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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("admin@barberstudio.com");
  const [password, setPassword] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await loginAction({ email, password });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Bienvenido");
      const next = searchParams.get("next") || "/";
      router.replace(next);
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
          Inicia sesión para acceder a los módulos del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
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
          <Button type="submit" disabled={pending} className="h-11 w-full">
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
