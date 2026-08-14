"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { createService, type CreateServiceInput } from "@/actions/services";
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

export function ServiceForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function onSubmit(formData: FormData) {
    const input: CreateServiceInput = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: Number(formData.get("price")),
      durationMinutes: Number(formData.get("durationMinutes")),
    };

    startTransition(async () => {
      const result = await createService(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Servicio registrado");
      formRef.current?.reset();
      nameRef.current?.focus();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo servicio</CardTitle>
        <CardDescription>
          Define precio y duración para el catálogo de citas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="service-name">Nombre</Label>
            <Input
              ref={nameRef}
              id="service-name"
              name="name"
              placeholder="Ej. Corte clásico"
              required
              autoFocus
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-price">Precio</Label>
            <Input
              id="service-price"
              name="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-duration">Duración (min)</Label>
            <Input
              id="service-duration"
              name="durationMinutes"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              max="480"
              defaultValue={30}
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="service-description">Descripción (opcional)</Label>
            <Input
              id="service-description"
              name="description"
              placeholder="Detalle del servicio"
              className="h-11"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full text-base lg:w-auto lg:px-8"
              size="lg"
            >
              {pending ? "Guardando..." : "Registrar servicio"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
