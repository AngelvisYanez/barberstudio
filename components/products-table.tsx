"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { LoaderIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteProduct,
  updateProduct,
  updateProductActive,
  type SerializedProduct,
  type UpdateProductInput,
} from "@/actions/products";
import {
  TablePagination,
  useTablePagination,
} from "@/components/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
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
  products: SerializedProduct[];
  canEdit?: boolean;
};

function EditProductDrawer({ product }: { product: SerializedProduct }) {
  const [pending, startTransition] = useTransition();
  const formId = `edit-product-${product.id}`;

  function onSubmit(formData: FormData) {
    const costRaw = String(formData.get("costPrice") ?? "");
    const stockRaw = String(formData.get("stock") ?? "");
    const minStockRaw = String(formData.get("minStock") ?? "");

    const input: UpdateProductInput = {
      id: product.id,
      name: String(formData.get("name") ?? ""),
      sku: String(formData.get("sku") ?? ""),
      salePrice: Number(formData.get("salePrice")),
      description: String(formData.get("description") ?? ""),
      ...(costRaw !== "" ? { costPrice: Number(costRaw) } : {}),
      ...(stockRaw !== "" ? { stock: Number(stockRaw) } : {}),
      ...(minStockRaw !== "" ? { minStock: Number(minStockRaw) } : {}),
    };

    startTransition(async () => {
      const result = await updateProduct(input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Producto actualizado");
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
            aria-label="Editar producto"
          />
        }
      >
        <PencilIcon className="size-3.5" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Editar producto</DrawerTitle>
          <DrawerDescription>{product.name}</DrawerDescription>
        </DrawerHeader>
        <form
          id={formId}
          action={onSubmit}
          className="grid gap-4 px-4 sm:grid-cols-2"
        >
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-name`}>Nombre</Label>
            <Input
              id={`${formId}-name`}
              name="name"
              defaultValue={product.name}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-sku`}>SKU (opcional)</Label>
            <Input
              id={`${formId}-sku`}
              name="sku"
              defaultValue={product.sku ?? ""}
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-sale`}>Precio de venta</Label>
            <Input
              id={`${formId}-sale`}
              name="salePrice"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              defaultValue={product.salePrice}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-cost`}>Costo</Label>
            <Input
              id={`${formId}-cost`}
              name="costPrice"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              defaultValue={product.costPrice}
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-stock`}>Stock</Label>
            <Input
              id={`${formId}-stock`}
              name="stock"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              defaultValue={product.stock}
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-min`}>Stock mínimo</Label>
            <Input
              id={`${formId}-min`}
              name="minStock"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              defaultValue={product.minStock}
              className="h-11"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`${formId}-description`}>Descripción</Label>
            <Input
              id={`${formId}-description`}
              name="description"
              defaultValue={product.description ?? ""}
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

export function ProductsTable({ products, canEdit = false }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const pagination = useTablePagination(products);

  function handleToggleActive(product: SerializedProduct) {
    const nextActive = !product.active;
    const confirmed = window.confirm(
      `¿${nextActive ? "Activar" : "Desactivar"} el producto ${product.name}?`,
    );
    if (!confirmed) return;

    setPendingId(product.id);
    startTransition(async () => {
      const result = await updateProductActive(product.id, nextActive);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        nextActive ? "Producto activado" : "Producto desactivado",
      );
    });
  }

  function handleDelete(product: SerializedProduct) {
    const confirmed = window.confirm(
      `¿Eliminar el producto ${product.name}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setPendingId(product.id);
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Producto eliminado");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos</CardTitle>
        <CardDescription>
          {products.length} {products.length === 1 ? "registro" : "registros"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay productos registrados.
          </p>
        ) : (
          <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    Costo
                  </TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    Mín.
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">Alta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pageItems.map((product) => {
                  const lowStock = product.stock <= product.minStock;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-0.5">
                          <span>{product.name}</span>
                          {product.description ? (
                            <span className="max-w-[200px] truncate text-xs text-muted-foreground">
                              {product.description}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {product.sku || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(product.salePrice)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {formatMoney(product.costPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lowStock ? (
                          <Badge variant="destructive">{product.stock}</Badge>
                        ) : (
                          product.stock
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">
                        {product.minStock}
                      </TableCell>
                      <TableCell className="hidden tabular-nums xl:table-cell">
                        {format(new Date(product.createdAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.active ? "default" : "secondary"}
                        >
                          {product.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit ? (
                            <EditProductDrawer product={product} />
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={pendingId === product.id}
                            onClick={() => handleToggleActive(product)}
                          >
                            {product.active ? "Desactivar" : "Activar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(product)}
                            disabled={pendingId === product.id}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar producto"
                          >
                            {pendingId === product.id ? (
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
