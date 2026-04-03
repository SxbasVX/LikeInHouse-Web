"use client";

import Link from "next/link";
import Image from "next/image";
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
  Image as ImageIcon,
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
      { label: "Galeria", href: "/admin/galeria", icon: ImageIcon },
      { label: "Usuarios", href: "/admin/usuarios", icon: UserCog },
    ],
  },
];

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
    <aside className="flex h-full w-64 flex-col rounded-2xl overflow-hidden" style={{ backgroundColor: "#0f2d26" }}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-5 border-b border-white/10">
        <Image
          src="/Logo-Azul.svg"
          alt="LikeInHouse"
          width={148}
          height={38}
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <div className="space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/20">
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
                            ? "text-white"
                            : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
                        )}
                        style={active ? { backgroundColor: "rgba(22,165,158,0.15)" } : undefined}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                            style={{ backgroundColor: "#16a59e" }}
                          />
                        )}
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors duration-150",
                            active ? "text-white/90" : "text-white/35 group-hover:text-white/60"
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
      <div className="border-t border-white/8 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: "rgba(22,165,158,0.20)", color: "#16a59e", border: "1px solid rgba(22,165,158,0.30)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white/90 truncate">{user.name}</p>
            <p className="text-[11px] text-white/35 truncate">{user.email}</p>
          </div>
        </div>

        {user.role && (
          <div className="mb-3">
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: "rgba(22,165,158,0.15)", color: "#16a59e", borderColor: "rgba(22,165,158,0.25)" }}
            >
              {user.role}
            </span>
          </div>
        )}

        <button
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/40 transition-colors hover:bg-red-500/12 hover:text-red-300"
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
