"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  decimalToNumber,
  firstZodError,
} from "@/lib/action-utils";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS_ID = "default";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const updateSettingsSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, "El nombre del negocio es obligatorio")
    .max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Correo inválido")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(250).optional().or(z.literal("")),
  currency: z
    .string()
    .trim()
    .min(1, "La moneda es obligatoria")
    .max(10, "Moneda inválida"),
  taxRate: z.coerce
    .number()
    .min(0, "La tasa de impuesto no puede ser negativa")
    .max(100, "La tasa de impuesto no puede superar 100"),
  openTime: z
    .string()
    .trim()
    .regex(timeRegex, "Hora de apertura inválida (HH:MM)"),
  closeTime: z
    .string()
    .trim()
    .regex(timeRegex, "Hora de cierre inválida (HH:MM)"),
});

export type UpdateBusinessSettingsInput = z.infer<typeof updateSettingsSchema>;

export type SerializedBusinessSettings = {
  id: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  taxRate: number;
  openTime: string;
  closeTime: string;
  updatedAt: string;
};

function serializeSettings(
  settings: NonNullable<
    Awaited<ReturnType<typeof prisma.businessSettings.findUnique>>
  >,
): SerializedBusinessSettings {
  return {
    id: settings.id,
    businessName: settings.businessName,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    currency: settings.currency,
    taxRate: decimalToNumber(settings.taxRate),
    openTime: settings.openTime,
    closeTime: settings.closeTime,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function getBusinessSettings(): Promise<SerializedBusinessSettings> {
  const settings = await prisma.businessSettings.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    create: { id: DEFAULT_SETTINGS_ID },
    update: {},
  });

  return serializeSettings(settings);
}

export async function updateBusinessSettings(
  input: UpdateBusinessSettingsInput,
): Promise<ActionResult> {
  const parsed = updateSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const {
    businessName,
    phone,
    email,
    address,
    currency,
    taxRate,
    openTime,
    closeTime,
  } = parsed.data;

  await prisma.businessSettings.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    create: {
      id: DEFAULT_SETTINGS_ID,
      businessName,
      phone: phone || null,
      email: email || null,
      address: address || null,
      currency,
      taxRate,
      openTime,
      closeTime,
    },
    update: {
      businessName,
      phone: phone || null,
      email: email || null,
      address: address || null,
      currency,
      taxRate,
      openTime,
      closeTime,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
