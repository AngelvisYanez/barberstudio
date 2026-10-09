import { PrismaClient } from "@prisma/client";

import { requireTenantId } from "@/lib/tenant";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const TENANT_MODELS = new Set([
  "Category",
  "Transaction",
  "AccountReceivable",
  "AccountPayable",
  "AccountPayablePayment",
  "Client",
  "Barber",
  "Service",
  "Appointment",
  "Product",
  "InventoryMovement",
  "BusinessSettings",
]);

const TENANT_READS = new Set([
  "findMany",
  "findFirst",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) {
            return query(args);
          }

          const tenantId = await requireTenantId();
          const scoped = args as {
            where?: object;
            data?: object | object[];
          };

          if (operation === "create") {
            scoped.data = { ...(scoped.data as object), tenantId };
          } else if (
            operation === "createMany" &&
            Array.isArray(scoped.data)
          ) {
            scoped.data = scoped.data.map((row) => ({ ...row, tenantId }));
          } else if (operation === "upsert") {
            const data = scoped.data as {
              create?: object;
              update?: object;
            };
            scoped.data = {
              ...data,
              create: { ...data.create, tenantId },
            };
            scoped.where = { ...(scoped.where as object), tenantId };
          } else if (TENANT_READS.has(operation)) {
            scoped.where = { ...(scoped.where as object), tenantId };
          }

          return query(args);
        },
      },
    },
  });
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma;

  // En hot-reload, una instancia antigua puede no tener modelos nuevos (ej. user).
  if (existing && typeof (existing as { user?: { findUnique?: unknown } }).user?.findUnique === "function") {
    return existing;
  }

  if (existing) {
    void existing.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
