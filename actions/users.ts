"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin, requireSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type UserActionResult =
  | { success: true }
  | { success: false; error: string };

export type SerializedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  role: z.enum(UserRole),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  email: z.string().trim().email("Correo inválido"),
  role: z.enum(UserRole),
  active: z.boolean(),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(72)
    .optional()
    .or(z.literal("")),
});

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SerializedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getUsers(): Promise<SerializedUser[]> {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  return users.map(serializeUser);
}

export async function createUser(
  input: z.infer<typeof createUserSchema>,
): Promise<UserActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Sin permisos de administrador" };
  }

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Ya existe un usuario con ese correo" };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUser(
  input: z.infer<typeof updateUserSchema>,
): Promise<UserActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Sin permisos de administrador" };
  }

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const conflict = await prisma.user.findFirst({
    where: { email, NOT: { id: parsed.data.id } },
  });
  if (conflict) {
    return { success: false, error: "Ya existe un usuario con ese correo" };
  }

  const data: {
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    passwordHash?: string;
  } = {
    name: parsed.data.name,
    email,
    role: parsed.data.role,
    active: parsed.data.active,
  };

  if (parsed.data.password && parsed.data.password.length > 0) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(id: string): Promise<UserActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { success: false, error: "Sin permisos de administrador" };
  }

  if (session.id === id) {
    return { success: false, error: "No puedes eliminar tu propia cuenta" };
  }

  const admins = await prisma.user.count({
    where: { role: "ADMIN", active: true },
  });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { success: false, error: "Usuario no encontrado" };
  }
  if (target.role === "ADMIN" && target.active && admins <= 1) {
    return {
      success: false,
      error: "Debe quedar al menos un administrador activo",
    };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function getAuthOverview() {
  const session = await requireSession();
  const [total, active, admins, managers, staff] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "MANAGER" } }),
    prisma.user.count({ where: { role: "STAFF" } }),
  ]);

  return {
    session,
    stats: { total, active, admins, managers, staff },
    authConfigured: Boolean(process.env.AUTH_SECRET),
  };
}
