"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutput } from "@/types";

type User = RouterOutput["user"]["list"]["users"][number];
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatTrpcError } from "@/lib/trpc-error";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Shield,
  Loader2,
  UserCog,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/admin/list-states";
import { formatDateTime } from "@/lib/format";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  SALES: "Ventas",
  MARKETING: "Marketing",
  DEVELOPER: "Developer (importador privado)",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-brand-orange/15 text-brand-orange",
  SALES: "bg-brand-teal/15 text-brand-darkTeal",
  MARKETING: "bg-brand-darkTeal/15 text-brand-darkTeal",
  DEVELOPER: "bg-brand-teal/15 text-brand-darkTeal",
};

/** Mismas reglas que `passwordSchema` del router de usuarios, para avisar antes de enviar. */
function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("al menos 8 caracteres");
  if (!/[A-Z]/.test(password)) issues.push("una mayúscula");
  if (!/[a-z]/.test(password)) issues.push("una minúscula");
  if (!/[0-9]/.test(password)) issues.push("un número");
  return issues;
}

export default function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    password?: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "SALES",
  });

  const createPasswordIssues = form.password ? passwordIssues(form.password) : [];
  const createMissing = [
    !form.name.trim() && "nombre",
    !form.email.trim() && "email",
    !form.password && "contraseña",
  ].filter(Boolean) as string[];
  const editPasswordIssues = editUser?.password ? passwordIssues(editUser.password) : [];

  const resetForm = () =>
    setForm({ name: "", email: "", password: "", role: "SALES" });

  const { data, isLoading, isError, error, refetch, isRefetching } = trpc.user.list.useQuery({
    page,
    limit: 20,
  });

  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      toast({ title: "Usuario creado" });
      refetch();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: formatTrpcError(error), variant: "destructive" });
    },
  });

  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      toast({ title: "Usuario actualizado" });
      refetch();
      setEditUser(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: formatTrpcError(error), variant: "destructive" });
    },
  });

  const toggleActive = trpc.user.toggleActive.useMutation({
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      refetch();
      setDeactivateUser(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: formatTrpcError(error), variant: "destructive" });
    },
  });

  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Usuario eliminado" });
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: formatTrpcError(error), variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        subtitle="Gestiona los usuarios del sistema"
        actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Usuario</DialogTitle>
              <DialogDescription>Crea una cuenta para un miembro del equipo</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Nombre *</Label>
                <Input
                  id="new-user-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email *</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Contraseña *</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  autoComplete="new-password"
                  aria-describedby="new-user-password-hint"
                  aria-invalid={createPasswordIssues.length > 0}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
                <p
                  id="new-user-password-hint"
                  className={createPasswordIssues.length > 0 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
                >
                  {createPasswordIssues.length > 0
                    ? `Falta: ${createPasswordIssues.join(", ")}.`
                    : "Mínimo 8 caracteres, con mayúscula, minúscula y número."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-role">Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(val) => setForm((p) => ({ ...p, role: val }))}
                >
                  <SelectTrigger id="new-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="SALES">Ventas</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="DEVELOPER">Developer (importador privado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {createMissing.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Completa {createMissing.join(", ")} para crear el usuario.
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() =>
                  createUser.mutate({
                    ...form,
                    role: form.role as "ADMIN" | "SALES" | "MARKETING" | "DEVELOPER",
                  })
                }
                disabled={
                  createUser.isPending ||
                  createMissing.length > 0 ||
                  createPasswordIssues.length > 0
                }
              >
                {createUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription>
            {data ? `${data.total} usuarios registrados` : isError ? "—" : "Cargando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : isError ? (
            <ErrorState title="No se pudieron cargar los usuarios" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
          ) : !data || data.users.length === 0 ? (
            page > 1 ? (
              <EmptyState
                icon={UserCog}
                title="No hay usuarios en esta página"
                action={
                  <Button variant="outline" size="sm" onClick={() => setPage(1)}>
                    Volver a la primera página
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={UserCog}
                title="Aún no hay usuarios registrados"
                description="Crea el primero con «Nuevo Usuario»."
              />
            )
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Último acceso</TableHead>
                  <TableHead className="hidden lg:table-cell">Reservas</TableHead>
                  <TableHead className="hidden lg:table-cell">Cotizaciones</TableHead>
                  <TableHead className="w-[50px]"><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] || ""} variant="secondary">
                        <Shield className="mr-1 h-3 w-3" />
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {user.lastLoginAt
                        ? formatDateTime(user.lastLoginAt, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{user._count.reservations}</TableCell>
                    <TableCell className="hidden lg:table-cell">{user._count.quotations}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Acciones para ${user.name}`}
                            title="Acciones"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setEditUser({
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role,
                              })
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              user.isActive
                                ? setDeactivateUser({ id: user.id, name: user.name, email: user.email })
                                : toggleActive.mutate({ id: user.id })
                            }
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" /> Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" /> Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              page={page}
              pages={data.pages}
              total={data.total}
              itemLabel="usuarios"
              onPageChange={setPage}
              className="mt-4"
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Nombre</Label>
                <Input
                  id="edit-user-name"
                  value={editUser.name}
                  onChange={(e) =>
                    setEditUser((p) => (p ? { ...p, name: e.target.value } : null))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input
                  id="edit-user-email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) =>
                    setEditUser((p) => (p ? { ...p, email: e.target.value } : null))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-role">Rol</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(val) =>
                    setEditUser((p) => (p ? { ...p, role: val } : null))
                  }
                >
                  <SelectTrigger id="edit-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="SALES">Ventas</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="DEVELOPER">Developer (importador privado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-password">Nueva contraseña (dejar vacío para mantener)</Label>
                <Input
                  id="edit-user-password"
                  type="password"
                  autoComplete="new-password"
                  aria-describedby="edit-user-password-hint"
                  aria-invalid={editPasswordIssues.length > 0}
                  value={editUser.password || ""}
                  onChange={(e) =>
                    setEditUser((p) =>
                      p ? { ...p, password: e.target.value } : null
                    )
                  }
                />
                <p
                  id="edit-user-password-hint"
                  className={editPasswordIssues.length > 0 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
                >
                  {editPasswordIssues.length > 0
                    ? `Falta: ${editPasswordIssues.join(", ")}.`
                    : "Mínimo 8 caracteres, con mayúscula, minúscula y número."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!editUser) return;
                updateUser.mutate({
                  id: editUser.id,
                  name: editUser.name,
                  email: editUser.email,
                  role: editUser.role as "ADMIN" | "SALES" | "MARKETING" | "DEVELOPER",
                  password: editUser.password || undefined,
                });
              }}
              disabled={updateUser.isPending || editPasswordIssues.length > 0}
            >
              {updateUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <ConfirmDialog
        open={!!deactivateUser}
        onOpenChange={(open) => !open && setDeactivateUser(null)}
        title="Desactivar usuario"
        description={
          deactivateUser && (
            <p>
              <strong>{deactivateUser.name}</strong> ({deactivateUser.email}) perderá el acceso
              al panel hasta que vuelvas a activarlo. Sus reservas y cotizaciones se
              conservan.
            </p>
          )
        }
        confirmLabel="Desactivar"
        destructive
        isPending={toggleActive.isPending}
        onConfirm={() => deactivateUser && toggleActive.mutate({ id: deactivateUser.id })}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro? Esta acción eliminará permanentemente la cuenta del usuario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteUser.mutate({ id: deleteId })}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
