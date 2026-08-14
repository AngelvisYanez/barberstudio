"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type ActionResult, firstZodError } from "@/lib/action-utils";
import { prisma } from "@/lib/prisma";

const createClientSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Correo inválido")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const updateActiveSchema = z.object({
  id: z.string().min(1, "ID inválido"),
  active: z.boolean(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export type SerializedClient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
};

function serializeClient(
  client: Awaited<ReturnType<typeof prisma.client.findMany>>[number],
): SerializedClient {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    notes: client.notes,
    active: client.active,
    createdAt: client.createdAt.toISOString(),
  };
}

export async function createClient(
  input: CreateClientInput,
): Promise<ActionResult> {
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const { name, phone, email, notes } = parsed.data;

  await prisma.client.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    },
  });

  revalidatePath("/clients");
  return { success: true };
}

export async function updateClientActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const parsed = updateActiveSchema.safeParse({ id, active });
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Cliente no encontrado" };
  }

  await prisma.client.update({
    where: { id },
    data: { active },
  });

  revalidatePath("/clients");
  return { success: true };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }

  const appointmentCount = await prisma.appointment.count({
    where: { clientId: id },
  });
  if (appointmentCount > 0) {
    return {
      success: false,
      error: "No se puede eliminar: el cliente tiene citas vinculadas",
    };
  }

  try {
    await prisma.client.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        error: "No se puede eliminar: el cliente tiene registros vinculados",
      };
    }
    throw error;
  }

  revalidatePath("/clients");
  return { success: true };
}

export async function getClients(): Promise<SerializedClient[]> {
  const clients = await prisma.client.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });
  return clients.map(serializeClient);
}
