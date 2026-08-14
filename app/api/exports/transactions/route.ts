import { CategoryType } from "@prisma/client";
import { endOfDay, format, startOfDay } from "date-fns";
import type { NextRequest } from "next/server";

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
import { categoryTypeLabel } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type ExportRow = {
  date: Date;
  hour: string;
  category: string;
  type: string;
  description: string;
  amount: number;
};

const columns: ExportColumn<ExportRow>[] = [
  { key: "date", header: "Fecha", format: "date", width: 12 },
  { key: "hour", header: "Hora", width: 9 },
  { key: "category", header: "Categoría", width: 26 },
  { key: "type", header: "Tipo", width: 18 },
  { key: "description", header: "Nota", width: 34 },
  { key: "amount", header: "Monto", format: "money", width: 16 },
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

  const typesParam = searchParams.get("types");
  const types = typesParam
    ? typesParam
        .split(",")
        .filter((value): value is CategoryType =>
          Object.values(CategoryType).includes(value as CategoryType),
        )
    : undefined;

  const now = new Date();
  const from = parseDateParam(searchParams.get("from")) ?? startOfDay(now);
  const to = parseDateParam(searchParams.get("to")) ?? endOfDay(now);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: startOfDay(from), lte: endOfDay(to) },
      ...(types && types.length > 0
        ? { category: { type: { in: types } } }
        : undefined),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const rows: ExportRow[] = transactions.map((transaction) => ({
    date: transaction.date,
    hour: format(transaction.date, "HH:mm"),
    category: transaction.category.name,
    type: categoryTypeLabel(transaction.category.type),
    description: transaction.description ?? "",
    amount: Number(transaction.amount),
  }));

  const rangeLabel = `${format(from, "yyyy-MM-dd")}_${format(to, "yyyy-MM-dd")}`;
  const baseName = sanitizeFilename(searchParams.get("filename"));
  const filename = `${baseName}-${rangeLabel}`;

  const buffer =
    formatParam === "xlsx"
      ? await buildExcelBuffer("Movimientos", columns, rows)
      : await buildPdfBuffer(
          "Movimientos de caja",
          `Del ${format(from, "dd/MM/yyyy")} al ${format(to, "dd/MM/yyyy")}`,
          columns,
          rows,
        );

  return buildExportResponse(buffer, formatParam, filename);
}
