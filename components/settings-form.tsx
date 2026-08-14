"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  updateBusinessSettings,
  type SerializedBusinessSettings,
  type UpdateBusinessSettingsInput,
} from "@/actions/settings";
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

type Props = {
  settings: SerializedBusinessSettings;
};

export function SettingsForm({ settings }: Props) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const input: UpdateBusinessSettingsInput = {
      businessName: String(formData.get("businessName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      address: String(formData.get("address") ?? ""),
      currency: String(formData.get("currency") ?? ""),
      taxRate: Number(formData.get("taxRate")),
      openTime: String(formData.get("openTime") ?? ""),
      closeTime: String(formData.get("closeTime") ?? ""),
    };

    startTransition(async () => {
      const result = await updateBusinessSettings(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Configuración guardada");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del negocio</CardTitle>
        <CardDescription>
          Nombre, contacto, moneda, impuestos y horario de atención.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="grid gap-2">
            <Label htmlFor="settings-name">Nombre del negocio</Label>
            <Input
              id="settings-name"
              name="businessName"
              defaultValue={settings.businessName}
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settings-phone">Teléfono (opcional)</Label>
            <Input
              id="settings-phone"
              name="phone"
              type="tel"
              defaultValue={settings.phone ?? ""}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settings-email">Correo (opcional)</Label>
            <Input
              id="settings-email"
              name="email"
              type="email"
              defaultValue={settings.email ?? ""}
              className="h-11"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="settings-address">Dirección (opcional)</Label>
            <Input
              id="settings-address"
              name="address"
              defaultValue={settings.address ?? ""}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settings-currency">Moneda</Label>
            <Input
              id="settings-currency"
              name="currency"
              defaultValue={settings.currency}
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settings-tax">Tasa de impuesto (%)</Label>
            <Input
              id="settings-tax"
              name="taxRate"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="100"
              defaultValue={settings.taxRate}
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settings-open">Apertura (HH:MM)</Label>
            <Input
              id="settings-open"
              name="openTime"
              type="time"
              defaultValue={settings.openTime}
              required
              className="h-11 text-base"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settings-close">Cierre (HH:MM)</Label>
            <Input
              id="settings-close"
              name="closeTime"
              type="time"
              defaultValue={settings.closeTime}
              required
              className="h-11 text-base"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full text-base lg:w-auto lg:px-8"
              size="lg"
            >
              {pending ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
