"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  ChartColumnIcon,
  ClipboardListIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptIcon,
  ScissorsIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  UserRoundCogIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { SessionUser } from "@/lib/auth-shared";

const navGroups = [
  {
    label: "Operación",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: <LayoutDashboardIcon />,
      },
      {
        title: "Citas",
        url: "/appointments",
        icon: <CalendarDaysIcon />,
      },
      {
        title: "Clientes",
        url: "/clients",
        icon: <UserRoundIcon />,
      },
      {
        title: "Servicios",
        url: "/services",
        icon: <ClipboardListIcon />,
      },
    ],
  },
  {
    label: "Contabilidad",
    items: [
      {
        title: "Caja Diaria",
        url: "/transactions",
        icon: <ScissorsIcon />,
      },
      {
        title: "Retiros Personales",
        url: "/owner-draws",
        icon: <WalletIcon />,
      },
      {
        title: "Cuentas por Cobrar",
        url: "/accounts-receivable",
        icon: <HandCoinsIcon />,
      },
      {
        title: "Cuentas por Pagar",
        url: "/accounts-payable",
        icon: <ReceiptIcon />,
      },
      {
        title: "Reportes",
        url: "/reports",
        icon: <ChartColumnIcon />,
      },
    ],
  },
  {
    label: "Gestión",
    items: [
      {
        title: "Barberos",
        url: "/barbers",
        icon: <UsersIcon />,
      },
      {
        title: "Inventario",
        url: "/inventory",
        icon: <PackageIcon />,
      },
      {
        title: "Productos",
        url: "/products",
        icon: <ShoppingBagIcon />,
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        title: "Usuarios",
        url: "/admin/users",
        icon: <UserRoundCogIcon />,
      },
      {
        title: "Auth y seguridad",
        url: "/admin/auth",
        icon: <ShieldCheckIcon />,
      },
      {
        title: "Configuración",
        url: "/admin/settings",
        icon: <SettingsIcon />,
      },
    ],
  },
];

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: SessionUser;
}) {
  const pathname = usePathname();

  const groups =
    user.role === "ADMIN"
      ? navGroups
      : navGroups.filter((group) => group.label !== "Administración");

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <Image
                src="/logo-barberstudio.jpg"
                alt="Barber Studio"
                width={36}
                height={36}
                className="size-9 rounded-lg object-cover ring-1 ring-foreground/10"
                priority
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Barber Studio</span>
                <span className="truncate text-xs text-muted-foreground">
                  Gestión integral
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        <NavMain groups={groups} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
