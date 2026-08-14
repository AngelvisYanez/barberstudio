"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { LoaderIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteProduct,
  updateProductActive,
  type SerializedProduct,
} from "@/actions/products";
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
};

export function ProductsTable({ products }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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
                {products.map((product) => {
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
        )}
      </CardContent>
    </Card>
  );
}
