"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { loginAction } from "@/actions/auth";
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
import { cn } from "@/lib/utils";

export type LoginTenant = {
  id: string;
  name: string;
};

export function LoginForm({ tenants }: { tenants: LoginTenant[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("admin@barberstudio.com");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId) {
      toast.error("Elige la barbería");
      return;
    }

    startTransition(async () => {
      const result = await loginAction({ email, password, tenantId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Bienvenido");
      const next = searchParams.get("next");
      const destination =
        next &&
        next.startsWith("/") &&
        !next.startsWith("//") &&
        next !== "/login" &&
        next !== "/tenants"
          ? next
          : "/";
      router.replace(destination);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Image
        src="/logo-barberstudio.jpg"
        alt="Barber Studio"
        width={96}
        height={96}
        className="size-24 rounded-xl object-cover ring-1 ring-foreground/10"
        priority
      />
      <Card className="w-full max-w-md border-foreground/10 bg-card/90 backdrop-blur">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">Barber Studio</CardTitle>
        <CardDescription>
          Elige la barbería, ingresa la contraseña y entra a ese local
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Barbería</Label>
            {tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay barberías disponibles.
              </p>
            ) : (
              <div className="grid gap-2" role="radiogroup" aria-label="Barbería">
                {tenants.map((tenant) => {
                  const selected = tenant.id === tenantId;
                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTenantId(tenant.id)}
                      className={cn(
                        "flex h-11 items-center rounded-md border px-3 text-left text-sm transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-input bg-background hover:bg-muted",
                      )}
                    >
                      {tenant.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={pending || tenants.length === 0}
            className="h-11 w-full"
          >
            {pending ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Usuario inicial: admin@barberstudio.com / admin123
          </p>
        </form>
      </CardContent>
      </Card>
    </div>
  );
}
