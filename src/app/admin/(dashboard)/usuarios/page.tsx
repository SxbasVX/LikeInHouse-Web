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
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Plus,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

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

  const resetForm = () =>
    setForm({ name: "", email: "", password: "", role: "SALES" });

  const { data, isLoading, isError, error, refetch } = trpc.user.list.useQuery({
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
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      toast({ title: "Usuario actualizado" });
      refetch();
      setEditUser(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActive = trpc.user.toggleActive.useMutation({
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      refetch();
      setDeactivateUser(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Usuario eliminado" });
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">Usuarios</h1>
          <p className="font-serif italic text-brand-teal">Gestiona los usuarios del sistema</p>
        </div>
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
                <Label>Nombre *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(val) => setForm((p) => ({ ...p, role: val }))}
                >
                  <SelectTrigger>
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
                  !form.name ||
                  !form.email ||
                  !form.password
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription>
            {data ? `${data.total} usuarios registrados` : "Cargando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-muted-foreground">
                No se pudieron cargar los usuarios{error?.message ? `: ${error.message}` : "."}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : !data || data.users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {page > 1 ? (
                <div className="flex flex-col items-center gap-3">
                  <p>No hay usuarios en esta página.</p>
                  <Button variant="outline" size="sm" onClick={() => setPage(1)}>
                    Volver a la primera página
                  </Button>
                </div>
              ) : (
                <p>Aún no hay usuarios registrados. Crea el primero con «Nuevo Usuario».</p>
              )}
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead>Reservas</TableHead>
                  <TableHead>Cotizaciones</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
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
                    <TableCell className="text-sm">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "Nunca"}
                    </TableCell>
                    <TableCell>{user._count.reservations}</TableCell>
                    <TableCell>{user._count.quotations}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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

            {data.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm font-serif italic text-brand-teal">
                  Página {data.page} de {data.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pages}
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
                <Label>Nombre</Label>
                <Input
                  value={editUser.name}
                  onChange={(e) =>
                    setEditUser((p) => (p ? { ...p, name: e.target.value } : null))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editUser.email}
                  onChange={(e) =>
                    setEditUser((p) => (p ? { ...p, email: e.target.value } : null))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(val) =>
                    setEditUser((p) => (p ? { ...p, role: val } : null))
                  }
                >
                  <SelectTrigger>
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
                <Label>Nueva contraseña (dejar vacío para mantener)</Label>
                <Input
                  type="password"
                  value={editUser.password || ""}
                  onChange={(e) =>
                    setEditUser((p) =>
                      p ? { ...p, password: e.target.value } : null
                    )
                  }
                />
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
              disabled={updateUser.isPending}
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
