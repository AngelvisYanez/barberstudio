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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";

const NONE_VALUE = "__none__";

export type CatalogItemOption = {
  id: string;
  name: string;
  price: number;
  kind: "service" | "product";
};

type Props = {
  categories: Category[];
  catalogItems?: CatalogItemOption[];
  title: string;
  description: string;
  submitLabel: string;
};

export function TransactionForm({
  categories,
  catalogItems = [],
  title,
  description,
  submitLabel,
}: Props) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [catalogItemId, setCatalogItemId] = useState(NONE_VALUE);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  const showCatalog = catalogItems.length > 0;

  const services = useMemo(
    () => catalogItems.filter((item) => item.kind === "service"),
    [catalogItems],
  );
  const products = useMemo(
    () => catalogItems.filter((item) => item.kind === "product"),
    [catalogItems],
  );

  const catalogById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );

  const categorySelectItems = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categories],
  );

  const catalogSelectItems = useMemo(
    () => [
      { label: "Sin producto/servicio", value: NONE_VALUE },
      ...catalogItems.map((item) => ({
        label: `${item.name} · ${formatMoney(item.price)}`,
        value: item.id,
      })),
    ],
    [catalogItems],
  );

  const hasCatalogSelection = catalogItemId !== NONE_VALUE;
  const categoryRequired = !hasCatalogSelection;

  function resolveCategoryId(item: CatalogItemOption): string | null {
    const incomeCategories = categories.filter(
      (category) => category.type === "INCOME",
    );

    if (item.kind === "product") {
      return (
        incomeCategories.find(
          (category) => category.name.toLowerCase() === "productos",
        )?.id ??
        incomeCategories[0]?.id ??
        null
      );
    }

    const itemName = item.name.toLowerCase();
    const exact = incomeCategories.find(
      (category) => category.name.toLowerCase() === itemName,
    );
    if (exact) return exact.id;

    let best: { id: string; index: number; length: number } | null = null;
    for (const category of incomeCategories) {
      const categoryName = category.name.toLowerCase();
      const index = itemName.indexOf(categoryName);
      if (index === -1) continue;
      if (
        !best ||
        categoryName.length > best.length ||
        (categoryName.length === best.length && index < best.index)
      ) {
        best = {
          id: category.id,
          index,
          length: categoryName.length,
        };
      }
    }

    return best?.id ?? incomeCategories[0]?.id ?? null;
  }

  function applyCatalogItem(itemId: string) {
    setCatalogItemId(itemId);

    if (itemId === NONE_VALUE) return;

    const item = catalogById.get(itemId);
    if (!item) return;

    if (amountRef.current) {
      amountRef.current.value = item.price.toFixed(2);
    }

    if (descriptionRef.current) {
      descriptionRef.current.value = item.name;
    }

    const resolvedCategoryId = resolveCategoryId(item);
    if (resolvedCategoryId) setCategoryId(resolvedCategoryId);
  }

  function onSubmit(formData: FormData) {
    const amount = Number(formData.get("amount"));
    const descriptionValue = String(formData.get("description") ?? "");
    const dateValue = String(formData.get("date") ?? "");

    let resolvedCategoryId = categoryId;

    if (hasCatalogSelection) {
      const item = catalogById.get(catalogItemId);
      if (!item) {
        toast.error("Producto o servicio no válido");
        return;
      }
      resolvedCategoryId = resolveCategoryId(item) ?? "";
      if (!resolvedCategoryId) {
        toast.error("No se pudo determinar la categoría del ítem");
        return;
      }
    } else if (!resolvedCategoryId) {
      toast.error("Selecciona una categoría");
      return;
    }

    const input: CreateTransactionInput = {
      amount,
      categoryId: resolvedCategoryId,
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
      setCatalogItemId(NONE_VALUE);
      setCategoryId(categories[0]?.id ?? "");
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
          {showCatalog ? (
            <div className="grid gap-2 sm:col-span-2 lg:col-span-2">
              <Label htmlFor="catalog-item">
                Producto o servicio{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Select
                items={catalogSelectItems}
                value={catalogItemId}
                onValueChange={(value) => {
                  if (value) applyCatalogItem(value);
                }}
              >
                <SelectTrigger id="catalog-item" className="h-11 w-full">
                  <SelectValue placeholder="Cualquier monto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>
                    Sin producto/servicio
                  </SelectItem>
                  {services.length > 0 ? (
                    <SelectGroup>
                      <SelectLabel>Servicios</SelectLabel>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                          <span className="text-muted-foreground">
                            {formatMoney(service.price)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                  {products.length > 0 ? (
                    <SelectGroup>
                      <SelectLabel>Productos</SelectLabel>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                          <span className="text-muted-foreground">
                            {formatMoney(product.price)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          ) : null}

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

          {categoryRequired ? (
            <div className="grid gap-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                items={categorySelectItems}
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
          ) : null}

          <div
            className={
              categoryRequired
                ? "grid gap-2 sm:col-span-2 lg:col-span-1"
                : "grid gap-2 sm:col-span-2 lg:col-span-2"
            }
          >
            <Label htmlFor="description">Nota (opcional)</Label>
            <Input
              ref={descriptionRef}
              id="description"
              name="description"
              placeholder="Ej. cliente habitual"
              className="h-11"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              disabled={pending || (categoryRequired && !categoryId)}
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
