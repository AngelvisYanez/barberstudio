"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  createAppointment,
  type AppointmentOptions,
  type CreateAppointmentInput,
} from "@/actions/appointments";
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
  options: AppointmentOptions;
};

export function AppointmentForm({ options }: Props) {
  const [clientId, setClientId] = useState(options.clients[0]?.id ?? "");
  const [barberId, setBarberId] = useState(options.barbers[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(options.services[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const clientItems = useMemo(
    () => options.clients.map((c) => ({ label: c.name, value: c.id })),
    [options.clients],
  );
  const barberItems = useMemo(
    () => options.barbers.map((b) => ({ label: b.name, value: b.id })),
    [options.barbers],
  );
  const serviceItems = useMemo(
    () =>
      options.services.map((s) => ({
        label: `${s.name} · ${s.durationMinutes} min`,
        value: s.id,
      })),
    [options.services],
  );

  const canSubmit =
    clientId && barberId && serviceId && options.clients.length > 0;

  function onSubmit(formData: FormData) {
    const startsAtRaw = String(formData.get("startsAt") ?? "");
    const input: CreateAppointmentInput = {
      clientId,
      barberId,
      serviceId,
      startsAt: new Date(startsAtRaw),
      notes: String(formData.get("notes") ?? ""),
    };

    startTransition(async () => {
      const result = await createAppointment(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Cita registrada");
      formRef.current?.reset();
    });
  }

  if (
    options.clients.length === 0 ||
    options.barbers.length === 0 ||
    options.services.length === 0
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nueva cita</CardTitle>
          <CardDescription>
            Necesitas al menos un cliente, un barbero y un servicio activos
            para agendar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva cita</CardTitle>
        <CardDescription>
          Agenda cliente, barbero y servicio con fecha y hora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="grid gap-2">
            <Label htmlFor="appointment-client">Cliente</Label>
            <Select
              items={clientItems}
              value={clientId}
              onValueChange={(value) => {
                if (value) setClientId(value);
              }}
            >
              <SelectTrigger id="appointment-client" className="h-11 w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {options.clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="appointment-barber">Barbero</Label>
            <Select
              items={barberItems}
              value={barberId}
              onValueChange={(value) => {
                if (value) setBarberId(value);
              }}
            >
              <SelectTrigger id="appointment-barber" className="h-11 w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {options.barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="appointment-service">Servicio</Label>
            <Select
              items={serviceItems}
              value={serviceId}
              onValueChange={(value) => {
                if (value) setServiceId(value);
              }}
            >
              <SelectTrigger id="appointment-service" className="h-11 w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {options.services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="appointment-starts">Fecha y hora</Label>
            <Input
              id="appointment-starts"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="appointment-notes">Notas (opcional)</Label>
            <Input
              id="appointment-notes"
              name="notes"
              placeholder="Preferencias o detalles"
              className="h-11"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button
              type="submit"
              disabled={pending || !canSubmit}
              className="h-11 w-full text-base lg:w-auto lg:px-8"
              size="lg"
            >
              {pending ? "Guardando..." : "Agendar cita"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
