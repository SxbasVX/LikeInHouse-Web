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
} from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  SALES: "Ventas",
  MARKETING: "Marketing",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  SALES: "bg-blue-100 text-blue-800",
  MARKETING: "bg-green-100 text-green-800",
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
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "SALES",
  });

  const resetForm = () =>
    setForm({ name: "", email: "", password: "", role: "SALES" });

  const { data, isLoading, refetch } = trpc.user.list.useQuery({
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
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
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
                    role: form.role as "ADMIN" | "SALES" | "MARKETING",
                  })
                }
                disabled={
                  createUser.isPending ||
                  !form.name ||
                  !form.email ||
                  !form.password
                }
              >
                {createUser.isPending ? "Creando..." : "Crear"}
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
          ) : (
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
                {data?.users.map((user: User) => (
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
                            onClick={() => toggleActive.mutate({ id: user.id })}
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
                  role: editUser.role as "ADMIN" | "SALES" | "MARKETING",
                  password: editUser.password || undefined,
                });
              }}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {deleteUser.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
