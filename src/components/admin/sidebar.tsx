"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Calendar,
  CreditCard,
  FileText,
  FileBarChart,
  Users,
  Newspaper,
  Image,
  UserCog,
  LogOut,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Principal",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { label: "Tours", href: "/admin/tours", icon: Map },
      { label: "Reservas", href: "/admin/reservas", icon: CalendarCheck },
      { label: "Calendario", href: "/admin/calendario", icon: Calendar },
      { label: "Pagos", href: "/admin/pagos", icon: CreditCard },
      { label: "Cotizaciones", href: "/admin/cotizaciones", icon: FileText },
    ],
  },
  {
    label: "Clientes & Datos",
    items: [
      { label: "Clientes", href: "/admin/clientes", icon: Users },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Reportes", href: "/admin/reportes", icon: FileBarChart },
    ],
  },
  {
    label: "Configuración",
    items: [
      { label: "Contenido", href: "/admin/contenido", icon: Newspaper },
      { label: "Galeria", href: "/admin/galeria", icon: Image },
      { label: "Usuarios", href: "/admin/usuarios", icon: UserCog },
    ],
  },
];

const roleBadgeColor: Record<string, string> = {
  ADMIN: "bg-brand-orange/20 text-brand-orange border-brand-orange/30",
  SALES: "bg-brand-teal/20 text-brand-teal border-brand-teal/30",
  MARKETING: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <aside className="flex h-screen w-64 flex-col bg-brand-darkRed">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange shadow-lg shadow-brand-orange/30">
          <Map className="h-4 w-4 text-white" />
        </div>
        <div className="leading-none">
          <span className="font-heading text-lg font-bold tracking-tight">
            <span className="text-white">Like</span>
            <span className="text-brand-orange">In</span>
            <span className="text-white">House</span>
          </span>
          <p className="text-[9px] text-white/30 tracking-widest uppercase mt-0.5">Panel Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <div className="space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                          active
                            ? "bg-white/10 text-white"
                            : "text-white/55 hover:bg-white/[0.06] hover:text-white/90"
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-orange" />
                        )}
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors duration-150",
                            active ? "text-brand-orange" : "text-white/40 group-hover:text-white/70"
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-orange/20 border border-brand-orange/30 text-brand-orange text-xs font-bold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[11px] text-white/40 truncate">{user.email}</p>
          </div>
        </div>

        {user.role && (
          <div className="mb-3">
            <span className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              roleBadgeColor[user.role] || "bg-white/10 text-white/50 border-white/10"
            )}>
              {user.role}
            </span>
          </div>
        )}

        <button
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-red-500/15 hover:text-red-400"
          onClick={() => {
            if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
              signOut({ callbackUrl: "/admin/login" });
            }
          }}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
