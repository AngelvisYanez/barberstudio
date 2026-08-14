import { CategoryType } from "@prisma/client";

import {
  getBalanceInRange,
  getCategories,
  getTransactionsInRange,
} from "@/actions/transactions";
import { DashboardCards } from "@/components/dashboard-cards";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ExportButtons } from "@/components/export-buttons";
import { SiteHeader } from "@/components/site-header";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionsTable } from "@/components/transactions-table";
import { resolveDateRange } from "@/lib/date-range";
import { buildExportUrl } from "@/lib/export-route";

export const dynamic = "force-dynamic";

export default async function OwnerDrawsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromParam, to: toParam } = await searchParams;
  const {
    fromDate,
    toDate,
    fromStr,
    toStr,
    singleDay,
    period,
    rangeLabel,
  } = resolveDateRange(fromParam, toParam, "today");

  const [categories, balance, transactions] = await Promise.all([
    getCategories([CategoryType.OWNER_DRAW]),
    getBalanceInRange(fromDate, toDate),
    getTransactionsInRange(fromDate, toDate, [CategoryType.OWNER_DRAW]),
  ]);

  const exportBase = "/api/exports/transactions";
  const xlsxUrl = buildExportUrl(exportBase, {
    format: "xlsx",
    filename: "retiros-personales",
    from: fromStr,
    to: toStr,
    types: ["OWNER_DRAW"],
  });
  const pdfUrl = buildExportUrl(exportBase, {
    format: "pdf",
    filename: "retiros-personales",
    from: fromStr,
    to: toStr,
    types: ["OWNER_DRAW"],
  });

  return (
    <>
      <SiteHeader title="Retiros Personales" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <TransactionForm
          categories={categories}
          title="Retiro del dueño"
          description="Gastos de hogar o personales. No se restan del balance operativo de la barbería."
          submitLabel="Registrar retiro"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold capitalize">
              {singleDay ? "Retiros del día" : "Retiros del período"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecciona un rango de fechas para ver los retiros.
            </p>
          </div>
          <DateRangeFilter defaultValue={{ from: fromStr, to: toStr }} />
        </div>
        <DashboardCards balance={balance} period={period} />
        <TransactionsTable
          transactions={transactions}
          title={singleDay ? "Retiros del día" : "Retiros del período"}
          description={rangeLabel}
          emptyMessage={
            singleDay
              ? "No hay retiros personales registrados en esta fecha."
              : "No hay retiros personales registrados en este período."
          }
          actions={<ExportButtons xlsxUrl={xlsxUrl} pdfUrl={pdfUrl} />}
        />
      </div>
    </>
  );
}
