"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Category, CategoryType } from "@prisma/client";

import { createTransaction, type CreateTransactionInput } from "@/actions/transactions";
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

type Props = {
  categories: Category[];
  title: string;
  description: string;
  submitLabel: string;
};

export function TransactionForm({
  categories,
  title,
  description,
  submitLabel,
}: Props) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const selectItems = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categories],
  );

  function onSubmit(formData: FormData) {
    const amount = Number(formData.get("amount"));
    const descriptionValue = String(formData.get("description") ?? "");
    const dateValue = String(formData.get("date") ?? "");

    const input: CreateTransactionInput = {
      amount,
      categoryId,
      description: descriptionValue,
      ...(dateValue
        ? { date: new Date(`${dateValue}T00:00:00`) }
        : {}),
    };

    startTransition(async () => {
      const result = await createTransaction(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Registrado");
      formRef.current?.reset();
      amountRef.current?.focus();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              ref={amountRef}
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              autoFocus
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={format(new Date(), "yyyy-MM-dd")}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              items={selectItems}
              value={categoryId}
              onValueChange={(value) => {
                if (value) setCategoryId(value);
              }}
            >
              <SelectTrigger id="category" className="h-11 w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                    <span className="sr-only">
                      {(category.type as CategoryType) === "INCOME"
                        ? "ingreso"
                        : category.type === "BUSINESS_EXPENSE"
                          ? "gasto"
                          : "retiro"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="description">Nota (opcional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ej. cliente habitual"
              className="h-11"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              disabled={pending || !categoryId}
              className="h-11 w-full text-base"
              size="lg"
            >
              {pending ? "Guardando..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
