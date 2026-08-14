import type { SerializedAccount } from "@/actions/accounts";
import { isOverdue } from "@/lib/accounts";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

type Props = {
  kind: "receivable" | "payable";
  accounts: SerializedAccount[];
};

export function AccountSummary({ kind, accounts }: Props) {
  const isReceivable = kind === "receivable";

  const pending = accounts.reduce(
    (sum, account) =>
      account.status === "PAID" ? sum : sum + account.balance,
    0,
  );
  const overdue = accounts.reduce(
    (sum, account) =>
      isOverdue(new Date(account.dueDate), account.status)
        ? sum + account.balance
        : sum,
    0,
  );
  const collected = accounts.reduce(
    (sum, account) => sum + account.paidAmount,
    0,
  );

  const items = [
    {
      label: isReceivable ? "Por cobrar" : "Por pagar",
      value: pending,
      hint: isReceivable
        ? "Saldo pendiente de clientes"
        : "Saldo pendiente a proveedores",
    },
    {
      label: "Vencido",
      value: overdue,
      hint: "Cuentas con fecha de vencimiento pasada",
    },
    {
      label: isReceivable ? "Cobrado" : "Pagado",
      value: collected,
      hint: isReceivable ? "Abonos recibidos" : "Abonos realizados",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
      {items.map((item) => (
        <Card key={item.label} className="@container/card">
          <CardHeader>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatMoney(item.value)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            {item.hint}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
