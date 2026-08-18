"use client";

import { useState, useTransition } from "react";
import type { AppointmentStatus } from "@prisma/client";
import { format } from "date-fns";
import { LoaderIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteAppointment,
  updateAppointmentStatus,
  type SerializedAppointment,
} from "@/actions/appointments";
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
import { formatMoney } from "@/lib/money";

type Props = {
  appointments: SerializedAppointment[];
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

const STATUS_ACTIONS: {
  status: AppointmentStatus;
  label: string;
}[] = [
  { status: "SCHEDULED", label: "Programada" },
  { status: "COMPLETED", label: "Completada" },
  { status: "CANCELLED", label: "Cancelada" },
  { status: "NO_SHOW", label: "No asistió" },
];

function statusVariant(
  status: AppointmentStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "SCHEDULED":
      return "outline";
    case "CANCELLED":
      return "secondary";
    case "NO_SHOW":
      return "destructive";
    default:
      return "outline";
  }
}

export function AppointmentsTable({ appointments }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const pagination = useTablePagination(appointments);

  function handleStatus(
    appointment: SerializedAppointment,
    status: AppointmentStatus,
  ) {
    if (appointment.status === status) return;

    setPendingId(appointment.id);
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointment.id, status);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Estado: ${STATUS_LABELS[status]}`);
    });
  }

  function handleDelete(appointment: SerializedAppointment) {
    const confirmed = window.confirm(
      `¿Eliminar la cita de ${appointment.clientName} el ${format(new Date(appointment.startsAt), "dd/MM/yyyy HH:mm")}?`,
    );
    if (!confirmed) return;

    setPendingId(appointment.id);
    startTransition(async () => {
      const result = await deleteAppointment(appointment.id);
      setPendingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Cita eliminada");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Citas</CardTitle>
        <CardDescription>
          {appointments.length}{" "}
          {appointments.length === 1 ? "registro" : "registros"} · ordenado por
          fecha
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay citas agendadas.
          </p>
        ) : (
          <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Barbero</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Servicio
                  </TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pageItems.map((appointment) => {
                  const startsAt = new Date(appointment.startsAt);
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {format(startsAt, "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {appointment.clientName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {appointment.barberName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {appointment.serviceName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(appointment.servicePrice)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(appointment.status)}>
                          {STATUS_LABELS[appointment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {STATUS_ACTIONS.filter(
                            (action) => action.status !== appointment.status,
                          ).map((action) => (
                            <Button
                              key={action.status}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={pendingId === appointment.id}
                              onClick={() =>
                                handleStatus(appointment, action.status)
                              }
                            >
                              {action.label}
                            </Button>
                          ))}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(appointment)}
                            disabled={pendingId === appointment.id}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar cita"
                          >
                            {pendingId === appointment.id ? (
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
