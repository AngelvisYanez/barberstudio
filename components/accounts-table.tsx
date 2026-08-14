"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { CircleDollarSignIcon, LoaderIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteAccountPayable,
  deleteAccountReceivable,
  recordPaymentPayable,
  recordPaymentReceivable,
  type RecordPaymentInput,
  type SerializedAccount,
} from "@/actions/accounts";
import { accountStatusLabel, isOverdue } from "@/lib/accounts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";

type Props = {
  kind: "receivable" | "payable";
  accounts: SerializedAccount[];
  emptyMessage?: string;
  actions?: React.ReactNode;
};

function statusVariant(
  status: SerializedAccount["status"],
  dueDate: Date,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "PAID") return "default";
  if (isOverdue(dueDate, status)) return "destructive";
  return status === "PARTIAL" ? "secondary" : "outline";
}

function PaymentDrawer({
  kind,
  account,
}: {
  kind: "receivable" | "payable";
  account: SerializedAccount;
}) {
  const [pending, startTransition] = useTransition();
  const amountRef = useRef<HTMLInputElement>(null);
  const formId = `payment-form-${account.id}`;
  const paid = account.status === "PAID";

  const recordPayment = kind === "receivable"
    ? recordPaymentReceivable
    : recordPaymentPayable;

  function onSubmit(formData: FormData) {
    const input: RecordPaymentInput = {
      id: account.id,
      amount: Number(formData.get("amount")),
    };

    startTransition(async () => {
      const result = await recordPayment(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Pago registrado");
      amountRef.current?.focus();
    });
  }

  return (
    <Drawer>
      <DrawerTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={paid}
            className="h-7 text-xs"
          />
        }
      >
        <CircleDollarSignIcon data-icon="inline-start" />
        {paid ? "Pagado" : "Pagar"}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Registrar pago</DrawerTitle>
          <DrawerDescription>
            {account.name} · Saldo pendiente: {formatMoney(account.balance)}
          </DrawerDescription>
        </DrawerHeader>
        <form id={formId} action={onSubmit} className="flex flex-col gap-4 px-4">
          <div className="grid gap-2">
            <Label htmlFor={`payment-amount-${account.id}`}>Monto del abono</Label>
            <Input
              ref={amountRef}
              id={`payment-amount-${account.id}`}
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={account.balance}
              placeholder="0.00"
              required
              className="h-11 text-base"
            />
          </div>
        </form>
        <DrawerFooter>
          <Button
            type="submit"
            form={formId}
            disabled={pending}
            className="w-full"
            size="lg"
          >
            {pending ? "Guardando..." : "Registrar pago"}
          </Button>
          <DrawerClose render={<Button variant="outline" />}>
            Cancelar
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function AccountsTable({
  kind,
  accounts,
  emptyMessage,
  actions,
}: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const removeAccount =
    kind === "receivable" ? deleteAccountReceivable : deleteAccountPayable;
  const isReceivable = kind === "receivable";
  const nameLabel = isReceivable ? "Cliente" : "Proveedor";
  const collectedLabel = isReceivable ? "Cobrado" : "Pagado";

  function handleDelete(account: SerializedAccount) {
    const confirmed = window.confirm(
      `¿Eliminar la cuenta de ${account.name}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setPendingId(account.id);
    startTransition(async () => {
      const result = await removeAccount(account.id);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Eliminada");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isReceivable ? "Cuentas por cobrar" : "Cuentas por pagar"}
        </CardTitle>
        <CardDescription>
          {accounts.length} {accounts.length === 1 ? "registro" : "registros"} ·
          ordenado por fecha de vencimiento
        </CardDescription>
        {actions ? <CardAction>{actions}</CardAction> : null}
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{nameLabel}</TableHead>
                  <TableHead className="hidden sm:table-cell">Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    {collectedLabel}
                  </TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Vencimiento
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const dueDate = new Date(account.dueDate);
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.name}
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate text-muted-foreground sm:table-cell">
                        {account.description || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(account.amount)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {formatMoney(account.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMoney(account.balance)}
                      </TableCell>
                      <TableCell className="hidden tabular-nums lg:table-cell">
                        {format(dueDate, "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant(account.status, dueDate)}
                        >
                          {accountStatusLabel(account.status, dueDate)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PaymentDrawer kind={kind} account={account} />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(account)}
                            disabled={pendingId === account.id}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar cuenta"
                          >
                            {pendingId === account.id ? (
                              <LoaderIcon className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2Icon className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
