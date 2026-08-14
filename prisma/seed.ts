import {
  CategoryType,
  PrismaClient,
  UserRole,
} from "@prisma/client";

import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const categories: { name: string; type: CategoryType }[] = [
  { name: "Corte", type: CategoryType.INCOME },
  { name: "Barba", type: CategoryType.INCOME },
  { name: "Combo", type: CategoryType.INCOME },
  { name: "Productos", type: CategoryType.INCOME },
  { name: "Insumos", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Alquiler", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Servicios", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Otros negocio", type: CategoryType.BUSINESS_EXPENSE },
  { name: "Hogar", type: CategoryType.OWNER_DRAW },
  { name: "Personal", type: CategoryType.OWNER_DRAW },
  { name: "Otros retiro", type: CategoryType.OWNER_DRAW },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {},
      create: category,
    });
  }

  const adminEmail = "admin@barberstudio.com";
  const passwordHash = await hashPassword("admin123");

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Administrador",
      role: UserRole.ADMIN,
      active: true,
      passwordHash,
    },
    create: {
      name: "Administrador",
      email: adminEmail,
      role: UserRole.ADMIN,
      active: true,
      passwordHash,
    },
  });

  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      businessName: "Barber Studio",
      phone: "+58 412 0000000",
      email: "hola@barberstudio.com",
      address: "Av. Principal, Local 1",
      currency: "USD",
      taxRate: 0,
      openTime: "09:00",
      closeTime: "19:00",
    },
  });

  const services = [
    {
      name: "Corte clásico",
      description: "Corte de cabello tradicional",
      price: 12,
      durationMinutes: 30,
    },
    {
      name: "Barba",
      description: "Perfilado y afeitado de barba",
      price: 8,
      durationMinutes: 20,
    },
    {
      name: "Combo corte + barba",
      description: "Servicio completo",
      price: 18,
      durationMinutes: 45,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        description: service.description,
        price: service.price,
        durationMinutes: service.durationMinutes,
        active: true,
      },
      create: service,
    });
  }

  const barberCount = await prisma.barber.count();
  if (barberCount === 0) {
    await prisma.barber.createMany({
      data: [
        {
          name: "Carlos Méndez",
          phone: "+58 414 1111111",
          commissionPercent: 40,
        },
        {
          name: "Luis Ramírez",
          phone: "+58 424 2222222",
          commissionPercent: 35,
        },
      ],
    });
  }

  const clientCount = await prisma.client.count();
  if (clientCount === 0) {
    await prisma.client.createMany({
      data: [
        {
          name: "Juan Pérez",
          phone: "+58 412 3333333",
          notes: "Cliente habitual",
        },
        {
          name: "Miguel Torres",
          phone: "+58 416 4444444",
        },
      ],
    });
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "Cera mate",
          sku: "CERA-01",
          salePrice: 10,
          costPrice: 5,
          stock: 20,
          minStock: 5,
        },
        {
          name: "Aceite para barba",
          sku: "ACEI-01",
          salePrice: 12,
          costPrice: 6,
          stock: 15,
          minStock: 4,
        },
        {
          name: "Navajas desechables",
          sku: "NAV-01",
          salePrice: 0,
          costPrice: 3,
          stock: 50,
          minStock: 10,
          description: "Insumo de uso interno",
        },
      ],
    });
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
