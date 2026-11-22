"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname as useNextPathname, useSearchParams } from "next/navigation";
import { Menu, ShoppingCart, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCartHydration, useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const LINKS = [
  { key: "nav_home", href: "/" },
  { key: "nav_tours", href: "/tours" },
  { key: "nav_about", href: "/nosotros" },
  { key: "nav_faq", href: "/faq" },
  { key: "nav_contact", href: "/contacto" },
] as const;

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-beige";

export function FamilyNavbar() {
  const t = useTranslations("familia");
  const locale = useLocale();
  const nextPathname = useNextPathname();
  const intlPathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const cartHydrated = useCartHydration();
  const cartCount = useCartStore((s) => s.items.length);
  const count = cartHydrated ? cartCount : 0;

  // Ruta sin idioma ni prefijo interno /familia (cuando se abre directo en local)
  const current = nextPathname.replace(/^\/familia(?=\/|$)/, "").replace(/^\/(es|en)(?=\/|$)/, "").replace(/\/$/, "") || "/";
  const isActive = (href: string) => (href === "/" ? current === "/" : current.startsWith(href));

  const switchLocale = () => {
    const next = locale === "es" ? "en" : "es";
    const search = searchParams.toString();
    router.replace(search ? `${intlPathname}?${search}` : intlPathname, { locale: next });
  };

  return (
    <header className="border-b-2 border-brand-darkRed bg-brand-beige">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <Link href="/" className={cn("flex shrink-0 items-center gap-2 rounded-xl", focusRing)} aria-label={t("logo_alt")}>
          <Image src="/Logo-Azul.svg" alt="" width={160} height={41} className="h-auto w-28 sm:w-36" priority />
          <span className="-rotate-3 rounded-full border-2 border-brand-darkRed bg-[#FFC93C] px-2.5 py-0.5 font-heading text-xs font-extrabold text-brand-darkRed shadow-[2px_2px_0_0_#441514]">
            {t("family_tag")}
          </span>
        </Link>

        <nav aria-label={t("nav_main")} className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 font-heading text-sm font-bold transition-colors",
                focusRing,
                isActive(l.href) ? "bg-brand-darkRed text-brand-beige" : "text-brand-darkRed hover:bg-white"
              )}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={switchLocale}
            aria-label={t("nav_language")}
            className={cn("hidden h-10 rounded-full border-2 border-brand-darkRed bg-white px-3 text-xs font-bold text-brand-darkRed hover:bg-brand-darkRed hover:text-white sm:inline-flex sm:items-center", focusRing)}
          >
            {locale === "es" ? "EN" : "ES"}
          </button>
          <Link
            href="/carrito"
            aria-label={count > 0 ? `${t("nav_cart")} (${count})` : t("nav_cart")}
            className={cn("relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-darkRed bg-white text-brand-darkRed hover:bg-brand-darkRed hover:text-white", focusRing)}
          >
            <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-brand-darkRed bg-brand-orange px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/tours"
            className={cn("hidden h-10 items-center rounded-full border-2 border-brand-darkRed bg-brand-darkTeal px-5 font-heading text-sm font-extrabold text-white shadow-[3px_3px_0_0_#441514] transition-transform hover:-translate-y-0.5 md:inline-flex", focusRing)}
          >
            {t("nav_cta")}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t("nav_menu")}
                className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-darkRed bg-white text-brand-darkRed lg:hidden", focusRing)}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[88vw] max-w-sm flex-col border-l-2 border-brand-darkRed bg-brand-beige p-6 [&>button]:hidden">
              <SheetTitle className="sr-only">{t("nav_main")}</SheetTitle>
              <div className="mb-8 flex items-center justify-between">
                <span className="font-heading text-lg font-extrabold text-brand-darkRed">{t("site_name")}</span>
                <SheetClose asChild>
                  <button
                    type="button"
                    aria-label={t("nav_close")}
                    className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-darkRed bg-white text-brand-darkRed", focusRing)}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </SheetClose>
              </div>
              <nav aria-label={t("nav_main")} className="flex flex-col gap-3">
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cn(
                      "rounded-2xl border-2 border-brand-darkRed px-5 py-3 font-heading text-xl font-extrabold",
                      focusRing,
                      isActive(l.href) ? "bg-brand-darkRed text-brand-beige" : "bg-white text-brand-darkRed"
                    )}
                  >
                    {t(l.key)}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex gap-3 pt-8">
                <button
                  type="button"
                  onClick={() => { switchLocale(); setOpen(false); }}
                  className={cn("h-12 flex-1 rounded-2xl border-2 border-brand-darkRed bg-white font-bold text-brand-darkRed", focusRing)}
                >
                  {t("nav_switch_to")}
                </button>
                <Link
                  href="/tours"
                  onClick={() => setOpen(false)}
                  className={cn("flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-brand-darkRed bg-brand-darkTeal font-heading font-extrabold text-white", focusRing)}
                >
                  {t("nav_cta")}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
