"use client";

import { useMemo, useState, useTransition } from "react";
import type { UserRole } from "@prisma/client";
import { toast } from "sonner";

import {
  createUser,
  deleteUser,
  updateUser,
  type SerializedUser,
} from "@/actions/users";
import {
  TablePagination,
  useTablePagination,
} from "@/components/table-pagination";
import {
  desktopTableClass,
  MobileRecord,
  MobileRecordList,
} from "@/components/mobile-record";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleLabel } from "@/lib/auth-shared";

const roles: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerente" },
  { value: "STAFF", label: "Personal" },
];

export function UsersAdmin({ users }: { users: SerializedUser[] }) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const pagination = useTablePagination(users);

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingId) ?? null,
    [editingId, users],
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "STAFF">("STAFF");
  const [active, setActive] = useState(true);

  function resetForm() {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("STAFF");
    setActive(true);
  }

  function startEdit(user: SerializedUser) {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role === "SUPERADMIN" ? "ADMIN" : user.role);
    setActive(user.active);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = editingId
        ? await updateUser({
            id: editingId,
            name,
            email,
            role,
            active,
            password,
          })
        : await createUser({ name, email, password, role });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(editingId ? "Usuario actualizado" : "Usuario creado");
      resetForm();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteUser(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Usuario eliminado");
      if (editingId === id) resetForm();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
          <CardDescription>
            Gestiona cuentas, roles y acceso al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required={!editingUser}
                minLength={editingUser ? undefined : 6}
              />
            </div>
            <div className="grid gap-2">
              <Label>Rol</Label>
              <Select
                items={roles.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
                value={role}
                onValueChange={(value) => {
                  if (
                    value === "ADMIN" ||
                    value === "MANAGER" ||
                    value === "STAFF"
                  ) {
                    setRole(value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingUser ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={active}
                  onCheckedChange={(checked) => setActive(checked === true)}
                />
                Usuario activo
              </label>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={pending} className="h-11 w-full sm:w-auto">
                {editingUser ? "Guardar cambios" : "Crear usuario"}
              </Button>
              {editingUser ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  className="h-11 w-full sm:w-auto"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del sistema</CardTitle>
          <CardDescription>
            {users.length} cuenta{users.length === 1 ? "" : "s"} registrada
            {users.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay usuarios registrados.
            </p>
          ) : (
            <>
              <MobileRecordList>
                {pagination.pageItems.map((user) => (
                  <MobileRecord
                    key={user.id}
                    title={user.name}
                    meta={`${user.email} · ${roleLabel(user.role)}`}
                    aside={
                      <Badge variant={user.active ? "default" : "secondary"}>
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                    }
                    actions={
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => startEdit(user)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={pending}
                          onClick={() => onDelete(user.id)}
                        >
                          Eliminar
                        </Button>
                      </>
                    }
                  />
                ))}
              </MobileRecordList>
              <div className={desktopTableClass}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.pageItems.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{roleLabel(user.role)}</TableCell>
                        <TableCell>
                          <Badge variant={user.active ? "default" : "secondary"}>
                            {user.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => startEdit(user)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={pending}
                            onClick={() => onDelete(user.id)}
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination {...pagination} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
