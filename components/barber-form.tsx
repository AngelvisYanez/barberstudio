"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { createBarber, type CreateBarberInput } from "@/actions/barbers";
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

export function BarberForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function onSubmit(formData: FormData) {
    const input: CreateBarberInput = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      commissionPercent: Number(formData.get("commissionPercent")),
      notes: String(formData.get("notes") ?? ""),
    };

    startTransition(async () => {
      const result = await createBarber(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Barbero registrado");
      formRef.current?.reset();
      nameRef.current?.focus();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo barbero</CardTitle>
        <CardDescription>
          Alta de personal con porcentaje de comisión.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="grid gap-2">
            <Label htmlFor="barber-name">Nombre</Label>
            <Input
              ref={nameRef}
              id="barber-name"
              name="name"
              placeholder="Ej. Carlos Ruiz"
              required
              autoFocus
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="barber-phone">Teléfono (opcional)</Label>
            <Input
              id="barber-phone"
              name="phone"
              type="tel"
              placeholder="Ej. 0414-9876543"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="barber-email">Correo (opcional)</Label>
            <Input
              id="barber-email"
              name="email"
              type="email"
              placeholder="Ej. carlos@barberstudio.com"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="barber-commission">Comisión (%)</Label>
            <Input
              id="barber-commission"
              name="commissionPercent"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="100"
              defaultValue={0}
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="barber-notes">Notas (opcional)</Label>
            <Input
              id="barber-notes"
              name="notes"
              placeholder="Horario, especialidad…"
              className="h-11"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full text-base lg:w-auto lg:px-8"
              size="lg"
            >
              {pending ? "Guardando..." : "Registrar barbero"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
