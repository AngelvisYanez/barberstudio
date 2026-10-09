"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  decimalToNumber,
  firstZodError,
} from "@/lib/action-utils";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/tenant";

const createServiceSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  durationMinutes: z.coerce
    .number()
    .int("La duración debe ser un número entero")
    .positive("La duración debe ser mayor a 0")
    .max(480, "La duración no puede superar 480 minutos"),
});

const updateServiceSchema = createServiceSchema.extend({
  id: z.string().min(1, "ID inválido"),
});

const updateActiveSchema = z.object({
  id: z.string().min(1, "ID inválido"),
  active: z.boolean(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export type SerializedService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
};

function serializeService(
  service: Awaited<ReturnType<typeof prisma.service.findMany>>[number],
): SerializedService {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: decimalToNumber(service.price),
    durationMinutes: service.durationMinutes,
    active: service.active,
    createdAt: service.createdAt.toISOString(),
  };
}

export async function createService(
  input: CreateServiceInput,
): Promise<ActionResult> {
  const parsed = createServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const { name, description, price, durationMinutes } = parsed.data;

  try {
    const tenantId = await requireTenantId();
    await prisma.service.create({
      data: {
        tenantId,
        name,
        description: description || null,
        price,
        durationMinutes,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Ya existe un servicio con ese nombre",
      };
    }
    throw error;
  }

  revalidatePath("/services");
  return { success: true };
}

export async function updateServiceActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const parsed = updateActiveSchema.safeParse({ id, active });
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const existing = await prisma.service.findFirst({ where: { id } });
  if (!existing) {
    return { success: false, error: "Servicio no encontrado" };
  }

  await prisma.service.updateMany({
    where: { id },
    data: { active },
  });

  revalidatePath("/services");
  return { success: true };
}

export async function updateService(
  input: UpdateServiceInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Sin permisos de administrador" };
  }

  const parsed = updateServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const { id, name, description, price, durationMinutes } = parsed.data;

  const existing = await prisma.service.findFirst({ where: { id } });
  if (!existing) {
    return { success: false, error: "Servicio no encontrado" };
  }

  try {
    await prisma.service.updateMany({
      where: { id },
      data: {
        name,
        description: description || null,
        price,
        durationMinutes,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Ya existe un servicio con ese nombre",
      };
    }
    throw error;
  }

  revalidatePath("/services");
  return { success: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }

  const appointmentCount = await prisma.appointment.count({
    where: { serviceId: id },
  });
  if (appointmentCount > 0) {
    return {
      success: false,
      error: "No se puede eliminar: el servicio tiene citas vinculadas",
    };
  }

  try {
    await prisma.service.deleteMany({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        error: "No se puede eliminar: el servicio tiene registros vinculados",
      };
    }
    throw error;
  }

  revalidatePath("/services");
  return { success: true };
}

export async function getServices(): Promise<SerializedService[]> {
  const services = await prisma.service.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });
  return services.map(serializeService);
}
