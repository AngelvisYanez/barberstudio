"use server";

import { CategoryType, type UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { requireSession, SESSION_MAX_AGE } from "@/lib/auth";
import { TENANT_COOKIE } from "@/lib/auth-shared";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const categories: { name: string; type: CategoryType }[] = [
  { name: "Corte", type: CategoryType.INCOME },
  { name: "Barba", type: CategoryType.INCOME },
  { name: "Combo", type: CategoryType.INCOME },
  { name: "Productos", type: CategoryType.INCOME },
  { name: "Alquiler", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Luz", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Agua", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Internet", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Servicios generales", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Insumos", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Otros negocio", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Hogar", type: CategoryType.OWNER_DRAW },
  { name: "Personal", type: CategoryType.OWNER_DRAW },
  { name: "Otros retiro", type: CategoryType.OWNER_DRAW },
];

const createTenantSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa un identificador corto, por ejemplo centro"),
  adminName: z.string().trim().min(2, "Nombre del administrador muy corto").max(80),
  adminEmail: z.string().trim().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export type TenantActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireSuperadmin() {
  const session = await requireSession();
  if (session.role !== "SUPERADMIN") {
    throw new Error("Sin permisos");
  }
  return session;
}

export async function createTenant(
  input: z.infer<typeof createTenantSchema>,
): Promise<TenantActionResult> {
  try {
    await requireSuperadmin();
  } catch {
    return { success: false, error: "Sin permisos de superadmin" };
  }

  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { name, slug, adminName, adminEmail, password } = parsed.data;
  const email = adminEmail.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "Ya existe un usuario con ese correo" };
  }
  const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
  if (existingSlug) {
    return { success: false, error: "Ese identificador ya está en uso" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.tenant.create({
    data: {
      name,
      slug,
      settings: {
        create: {
          businessName: name,
          currency: "USD",
          openTime: "09:00",
          closeTime: "19:00",
        },
      },
      categories: { create: categories },
      users: {
        create: {
          name: adminName,
          email,
          passwordHash,
          role: "ADMIN" satisfies UserRole,
        },
      },
    },
  });

  revalidatePath("/tenants");
  return { success: true };
}

export async function setActiveTenant(
  tenantId: string,
): Promise<TenantActionResult> {
  try {
    await requireSuperadmin();
  } catch {
    return { success: false, error: "Sin permisos de superadmin" };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, active: true },
  });
  if (!tenant) {
    return { success: false, error: "Barbería no encontrada" };
  }

  const cookieStore = await cookies();
  cookieStore.set(TENANT_COOKIE, tenant.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  revalidatePath("/", "layout");
  return { success: true };
}
