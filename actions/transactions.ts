"use server";

import { CategoryType, Prisma } from "@prisma/client";
import {
  addDays,
  differenceInDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import type { Locale } from "date-fns";
import { es } from "date-fns/locale";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createTransactionSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  categoryId: z.string().min(1, "Selecciona una categoría"),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  date: z.coerce.date().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export type SerializedTransaction = {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
};

export type BalanceSummary = {
  income: number;
  businessExpense: number;
  ownerDraw: number;
  netOperating: number;
  cashBalance: number;
};

export type MonthlyBalance = BalanceSummary & {
  year: number;
  month: number;
};

export type DayComparison = {
  date: string;
  label: string;
  income: number;
  businessExpense: number;
};

export type ComparisonPoint = {
  key: string;
  label: string;
  income: number;
  businessExpense: number;
  ownerDraw: number;
};

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

function serializeTransaction(
  transaction: Prisma.TransactionGetPayload<{ include: { category: true } }>,
): SerializedTransaction {
  return {
    id: transaction.id,
    amount: decimalToNumber(transaction.amount),
    date: transaction.date.toISOString(),
    description: transaction.description,
    categoryId: transaction.categoryId,
    category: {
      id: transaction.category.id,
      name: transaction.category.name,
      type: transaction.category.type,
    },
  };
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<ActionResult> {
  const parsed = createTransactionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { amount, categoryId, description, date } = parsed.data;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return { success: false, error: "Categoría no encontrada" };
  }

  await prisma.transaction.create({
    data: {
      amount,
      categoryId,
      description: description || null,
      date: date ?? new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/owner-draws");

  return { success: true };
}

export async function getCategories(types?: CategoryType[]) {
  return prisma.category.findMany({
    where: types?.length ? { type: { in: types } } : undefined,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function getTodayTransactions(
  types?: CategoryType[],
): Promise<SerializedTransaction[]> {
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: from, lte: to },
      ...(types?.length
        ? { category: { type: { in: types } } }
        : undefined),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}

export async function getTransactionsInRange(
  from: Date,
  to: Date,
  types?: CategoryType[],
): Promise<SerializedTransaction[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: startOfDay(from), lte: endOfDay(to) },
      ...(types?.length
        ? { category: { type: { in: types } } }
        : undefined),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}

async function computeBalance(from: Date, to: Date): Promise<BalanceSummary> {
  const range = { gte: startOfDay(from), lte: endOfDay(to) };

  const [grouped, payablePayments] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { date: range },
      _sum: { amount: true },
    }),
    prisma.accountPayablePayment.aggregate({
      where: { paidAt: range },
      _sum: { amount: true },
    }),
  ]);

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((row) => row.categoryId) } },
  });

  const typeByCategoryId = new Map(
    categories.map((category) => [category.id, category.type]),
  );

  let income = 0;
  let ownerDraw = 0;

  for (const row of grouped) {
    const type = typeByCategoryId.get(row.categoryId);
    const sum = decimalToNumber(row._sum.amount ?? 0);

    if (type === CategoryType.INCOME) income += sum;
    if (type === CategoryType.OWNER_DRAW) ownerDraw += sum;
  }

  const businessExpense = decimalToNumber(
    payablePayments._sum.amount ?? 0,
  );

  return {
    income,
    businessExpense,
    ownerDraw,
    netOperating: income - businessExpense,
    cashBalance: income - businessExpense - ownerDraw,
  };
}

export async function getBalanceInRange(
  from: Date,
  to: Date,
): Promise<BalanceSummary> {
  return computeBalance(from, to);
}

export async function getMonthlyBalance(
  year?: number,
  month?: number,
): Promise<MonthlyBalance> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  // month is 1-12 for callers; Date uses 0-11
  const targetMonthIndex = (month ?? now.getMonth() + 1) - 1;
  const anchor = new Date(targetYear, targetMonthIndex, 1);
  const from = startOfMonth(anchor);
  const to = endOfMonth(anchor);

  const summary = await computeBalance(from, to);

  return {
    ...summary,
    year: targetYear,
    month: targetMonthIndex + 1,
  };
}

export async function getLast7DaysComparison(): Promise<DayComparison[]> {
  const today = startOfDay(new Date());
  const from = subDays(today, 6);
  const to = endOfDay(today);
  const range = { gte: from, lte: to };

  const [transactions, payablePayments] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: range,
        category: { type: CategoryType.INCOME },
      },
      include: { category: true },
    }),
    prisma.accountPayablePayment.findMany({
      where: { paidAt: range },
      select: { amount: true, paidAt: true },
    }),
  ]);

  const days: DayComparison[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const day = subDays(today, i);
    const key = format(day, "yyyy-MM-dd");
    days.push({
      date: key,
      label: format(day, "EEE dd"),
      income: 0,
      businessExpense: 0,
    });
  }

  const byDate = new Map(days.map((day) => [day.date, day]));

  for (const transaction of transactions) {
    const key = format(transaction.date, "yyyy-MM-dd");
    const bucket = byDate.get(key);
    if (!bucket) continue;
    bucket.income += decimalToNumber(transaction.amount);
  }

  for (const payment of payablePayments) {
    const key = format(payment.paidAt, "yyyy-MM-dd");
    const bucket = byDate.get(key);
    if (!bucket) continue;
    bucket.businessExpense += decimalToNumber(payment.amount);
  }

  return days;
}

