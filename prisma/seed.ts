import {
  AccountStatus,
  AppointmentStatus,
  CategoryType,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import { subDays } from "date-fns";

import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const categories: { name: string; type: CategoryType }[] = [
  { name: "Corte", type: CategoryType.INCOME },
  { name: "Barba", type: CategoryType.INCOME },
  { name: "Combo", type: CategoryType.INCOME },
  { name: "Productos", type: CategoryType.INCOME },
  { name: "Alquiler", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Luz", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Agua", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Internet", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Servicios generales", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Insumos", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Otros negocio", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Hogar", type: CategoryType.OWNER_DRAW },
  { name: "Personal", type: CategoryType.OWNER_DRAW },
  { name: "Otros retiro", type: CategoryType.OWNER_DRAW },
];

type ShopSeed = {
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  adminName: string;
  adminEmail: string;
  barbers: { name: string; phone: string; commissionPercent: number }[];
  clients: { name: string; phone: string; notes?: string }[];
  income: { category: string; amount: number; daysAgo: number; note: string }[];
};

const shops: ShopSeed[] = [
  {
    name: "Barber Studio Centro",
    slug: "centro",
    phone: "+58 412 1000001",
    email: "centro@barberstudio.com",
    address: "Av. Principal, Local 1",
    adminName: "María Centro",
    adminEmail: "centro@barberstudio.com",
    barbers: [
      { name: "Carlos Méndez", phone: "+58 414 1111111", commissionPercent: 40 },
      { name: "Luis Ramírez", phone: "+58 424 2222222", commissionPercent: 35 },
    ],
    clients: [
      { name: "Juan Pérez", phone: "+58 412 3333333", notes: "Cliente habitual" },
      { name: "Miguel Torres", phone: "+58 416 4444444" },
    ],
    income: [
      { category: "Corte", amount: 12, daysAgo: 1, note: "Corte clásico" },
      { category: "Barba", amount: 8, daysAgo: 0, note: "Perfilado" },
      { category: "Combo", amount: 18, daysAgo: 2, note: "Combo de la mañana" },
    ],
  },
  {
    name: "Barber Studio Norte",
    slug: "norte",
    phone: "+58 412 1000002",
    email: "norte@barberstudio.com",
    address: "Calle Norte, Local 8",
    adminName: "Pedro Norte",
    adminEmail: "norte@barberstudio.com",
    barbers: [
      { name: "Andrés Silva", phone: "+58 414 5555555", commissionPercent: 45 },
      { name: "Diego Rojas", phone: "+58 424 6666666", commissionPercent: 30 },
    ],
    clients: [
      { name: "José Herrera", phone: "+58 412 7777777" },
      { name: "Ricardo León", phone: "+58 416 8888888", notes: "Prefiere cita temprano" },
    ],
    income: [
      { category: "Corte", amount: 15, daysAgo: 0, note: "Fade" },
      { category: "Productos", amount: 10, daysAgo: 1, note: "Cera mate" },
    ],
  },
];

async function seedShop(shop: ShopSeed, passwordHash: string) {
  const tenant = await prisma.tenant.create({
    data: {
      name: shop.name,
      slug: shop.slug,
      settings: {
        create: {
          businessName: shop.name,
          phone: shop.phone,
          email: shop.email,
          address: shop.address,
          currency: "USD",
          openTime: "09:00",
          closeTime: "19:00",
        },
      },
      categories: { create: categories },
      users: {
        create: {
          name: shop.adminName,
          email: shop.adminEmail,
          passwordHash,
          role: UserRole.ADMIN,
        },
      },
    },
    include: { categories: true },
  });

  const categoryId = new Map(
    tenant.categories.map((category) => [category.name, category.id]),
  );

  const [corte, barba, combo] = await Promise.all([
    prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: "Corte clásico",
        description: "Corte de cabello tradicional",
        price: shop.slug === "norte" ? 15 : 12,
        durationMinutes: 30,
      },
    }),
    prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: "Barba",
        description: "Perfilado y afeitado de barba",
        price: 8,
        durationMinutes: 20,
      },
    }),
    prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: "Combo corte + barba",
        description: "Servicio completo",
        price: 18,
        durationMinutes: 45,
      },
    }),
  ]);

  const barbers = await Promise.all(
    shop.barbers.map((barber) =>
      prisma.barber.create({ data: { ...barber, tenantId: tenant.id } }),
    ),
  );
  const clients = await Promise.all(
    shop.clients.map((client) =>
      prisma.client.create({ data: { ...client, tenantId: tenant.id } }),
    ),
  );

  await prisma.product.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: "Cera mate",
        sku: "CERA-01",
        salePrice: 10,
        costPrice: 5,
        stock: 20,
        minStock: 5,
      },
      {
        tenantId: tenant.id,
        name: "Aceite para barba",
        sku: "ACEI-01",
        salePrice: 12,
        costPrice: 6,
        stock: 15,
        minStock: 4,
      },
    ],
  });

  await prisma.transaction.createMany({
    data: shop.income.map((row) => ({
      tenantId: tenant.id,
      amount: row.amount,
      categoryId: categoryId.get(row.category)!,
      description: row.note,
      date: subDays(new Date(), row.daysAgo),
    })),
  });

  const startsAt = new Date();
  startsAt.setHours(10, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + corte.durationMinutes * 60_000);
  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      clientId: clients[0].id,
      barberId: barbers[0].id,
      serviceId: corte.id,
      startsAt,
      endsAt,
      status: AppointmentStatus.SCHEDULED,
      notes: "Cita de ejemplo",
    },
  });

  await prisma.accountReceivable.create({
    data: {
      tenantId: tenant.id,
      clientName: clients[1]?.name ?? clients[0].name,
      description: "Combo pendiente",
      amount: combo.price,
      dueDate: subDays(new Date(), -5),
      status: AccountStatus.PENDING,
    },
  });

  const payable = await prisma.accountPayable.create({
    data: {
      tenantId: tenant.id,
      supplierName: shop.slug === "norte" ? "Distribuidora Norte" : "Insumos Centro",
      description: "Pedido de cera",
      amount: 40,
      paidAmount: 15,
      dueDate: subDays(new Date(), -3),
      status: AccountStatus.PARTIAL,
      categoryId: categoryId.get("Insumos"),
    },
  });
  await prisma.accountPayablePayment.create({
    data: {
      tenantId: tenant.id,
      accountId: payable.id,
      amount: 15,
      paidAt: subDays(new Date(), 1),
      note: "Abono",
    },
  });

  void barba;
}

async function main() {
  const passwordHash = await hashPassword("admin123");

  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany({
    where: { role: { not: UserRole.SUPERADMIN } },
  });

  await prisma.user.upsert({
    where: { email: "admin@barberstudio.com" },
    update: {
      name: "Superadmin",
      role: UserRole.SUPERADMIN,
      tenantId: null,
      active: true,
      passwordHash,
    },
    create: {
      name: "Superadmin",
      email: "admin@barberstudio.com",
      role: UserRole.SUPERADMIN,
      tenantId: null,
      active: true,
      passwordHash,
    },
  });

  for (const shop of shops) {
    await seedShop(shop, passwordHash);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
