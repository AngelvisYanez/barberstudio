# BarberStudio

Plataforma web para la gestión financiera de una barbería: caja diaria, gastos operativos y retiros personales separados.

## Stack

- Next.js (App Router) + Server Actions
- PostgreSQL (Neon) + Prisma
- shadcn/ui + Tailwind CSS + Recharts

## Setup

1. Instala dependencias:

```bash
npm install
```

2. Crea un proyecto en [Neon](https://neon.tech) y pega la connection string en `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

3. Aplica migraciones y seed de categorías:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

4. Arranca el servidor de desarrollo:

```bash
npm run dev
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard: KPIs mensuales + gráfico 7 días |
| `/transactions` | Caja diaria (ingresos y gastos operativos) |
| `/owner-draws` | Retiros personales (no afectan el balance neto operativo) |

## Scripts útiles

- `npm run db:migrate` — migraciones Prisma
- `npm run db:seed` — categorías iniciales
- `npm run db:studio` — Prisma Studio
