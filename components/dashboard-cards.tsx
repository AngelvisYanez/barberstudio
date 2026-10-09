import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BalanceSummary } from "@/actions/transactions";
import { formatMoney } from "@/lib/money";

export function DashboardCards({
  balance,
  period = "mensual",
}: {
  balance: BalanceSummary;
  period?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
      <Card size="sm" className="@container/card md:[--card-spacing:--spacing(4)]">
        <CardHeader>
          <CardDescription className="line-clamp-1 text-xs md:text-sm">
            Ingreso {period}
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl @[250px]/card:text-3xl">
            {formatMoney(balance.income)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="line-clamp-1 text-xs text-muted-foreground md:text-sm">
          Cortes, combos y productos
        </CardFooter>
      </Card>

      <Card size="sm" className="@container/card md:[--card-spacing:--spacing(4)]">
        <CardHeader>
          <CardDescription className="line-clamp-1 text-xs md:text-sm">
            Gasto operativo {period}
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl @[250px]/card:text-3xl">
            {formatMoney(balance.businessExpense)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="line-clamp-1 text-xs text-muted-foreground md:text-sm">
          Insumos, alquiler y costos del negocio
        </CardFooter>
      </Card>

      <Card size="sm" className="@container/card md:[--card-spacing:--spacing(4)]">
        <CardHeader>
          <CardDescription className="line-clamp-1 text-xs md:text-sm">
            Retiros {period}
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl @[250px]/card:text-3xl">
            {formatMoney(balance.ownerDraw)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="line-clamp-1 text-xs text-muted-foreground md:text-sm">
          Salen de caja igual que un gasto
        </CardFooter>
      </Card>

      <Card size="sm" className="@container/card md:[--card-spacing:--spacing(4)]">
        <CardHeader>
          <CardDescription className="line-clamp-1 text-xs md:text-sm">
            Balance en caja {period}
          </CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl @[250px]/card:text-3xl">
            {formatMoney(balance.cashBalance)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="line-clamp-1 text-xs text-muted-foreground md:text-sm">
          Ingresos − gastos − retiros
        </CardFooter>
      </Card>
    </div>
  );
}
