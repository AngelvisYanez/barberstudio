import { CategoryType } from "@prisma/client";

import {
  getCategories,
  getTodayTransactions,
} from "@/actions/transactions";
import { SiteHeader } from "@/components/site-header";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionsTable } from "@/components/transactions-table";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const [categories, transactions] = await Promise.all([
    getCategories([CategoryType.INCOME, CategoryType.BUSINESS_EXPENSE]),
    getTodayTransactions([
      CategoryType.INCOME,
      CategoryType.BUSINESS_EXPENSE,
    ]),
  ]);

  return (
    <>
      <SiteHeader title="Caja Diaria" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <TransactionForm
          categories={categories}
          title="Registro rápido"
          description="Anota ingresos y gastos operativos entre cortes. Los retiros van en otra pantalla."
          submitLabel="Registrar"
        />
        <TransactionsTable transactions={transactions} />
      </div>
    </>
  );
}