type AmountRow = { amount: number; date: Date; type: CategoryType };

async function fetchAmounts(from: Date, to: Date): Promise<AmountRow[]> {
  const range = { gte: startOfDay(from), lte: endOfDay(to) };

  const [transactions, payablePayments] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: range,
        category: {
          type: {
            in: [CategoryType.INCOME, CategoryType.OWNER_DRAW],
          },
        },
      },
      select: {
        amount: true,
        date: true,
        category: { select: { type: true } },
      },
    }),
    prisma.accountPayablePayment.findMany({
      where: { paidAt: range },
      select: { amount: true, paidAt: true },
    }),
  ]);

  return [
    ...transactions.map((row) => ({
      amount: decimalToNumber(row.amount),
      date: row.date,
      type: row.category.type,
    })),
    ...payablePayments.map((row) => ({
      amount: decimalToNumber(row.amount),
      date: row.paidAt,
      type: CategoryType.BUSINESS_EXPENSE,
    })),
  ];
}

function emptyPoint(key: string, label: string): ComparisonPoint {
  return { key, label, income: 0, businessExpense: 0, ownerDraw: 0 };
}

function addToBucket(
  bucket: ComparisonPoint,
  type: CategoryType,
  amount: number,
) {
  if (type === CategoryType.INCOME) bucket.income += amount;
  else if (type === CategoryType.BUSINESS_EXPENSE) {
    bucket.businessExpense += amount;
  } else if (type === CategoryType.OWNER_DRAW) bucket.ownerDraw += amount;
}

async function bucketByDay(
  from: Date,
  to: Date,
  labelFormat: string,
  locale?: Locale,
): Promise<ComparisonPoint[]> {
  const start = startOfDay(from);
  const totalDays = differenceInDays(startOfDay(to), start) + 1;

  const points: ComparisonPoint[] = [];
  const byKey = new Map<string, ComparisonPoint>();

  for (let i = 0; i < totalDays; i += 1) {
    const day = addDays(start, i);
    const key = format(day, "yyyy-MM-dd");
    const point = emptyPoint(
      key,
      locale ? format(day, labelFormat, { locale }) : format(day, labelFormat),
    );
    points.push(point);
    byKey.set(key, point);
  }

  const amounts = await fetchAmounts(from, to);
  for (const row of amounts) {
    const bucket = byKey.get(format(row.date, "yyyy-MM-dd"));
    if (bucket) addToBucket(bucket, row.type, row.amount);
  }

  return points;
}

export async function getDayComparison(
  from: Date,
  to: Date,
): Promise<ComparisonPoint[]> {
  return bucketByDay(from, to, "EEE dd", es);
}

export async function getMonthComparison(
  year: number,
): Promise<ComparisonPoint[]> {
  const from = startOfYear(new Date(year, 0, 1));
  const to = endOfYear(new Date(year, 0, 1));

  const points: ComparisonPoint[] = [];
  const byKey = new Map<string, ComparisonPoint>();

  for (let m = 0; m < 12; m += 1) {
    const month = new Date(year, m, 1);
    const key = format(month, "yyyy-MM");
    const point = emptyPoint(key, format(month, "MMM", { locale: es }));
    points.push(point);
    byKey.set(key, point);
  }

  const amounts = await fetchAmounts(from, to);
  for (const row of amounts) {
    const bucket = byKey.get(format(row.date, "yyyy-MM"));
    if (bucket) addToBucket(bucket, row.type, row.amount);
  }

  return points;
}

export async function getYearComparison(): Promise<ComparisonPoint[]> {
  const aggregate = await prisma.transaction.aggregate({
    _min: { date: true },
    _max: { date: true },
  });

  const minDate = aggregate._min.date;
  const maxDate = aggregate._max.date;
  if (!minDate || !maxDate) return [];

  const points: ComparisonPoint[] = [];
  const byKey = new Map<string, ComparisonPoint>();

  for (let y = minDate.getFullYear(); y <= maxDate.getFullYear(); y += 1) {
    const key = String(y);
    const point = emptyPoint(key, key);
    points.push(point);
    byKey.set(key, point);
  }

  const amounts = await fetchAmounts(minDate, maxDate);
  for (const row of amounts) {
    const bucket = byKey.get(String(row.date.getFullYear()));
    if (bucket) addToBucket(bucket, row.type, row.amount);
  }

  return points;
}
