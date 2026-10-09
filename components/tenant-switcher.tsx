"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setActiveTenant } from "@/actions/tenants";
import { cn } from "@/lib/utils";

export type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

export function TenantSwitcher({
  tenants,
  activeTenantId,
  variant = "select",
  onSwitched,
}: {
  tenants: TenantOption[];
  activeTenantId: string | null;
  variant?: "select" | "list";
  onSwitched?: () => void;
}) {
  const router = useRouter();
  const selectId = useId();
  const [pending, startTransition] = useTransition();

  function switchTenant(tenantId: string) {
    if (!tenantId || tenantId === activeTenantId) return;
    startTransition(async () => {
      const result = await setActiveTenant(tenantId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onSwitched?.();
      router.push("/");
      router.refresh();
    });
  }

  if (variant === "list") {
    return (
      <div className="px-2">
        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
          Barbería activa
        </p>
        {tenants.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">
            No hay barberías disponibles.
          </p>
        ) : (
          <ul className="grid gap-1">
            {tenants.map((tenant) => {
              const selected = tenant.id === activeTenantId;
              return (
                <li key={tenant.id}>
                  <button
                    type="button"
                    disabled={pending}
                    aria-current={selected ? "true" : undefined}
                    onClick={() => switchTenant(tenant.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium",
                      selected
                        ? "bg-foreground text-background"
                        : "text-foreground/80",
                    )}
                  >
                    <span className="truncate">{tenant.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 pb-2">
      <label
        htmlFor={selectId}
        className="px-1 text-xs font-medium text-muted-foreground"
      >
        Barbería activa
      </label>
      <select
        id={selectId}
        className="mt-1 h-11 w-full rounded-md border border-input bg-background px-2 text-base md:h-9 md:text-sm"
        value={activeTenantId ?? ""}
        disabled={pending || tenants.length === 0}
        onChange={(event) => switchTenant(event.target.value)}
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
