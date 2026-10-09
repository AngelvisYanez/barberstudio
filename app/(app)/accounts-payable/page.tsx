import { CategoryType } from "@prisma/client";

import { getAccountsPayable } from "@/actions/accounts";
import { getCategories } from "@/actions/transactions";
import { AccountForm } from "@/components/account-form";
import { AccountSummary } from "@/components/account-summary";
import { AccountsTable } from "@/components/accounts-table";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ExportButtons } from "@/components/export-buttons";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { resolveDateRange } from "@/lib/date-range";
import { buildExportUrl } from "@/lib/export-route";

export const dynamic = "force-dynamic";

export default async function AccountsPayablePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromParam, to: toParam } = await searchParams;
  const { fromDate, toDate, fromStr, toStr, singleDay, rangeLabel } =
    resolveDateRange(fromParam, toParam, "month");

  const [accounts, session, expenseCategories] = await Promise.all([
    getAccountsPayable(fromDate, toDate),
    getSession(),
    getCategories([CategoryType.BUSINESS_EXPENSE]),
  ]);

  const xlsxUrl = buildExportUrl("/api/exports/accounts-payable", {
    format: "xlsx",
    filename: "cuentas-por-pagar",
    from: fromStr,
    to: toStr,
  });
  const pdfUrl = buildExportUrl("/api/exports/accounts-payable", {
    format: "pdf",
    filename: "cuentas-por-pagar",
    from: fromStr,
    to: toStr,
  });

  return (
    <>
      <SiteHeader title="Cuentas por Pagar" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold capitalize">
              {singleDay ? "Pagos del día" : "Pagos del período"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Filtra por fecha de vencimiento.
            </p>
          </div>
          <DateRangeFilter defaultValue={{ from: fromStr, to: toStr }} />
        </div>
        <AccountSummary kind="payable" accounts={accounts} />
        <AccountForm kind="payable" expenseCategories={expenseCategories} />
        <AccountsTable
          kind="payable"
          accounts={accounts}
          expenseCategories={expenseCategories}
          canEdit={session?.role === "ADMIN"}
          emptyMessage={`No hay cuentas por pagar con vencimiento en ${rangeLabel}.`}
          actions={<ExportButtons xlsxUrl={xlsxUrl} pdfUrl={pdfUrl} />}
        />
      </div>
    </>
  );
}
