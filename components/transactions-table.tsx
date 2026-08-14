import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { SerializedTransaction } from "@/actions/transactions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { categoryTypeLabel, formatMoney } from "@/lib/money";

type Props = {
  transactions: SerializedTransaction[];
  title?: string;
  emptyMessage?: string;
};

export function TransactionsTable({
  transactions,
  title = "Movimientos de hoy",
  emptyMessage = "Aún no hay movimientos registrados hoy.",
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Nota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="tabular-nums">
                      {format(new Date(transaction.date), "HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatMoney(transaction.amount)}
                    </TableCell>
                    <TableCell>{transaction.category.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">
                        {categoryTypeLabel(transaction.category.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-muted-foreground md:table-cell">
                      {transaction.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
