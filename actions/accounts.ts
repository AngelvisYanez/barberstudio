"use server";

import { AccountStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/tenant";
import { requireTenantId } from "@/lib/tenant";

const createAccountSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  dueDate: z.coerce.date("La fecha de vencimiento es obligatoria"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
});

const createPayableSchema = createAccountSchema.extend({
  categoryId: z.string().min(1, "Selecciona el tipo de gasto"),
});

const updateAccountSchema = createAccountSchema.extend({
  id: z.string().min(1, "ID inválido"),
});

const updatePayableSchema = createPayableSchema.extend({
  id: z.string().min(1, "ID inválido"),
});

const paymentSchema = z.object({
  id: z.string().min(1, "ID inválido"),
  amount: z.coerce.number().positive("El abono debe ser mayor a 0"),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type CreatePayableInput = z.infer<typeof createPayableSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type UpdatePayableInput = z.infer<typeof updatePayableSchema>;
export type RecordPaymentInput = z.infer<typeof paymentSchema>;

function resolveStatus(amount: number, paidAmount: number): AccountStatus {
  if (paidAmount >= amount) return "PAID";
  if (paidAmount > 0) return "PARTIAL";
  return "PENDING";
}

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export type SerializedAccount = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  notes: string | null;
  status: AccountStatus;
  categoryId: string | null;
  categoryName: string | null;
};

function revalidateFinancePaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  revalidatePath("/owner-draws");
  revalidatePath("/accounts-payable");
  revalidatePath("/accounts-receivable");
}

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}

function firstError(parsed: z.ZodSafeParseResult<unknown>): string {
  return parsed.success
    ? "Datos inválidos"
    : (parsed.error.issues[0]?.message ?? "Datos inválidos");
}

export async function createAccountReceivable(
  input: CreateAccountInput,
): Promise<ActionResult> {
  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed) };
  }

  const { name, description, amount, dueDate, notes } = parsed.data;

  const tenantId = await requireTenantId();
  await prisma.accountReceivable.create({
    data: {
      tenantId,
      clientName: name,
      description: description || null,
      amount,
      dueDate,
      notes: notes || null,
    },
  });

  revalidatePath("/accounts-receivable");
  revalidateFinancePaths();

  return { success: true };
}

export async function createAccountPayable(
  input: CreatePayableInput,
): Promise<ActionResult> {
  const parsed = createPayableSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed) };
  }

  const { name, description, amount, dueDate, notes, categoryId } = parsed.data;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, type: "BUSINESS_EXPENSE" },
  });
  if (!category) {
    return { success: false, error: "Categoría de gasto no válida" };
  }

  const tenantId = await requireTenantId();
  await prisma.accountPayable.create({
    data: {
      tenantId,
      supplierName: name,
      description: description || null,
      amount,
      dueDate,
      notes: notes || null,
      categoryId,
    },
  });

  revalidateFinancePaths();

  return { success: true };
}

function serializeReceivable(
  account: Awaited<
    ReturnType<typeof prisma.accountReceivable.findMany>
  >[number],
): SerializedAccount {
  const amount = decimalToNumber(account.amount);
  const paidAmount = decimalToNumber(account.paidAmount);
  return {
    id: account.id,
    name: account.clientName,
    description: account.description,
    amount,
    paidAmount,
    balance: amount - paidAmount,
    dueDate: account.dueDate.toISOString(),
    notes: account.notes,
    status: account.status,
    categoryId: null,
    categoryName: null,
  };
}

function serializePayable(
  account: Prisma.AccountPayableGetPayload<{ include: { category: true } }>,
): SerializedAccount {
  const amount = decimalToNumber(account.amount);
  const paidAmount = decimalToNumber(account.paidAmount);
  return {
    id: account.id,
    name: account.supplierName,
    description: account.description,
    amount,
    paidAmount,
    balance: amount - paidAmount,
    dueDate: account.dueDate.toISOString(),
    notes: account.notes,
    status: account.status,
    categoryId: account.categoryId,
    categoryName: account.category?.name ?? null,
  };
}

