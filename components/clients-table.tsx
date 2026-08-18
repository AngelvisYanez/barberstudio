"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { LoaderIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteClient,
  updateClientActive,
  type SerializedClient,
} from "@/actions/clients";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  clients: SerializedClient[];
};

export function ClientsTable({ clients }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const pagination = useTablePagination(clients);

  function handleToggleActive(client: SerializedClient) {
    const nextActive = !client.active;
    const confirmed = window.confirm(
      `¿${nextActive ? "Activar" : "Desactivar"} a ${client.name}?`,
    );
    if (!confirmed) return;

    setPendingId(client.id);
    startTransition(async () => {
      const result = await updateClientActive(client.id, nextActive);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(nextActive ? "Cliente activado" : "Cliente desactivado");
    });
  }

  function handleDelete(client: SerializedClient) {
    const confirmed = window.confirm(
      `¿Eliminar a ${client.name}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setPendingId(client.id);
    startTransition(async () => {
      const result = await deleteClient(client.id);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Cliente eliminado");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes</CardTitle>
        <CardDescription>
          {clients.length} {clients.length === 1 ? "registro" : "registros"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay clientes registrados.
          </p>
        ) : (
          <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden md:table-cell">Correo</TableHead>
                  <TableHead className="hidden lg:table-cell">Notas</TableHead>
                  <TableHead className="hidden xl:table-cell">Alta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pageItems.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {client.phone || "—"}
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                      {client.email || "—"}
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell">
                      {client.notes || "—"}
                    </TableCell>
                    <TableCell className="hidden tabular-nums xl:table-cell">
                      {format(new Date(client.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.active ? "default" : "secondary"}>
                        {client.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={pendingId === client.id}
                          onClick={() => handleToggleActive(client)}
                        >
                          {client.active ? "Desactivar" : "Activar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(client)}
                          disabled={pendingId === client.id}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar cliente"
                        >
                          {pendingId === client.id ? (
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
