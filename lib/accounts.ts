import type { AccountStatus } from "@prisma/client";
import { startOfDay } from "date-fns";

export function isOverdue(dueDate: Date, status: AccountStatus): boolean {
  return status !== "PAID" && startOfDay(dueDate) < startOfDay(new Date());
}

export function accountStatusLabel(
  status: AccountStatus,
  dueDate: Date,
): string {
  if (status === "PAID") return "Pagado";
  if (isOverdue(dueDate, status)) return "Vencido";
  return status === "PARTIAL" ? "Parcial" : "Pendiente";
}
