"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { LoaderIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteBarber,
  updateBarberActive,
  type SerializedBarber,
} from "@/actions/barbers";
import {
  TablePagination,
  useTablePagination,
} from "@/components/table-pagination";
import {
  desktopTableClass,
  MobileRecord,
  MobileRecordList,
} from "@/components/mobile-record";
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

type Props = {
  barbers: SerializedBarber[];
};

export function BarbersTable({ barbers }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const pagination = useTablePagination(barbers);

  function handleToggleActive(barber: SerializedBarber) {
    const nextActive = !barber.active;
    const confirmed = window.confirm(
      `¿${nextActive ? "Activar" : "Desactivar"} a ${barber.name}?`,
    );
    if (!confirmed) return;

    setPendingId(barber.id);
    startTransition(async () => {
      const result = await updateBarberActive(barber.id, nextActive);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(nextActive ? "Barbero activado" : "Barbero desactivado");
    });
  }

  function handleDelete(barber: SerializedBarber) {
    const confirmed = window.confirm(
      `¿Eliminar a ${barber.name}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setPendingId(barber.id);
    startTransition(async () => {
      const result = await deleteBarber(barber.id);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Barbero eliminado");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barberos</CardTitle>
        <CardDescription>
          {barbers.length} {barbers.length === 1 ? "registro" : "registros"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {barbers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay barberos registrados.
          </p>
        ) : (
          <>
          <MobileRecordList>
            {pagination.pageItems.map((barber) => (
              <MobileRecord
                key={barber.id}
                title={barber.name}
                meta={`${barber.phone || "Sin teléfono"} · comisión ${barber.commissionPercent}%`}
                aside={
                  <Badge variant={barber.active ? "default" : "secondary"}>
                    {barber.active ? "Activo" : "Inactivo"}
                  </Badge>
                }
                actions={
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingId === barber.id}
                      onClick={() => handleToggleActive(barber)}
                    >
                      {barber.active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(barber)}
                      disabled={pendingId === barber.id}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar barbero"
                    >
                      {pendingId === barber.id ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-4" />
                      )}
                    </Button>
                  </>
                }
              />
            ))}
          </MobileRecordList>
          <div className={desktopTableClass}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden md:table-cell">Correo</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead className="hidden lg:table-cell">Notas</TableHead>
                  <TableHead className="hidden xl:table-cell">Alta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pageItems.map((barber) => (
                  <TableRow key={barber.id}>
                    <TableCell className="font-medium">{barber.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {barber.phone || "—"}
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                      {barber.email || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {barber.commissionPercent}%
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell">
                      {barber.notes || "—"}
                    </TableCell>
                    <TableCell className="hidden tabular-nums xl:table-cell">
                      {format(new Date(barber.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={barber.active ? "default" : "secondary"}>
                        {barber.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={pendingId === barber.id}
                          onClick={() => handleToggleActive(barber)}
                        >
                          {barber.active ? "Desactivar" : "Activar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(barber)}
                          disabled={pendingId === barber.id}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar barbero"
                        >
                          {pendingId === barber.id ? (
                            <LoaderIcon className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2Icon className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
