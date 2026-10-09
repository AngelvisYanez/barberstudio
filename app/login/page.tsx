import { Suspense } from "react";

import { LoginForm, type LoginTenant } from "@/components/login-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let tenants: LoginTenant[] = [];
  try {
    tenants = await prisma.tenant.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    tenants = [];
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-x-hidden overflow-y-auto bg-background px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]"
      />
      <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando...</div>}>
        <LoginForm tenants={tenants} />
      </Suspense>
    </main>
  );
}
