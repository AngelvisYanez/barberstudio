"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setActiveTenant } from "@/actions/tenants";

export type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

export function TenantSwitcher({
  tenants,
  activeTenantId,
}: {
  tenants: TenantOption[];
  activeTenantId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="px-3 pb-2">
      <label
        htmlFor="active-tenant"
        className="px-1 text-xs font-medium text-muted-foreground"
      >
        Barbería activa
      </label>
      <select
        id="active-tenant"
        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={activeTenantId ?? ""}
        disabled={pending || tenants.length === 0}
        onChange={(event) => {
          const tenantId = event.target.value;
          if (!tenantId) return;
          startTransition(async () => {
            const result = await setActiveTenant(tenantId);
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            router.push("/");
            router.refresh();
          });
        }}
      >
        <option value="">Selecciona un local</option>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}
