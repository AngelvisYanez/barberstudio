"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  ScissorsIcon,
  UserRoundIcon,
} from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { getNavGroups } from "@/components/app-sidebar";
import { TenantSwitcher, type TenantOption } from "@/components/tenant-switcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { roleLabel, type SessionUser } from "@/lib/auth-shared";
import { cn } from "@/lib/utils";

const primaryItems = [
  { title: "Inicio", url: "/", icon: LayoutDashboardIcon },
  { title: "Citas", url: "/appointments", icon: CalendarDaysIcon },
  { title: "Caja", url: "/transactions", icon: ScissorsIcon },
  { title: "Clientes", url: "/clients", icon: UserRoundIcon },
] as const;

const primaryUrls = new Set<string>(primaryItems.map((item) => item.url));

function isActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function MobileNav({
  user,
  tenants = [],
  activeTenant = null,
}: {
  user: SessionUser;
  tenants?: TenantOption[];
  activeTenant?: TenantOption | null;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreGroups = getNavGroups(user)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !primaryUrls.has(item.url)),
    }))
    .filter((group) => group.items.length > 0);

  const moreActive = moreGroups.some((group) =>
    group.items.some((item) => isActive(pathname, item.url)),
  );

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 left-[env(safe-area-inset-left)] right-[env(safe-area-inset-right)] z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid h-16 grid-cols-5">
          {primaryItems.map((item) => {
            const active = isActive(pathname, item.url);
            const Icon = item.icon;
            return (
              <Link
                key={item.url}
                href={item.url}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
              moreActive || moreOpen
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            <MenuIcon className="size-5" />
            <span>Más</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[min(85dvh,40rem)] gap-0 overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="border-b text-left">
            <SheetTitle>Más</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {user.role === "SUPERADMIN" ? (
              <div className="border-b py-3">
                <TenantSwitcher
                  variant="list"
                  tenants={tenants}
                  activeTenantId={activeTenant?.id ?? null}
                  onSwitched={() => setMoreOpen(false)}
                />
              </div>
            ) : null}
            {moreGroups.map((group) => (
              <div key={group.label} className="px-2 py-3">
                <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                  {group.label}
                </p>
                <ul className="grid gap-1">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.url);
                    return (
                      <li key={item.url}>
                        <Link
                          href={item.url}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                            active
                              ? "bg-muted text-foreground"
                              : "text-foreground/80",
                          )}
                        >
                          {item.icon}
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <div className="mt-auto border-t p-3">
              <div className="mb-2 px-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleLabel(user.role)}
                  {activeTenant ? ` · ${activeTenant.name}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void logoutAction();
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground"
              >
                <LogOutIcon className="size-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
