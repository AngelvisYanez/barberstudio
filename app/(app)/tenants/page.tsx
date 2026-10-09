import { setActiveTenant } from "@/actions/tenants";
import { TenantForm } from "@/components/tenant-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveTenantId } from "@/lib/tenant";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SUPERADMIN") redirect("/");

  const [tenants, activeTenantId] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { users: true, clients: true, barbers: true } },
      },
    }),
    getActiveTenantId(),
  ]);

  async function enterTenant(formData: FormData) {
    "use server";
    const tenantId = String(formData.get("tenantId") ?? "");
    await setActiveTenant(tenantId);
    redirect("/");
  }

  return (
    <>
      <SiteHeader title="Barberías" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div>
          <h2 className="text-lg font-semibold">Locales del sistema</h2>
          <p className="text-sm text-muted-foreground">
            El superadmin entra a una barbería para ver su caja, citas e
            inventario. Cada local está aislado.
          </p>
        </div>
        <div className="grid gap-3">
          {tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay barberías.
            </p>
          ) : (
            tenants.map((tenant) => (
              <Card key={tenant.id}>
                <CardHeader>
                  <CardTitle>{tenant.name}</CardTitle>
                  <CardDescription>
                    {tenant.slug}
                    {tenant.id === activeTenantId ? " · activa" : ""}
                    {!tenant.active ? " · inactiva" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {tenant._count.users} usuarios · {tenant._count.barbers}{" "}
                    barberos · {tenant._count.clients} clientes
                  </p>
                  <form action={enterTenant} className="w-full sm:w-auto">
                    <input type="hidden" name="tenantId" value={tenant.id} />
                    <Button type="submit" className="h-11 w-full sm:w-auto">
                      Entrar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <TenantForm />
      </div>
    </>
  );
}
