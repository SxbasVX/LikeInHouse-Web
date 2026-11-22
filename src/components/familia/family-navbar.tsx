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
import { TextileBand } from "@/components/familia/textile";
import { familyBtnPrimary } from "@/components/familia/styles";

const LINKS = [
  { key: "nav_home", href: "/" },
  { key: "nav_tours", href: "/tours" },
  { key: "nav_about", href: "/nosotros" },
  { key: "nav_faq", href: "/faq" },
  { key: "nav_contact", href: "/contacto" },
] as const;

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-maiz focus-visible:ring-offset-2";

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
    <header className="border-b border-fam-tinta/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <TextileBand thin />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <Link href="/" className={cn("flex shrink-0 items-baseline gap-2 rounded-lg", focusRing)} aria-label={t("logo_alt")}>
          <Image src="/Logo-Azul.svg" alt="" width={160} height={41} className="h-auto w-28 self-center sm:w-32" priority />
          <span className="font-familia text-xl leading-none text-fam-valle sm:text-2xl">{t("family_tag")}</span>
        </Link>

        <nav aria-label={t("nav_main")} className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "relative rounded py-2 text-[15px] font-bold transition-colors",
                focusRing,
                isActive(l.href)
                  ? "text-fam-tinta after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-fam-maiz"
                  : "text-fam-tinta/70 hover:text-fam-tinta"
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
            className={cn("hidden h-10 rounded-full px-3 text-sm font-bold text-fam-tinta/70 hover:text-fam-tinta sm:inline-flex sm:items-center", focusRing)}
          >
            {locale === "es" ? "EN" : "ES"}
          </button>
          <Link
            href="/carrito"
            aria-label={count > 0 ? `${t("nav_cart")} (${count})` : t("nav_cart")}
            className={cn("relative flex h-10 w-10 items-center justify-center rounded-full text-fam-tinta hover:bg-fam-niebla", focusRing)}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-fam-aji px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link href="/tours" className={cn(familyBtnPrimary, "hidden min-h-10 px-5 py-2.5 md:inline-flex")}>
            {t("nav_cta")}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t("nav_menu")}
                className={cn("flex h-10 w-10 items-center justify-center rounded-full text-fam-tinta hover:bg-fam-niebla lg:hidden", focusRing)}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[88vw] max-w-sm flex-col border-l-0 bg-white p-0 [&>button]:hidden">
              <TextileBand thin />
              <div className="flex flex-1 flex-col p-6">
                <SheetTitle className="sr-only">{t("nav_main")}</SheetTitle>
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-familia text-2xl text-fam-valle">{t("site_name")}</span>
                  <SheetClose asChild>
                    <button
                      type="button"
                      aria-label={t("nav_close")}
                      className={cn("flex h-10 w-10 items-center justify-center rounded-full text-fam-tinta hover:bg-fam-niebla", focusRing)}
                    >
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </SheetClose>
                </div>
                <nav aria-label={t("nav_main")} className="flex flex-col">
                  {LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 border-b border-fam-tinta/10 py-4 font-familia text-2xl",
                        focusRing,
                        isActive(l.href) ? "text-fam-valle" : "text-fam-tinta"
                      )}
                    >
                      {isActive(l.href) && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-fam-maiz" />}
                      {t(l.key)}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex gap-3 pt-8">
                  <button
                    type="button"
                    onClick={() => { switchLocale(); setOpen(false); }}
                    className={cn("h-12 flex-1 rounded-full border border-fam-tinta/25 font-bold text-fam-tinta", focusRing)}
                  >
                    {t("nav_switch_to")}
                  </button>
                  <Link href="/tours" onClick={() => setOpen(false)} className={cn(familyBtnPrimary, "flex-1")}>
                    {t("nav_cta")}
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
