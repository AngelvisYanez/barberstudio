"use server";

import { AccountStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createAccountSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  dueDate: z.coerce.date("La fecha de vencimiento es obligatoria"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const paymentSchema = z.object({
  id: z.string().min(1, "ID inválido"),
  amount: z.coerce.number().positive("El abono debe ser mayor a 0"),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type RecordPaymentInput = z.infer<typeof paymentSchema>;

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
};

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

  await prisma.accountReceivable.create({
    data: {
      clientName: name,
      description: description || null,
      amount,
      dueDate,
      notes: notes || null,
    },
  });

  revalidatePath("/accounts-receivable");

  return { success: true };
}

export async function createAccountPayable(
  input: CreateAccountInput,
): Promise<ActionResult> {
  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstError(parsed) };
  }

  const { name, description, amount, dueDate, notes } = parsed.data;

  await prisma.accountPayable.create({
    data: {
      supplierName: name,
      description: description || null,
      amount,
      dueDate,
      notes: notes || null,
    },
  });

  revalidatePath("/accounts-payable");

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
  };
}

function serializePayable(
  account: Awaited<ReturnType<typeof prisma.accountPayable.findMany>>[number],
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

  const account = await prisma.accountReceivable.findUnique({ where: { id } });
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

  await prisma.accountReceivable.update({
    where: { id },
    data: {
      paidAmount: newPaid,
      status:
        newPaid >= total ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING",
    },
  });

  revalidatePath("/accounts-receivable");

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

  const account = await prisma.accountPayable.findUnique({ where: { id } });
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

  await prisma.accountPayable.update({
    where: { id },
    data: {
      paidAmount: newPaid,
      status:
        newPaid >= total ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING",
    },
  });

  revalidatePath("/accounts-payable");

  return { success: true };
}

export async function deleteAccountReceivable(
  id: string,
): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }
  await prisma.accountReceivable.delete({ where: { id } });
  revalidatePath("/accounts-receivable");
  return { success: true };
}

export async function deleteAccountPayable(
  id: string,
): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }
  await prisma.accountPayable.delete({ where: { id } });
  revalidatePath("/accounts-payable");
  return { success: true };
}
