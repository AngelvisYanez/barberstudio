import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "barberstudio_session";
export const TENANT_COOKIE = "barberstudio_tenant";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
};

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "SUPERADMIN":
      return "Superadmin";
    case "ADMIN":
      return "Administrador";
    case "MANAGER":
      return "Gerente";
    case "STAFF":
      return "Personal";
    default:
      return role;
  }
}

export function isPlatformAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}
