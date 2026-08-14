"use server";

import { InventoryMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  decimalToNumber,
  firstZodError,
} from "@/lib/action-utils";
import { prisma } from "@/lib/prisma";

const recordMovementSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  type: z.enum(InventoryMovementType, {
    error: "Tipo de movimiento inválido",
  }),
  quantity: z.coerce
    .number()
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type RecordInventoryMovementInput = z.infer<typeof recordMovementSchema>;

export type InventoryProductOverview = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  minStock: number;
  salePrice: number;
  costPrice: number;
  active: boolean;
  lowStock: boolean;
};

export type SerializedInventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
  note: string | null;
  createdAt: string;
};

export async function recordInventoryMovement(
  input: RecordInventoryMovementInput,
): Promise<ActionResult> {
  const parsed = recordMovementSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const { productId, type, quantity, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      let nextStock: number;
      if (type === "IN") {
        nextStock = product.stock + quantity;
      } else if (type === "OUT") {
        if (product.stock < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
        nextStock = product.stock - quantity;
      } else {
        nextStock = quantity;
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock: nextStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId,
          type,
          quantity,
          note: note || null,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return { success: false, error: "Producto no encontrado" };
      }
      if (error.message === "INSUFFICIENT_STOCK") {
        return {
          success: false,
          error: "Stock insuficiente para esta salida",
        };
      }
    }
    throw error;
  }

  revalidatePath("/inventory");
  revalidatePath("/products");
  return { success: true };
}

export async function getInventoryOverview(): Promise<
  InventoryProductOverview[]
> {
  const products = await prisma.product.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    minStock: product.minStock,
    salePrice: decimalToNumber(product.salePrice),
    costPrice: decimalToNumber(product.costPrice),
    active: product.active,
    lowStock: product.stock <= product.minStock,
  }));
}

export async function getRecentMovements(
  limit = 30,
): Promise<SerializedInventoryMovement[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const movements = await prisma.inventoryMovement.findMany({
    take: safeLimit,
    include: {
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return movements.map((movement) => ({
    id: movement.id,
    productId: movement.productId,
    productName: movement.product.name,
    type: movement.type,
    quantity: movement.quantity,
    note: movement.note,
    createdAt: movement.createdAt.toISOString(),
  }));
}
