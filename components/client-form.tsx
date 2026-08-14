"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { createClient, type CreateClientInput } from "@/actions/clients";
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

export function ClientForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function onSubmit(formData: FormData) {
    const input: CreateClientInput = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };

    startTransition(async () => {
      const result = await createClient(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Cliente registrado");
      formRef.current?.reset();
      nameRef.current?.focus();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo cliente</CardTitle>
        <CardDescription>
          Registra un cliente para citas e historial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="client-name">Nombre</Label>
            <Input
              ref={nameRef}
              id="client-name"
              name="name"
              placeholder="Ej. Juan Pérez"
              required
              autoFocus
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client-phone">Teléfono (opcional)</Label>
            <Input
              id="client-phone"
              name="phone"
              type="tel"
              placeholder="Ej. 0412-1234567"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client-email">Correo (opcional)</Label>
            <Input
              id="client-email"
              name="email"
              type="email"
              placeholder="Ej. juan@correo.com"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client-notes">Notas (opcional)</Label>
            <Input
              id="client-notes"
              name="notes"
              placeholder="Preferencias, alergias…"
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
              {pending ? "Guardando..." : "Registrar cliente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
