"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter as useIntlRouter, usePathname as useIntlPathname } from "@/i18n/routing";
import { usePathname as useNextPathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Globe, Map, ChevronDown, ChevronRight, MapPin, ShoppingCart, X, ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useCartStore, useCartHydration } from "@/lib/cart-store";
import Image from "next/image";

const rightLinks = [
  { key: "about", href: "/nosotros" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contacto" },
];

export function Navbar() {
  const t = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";

  const nextPathname = useNextPathname();
  const searchParams = useSearchParams();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const cartHydrated = useCartHydration();
  const cartCount = useCartStore((s) => s.items.length);
  const safeCartCount = cartHydrated ? cartCount : 0;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(prev => prev ? y > 40 : y > 80);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        const navRect = navRef.current.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({ left: elRect.left - navRect.left, width: elRect.width, opacity: 1 });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    const timeout = setTimeout(updateIndicator, 150);
    return () => { window.removeEventListener("resize", updateIndicator); clearTimeout(timeout); };
  }, [nextPathname, isEs, scrolled]);

  const { data: toursByDest } = trpc.public.toursByDestination.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: featuredTours } = trpc.public.featuredTours.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: settings } = trpc.public.settings.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const airbnbUrl = settings ? (settings as Record<string, string>)["airbnbUrl"] : undefined;

  const destinations = toursByDest ? Object.keys(toursByDest) : [];

  const isActive = (href: string) => {
    const cleanPath = nextPathname.replace(/^\/(es|en)(\/|$)/, "/") || "/";
    const normalizedClean = cleanPath.replace(/\/$/, "") || "/";
    if (href === "/") return normalizedClean === "/";
    return normalizedClean.startsWith(href);
  };

  const switchLocale = (loc: "es" | "en") => {
    const search = searchParams.toString();
    const path = search ? `${intlPathname}?${search}` : intlPathname;
    intlRouter.replace(path, { locale: loc });
  };

  // Hero mode: homepage + not scrolled
  const heroMode = isActive("/") && !scrolled;

  // ─── HERO MODE ────────────────────────────────────────────────────────────
  if (heroMode) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none py-4">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">

          <Link href="/" className="pointer-events-auto hidden sm:flex items-center shrink-0 group relative z-20">
            <Image src="/Logo.svg" alt="Like In House Logo" width={200} height={51}
              className="w-36 sm:w-44 lg:w-[200px] h-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          <div className="pointer-events-none absolute left-0 right-0 hidden lg:flex justify-center" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <nav ref={navRef} className="pointer-events-auto flex items-center gap-0.5 rounded-full p-1.5 shadow-2xl border backdrop-blur-xl relative bg-black/45 border-white/10">
              <div className="absolute h-[calc(100%-12px)] top-[6px] rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0"
                style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px`, opacity: indicatorStyle.opacity }}
              />
              <Link href="/" data-active={isActive("/")} className={cn("relative z-10 px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors duration-200", isActive("/") ? "text-brand-darkRed" : "text-white/85 hover:text-white hover:bg-white/10")}>
                {t("home")}
              </Link>
              <ToursMegaMenu destinations={destinations} toursByDest={toursByDest} featuredTours={featuredTours?.slice(0, 2) || []} isEs={isEs} isActive={isActive("/tours")} toursLabel={t("tours", { fallback: "Packages" })} heroMode />
              {rightLinks.slice(0, 3).map((link) => (
                <Link key={link.key} href={link.href} data-active={isActive(link.href)}
                  className={cn("relative z-10 px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors duration-200", isActive(link.href) ? "text-brand-darkRed" : "text-white/85 hover:text-white hover:bg-white/10")}
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pointer-events-auto hidden lg:flex items-center gap-2 rounded-full p-1.5 pl-3 shadow-2xl border backdrop-blur-xl relative z-20 bg-black/45 border-white/10">
            <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/90 hover:text-white hover:bg-white/15 focus-visible:ring-0 relative">
              <Link href="/carrito">
                <ShoppingCart className="h-5 w-5" />
                {safeCartCount > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white px-1 shadow-md">{safeCartCount}</span>}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/90 hover:text-white hover:bg-white/15 focus-visible:ring-0">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-white/10 bg-black/80 backdrop-blur-xl text-white">
                <DropdownMenuItem onClick={() => switchLocale("es")} className="rounded-lg cursor-pointer focus:bg-white/20">Español</DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLocale("en")} className="rounded-lg cursor-pointer focus:bg-white/20">English</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {airbnbUrl && (
              <a href={airbnbUrl} target="_blank" rel="noopener noreferrer" className="h-10 lg:h-11 rounded-full bg-white/10 hover:bg-[#FF5A5F] text-white border border-white/20 hover:border-[#FF5A5F] px-4 text-[14px] font-semibold transition-all ml-1 inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.7 17.4c-.3.6-.8 1-1.4 1.2-.2.1-.4.1-.6.1-.4 0-.7-.1-1-.3-.4-.2-.8-.6-1.3-1-.5-.5-1.1-1.2-1.7-2-.9-1.2-1.5-2.3-1.7-3.2-.3-1.1-.1-2 .4-2.6.4-.5 1-.7 1.6-.7.2 0 .3 0 .5.1.4.1.7.4 1 .9l.8 1.2c.2.3.3.5.4.8.1.3.1.5 0 .7-.1.3-.3.5-.5.8l-.2.2c-.1.1-.1.2-.1.3 0 .1.1.2.1.3.3.5.7 1 1.2 1.5.5.5 1 .8 1.5 1 .1.1.2.1.3.1s.2 0 .3-.1l.2-.2c.3-.3.5-.5.8-.6.2-.1.4-.1.7 0 .3.1.5.2.8.4l1.3.9c.4.3.7.6.8 1 .2.4.1.9-.1 1.3z"/></svg>
                Airbnb
              </a>
            )}
            <Button asChild className="h-10 lg:h-11 rounded-full bg-white/20 hover:bg-white text-white hover:text-brand-darkRed border border-white/30 pl-5 pr-1.5 text-[14px] font-semibold transition-all ml-1 group">
              <Link href="/tours" className="flex items-center gap-2.5">
                {t("book", { fallback: "Reservar" })}
                <div className="flex items-center justify-center bg-white text-brand-darkRed rounded-full h-8 w-8 group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300">
                  <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                </div>
              </Link>
            </Button>
          </div>

          <div className="pointer-events-auto flex lg:hidden items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white border border-white/30 hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <MobileMenuContent t={t} isEs={isEs} cartCount={safeCartCount} switchLocale={switchLocale} intlRouter={intlRouter} setMobileOpen={setMobileOpen} airbnbUrl={airbnbUrl} />
            </Sheet>
          </div>
        </div>
      </header>
    );
  }

  // ─── SCROLLED MODE: barra blanca con animación de entrada ─────────────────
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-md animate-slide-down">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

        <Link href="/" className="hidden sm:flex items-center shrink-0 group">
          <Image src="/Logo-Azul.svg" alt="Like In House Logo" width={200} height={51}
            className="w-36 sm:w-44 lg:w-[200px] h-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        <nav ref={navRef} className="hidden lg:flex items-center gap-0.5 flex-1 justify-center relative">
          <div className="absolute h-[calc(100%-4px)] top-[2px] rounded-full bg-brand-darkRed/8 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0"
            style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px`, opacity: indicatorStyle.opacity }}
          />
          <Link href="/" data-active={isActive("/")} className={cn("relative z-10 px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200", isActive("/") ? "text-brand-darkRed" : "text-gray-600 hover:text-brand-darkRed hover:bg-gray-100")}>
            {t("home")}
          </Link>
          <ToursMegaMenu destinations={destinations} toursByDest={toursByDest} featuredTours={featuredTours?.slice(0, 2) || []} isEs={isEs} isActive={isActive("/tours")} toursLabel={t("tours", { fallback: "Packages" })} heroMode={false} />
          {rightLinks.slice(0, 3).map((link) => (
            <Link key={link.key} href={link.href} data-active={isActive(link.href)}
              className={cn("relative z-10 px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200", isActive(link.href) ? "text-brand-darkRed" : "text-gray-600 hover:text-brand-darkRed hover:bg-gray-100")}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-600 hover:text-brand-darkRed hover:bg-gray-100 focus-visible:ring-0 relative">
            <Link href="/carrito">
              <ShoppingCart className="h-5 w-5" />
              {safeCartCount > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white px-1 shadow-md">{safeCartCount}</span>}
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-600 hover:text-brand-darkRed hover:bg-gray-100 focus-visible:ring-0">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => switchLocale("es")} className="rounded-lg cursor-pointer">Español</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLocale("en")} className="rounded-lg cursor-pointer">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {airbnbUrl && (
            <a href={airbnbUrl} target="_blank" rel="noopener noreferrer" className="h-10 lg:h-11 rounded-full bg-gray-100 hover:bg-[#FF5A5F] text-gray-700 hover:text-white border border-gray-200 hover:border-[#FF5A5F] px-4 text-[14px] font-semibold transition-all ml-1 inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.7 17.4c-.3.6-.8 1-1.4 1.2-.2.1-.4.1-.6.1-.4 0-.7-.1-1-.3-.4-.2-.8-.6-1.3-1-.5-.5-1.1-1.2-1.7-2-.9-1.2-1.5-2.3-1.7-3.2-.3-1.1-.1-2 .4-2.6.4-.5 1-.7 1.6-.7.2 0 .3 0 .5.1.4.1.7.4 1 .9l.8 1.2c.2.3.3.5.4.8.1.3.1.5 0 .7-.1.3-.3.5-.5.8l-.2.2c-.1.1-.1.2-.1.3 0 .1.1.2.1.3.3.5.7 1 1.2 1.5.5.5 1 .8 1.5 1 .1.1.2.1.3.1s.2 0 .3-.1l.2-.2c.3-.3.5-.5.8-.6.2-.1.4-.1.7 0 .3.1.5.2.8.4l1.3.9c.4.3.7.6.8 1 .2.4.1.9-.1 1.3z"/></svg>
              Airbnb
            </a>
          )}
          <Button asChild className="h-10 lg:h-11 rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-1.5 text-[14px] font-semibold transition-all ml-1 group shadow-sm">
            <Link href="/tours" className="flex items-center gap-2.5">
              {t("book", { fallback: "Reservar" })}
              <div className="flex items-center justify-center bg-white/20 rounded-full h-8 w-8 group-hover:bg-white group-hover:text-brand-darkRed transition-colors duration-300">
                <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              </div>
            </Link>
          </Button>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 relative">
            <Link href="/carrito">
              <ShoppingCart className="h-5 w-5" />
              {safeCartCount > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white px-1 shadow-md">{safeCartCount}</span>}
            </Link>
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-700 border border-gray-200 hover:bg-gray-100">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <MobileMenuContent t={t} isEs={isEs} cartCount={safeCartCount} switchLocale={switchLocale} intlRouter={intlRouter} setMobileOpen={setMobileOpen} airbnbUrl={airbnbUrl} />
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// ─── Shared Mobile Menu Content ───────────────────────────────────────────────
function MobileMenuContent({ t, isEs, cartCount, switchLocale, intlRouter, setMobileOpen, airbnbUrl }: {
  t: any; isEs: boolean; cartCount: number;
  switchLocale: (loc: "es" | "en") => void;
  intlRouter: any;
  setMobileOpen: (v: boolean) => void;
  airbnbUrl?: string;
}) {
  return (
    <SheetContent side="left" className="w-[95vw] sm:w-[500px] p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] m-2 sm:m-4 h-[calc(100vh-16px)] sm:h-[calc(100vh-32px)] border-0 shadow-2xl overflow-y-auto flex flex-col bg-white">
      <div className="flex items-center justify-between mb-12">
        <SheetClose asChild>
          <button className="h-12 w-12 flex items-center justify-center rounded-2xl border border-neutral-200 text-black hover:bg-neutral-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </SheetClose>
        <div className="flex-1 flex justify-center">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group">
            <Map className="h-6 w-6 text-brand-orange" />
            <span className="text-xl font-bold tracking-widest uppercase text-black">LikeInHouse</span>
          </Link>
        </div>
        <div className="h-12 w-12" />
      </div>

      <div className="space-y-6">
        {[
          { key: "home", href: "/" },
          { key: "tours", href: "/tours" },
          { key: "blog", href: "/blog" },
          { key: "about", href: "/nosotros" },
          { key: "faq", href: "/faq" },
          { key: "contact", href: "/contacto" },
        ].map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex justify-between items-center group">
            <span className="text-3xl font-medium text-black group-hover:text-brand-orange transition-colors">{t(item.key)}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-black group-hover:bg-brand-orange group-hover:text-white transition-colors">
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex-1" />

      {airbnbUrl && (
        <a href={airbnbUrl} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="flex justify-between items-center group mt-6">
          <span className="text-2xl font-medium text-[#FF5A5F] group-hover:text-[#e04e52] transition-colors">Airbnb</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5A5F]/10 text-[#FF5A5F] group-hover:bg-[#FF5A5F] group-hover:text-white transition-colors">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </a>
      )}

      <div className="flex gap-3 mt-12 mb-4">
        <Button variant="outline" className="flex-1 rounded-2xl h-14 font-semibold text-lg border-neutral-200" onClick={() => { switchLocale(isEs ? "en" : "es"); setMobileOpen(false); }}>
          {isEs ? "English" : "Español"}
        </Button>
        <Button className="flex-1 rounded-2xl h-14 font-semibold text-lg bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg" onClick={() => { intlRouter.push("/tours"); setMobileOpen(false); }}>
          {t("book", { fallback: "Reservar" })}
        </Button>
      </div>
    </SheetContent>
  );
}

// ─── Mega Menu ────────────────────────────────────────────────────────────────
function ToursMegaMenu({
  destinations, toursByDest, featuredTours, isEs, isActive, toursLabel, heroMode,
}: {
  destinations: string[];
  toursByDest: Record<string, { slug: string; nameEs: string; nameEn: string; destination: string; category: string }[]> | undefined;
  featuredTours: { slug: string; nameEs: string; nameEn: string; shortDescEs: string; shortDescEn: string; images: { url: string; altEs: string | null; altEn: string | null }[] }[];
  isEs: boolean;
  isActive: boolean;
  toursLabel: string;
  heroMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setOpen(true); };
  const handleLeave = () => { timeoutRef.current = setTimeout(() => setOpen(false), 200); };
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const linkCn = cn(
    "relative z-10 flex items-center gap-1 font-medium transition-colors duration-200",
    heroMode ? "px-5 py-2.5 rounded-full text-[13px]" : "px-4 py-2 rounded-full text-[13px]",
    isActive
      ? "text-brand-darkRed"
      : heroMode
      ? "text-white/85 hover:text-white hover:bg-white/10"
      : "text-gray-600 hover:text-brand-darkRed hover:bg-gray-100"
  );

  const fallback = (
    <Link href="/tours" data-active={isActive} className={linkCn}>
      {toursLabel}
    </Link>
  );

  if (destinations.length === 0) return fallback;

  return (
    <div className="relative flex items-center" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link href="/tours" data-active={isActive} className={linkCn}>
        {toursLabel}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>

      {open && (
        <div className="absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-[720px] rounded-[24px] border bg-white shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="grid grid-cols-5">
              <div className="col-span-2 bg-gray-50 p-5">
                <div className="space-y-4">
                  {destinations.map((dest) => (
                    <DestinationGroup key={dest} destination={dest} tours={toursByDest?.[dest] || []} isEs={isEs} onNavigate={() => setOpen(false)} />
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <Link href="/tours" onClick={() => setOpen(false)} className="inline-flex items-center gap-1 text-sm font-medium text-brand-darkRed hover:underline">
                    {isEs ? "Ver todos los tours" : "View all tours"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="col-span-3 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {isEs ? "Tours destacados" : "Featured tours"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {featuredTours.map((tour) => (
                    <Link key={tour.slug} href={`/tours/${tour.slug}`} onClick={() => setOpen(false)} className="group overflow-hidden rounded-lg">
                      <div className="aspect-[16/10] overflow-hidden rounded-lg bg-gray-100">
                        {tour.images[0] ? (
                          <img src={tour.images[0].url} alt={(isEs ? tour.images[0].altEs : tour.images[0].altEn) || tour.nameEs} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center"><Map className="h-8 w-8 opacity-20" /></div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-800 group-hover:text-brand-darkRed transition-colors line-clamp-2">
                        {isEs ? tour.nameEs : tour.nameEn}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DestinationGroup({ destination, tours, isEs, onNavigate }: {
  destination: string;
  tours: { slug: string; nameEs: string; nameEn: string }[];
  isEs: boolean;
  onNavigate: () => void;
}) {
  return (
    <div>
      <Link href={`/tours?destination=${encodeURIComponent(destination)}`} onClick={onNavigate} className="group flex items-center gap-2">
        <MapPin className="h-4 w-4 text-brand-darkRed" />
        <span className="text-sm font-semibold text-gray-800 group-hover:text-brand-darkRed transition-colors">{destination}</span>
      </Link>
      <div className="ml-6 mt-1 space-y-0.5">
        {tours.slice(0, 3).map((tour) => (
          <Link key={tour.slug} href={`/tours/${tour.slug}`} onClick={onNavigate} className="block text-xs text-gray-500 hover:text-brand-darkRed transition-colors py-0.5">
            {isEs ? tour.nameEs : tour.nameEn}
          </Link>
        ))}
        {tours.length > 3 && (
          <Link href={`/tours?destination=${encodeURIComponent(destination)}`} onClick={onNavigate} className="block text-xs font-medium text-brand-darkRed/70 hover:text-brand-darkRed py-0.5">
            +{tours.length - 3} {isEs ? "mas" : "more"}...
          </Link>
        )}
      </div>
    </div>
  );
}
