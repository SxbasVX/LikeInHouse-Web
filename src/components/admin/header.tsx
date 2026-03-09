"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/tours": "Tours",
  "/admin/tours/nuevo": "Nuevo Tour",
  "/admin/reservas": "Reservas",
  "/admin/pagos": "Pagos",
  "/admin/cotizaciones": "Cotizaciones",
  "/admin/clientes": "Clientes",
  "/admin/analytics": "Analytics",
  "/admin/contenido": "Contenido",
  "/admin/galeria": "Galeria",
  "/admin/usuarios": "Usuarios",
};

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    // Exact match first
    if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];

    // Check if editing a tour
    if (pathname.match(/\/admin\/tours\/[^/]+\/editar/)) return "Editar Tour";

    // Fallback: match the closest parent
    const segments = pathname.split("/").filter(Boolean);
    for (let i = segments.length; i >= 0; i--) {
      const path = "/" + segments.slice(0, i).join("/");
      if (breadcrumbMap[path]) return breadcrumbMap[path];
    }
    return "Admin";
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold">{getPageTitle()}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline">
            {user.name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="gap-2">
            <User className="h-4 w-4" />
            Mi Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
