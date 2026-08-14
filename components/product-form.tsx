"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { createProduct, type CreateProductInput } from "@/actions/products";
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

export function ProductForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function onSubmit(formData: FormData) {
    const costRaw = String(formData.get("costPrice") ?? "");
    const stockRaw = String(formData.get("stock") ?? "");
    const minStockRaw = String(formData.get("minStock") ?? "");

    const input: CreateProductInput = {
      name: String(formData.get("name") ?? ""),
      sku: String(formData.get("sku") ?? ""),
      salePrice: Number(formData.get("salePrice")),
      description: String(formData.get("description") ?? ""),
      ...(costRaw !== "" ? { costPrice: Number(costRaw) } : {}),
      ...(stockRaw !== "" ? { stock: Number(stockRaw) } : {}),
      ...(minStockRaw !== "" ? { minStock: Number(minStockRaw) } : {}),
    };

    startTransition(async () => {
      const result = await createProduct(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Producto registrado");
      formRef.current?.reset();
      nameRef.current?.focus();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo producto</CardTitle>
        <CardDescription>
          Catálogo para venta e inventario.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="product-name">Nombre</Label>
            <Input
              ref={nameRef}
              id="product-name"
              name="name"
              placeholder="Ej. Cera mate"
              required
              autoFocus
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product-sku">SKU (opcional)</Label>
            <Input
              id="product-sku"
              name="sku"
              placeholder="Ej. CER-001"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product-sale">Precio de venta</Label>
            <Input
              id="product-sale"
              name="salePrice"
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
            <Label htmlFor="product-cost">Costo (opcional)</Label>
            <Input
              id="product-cost"
              name="costPrice"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product-stock">Stock inicial</Label>
            <Input
              id="product-stock"
              name="stock"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              defaultValue={0}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product-min-stock">Stock mínimo</Label>
            <Input
              id="product-min-stock"
              name="minStock"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              defaultValue={0}
              className="h-11"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="product-description">Descripción (opcional)</Label>
            <Input
              id="product-description"
              name="description"
              placeholder="Detalle del producto"
              className="h-11"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full text-base lg:w-auto lg:px-8"
              size="lg"
            >
              {pending ? "Guardando..." : "Registrar producto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
