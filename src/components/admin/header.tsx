"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBreadcrumbs } from "@/components/admin/nav-config";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <header className="flex h-16 items-center justify-between border-b border-brand-darkRed/8 bg-white pl-16 pr-4 sm:pr-6 lg:pl-6 shadow-sm">
      {/* Breadcrumb (el <h1> lo pone cada página con PageHeader) */}
      <nav aria-label="Ruta de navegación" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            const content =
              i === 0 && !isLast ? (
                <>
                  <Home className="h-3.5 w-3.5" />
                  <span className="sr-only">{crumb.label}</span>
                </>
              ) : (
                crumb.label
              );
            return (
              <li key={i} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" aria-hidden="true" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="flex items-center text-gray-500 transition-colors hover:text-brand-darkRed"
                  >
                    {content}
                  </Link>
                ) : (
                  <span aria-current="page" className="truncate font-semibold text-brand-darkRed">
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

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
