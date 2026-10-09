"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createTenant } from "@/actions/tenants";
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

export function TenantForm() {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createTenant({
        name,
        slug,
        adminName,
        adminEmail,
        password,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Barbería creada");
      setName("");
      setSlug("");
      setAdminName("");
      setAdminEmail("");
      setPassword("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva barbería</CardTitle>
        <CardDescription>
          Cada local tiene sus propios clientes, caja, inventario y usuarios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="tenant-name">Nombre</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tenant-slug">Identificador</Label>
            <Input
              id="tenant-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="centro"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-name">Administrador</Label>
            <Input
              id="admin-name"
              value={adminName}
              onChange={(event) => setAdminName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admin-email">Correo</Label>
            <Input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="admin-password">Contraseña inicial</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} className="h-11 w-full sm:w-auto">
              {pending ? "Creando..." : "Crear barbería"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
