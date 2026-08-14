import {
  getBalanceInRange,
  getDayComparison,
} from "@/actions/transactions";
import { DashboardCards } from "@/components/dashboard-cards";
import { DateRangeFilter } from "@/components/date-range-filter";
import { IncomeExpenseChart } from "@/components/income-expense-chart";
import { SiteHeader } from "@/components/site-header";
import { resolveDateRange } from "@/lib/date-range";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromParam, to: toParam } = await searchParams;
  const { fromDate, toDate, fromStr, toStr, period, rangeLabel, singleDay } =
    resolveDateRange(fromParam, toParam, "month");

  const [balance, chartData] = await Promise.all([
    getBalanceInRange(fromDate, toDate),
    getDayComparison(fromDate, toDate),
  ]);

  const chartPoints = chartData.map((point) => ({
    date: point.key,
    label: point.label,
    income: point.income,
    businessExpense: point.businessExpense,
  }));

  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold capitalize">
              {singleDay ? "Balance del día" : "Balance del período"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecciona un rango de fechas para ver el resumen.
            </p>
          </div>
          <DateRangeFilter defaultValue={{ from: fromStr, to: toStr }} />
        </div>
        <DashboardCards balance={balance} period={period} />
        <IncomeExpenseChart
          data={chartPoints}
          description={`${rangeLabel} (solo finanzas operativas)`}
        />
      </div>
    </>
  );
}
