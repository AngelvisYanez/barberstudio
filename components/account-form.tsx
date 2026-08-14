"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

import {
  createAccountPayable,
  createAccountReceivable,
  type CreateAccountInput,
} from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  kind: "receivable" | "payable";
};

export function AccountForm({ kind }: Props) {
  const isReceivable = kind === "receivable";
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const createAccount = isReceivable
    ? createAccountReceivable
    : createAccountPayable;

  function onSubmit(formData: FormData) {
    const input: CreateAccountInput = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      amount: Number(formData.get("amount")),
      dueDate: new Date(String(formData.get("dueDate") ?? "")),
      notes: String(formData.get("notes") ?? ""),
    };

    startTransition(async () => {
      const result = await createAccount(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Registrado");
      formRef.current?.reset();
      nameRef.current?.focus();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isReceivable ? "Nueva cuenta por cobrar" : "Nueva cuenta por pagar"}
        </CardTitle>
        <CardDescription>
          {isReceivable
            ? "Registra un crédito otorgado a un cliente."
            : "Registra una deuda con un proveedor."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="grid gap-2">
            <Label htmlFor="account-name">
              {isReceivable ? "Cliente" : "Proveedor"}
            </Label>
            <Input
              ref={nameRef}
              id="account-name"
              name="name"
              placeholder={
                isReceivable ? "Ej. Juan Pérez" : "Ej. Distribuidora Central"
              }
              required
              autoFocus
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-amount">Monto</Label>
            <Input
              id="account-amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-due-date">Vencimiento</Label>
            <Input
              id="account-due-date"
              name="dueDate"
              type="date"
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2 lg:col-span-2">
            <Label htmlFor="account-description">Concepto (opcional)</Label>
            <Input
              id="account-description"
              name="description"
              placeholder="Ej. Corte + barba a crédito"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-notes">Notas (opcional)</Label>
            <Input
              id="account-notes"
              name="notes"
              placeholder="Ej. pagará en dos quincenas"
              className="h-11"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full text-base lg:w-auto lg:px-8"
              size="lg"
            >
              {pending ? "Guardando..." : "Registrar cuenta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
