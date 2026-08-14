"use server";

import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  decimalToNumber,
  firstZodError,
} from "@/lib/action-utils";
import { prisma } from "@/lib/prisma";

const createAppointmentSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  barberId: z.string().min(1, "Selecciona un barbero"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
  startsAt: z.coerce.date("La fecha y hora de inicio son obligatorias"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const updateStatusSchema = z.object({
  id: z.string().min(1, "ID inválido"),
  status: z.enum(AppointmentStatus, {
    error: "Estado de cita inválido",
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export type SerializedAppointment = {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  clientName: string;
  barberName: string;
  serviceName: string;
  servicePrice: number;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
};

export type AppointmentOptions = {
  clients: { id: string; name: string }[];
  barbers: { id: string; name: string }[];
  services: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  }[];
};

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<ActionResult> {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const { clientId, barberId, serviceId, startsAt, notes } = parsed.data;

  const [client, barber, service] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.barber.findUnique({ where: { id: barberId } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
  ]);

  if (!client || !client.active) {
    return { success: false, error: "Cliente no encontrado o inactivo" };
  }
  if (!barber || !barber.active) {
    return { success: false, error: "Barbero no encontrado o inactivo" };
  }
  if (!service || !service.active) {
    return { success: false, error: "Servicio no encontrado o inactivo" };
  }

  const endsAt = new Date(
    startsAt.getTime() + service.durationMinutes * 60_000,
  );

  await prisma.appointment.create({
    data: {
      clientId,
      barberId,
      serviceId,
      startsAt,
      endsAt,
      notes: notes || null,
    },
  });

  revalidatePath("/appointments");
  return { success: true };
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<ActionResult> {
  const parsed = updateStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Cita no encontrada" };
  }

  await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/appointments");
  return { success: true };
}

export async function deleteAppointment(id: string): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }

  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Cita no encontrada" };
  }

  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/appointments");
  return { success: true };
}

export async function getAppointments(
  from?: Date,
  to?: Date,
): Promise<SerializedAppointment[]> {
  const appointments = await prisma.appointment.findMany({
    where:
      from || to
        ? {
            startsAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : undefined,
    include: {
      client: { select: { name: true } },
      barber: { select: { name: true } },
      service: { select: { name: true, price: true } },
    },
    orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
  });

  return appointments.map((appointment) => ({
    id: appointment.id,
    clientId: appointment.clientId,
    barberId: appointment.barberId,
    serviceId: appointment.serviceId,
    clientName: appointment.client.name,
    barberName: appointment.barber.name,
    serviceName: appointment.service.name,
    servicePrice: decimalToNumber(appointment.service.price),
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status,
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
  }));
}

export async function getAppointmentOptions(): Promise<AppointmentOptions> {
  const [clients, barbers, services] = await Promise.all([
    prisma.client.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.barber.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        price: true,
        durationMinutes: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    clients,
    barbers,
    services: services.map((service) => ({
      id: service.id,
      name: service.name,
      price: decimalToNumber(service.price),
      durationMinutes: service.durationMinutes,
    })),
  };
}
