# Barber Studio

Plataforma web para la gestión integral de una barbería: caja diaria, módulos operativos y administración de usuarios.

## Stack

- Next.js (App Router) + Server Actions
- PostgreSQL (Neon) + Prisma
- Auth con sesión JWT (cookie HTTP-only) + bcrypt
- shadcn/ui + Tailwind CSS + Recharts

## Setup

1. Instala dependencias:

```bash
npm install
```

2. Crea un proyecto en [Neon](https://neon.tech) y pega la connection string en `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
AUTH_SECRET="una-cadena-larga-y-aleatoria"
```

3. Aplica migraciones y seed (categorías + admin):

```bash
npx prisma migrate dev
npm run db:seed
```

4. Arranca el servidor de desarrollo:

```bash
npm run dev
```

Usuario inicial: `admin@barberstudio.com` / `admin123`

## Módulos

| Ruta | Descripción |
|------|-------------|
| `/login` | Autenticación |
| `/` | Dashboard |
| `/transactions` | Caja diaria |
| `/owner-draws` | Retiros personales |
| `/appointments` | Citas |
| `/clients` | Clientes |
| `/services` | Servicios |
| `/barbers` | Barberos |
| `/inventory` | Inventario |
| `/products` | Productos |
| `/reports` | Reportes |
| `/admin/users` | Gestión de usuarios (ADMIN) |
| `/admin/auth` | Auth y seguridad (ADMIN) |
| `/admin/settings` | Configuración (ADMIN) |

## Scripts útiles

- `npm run db:migrate` — migraciones Prisma
- `npm run db:seed` — categorías e usuario admin
- `npm run db:studio` — Prisma Studio

## Despliegue en Vercel

El push a `main` dispara el deploy automático si el repo está conectado en Vercel.

Variables de entorno requeridas en el proyecto de Vercel:

```env
DATABASE_URL=
AUTH_SECRET=
```

En el build se ejecuta `prisma generate`, `prisma migrate deploy` y `next build`.
