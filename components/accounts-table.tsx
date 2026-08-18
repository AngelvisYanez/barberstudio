"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  CircleDollarSignIcon,
  LoaderIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteAccountPayable,
  deleteAccountReceivable,
  recordPaymentPayable,
  recordPaymentReceivable,
  updateAccountPayable,
  updateAccountReceivable,
  type RecordPaymentInput,
  type SerializedAccount,
  type UpdateAccountInput,
} from "@/actions/accounts";
import { accountStatusLabel, isOverdue } from "@/lib/accounts";
import {
  TablePagination,
  useTablePagination,
} from "@/components/table-pagination";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  canEdit?: boolean;
};

function statusVariant(
  status: SerializedAccount["status"],
  dueDate: Date,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "PAID") return "default";
  if (isOverdue(dueDate, status)) return "destructive";
  return status === "PARTIAL" ? "secondary" : "outline";
}

function PaymentDialog({
  kind,
  account,
}: {
  kind: "receivable" | "payable";
  account: SerializedAccount;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState(account.balance.toFixed(2));
  const [pending, startTransition] = useTransition();
  const amountRef = useRef<HTMLInputElement>(null);

  const isReceivable = kind === "receivable";
  const settled = account.status === "PAID";
  const actionVerb = isReceivable ? "Cobrar" : "Pagar";
  const settledLabel = isReceivable ? "Cobrado" : "Pagado";
  const fullLabel = isReceivable ? "Cobro completo" : "Pago completo";
  const partialLabel = "Abono parcial";
  const submitLabel = isReceivable ? "Registrar cobro" : "Registrar pago";
  const successLabel = isReceivable ? "Cobro registrado" : "Pago registrado";

  const recordPayment =
    kind === "receivable" ? recordPaymentReceivable : recordPaymentPayable;

  function resetForm() {
    setMode("full");
    setAmount(account.balance.toFixed(2));
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) resetForm();
  }

  function applyMode(nextMode: "full" | "partial") {
    setMode(nextMode);
    if (nextMode === "full") {
      setAmount(account.balance.toFixed(2));
    } else {
      setAmount("");
      queueMicrotask(() => amountRef.current?.focus());
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount =
      mode === "full" ? account.balance : Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (parsedAmount > account.balance) {
      toast.error("El monto excede el saldo pendiente");
      return;
    }

    const input: RecordPaymentInput = {
      id: account.id,
      amount: parsedAmount,
    };

    startTransition(async () => {
      const result = await recordPayment(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(successLabel);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={settled}
            className="h-7 text-xs"
          />
        }
      >
        <CircleDollarSignIcon data-icon="inline-start" />
        {settled ? settledLabel : actionVerb}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {actionVerb}: {account.name}
          </DialogTitle>
          <DialogDescription>
            Saldo pendiente: {formatMoney(account.balance)}
          </DialogDescription>
        </DialogHeader>

        <form
          id={`payment-form-${account.id}`}
          onSubmit={onSubmit}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label>Tipo de movimiento</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "full" ? "default" : "outline"}
                className="h-10"
                onClick={() => applyMode("full")}
              >
                {fullLabel}
              </Button>
              <Button
                type="button"
                variant={mode === "partial" ? "default" : "outline"}
                className="h-10"
                onClick={() => applyMode("partial")}
              >
                {partialLabel}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`payment-amount-${account.id}`}>
              {mode === "full" ? "Monto total" : "Monto del abono"}
            </Label>
            <Input
              ref={amountRef}
              id={`payment-amount-${account.id}`}
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={account.balance}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              readOnly={mode === "full"}
              required={mode === "partial"}
              placeholder="0.00"
              className="h-11 text-base"
            />
            {mode === "full" ? (
              <p className="text-xs text-muted-foreground">
                Se registrará el saldo completo pendiente.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Máximo {formatMoney(account.balance)}.
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            type="submit"
            form={`payment-form-${account.id}`}
            disabled={pending}
          >
            {pending ? "Guardando..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditAccountDrawer({
  kind,
  account,
}: {
  kind: "receivable" | "payable";
  account: SerializedAccount;
}) {
  const [pending, startTransition] = useTransition();
  const formId = `edit-account-${account.id}`;
  const isReceivable = kind === "receivable";
  const updateAccount = isReceivable
    ? updateAccountReceivable
    : updateAccountPayable;

  function onSubmit(formData: FormData) {
    const input: UpdateAccountInput = {
      id: account.id,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      amount: Number(formData.get("amount")),
      dueDate: new Date(String(formData.get("dueDate") ?? "")),
      notes: String(formData.get("notes") ?? ""),
    };

    startTransition(async () => {
      const result = await updateAccount(input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Cuenta actualizada");
    });
  }

  return (
    <Drawer>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Editar cuenta"
          />
        }
      >
        <PencilIcon className="size-3.5" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Editar cuenta</DrawerTitle>
          <DrawerDescription>
            {account.name}
            {account.paidAmount > 0
              ? ` · Ya ${isReceivable ? "cobrado" : "pagado"}: ${formatMoney(account.paidAmount)}`
              : null}
          </DrawerDescription>
        </DrawerHeader>
        <form
          id={formId}
          action={onSubmit}
          className="grid gap-4 px-4 sm:grid-cols-2"
        >
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-name`}>
              {isReceivable ? "Cliente" : "Proveedor"}
            </Label>
            <Input
              id={`${formId}-name`}
              name="name"
              defaultValue={account.name}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-amount`}>Monto</Label>
            <Input
              id={`${formId}-amount`}
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={Math.max(0.01, account.paidAmount)}
              defaultValue={account.amount}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-due`}>Vencimiento</Label>
            <Input
              id={`${formId}-due`}
              name="dueDate"
              type="date"
              defaultValue={format(new Date(account.dueDate), "yyyy-MM-dd")}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`${formId}-description`}>Concepto</Label>
            <Input
              id={`${formId}-description`}
              name="description"
              defaultValue={account.description ?? ""}
              className="h-11"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`${formId}-notes`}>Notas</Label>
            <Input
              id={`${formId}-notes`}
              name="notes"
              defaultValue={account.notes ?? ""}
              className="h-11"
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
            {pending ? "Guardando..." : "Guardar cambios"}
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
  canEdit = false,
}: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const pagination = useTablePagination(accounts);

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
          <>
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
                {pagination.pageItems.map((account) => {
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
                          {canEdit ? (
                            <EditAccountDrawer kind={kind} account={account} />
                          ) : null}
                          <PaymentDialog kind={kind} account={account} />
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
          <TablePagination {...pagination} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
