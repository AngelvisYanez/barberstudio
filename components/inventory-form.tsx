"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { InventoryMovementType } from "@prisma/client";
import { toast } from "sonner";

import {
  recordInventoryMovement,
  type InventoryProductOverview,
  type RecordInventoryMovementInput,
} from "@/actions/inventory";
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
  products: InventoryProductOverview[];
};

const MOVEMENT_TYPES: {
  value: InventoryMovementType;
  label: string;
}[] = [
  { value: "IN", label: "Entrada" },
  { value: "OUT", label: "Salida" },
  { value: "ADJUST", label: "Ajuste (stock absoluto)" },
];

export function InventoryForm({ products }: Props) {
  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products],
  );
  const [productId, setProductId] = useState(activeProducts[0]?.id ?? "");
  const [type, setType] = useState<InventoryMovementType>("IN");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const productItems = useMemo(
    () =>
      activeProducts.map((p) => ({
        label: `${p.name}${p.sku ? ` (${p.sku})` : ""} · stock ${p.stock}`,
        value: p.id,
      })),
    [activeProducts],
  );

  const typeItems = useMemo(
    () => MOVEMENT_TYPES.map((t) => ({ label: t.label, value: t.value })),
    [],
  );

  function onSubmit(formData: FormData) {
    const input: RecordInventoryMovementInput = {
      productId,
      type,
      quantity: Number(formData.get("quantity")),
      note: String(formData.get("note") ?? ""),
    };

    startTransition(async () => {
      const result = await recordInventoryMovement(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Movimiento registrado");
      formRef.current?.reset();
    });
  }

  if (activeProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nuevo movimiento</CardTitle>
          <CardDescription>
            Registra primero un producto activo para poder ajustar inventario.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo movimiento</CardTitle>
        <CardDescription>
          Entrada, salida o ajuste del stock de un producto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="inventory-product">Producto</Label>
            <Select
              items={productItems}
              value={productId}
              onValueChange={(value) => {
                if (value) setProductId(value);
              }}
            >
              <SelectTrigger id="inventory-product" className="h-11 w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="inventory-type">Tipo</Label>
            <Select
              items={typeItems}
              value={type}
              onValueChange={(value) => {
                if (value) setType(value as InventoryMovementType);
              }}
            >
              <SelectTrigger id="inventory-type" className="h-11 w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="inventory-quantity">
              {type === "ADJUST" ? "Stock resultante" : "Cantidad"}
            </Label>
            <Input
              id="inventory-quantity"
              name="quantity"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              placeholder="1"
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="inventory-note">Nota (opcional)</Label>
            <Input
              id="inventory-note"
              name="note"
              placeholder="Ej. compra proveedor"
              className="h-11"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              disabled={pending || !productId}
              className="h-11 w-full text-base lg:w-auto lg:px-8"
              size="lg"
            >
              {pending ? "Guardando..." : "Registrar movimiento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
