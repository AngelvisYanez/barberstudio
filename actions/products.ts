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

const createProductSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  salePrice: z.coerce.number().positive("El precio de venta debe ser mayor a 0"),
  costPrice: z.coerce
    .number()
    .min(0, "El costo no puede ser negativo")
    .optional(),
  stock: z.coerce
    .number()
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo")
    .optional(),
  minStock: z.coerce
    .number()
    .int("El stock mínimo debe ser un número entero")
    .min(0, "El stock mínimo no puede ser negativo")
    .optional(),
});

const updateProductSchema = createProductSchema.extend({
  id: z.string().min(1, "ID inválido"),
});

const updateActiveSchema = z.object({
  id: z.string().min(1, "ID inválido"),
  active: z.boolean(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export type SerializedProduct = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  salePrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
};

function serializeProduct(
  product: Awaited<ReturnType<typeof prisma.product.findMany>>[number],
): SerializedProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    salePrice: decimalToNumber(product.salePrice),
    costPrice: decimalToNumber(product.costPrice),
    stock: product.stock,
    minStock: product.minStock,
    active: product.active,
    createdAt: product.createdAt.toISOString(),
  };
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ActionResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const { name, sku, description, salePrice, costPrice, stock, minStock } =
    parsed.data;

  try {
    const tenantId = await requireTenantId();
    await prisma.product.create({
      data: {
        tenantId,
        name,
        sku: sku || null,
        description: description || null,
        salePrice,
        costPrice: costPrice ?? 0,
        stock: stock ?? 0,
        minStock: minStock ?? 0,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Ya existe un producto con ese SKU",
      };
    }
    throw error;
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  return { success: true };
}

export async function updateProductActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const parsed = updateActiveSchema.safeParse({ id, active });
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const existing = await prisma.product.findFirst({ where: { id } });
  if (!existing) {
    return { success: false, error: "Producto no encontrado" };
  }

  await prisma.product.updateMany({
    where: { id },
    data: { active },
  });

  revalidatePath("/products");
  revalidatePath("/inventory");
  return { success: true };
}

export async function updateProduct(
  input: UpdateProductInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Sin permisos de administrador" };
  }

  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const {
    id,
    name,
    sku,
    description,
    salePrice,
    costPrice,
    stock,
    minStock,
  } = parsed.data;

  const existing = await prisma.product.findFirst({ where: { id } });
  if (!existing) {
    return { success: false, error: "Producto no encontrado" };
  }

  try {
    await prisma.product.updateMany({
      where: { id },
      data: {
        name,
        sku: sku || null,
        description: description || null,
        salePrice,
        costPrice: costPrice ?? existing.costPrice,
        stock: stock ?? existing.stock,
        minStock: minStock ?? existing.minStock,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Ya existe un producto con ese SKU",
      };
    }
    throw error;
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: "ID inválido" };
  }

  const movementCount = await prisma.inventoryMovement.count({
    where: { productId: id },
  });
  if (movementCount > 0) {
    return {
      success: false,
      error: "No se puede eliminar: el producto tiene movimientos de inventario",
    };
  }

  try {
    await prisma.product.deleteMany({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        error: "No se puede eliminar: el producto tiene registros vinculados",
      };
    }
    throw error;
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  return { success: true };
}

export async function getProducts(): Promise<SerializedProduct[]> {
  const products = await prisma.product.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  });
  return products.map(serializeProduct);
}
