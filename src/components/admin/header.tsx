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
import { LogOut, User, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/tours": "Tours",
  "/admin/tours/nuevo": "Nuevo Tour",
  "/admin/reservas": "Reservas",
  "/admin/reservas/nueva": "Nueva Reserva",
  "/admin/calendario": "Calendario",
  "/admin/pagos": "Pagos",
  "/admin/cotizaciones": "Cotizaciones",
  "/admin/clientes": "Clientes",
  "/admin/analytics": "Analytics",
  "/admin/reportes": "Reportes",
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
    if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
    if (pathname.match(/\/admin\/tours\/[^/]+\/editar/)) return "Editar Tour";
    const segments = pathname.split("/").filter(Boolean);
    for (let i = segments.length; i >= 0; i--) {
      const path = "/" + segments.slice(0, i).join("/");
      if (breadcrumbMap[path]) return breadcrumbMap[path];
    }
    return "Admin";
  };

  const getBreadcrumbs = () => {
    const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin" }];
    const title = getPageTitle();
    if (title !== "Dashboard") crumbs.push({ label: title });
    return crumbs;
  };

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  const crumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 items-center justify-between border-b border-brand-darkRed/8 bg-white pl-16 pr-4 sm:pr-6 lg:pl-6 shadow-sm">
      {/* Breadcrumb + title */}
      <div className="flex items-center gap-2">
        {crumbs.length > 1 ? (
          <nav className="flex items-center gap-1.5">
            {crumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
                {i === crumbs.length - 1 ? (
                  <h1 className="font-heading text-xl font-bold tracking-tight text-brand-darkRed">
                    {crumb.label}
                  </h1>
                ) : (
                  <span className="text-sm text-gray-400">
                    {i === 0 ? <Home className="h-3.5 w-3.5" /> : crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        ) : (
          <h1 className="font-heading text-xl font-bold tracking-tight text-brand-darkRed">
            {crumbs[0].label}
          </h1>
        )}
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(
          "flex items-center gap-2.5 rounded-xl px-3 py-1.5",
          "border border-transparent hover:border-brand-darkRed/10 hover:bg-brand-darkRed/4",
          "transition-colors outline-none"
        )}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange text-white text-[11px] font-bold shadow-sm shadow-brand-orange/30">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
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
            className="gap-2 text-destructive focus:text-destructive"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
