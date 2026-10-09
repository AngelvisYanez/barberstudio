import { CategoryType } from "@prisma/client";

import {
  getBalanceInRange,
  getDayComparison,
  getMonthComparison,
  getTransactionsInRange,
  getYearComparison,
} from "@/actions/transactions";
import { ComparisonSection } from "@/components/comparison-section";
import { DashboardCards } from "@/components/dashboard-cards";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ExportButtons } from "@/components/export-buttons";
import { SiteHeader } from "@/components/site-header";
import { TransactionsTable } from "@/components/transactions-table";
import { resolveDateRange } from "@/lib/date-range";
import { buildExportUrl } from "@/lib/export-route";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
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
  } = resolveDateRange(fromParam, toParam, "month");

  const [balance, transactions, dayComparison, monthComparison, yearComparison] =
    await Promise.all([
      getBalanceInRange(fromDate, toDate),
      getTransactionsInRange(fromDate, toDate, [
        CategoryType.INCOME,
        CategoryType.BUSINESS_EXPENSE,
        CategoryType.OWNER_DRAW,
      ]),
      getDayComparison(fromDate, toDate),
      getMonthComparison(fromDate.getFullYear()),
      getYearComparison(),
    ]);

  const exportBase = "/api/exports/transactions";
  const xlsxUrl = buildExportUrl(exportBase, {
    format: "xlsx",
    filename: `reporte-${fromStr}-${toStr}`,
    from: fromStr,
    to: toStr,
  });
  const pdfUrl = buildExportUrl(exportBase, {
    format: "pdf",
    filename: `reporte-${fromStr}-${toStr}`,
    from: fromStr,
    to: toStr,
  });

  return (
    <>
      <SiteHeader title="Reportes" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold capitalize">
              {singleDay ? "Reporte del día" : "Reporte del período"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Resumen de ingresos, gastos y retiros.
            </p>
          </div>
          <DateRangeFilter defaultValue={{ from: fromStr, to: toStr }} />
        </div>

        <DashboardCards balance={balance} period={period} />

        <TransactionsTable
          transactions={transactions}
          title={
            singleDay ? "Movimientos del día" : "Movimientos del período"
          }
          description={rangeLabel}
          emptyMessage={
            singleDay
              ? "No hay movimientos registrados en esta fecha."
              : "No hay movimientos registrados en este período."
          }
          actions={<ExportButtons xlsxUrl={xlsxUrl} pdfUrl={pdfUrl} />}
        />

        <ComparisonSection
          day={dayComparison}
          month={monthComparison}
          year={yearComparison}
        />
      </div>
    </>
  );
}
