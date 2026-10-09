"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearSessionCookie,
  createSessionToken,
  getSession,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(
  input: z.infer<typeof loginSchema>,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const email = parsed.data.email.trim().toLowerCase();
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      user = await prisma.user.findUnique({ where: { email } });
    } catch {
      return {
        success: false,
        error: "No se pudo conectar con la base de datos. Intenta de nuevo.",
      };
    }
  }

  if (!user || !user.active) {
    return { success: false, error: "Credenciales incorrectas" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Credenciales incorrectas" };
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  });
  await setSessionCookie(token);

  return { success: true };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function getCurrentUser() {
  return getSession();
}
