"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { LoaderIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteService,
  updateService,
  updateServiceActive,
  type SerializedService,
  type UpdateServiceInput,
} from "@/actions/services";
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
  services: SerializedService[];
  canEdit?: boolean;
};

function EditServiceDrawer({ service }: { service: SerializedService }) {
  const [pending, startTransition] = useTransition();
  const formId = `edit-service-${service.id}`;

  function onSubmit(formData: FormData) {
    const input: UpdateServiceInput = {
      id: service.id,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: Number(formData.get("price")),
      durationMinutes: Number(formData.get("durationMinutes")),
    };

    startTransition(async () => {
      const result = await updateService(input);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Servicio actualizado");
    });
  }

  return (
    <Drawer>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-11 text-muted-foreground md:size-7"
            aria-label="Editar servicio"
          />
        }
      >
        <PencilIcon className="size-3.5" />
      </DrawerTrigger>
      <DrawerContent className="max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-bottom)-1rem))] overflow-y-auto">
        <DrawerHeader className="gap-1">
          <DrawerTitle>Editar servicio</DrawerTitle>
          <DrawerDescription>{service.name}</DrawerDescription>
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
              defaultValue={service.name}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-price`}>Precio</Label>
            <Input
              id={`${formId}-price`}
              name="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              defaultValue={service.price}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-duration`}>Duración (min)</Label>
            <Input
              id={`${formId}-duration`}
              name="durationMinutes"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              max="480"
              defaultValue={service.durationMinutes}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`${formId}-description`}>Descripción</Label>
            <Input
              id={`${formId}-description`}
              name="description"
              defaultValue={service.description ?? ""}
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

export function ServicesTable({ services, canEdit = false }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const pagination = useTablePagination(services);

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
          <>
          <MobileRecordList>
            {pagination.pageItems.map((service) => (
              <MobileRecord
                key={service.id}
                title={service.name}
                meta={`${formatMoney(service.price)} · ${service.durationMinutes} min${service.description ? ` · ${service.description}` : ""}`}
                aside={
                  <Badge variant={service.active ? "default" : "secondary"}>
                    {service.active ? "Activo" : "Inactivo"}
                  </Badge>
                }
                actions={
                  <>
                    {canEdit ? <EditServiceDrawer service={service} /> : null}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingId === service.id}
                      onClick={() => handleToggleActive(service)}
                    >
                      {service.active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(service)}
                      disabled={pendingId === service.id}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar servicio"
                    >
                      {pendingId === service.id ? (
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
                {pagination.pageItems.map((service) => (
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
                        {canEdit ? (
                          <EditServiceDrawer service={service} />
                        ) : null}
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
          <TablePagination {...pagination} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
