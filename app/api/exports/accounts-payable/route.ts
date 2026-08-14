import { endOfDay, format, startOfDay } from "date-fns";
import type { NextRequest } from "next/server";

import { accountStatusLabel } from "@/lib/accounts";
import {
  buildExcelBuffer,
  buildPdfBuffer,
  type ExportColumn,
} from "@/lib/export";
import {
  buildExportResponse,
  getExportSession,
  parseDateParam,
  parseExportFormat,
  sanitizeFilename,
} from "@/lib/export-route";
import { prisma } from "@/lib/prisma";

type ExportRow = {
  supplierName: string;
  description: string;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
  notes: string;
};

const columns: ExportColumn<ExportRow>[] = [
  { key: "supplierName", header: "Proveedor", width: 24 },
  { key: "description", header: "Concepto", width: 28 },
  { key: "dueDate", header: "Vencimiento", format: "date", width: 13 },
  { key: "amount", header: "Monto", format: "money", width: 14 },
  { key: "paidAmount", header: "Pagado", format: "money", width: 14 },
  { key: "balance", header: "Saldo", format: "money", width: 14 },
  { key: "status", header: "Estado", width: 12 },
  { key: "notes", header: "Notas", width: 24 },
];

export async function GET(request: NextRequest) {
  const session = await getExportSession();
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const formatParam = parseExportFormat(searchParams.get("format"));
  if (!formatParam) {
    return new Response("Formato inválido", { status: 400 });
  }

  const from = parseDateParam(searchParams.get("from"));
  const to = parseDateParam(searchParams.get("to"));

  const accounts = await prisma.accountPayable.findMany({
    where:
      from && to
        ? { dueDate: { gte: startOfDay(from), lte: endOfDay(to) } }
        : undefined,
    orderBy: [{ dueDate: "asc" }],
  });

  const rows: ExportRow[] = accounts.map((account) => {
    const amount = Number(account.amount);
    const paidAmount = Number(account.paidAmount);
    return {
      supplierName: account.supplierName,
      description: account.description ?? "",
      dueDate: account.dueDate,
      amount,
      paidAmount,
      balance: amount - paidAmount,
      status: accountStatusLabel(account.status, account.dueDate),
      notes: account.notes ?? "",
    };
  });

  const filename = sanitizeFilename(
    searchParams.get("filename") || "cuentas-por-pagar",
  );

  const buffer =
    formatParam === "xlsx"
      ? await buildExcelBuffer("Cuentas por pagar", columns, rows)
      : await buildPdfBuffer(
          "Cuentas por pagar",
          `Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
          columns,
          rows,
        );

  return buildExportResponse(buffer, formatParam, filename);
}
