"use client";

import { format } from "date-fns";
import type { InventoryMovementType } from "@prisma/client";

import type {
  InventoryProductOverview,
  SerializedInventoryMovement,
} from "@/actions/inventory";
import {
  TablePagination,
  useTablePagination,
} from "@/components/table-pagination";
import { Badge } from "@/components/ui/badge";
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
  overview: InventoryProductOverview[];
  movements: SerializedInventoryMovement[];
};

const MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  IN: "Entrada",
  OUT: "Salida",
  ADJUST: "Ajuste",
};

function movementVariant(
  type: InventoryMovementType,
): "default" | "secondary" | "outline" {
  if (type === "IN") return "default";
  if (type === "OUT") return "secondary";
  return "outline";
}

export function InventoryTable({ overview, movements }: Props) {
  const overviewPagination = useTablePagination(overview);
  const movementsPagination = useTablePagination(movements);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock actual</CardTitle>
          <CardDescription>
            {overview.length}{" "}
            {overview.length === 1 ? "producto" : "productos"} · los bajos se
            marcan en rojo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay productos en inventario.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="hidden sm:table-cell">SKU</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="hidden text-right md:table-cell">
                        Mínimo
                      </TableHead>
                      <TableHead className="hidden text-right lg:table-cell">
                        Venta
                      </TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overviewPagination.pageItems.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {product.sku || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {product.lowStock ? (
                            <Badge variant="destructive">{product.stock}</Badge>
                          ) : (
                            product.stock
                          )}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums md:table-cell">
                          {product.minStock}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums lg:table-cell">
                          {formatMoney(product.salePrice)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant={product.active ? "default" : "secondary"}
                            >
                              {product.active ? "Activo" : "Inactivo"}
                            </Badge>
                            {product.lowStock ? (
                              <Badge variant="destructive">Stock bajo</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination {...overviewPagination} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos recientes</CardTitle>
          <CardDescription>
            Últimos {movements.length}{" "}
            {movements.length === 1 ? "movimiento" : "movimientos"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay movimientos de inventario.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="hidden md:table-cell">Nota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementsPagination.pageItems.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="tabular-nums whitespace-nowrap">
                          {format(
                            new Date(movement.createdAt),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.productName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={movementVariant(movement.type)}>
                            {MOVEMENT_LABELS[movement.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {movement.quantity}
                        </TableCell>
                        <TableCell className="hidden max-w-[220px] truncate text-muted-foreground md:table-cell">
                          {movement.note || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination {...movementsPagination} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
