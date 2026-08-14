import { CategoryType } from "@prisma/client";

import {
  getCategories,
  getTodayTransactions,
} from "@/actions/transactions";
import { SiteHeader } from "@/components/site-header";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionsTable } from "@/components/transactions-table";

export const dynamic = "force-dynamic";

export default async function OwnerDrawsPage() {
  const [categories, transactions] = await Promise.all([
    getCategories([CategoryType.OWNER_DRAW]),
    getTodayTransactions([CategoryType.OWNER_DRAW]),
  ]);

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
        <TransactionsTable
          transactions={transactions}
          title="Retiros de hoy"
          emptyMessage="No hay retiros personales registrados hoy."
        />
      </div>
    </>
  );
}
