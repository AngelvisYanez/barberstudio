"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { LoaderIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteService,
  updateServiceActive,
  type SerializedService,
} from "@/actions/services";
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
  services: SerializedService[];
};

export function ServicesTable({ services }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggleActive(service: SerializedService) {
    const nextActive = !service.active;
    const confirmed = window.confirm(
      `¿${nextActive ? "Activar" : "Desactivar"} el servicio ${service.name}?`,
    );
    if (!confirmed) return;

    setPendingId(service.id);
    startTransition(async () => {
      const result = await updateServiceActive(service.id, nextActive);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        nextActive ? "Servicio activado" : "Servicio desactivado",
      );
    });
  }

  function handleDelete(service: SerializedService) {
    const confirmed = window.confirm(
      `¿Eliminar el servicio ${service.name}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setPendingId(service.id);
    startTransition(async () => {
      const result = await deleteService(service.id);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Servicio eliminado");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios</CardTitle>
        <CardDescription>
          {services.length} {services.length === 1 ? "registro" : "registros"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay servicios registrados.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Descripción
                  </TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Duración</TableHead>
                  <TableHead className="hidden lg:table-cell">Alta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-muted-foreground sm:table-cell">
                      {service.description || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(service.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {service.durationMinutes} min
                    </TableCell>
                    <TableCell className="hidden tabular-nums lg:table-cell">
                      {format(new Date(service.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.active ? "default" : "secondary"}>
                        {service.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={pendingId === service.id}
                          onClick={() => handleToggleActive(service)}
                        >
                          {service.active ? "Desactivar" : "Activar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(service)}
                          disabled={pendingId === service.id}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar servicio"
                        >
                          {pendingId === service.id ? (
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
        )}
      </CardContent>
    </Card>
  );
}
