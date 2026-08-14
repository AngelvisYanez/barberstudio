import { getAuthOverview } from "@/actions/users";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { roleLabel } from "@/lib/auth-shared";

export const dynamic = "force-dynamic";

export default async function AdminAuthPage() {
  const { session, stats, authConfigured } = await getAuthOverview();

  return (
    <>
      <SiteHeader title="Auth y seguridad" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Usuarios totales</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Activos</CardDescription>
              <CardTitle className="text-3xl">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Administradores</CardDescription>
              <CardTitle className="text-3xl">{stats.admins}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Personal / Gerentes</CardDescription>
              <CardTitle className="text-3xl">
                {stats.staff + stats.managers}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sesión actual</CardTitle>
              <CardDescription>
                Usuario autenticado en este navegador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Nombre: </span>
                {session.name}
              </p>
              <p>
                <span className="text-muted-foreground">Correo: </span>
                {session.email}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Rol:</span>
                <Badge>{roleLabel(session.role)}</Badge>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Política de autenticación</CardTitle>
              <CardDescription>
                Controles activos del módulo de auth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center justify-between gap-2">
                <span>AUTH_SECRET configurado</span>
                <Badge variant={authConfigured ? "default" : "destructive"}>
                  {authConfigured ? "OK" : "Falta"}
                </Badge>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span>Sesión por cookie HTTP-only</span>
                <Badge>Activo</Badge>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span>Duración de sesión</span>
                <Badge variant="secondary">7 días</Badge>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span>Rutas /admin solo ADMIN</span>
                <Badge>Activo</Badge>
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Login en `/login` con email y contraseña</li>
                <li>Contraseñas hasheadas con bcrypt</li>
                <li>Usuarios inactivos no pueden iniciar sesión</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
