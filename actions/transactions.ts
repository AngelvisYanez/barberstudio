"use server";

import { CategoryType, Prisma } from "@prisma/client";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
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

export type MonthlyBalance = {
  income: number;
  businessExpense: number;
  ownerDraw: number;
  netOperating: number;
  year: number;
  month: number;
};

export type DayComparison = {
  date: string;
  label: string;
  income: number;
  businessExpense: number;
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

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { date: { gte: from, lte: to } },
    _sum: { amount: true },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((row) => row.categoryId) } },
  });

  const typeByCategoryId = new Map(
    categories.map((category) => [category.id, category.type]),
  );

  let income = 0;
  let businessExpense = 0;
  let ownerDraw = 0;

  for (const row of grouped) {
    const type = typeByCategoryId.get(row.categoryId);
    const sum = decimalToNumber(row._sum.amount ?? 0);

    if (type === CategoryType.INCOME) income += sum;
    if (type === CategoryType.BUSINESS_EXPENSE) businessExpense += sum;
    if (type === CategoryType.OWNER_DRAW) ownerDraw += sum;
  }

  return {
    income,
    businessExpense,
    ownerDraw,
    netOperating: income - businessExpense,
    year: targetYear,
    month: targetMonthIndex + 1,
  };
}

export async function getLast7DaysComparison(): Promise<DayComparison[]> {
  const today = startOfDay(new Date());
  const from = subDays(today, 6);
  const to = endOfDay(today);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: from, lte: to },
      category: {
        type: {
          in: [CategoryType.INCOME, CategoryType.BUSINESS_EXPENSE],
        },
      },
    },
    include: { category: true },
  });

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

    const amount = decimalToNumber(transaction.amount);
    if (transaction.category.type === CategoryType.INCOME) {
      bucket.income += amount;
    } else if (transaction.category.type === CategoryType.BUSINESS_EXPENSE) {
      bucket.businessExpense += amount;
    }
  }

  return days;
}
