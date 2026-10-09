"use client";

import { createContext, useContext } from "react";

import type { TenantOption } from "@/components/tenant-switcher";

const ActiveTenantContext = createContext<TenantOption | null>(null);

export function ActiveTenantProvider({
  tenant,
  children,
}: {
  tenant: TenantOption | null;
  children: React.ReactNode;
}) {
  return (
    <ActiveTenantContext.Provider value={tenant}>
      {children}
    </ActiveTenantContext.Provider>
  );
}

export function ActiveTenantName() {
  const tenant = useContext(ActiveTenantContext);
  if (!tenant) return null;

  return (
    <p className="truncate text-xs font-normal text-muted-foreground md:hidden">
      {tenant.name}
    </p>
  );
}