export async function getAccountsReceivable(
  from?: Date,
  to?: Date,
): Promise<SerializedAccount[]> {
  const accounts = await prisma.accountReceivable.findMany({
    where:
      from && to
        ? { dueDate: { gte: from, lte: to } }
        : undefined,
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  return accounts.map(serializeReceivable);
}

export async function getAccountsPayable(
  from?: Date,
  to?: Date,
): Promise<SerializedAccount[]> {
  const accounts = await prisma.accountPayable.findMany({
    where:
      from && to
        ? { dueDate: { gte: from, lte: to } }
        : undefined,
    include: { category: true },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  return accounts.map(serializePayable);
}

export async function recordPaymentReceivable(
  input: RecordPaymentInput,
): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed) };
  }

  const { id, amount } = parsed.data;

  const account = await prisma.accountReceivable.findFirst({ where: { id } });
  if (!account) {
    return { success: false, error: "Cuenta no encontrada" };
  }

  const total = decimalToNumber(account.amount);
  const paid = decimalToNumber(account.paidAmount);
  const newPaid = paid + amount;

  if (newPaid > total) {
    return {
      success: false,
      error: "El abono excede el saldo pendiente",
    };
  }

  await prisma.accountReceivable.updateMany({
    where: { id },
    data: {
      paidAmount: newPaid,
      status:
        newPaid >= total ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING",
    },
  });

  revalidateFinancePaths();

  return { success: true };
}

export async function recordPaymentPayable(
  input: RecordPaymentInput,
): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed) };
  }

  const { id, amount } = parsed.data;

  const account = await prisma.accountPayable.findFirst({ where: { id } });
  if (!account) {
    return { success: false, error: "Cuenta no encontrada" };
  }

  const total = decimalToNumber(account.amount);
  const paid = decimalToNumber(account.paidAmount);
  const newPaid = paid + amount;

  if (newPaid > total) {
    return {
      success: false,
      error: "El abono excede el saldo pendiente",
    };
  }

  const paidAt = new Date();

  await prisma.$transaction([
    prisma.accountPayable.updateMany({
      where: { id },
      data: {
        paidAmount: newPaid,
        status: resolveStatus(total, newPaid),
      },
    }),
    prisma.accountPayablePayment.create({
      data: {
        tenantId: account.tenantId,
        accountId: id,
        amount,
        paidAt,
      },
    }),
  ]);

  revalidateFinancePaths();

  return { success: true };
}

export async function updateAccountReceivable(
  input: UpdateAccountInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Sin permisos de administrador" };
  }

  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed) };
  }

  const { id, name, description, amount, dueDate, notes } = parsed.data;
  const account = await prisma.accountReceivable.findFirst({ where: { id } });
  if (!account) {
    return { success: false, error: "Cuenta no encontrada" };
  }

  const paidAmount = decimalToNumber(account.paidAmount);
  if (amount < paidAmount) {
    return {
      success: false,
      error: "El monto no puede ser menor a lo ya cobrado",
    };
  }

  await prisma.accountReceivable.updateMany({
    where: { id },
    data: {
      clientName: name,
      description: description || null,
      amount,
      dueDate,
      notes: notes || null,
      status: resolveStatus(amount, paidAmount),
    },
  });

  revalidatePath("/accounts-receivable");
  return { success: true };
}

export async function updateAccountPayable(
  input: UpdatePayableInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Sin permisos de administrador" };
  }

  const parsed = updatePayableSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed) };
  }

  const { id, name, description, amount, dueDate, notes, categoryId } =
    parsed.data;
  const account = await prisma.accountPayable.findFirst({ where: { id } });
  if (!account) {
    return { success: false, error: "Cuenta no encontrada" };
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, type: "BUSINESS_EXPENSE" },
  });
  if (!category) {
    return { success: false, error: "Categoría de gasto no válida" };
  }

  const paidAmount = decimalToNumber(account.paidAmount);
  if (amount < paidAmount) {
    return {
      success: false,
      error: "El monto no puede ser menor a lo ya pagado",
    };
  }

  await prisma.accountPayable.updateMany({
    where: { id },
    data: {
      supplierName: name,
      description: description || null,
      amount,
      dueDate,
      notes: notes || null,
      categoryId,
      status: resolveStatus(amount, paidAmount),
    },
  });

  revalidateFinancePaths();
  return { success: true };
}

export async function deleteAccountReceivable(
  id: string,
): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }
  await prisma.accountReceivable.deleteMany({ where: { id } });
  revalidatePath("/accounts-receivable");
  return { success: true };
}

export async function deleteAccountPayable(
  id: string,
): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }
  await prisma.accountPayable.deleteMany({ where: { id } });
  revalidatePath("/accounts-payable");
  return { success: true };
}
