import {
  getLast7DaysComparison,
  getMonthlyBalance,
} from "@/actions/transactions";
import { DashboardCards } from "@/components/dashboard-cards";
import { IncomeExpenseChart } from "@/components/income-expense-chart";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [balance, chartData] = await Promise.all([
    getMonthlyBalance(),
    getLast7DaysComparison(),
  ]);

  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DashboardCards balance={balance} />
            <div className="px-4 lg:px-6">
              <IncomeExpenseChart data={chartData} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
