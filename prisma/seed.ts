import { CategoryType, PrismaClient } from "@prisma/client";

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
