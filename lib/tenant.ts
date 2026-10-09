import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { TENANT_COOKIE } from "@/lib/auth-shared";

export async function getActiveTenantId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "SUPERADMIN") {
    const selected = (await cookies()).get(TENANT_COOKIE)?.value;
    return selected || null;
  }
  return session.tenantId;
}

export async function requireTenantId(): Promise<string> {
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    redirect("/tenants");
  }
  return tenantId;
}
