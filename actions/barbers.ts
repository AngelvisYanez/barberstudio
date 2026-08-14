"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  decimalToNumber,
  firstZodError,
} from "@/lib/action-utils";
import { prisma } from "@/lib/prisma";

const createBarberSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Correo inválido")
    .optional()
    .or(z.literal("")),
  commissionPercent: z.coerce
    .number()
    .min(0, "La comisión no puede ser negativa")
    .max(100, "La comisión no puede superar 100"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const updateActiveSchema = z.object({
  id: z.string().min(1, "ID inválido"),
  active: z.boolean(),
});

export type CreateBarberInput = z.infer<typeof createBarberSchema>;

export type SerializedBarber = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  commissionPercent: number;
  active: boolean;
  notes: string | null;
  createdAt: string;
};

function serializeBarber(
  barber: Awaited<ReturnType<typeof prisma.barber.findMany>>[number],
): SerializedBarber {
  return {
    id: barber.id,
    name: barber.name,
    phone: barber.phone,
    email: barber.email,
    commissionPercent: decimalToNumber(barber.commissionPercent),
    active: barber.active,
    notes: barber.notes,
    createdAt: barber.createdAt.toISOString(),
  };
}

export async function createBarber(
  input: CreateBarberInput,
): Promise<ActionResult> {
  const parsed = createBarberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const { name, phone, email, commissionPercent, notes } = parsed.data;

  await prisma.barber.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      commissionPercent,
      notes: notes || null,
    },
  });

  revalidatePath("/barbers");
  return { success: true };
}

export async function updateBarberActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const parsed = updateActiveSchema.safeParse({ id, active });
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const existing = await prisma.barber.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Barbero no encontrado" };
  }

  await prisma.barber.update({
    where: { id },
    data: { active },
  });

  revalidatePath("/barbers");
  return { success: true };
}

export async function deleteBarber(id: string): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }

  const appointmentCount = await prisma.appointment.count({
    where: { barberId: id },
  });
  if (appointmentCount > 0) {
    return {
      success: false,
      error: "No se puede eliminar: el barbero tiene citas vinculadas",
    };
  }

  try {
    await prisma.barber.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        error: "No se puede eliminar: el barbero tiene registros vinculados",
      };
    }
    throw error;
  }

  revalidatePath("/barbers");
  return { success: true };
}

export async function getBarbers(): Promise<SerializedBarber[]> {
  const barbers = await prisma.barber.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });
  return barbers.map(serializeBarber);
}
