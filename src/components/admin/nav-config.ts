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
  UserCog,
  BarChart3,
  BookMarked,
  BookOpen,
  Tag,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Fuente única de secciones del panel: la usan el sidebar y el breadcrumb del header.
 * Galería (/admin/galeria) se oculta del menú mientras sea un placeholder.
 */
export const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
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
    label: "Marketing",
    items: [{ label: "Promociones", href: "/admin/promociones", icon: Tag }],
  },
  {
    label: "Legal",
    items: [{ label: "Reclamaciones", href: "/admin/reclamaciones", icon: BookOpen }],
  },
  {
    label: "Configuración",
    items: [
      { label: "Contenido", href: "/admin/contenido", icon: Newspaper },
      { label: "Documentos", href: "/admin/documentos", icon: BookMarked },
      { label: "Usuarios", href: "/admin/usuarios", icon: UserCog },
    ],
  },
];

/** Sub-rutas bajo una sección (el resto del path tras el href de la sección). */
const subRoutes: { section: string; pattern: RegExp; label: string }[] = [
  { section: "/admin/tours", pattern: /^\/nuevo$/, label: "Nuevo tour" },
  { section: "/admin/tours", pattern: /^\/[^/]+\/editar$/, label: "Editar tour" },
  { section: "/admin/reservas", pattern: /^\/nueva$/, label: "Nueva reserva" },
  { section: "/admin/documentos", pattern: /^\/nuevo$/, label: "Nuevo documento" },
  { section: "/admin/documentos", pattern: /^\/[^/]+\/editar$/, label: "Editar documento" },
  { section: "/admin/reclamaciones", pattern: /^\/[^/]+$/, label: "Detalle" },
];

/** Activo si es la ruta exacta o una sub-ruta (`href/...`), nunca un prefijo parcial. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export interface Breadcrumb {
  label: string;
  /** Ausente en el último elemento (página actual). */
  href?: string;
}

export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  const path = pathname.replace(/\/+$/, "") || "/";
  const crumbs: Breadcrumb[] = [{ label: "Dashboard", href: "/admin" }];
  if (path === "/admin") return [{ label: "Dashboard" }];

  const section = navSections
    .flatMap((s) => s.items)
    .find((item) => item.href !== "/admin" && isNavActive(path, item.href));

  if (section) {
    const rest = path.slice(section.href.length);
    if (!rest) {
      crumbs.push({ label: section.label });
      return crumbs;
    }
    crumbs.push({ label: section.label, href: section.href });
    const sub = subRoutes.find((r) => r.section === section.href && r.pattern.test(rest));
    crumbs.push({ label: sub?.label ?? "Detalle" });
    return crumbs;
  }

  return crumbs.map(({ label }) => ({ label }));
}
