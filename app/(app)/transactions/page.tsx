import { CategoryType } from "@prisma/client";

import { getProducts } from "@/actions/products";
import { getServices } from "@/actions/services";
import {
  getBalanceInRange,
  getCategories,
  getTransactionsInRange,
} from "@/actions/transactions";
import { DashboardCards } from "@/components/dashboard-cards";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ExportButtons } from "@/components/export-buttons";
import { SiteHeader } from "@/components/site-header";
import {
  TransactionForm,
  type CatalogItemOption,
} from "@/components/transaction-form";
import { TransactionsTable } from "@/components/transactions-table";
import { resolveDateRange } from "@/lib/date-range";
import { buildExportUrl } from "@/lib/export-route";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
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

  const [categories, balance, transactions, services, products] =
    await Promise.all([
      getCategories([CategoryType.INCOME, CategoryType.BUSINESS_EXPENSE]),
      getBalanceInRange(fromDate, toDate),
      getTransactionsInRange(fromDate, toDate, [
        CategoryType.INCOME,
        CategoryType.BUSINESS_EXPENSE,
      ]),
      getServices(),
      getProducts(),
    ]);

  const catalogItems: CatalogItemOption[] = [
    ...services
      .filter((service) => service.active)
      .map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        kind: "service" as const,
      })),
    ...products
      .filter((product) => product.active)
      .map((product) => ({
        id: product.id,
        name: product.name,
        price: product.salePrice,
        kind: "product" as const,
      })),
  ];

  const exportBase = "/api/exports/transactions";
  const xlsxUrl = buildExportUrl(exportBase, {
    format: "xlsx",
    filename: "caja-diaria",
    from: fromStr,
    to: toStr,
    types: ["INCOME", "BUSINESS_EXPENSE"],
  });
  const pdfUrl = buildExportUrl(exportBase, {
    format: "pdf",
    filename: "caja-diaria",
    from: fromStr,
    to: toStr,
    types: ["INCOME", "BUSINESS_EXPENSE"],
  });

  return (
    <>
      <SiteHeader title="Caja Diaria" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <TransactionForm
          categories={categories}
          catalogItems={catalogItems}
          title="Registro rápido"
          description="Anota ingresos y gastos operativos entre cortes. Los retiros van en otra pantalla."
          submitLabel="Registrar"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold capitalize">
              {singleDay ? "Balance del día" : "Balance del período"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecciona un rango de fechas para ver el balance.
            </p>
          </div>
          <DateRangeFilter defaultValue={{ from: fromStr, to: toStr }} />
        </div>
        <DashboardCards balance={balance} period={period} />
        <TransactionsTable
          transactions={transactions}
          title={singleDay ? "Movimientos del día" : "Movimientos del período"}
          description={rangeLabel}
          emptyMessage={
            singleDay
              ? "No hay movimientos registrados en esta fecha."
              : "No hay movimientos registrados en este período."
          }
          actions={<ExportButtons xlsxUrl={xlsxUrl} pdfUrl={pdfUrl} />}
        />
      </div>
    </>
  );
}
