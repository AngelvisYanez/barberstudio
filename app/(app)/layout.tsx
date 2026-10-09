import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ActiveTenantProvider } from "@/components/active-tenant";
import { AppSidebar, type TenantOption } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveTenantId } from "@/lib/tenant";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const activeTenantId = await getActiveTenantId();

  if (
    user.role === "SUPERADMIN" &&
    !activeTenantId &&
    pathname !== "/tenants"
  ) {
    redirect("/tenants");
  }

  if (user.role !== "SUPERADMIN" && pathname === "/tenants") {
    redirect("/");
  }

  const tenants: TenantOption[] =
    user.role === "SUPERADMIN"
      ? await prisma.tenant.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true },
        })
      : [];
  const activeTenant = activeTenantId
    ? await prisma.tenant.findUnique({
        where: { id: activeTenantId },
        select: { id: true, name: true, slug: true },
      })
    : null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <div className="hidden md:contents">
        <AppSidebar
          variant="inset"
          user={user}
          tenants={tenants}
          activeTenant={activeTenant}
        />
      </div>
      <SidebarInset>
        <ActiveTenantProvider tenant={activeTenant}>{children}</ActiveTenantProvider>
      </SidebarInset>
      <MobileNav
        user={user}
        tenants={tenants}
        activeTenant={activeTenant}
      />
    </SidebarProvider>
  );
}
