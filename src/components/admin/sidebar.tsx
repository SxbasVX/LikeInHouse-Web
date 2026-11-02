"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOutToLogin } from "@/lib/auth-client";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { navSections, isNavActive } from "@/components/admin/nav-config";

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Cerrar al navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Cerrar el drawer con Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  const sidebarContent = (
    <>
      {/* Navigation */}
      <nav aria-label="Navegación del panel" className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <div className="space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/80">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                          active
                            ? "text-white"
                            : "text-white/85 hover:bg-white/10 hover:text-white"
                        )}
                        style={active ? { backgroundColor: "rgba(255,255,255,0.18)" } : undefined}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                            style={{ backgroundColor: "#e5cfbe" }}
                          />
                        )}
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors duration-150",
                            active ? "text-white" : "text-white/85 group-hover:text-white"
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
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.20)", color: "#fff", border: "1px solid rgba(255,255,255,0.30)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white/90 truncate">{user.name}</p>
            <p className="text-[11px] text-white/80 truncate">{user.email}</p>
          </div>
        </div>

        {user.role && (
          <div className="mb-3">
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}
            >
              {user.role}
            </span>
          </div>
        )}

        <button
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Botón hamburguesa — solo mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8411d] text-white shadow-lg lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex h-full w-64 flex-col gap-2">
        <div className="flex items-center justify-center px-5 py-3">
          <Image
            src="/Logo-Azul.svg"
            alt="LikeInHouse"
            width={160}
            height={41}
            className="object-contain"
            priority
          />
        </div>
        <aside aria-label="Menú principal" className="flex flex-1 flex-col rounded-2xl overflow-hidden min-h-0" style={{ backgroundColor: "#e8411d" }}>
          {sidebarContent}
        </aside>
      </div>

      {/* Sidebar mobile — overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="absolute left-0 top-0 bottom-0 w-72 flex flex-col bg-[#e8411d] shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {/* Header del drawer */}
            <div className="flex items-center justify-between px-4 py-4">
              <Image
                src="/Logo.svg"
                alt="LikeInHouse"
                width={130}
                height={33}
                className="object-contain brightness-0 invert"
              />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white"
                aria-label="Cerrar menú"
                title="Cerrar menú"
                autoFocus
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Cerrar sesión"
        description={<p>Se cerrará tu sesión en el panel y volverás a la pantalla de inicio de sesión.</p>}
        confirmLabel="Cerrar sesión"
        isPending={signingOut}
        onConfirm={() => {
          setSigningOut(true);
          void signOutToLogin();
        }}
      />
    </>
  );
}
