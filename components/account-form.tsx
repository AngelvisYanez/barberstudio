"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createAccountPayable,
  createAccountReceivable,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ExpenseCategoryOption = {
  id: string;
  name: string;
};

type Props = {
  kind: "receivable" | "payable";
  expenseCategories?: ExpenseCategoryOption[];
};

export function AccountForm({ kind, expenseCategories = [] }: Props) {
  const isReceivable = kind === "receivable";
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const categoryItems = useMemo(
    () => expenseCategories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
    [expenseCategories],
  );

  function onSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const description = String(formData.get("description") ?? "");
    const amount = Number(formData.get("amount"));
    const dueDate = new Date(String(formData.get("dueDate") ?? ""));
    const notes = String(formData.get("notes") ?? "");

    startTransition(async () => {
      const result = isReceivable
        ? await createAccountReceivable({
            name,
            description,
            amount,
            dueDate,
            notes,
          })
        : await createAccountPayable({
            name,
            description,
            amount,
            dueDate,
            notes,
            categoryId,
          });

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

          {isReceivable ? null : (
            <div className="grid gap-2">
              <Label htmlFor="account-category">Tipo de gasto</Label>
              <Select
                items={categoryItems}
                value={categoryId}
                onValueChange={(value) => {
                  if (value) setCategoryId(value);
                }}
              >
                <SelectTrigger id="account-category" className="h-11 w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              disabled={pending || (!isReceivable && !categoryId)}
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
