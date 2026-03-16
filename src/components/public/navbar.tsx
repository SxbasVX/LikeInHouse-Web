"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter as useIntlRouter, usePathname as useIntlPathname } from "@/i18n/routing";
import { usePathname as useNextPathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Globe, Map, ChevronDown, ChevronRight, MapPin, ShoppingCart, X, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import Image from "next/image";

const rightLinks = [
  { key: "about", href: "/nosotros" },
  { key: "blog", href: "/blog" },
  { key: "faq", href: "/faq" },
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
  const cartCount = useCartStore((s) => s.items.length);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
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
  }, [nextPathname, isEs]);

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

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
      scrolled
        ? "bg-white/97 backdrop-blur-md shadow-md"
        : "bg-transparent"
    )}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 group">
          <Image
            src="/Logo.svg"
            alt="Like In House Logo"
            width={200}
            height={66}
            className="w-36 sm:w-44 lg:w-[200px] h-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Nav — centered */}
        <nav
          ref={navRef}
          className="hidden lg:flex items-center gap-0.5 flex-1 justify-center relative"
        >
          {/* Sliding Pill Indicator */}
          <div
            className="absolute h-[calc(100%-4px)] top-[2px] rounded-full bg-brand-darkRed/8 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
          />

          <Link
            href="/"
            data-active={isActive("/")}
            className={cn(
              "relative z-10 px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200",
              isActive("/")
                ? "text-brand-darkRed"
                : scrolled
                ? "text-gray-600 hover:text-brand-darkRed hover:bg-gray-100"
                : "text-white/90 hover:text-white hover:bg-white/10"
            )}
          >
            {t("home")}
          </Link>

          <ToursMegaMenu
            destinations={destinations}
            toursByDest={toursByDest}
            featuredTours={featuredTours?.slice(0, 2) || []}
            isEs={isEs}
            isActive={isActive("/tours")}
            toursLabel={t("tours", { fallback: "Packages" })}
            scrolled={scrolled}
          />

          {rightLinks.slice(0, 3).map((link) => (
            <Link
              key={link.key}
              href={link.href}
              data-active={isActive(link.href)}
              className={cn(
                "relative z-10 px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200",
                isActive(link.href)
                  ? "text-brand-darkRed"
                  : scrolled
                  ? "text-gray-600 hover:text-brand-darkRed hover:bg-gray-100"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              )}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Cart */}
          <Button asChild variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full focus-visible:ring-0 relative transition-colors", scrolled ? "text-gray-600 hover:text-brand-darkRed hover:bg-gray-100" : "text-white/90 hover:text-white hover:bg-white/10")}>
            <Link href="/carrito">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white px-1 shadow-md animate-scale-in">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full focus-visible:ring-0 transition-colors", scrolled ? "text-gray-600 hover:text-brand-darkRed hover:bg-gray-100" : "text-white/90 hover:text-white hover:bg-white/10")}>
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => switchLocale("es")} className="rounded-lg cursor-pointer">Español</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLocale("en")} className="rounded-lg cursor-pointer">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Book Now */}
          <Button asChild className={cn("h-10 lg:h-11 rounded-full pl-5 pr-1.5 text-[14px] font-semibold transition-all ml-1 group", scrolled ? "bg-brand-darkRed hover:bg-brand-orange text-white shadow-sm" : "bg-white/15 hover:bg-white text-white hover:text-brand-darkRed border border-white/30")}>
            <Link href="/contacto" className="flex items-center gap-2.5">
              {t("book", { fallback: "Reservar" })}
              <div className={cn("flex items-center justify-center rounded-full h-8 w-8 transition-colors duration-300", scrolled ? "bg-white/20 group-hover:bg-white group-hover:text-brand-darkRed" : "bg-white/20 group-hover:bg-brand-orange")}>
                <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              </div>
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <Button asChild variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full relative transition-colors", scrolled ? "text-gray-600 hover:bg-gray-100" : "text-white hover:bg-white/10")}>
            <Link href="/carrito">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white px-1 shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full transition-colors", scrolled ? "text-gray-700 border border-gray-200 hover:bg-gray-100" : "text-white border border-white/30 hover:bg-white/10")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
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
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex justify-between items-center group"
                  >
                    <span className="text-3xl font-medium text-black group-hover:text-brand-orange transition-colors">
                      {t(item.key)}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-black group-hover:bg-brand-orange group-hover:text-white transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex-1" />

              <div className="flex gap-3 mt-12 mb-4">
                <Button variant="outline" className="flex-1 rounded-2xl h-14 font-semibold text-lg border-neutral-200" onClick={() => { switchLocale(isEs ? "en" : "es"); setMobileOpen(false); }}>
                  {isEs ? "English" : "Español"}
                </Button>
                <Button className="flex-1 rounded-2xl h-14 font-semibold text-lg bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg shadow-brand-orange/20" onClick={() => { intlRouter.push("/contacto"); setMobileOpen(false); }}>
                  {t("book", { fallback: "Reservar" })}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// Mega Menu for Tours
function ToursMegaMenu({
  destinations,
  toursByDest,
  featuredTours,
  isEs,
  isActive,
  toursLabel,
  scrolled,
}: {
  destinations: string[];
  toursByDest: Record<string, { slug: string; nameEs: string; nameEn: string; destination: string; category: string }[]> | undefined;
  featuredTours: { slug: string; nameEs: string; nameEn: string; shortDescEs: string; shortDescEn: string; images: { url: string; altEs: string | null; altEn: string | null }[] }[];
  isEs: boolean;
  isActive: boolean;
  toursLabel: string;
  scrolled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const linkCn = (active: boolean) => cn(
    "relative z-10 px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200",
    active
      ? "text-brand-darkRed"
      : scrolled
      ? "text-gray-600 hover:text-brand-darkRed hover:bg-gray-100"
      : "text-white/90 hover:text-white hover:bg-white/10"
  );

  if (destinations.length === 0) {
    return (
      <Link href="/tours" data-active={isActive} className={linkCn(isActive)}>
        {toursLabel}
      </Link>
    );
  }

  return (
    <div className="relative flex items-center" onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={menuRef}>
      <Link
        href="/tours"
        data-active={isActive}
        className={cn(linkCn(isActive), "flex items-center gap-1")}
      >
        {toursLabel}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>

      {/* Mega Menu Panel */}
      {open && (
        <div className="absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-[720px] rounded-[24px] border bg-white shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="grid grid-cols-5">
              {/* Left: Destinations */}
              <div className="col-span-2 bg-gray-50 p-5">
                <div className="space-y-4">
                  {destinations.map((dest) => (
                    <DestinationGroup
                      key={dest}
                      destination={dest}
                      tours={toursByDest?.[dest] || []}
                      isEs={isEs}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <Link
                    href="/tours"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-darkRed hover:underline"
                  >
                    {isEs ? "Ver todos los tours" : "View all tours"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right: Featured Tours */}
              <div className="col-span-3 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {isEs ? "Tours destacados" : "Featured tours"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {featuredTours.map((tour) => (
                    <Link
                      key={tour.slug}
                      href={`/tours/${tour.slug}`}
                      onClick={() => setOpen(false)}
                      className="group overflow-hidden rounded-lg"
                    >
                      <div className="aspect-[16/10] overflow-hidden rounded-lg bg-gray-100">
                        {tour.images[0] ? (
                          <img
                            src={tour.images[0].url}
                            alt={(isEs ? tour.images[0].altEs : tour.images[0].altEn) || tour.nameEs}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            <Map className="h-8 w-8 opacity-30" />
                          </div>
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

function DestinationGroup({
  destination,
  tours,
  isEs,
  onNavigate,
}: {
  destination: string;
  tours: { slug: string; nameEs: string; nameEn: string }[];
  isEs: boolean;
  onNavigate: () => void;
}) {
  return (
    <div>
      <Link
        href={`/tours?destination=${encodeURIComponent(destination)}`}
        onClick={onNavigate}
        className="group flex items-center gap-2"
      >
        <MapPin className="h-4 w-4 text-brand-darkRed" />
        <span className="text-sm font-semibold text-gray-800 group-hover:text-brand-darkRed transition-colors">
          {destination}
        </span>
      </Link>
      <div className="ml-6 mt-1 space-y-0.5">
        {tours.slice(0, 3).map((tour) => (
          <Link
            key={tour.slug}
            href={`/tours/${tour.slug}`}
            onClick={onNavigate}
            className="block text-xs text-gray-500 hover:text-brand-darkRed transition-colors py-0.5"
          >
            {isEs ? tour.nameEs : tour.nameEn}
          </Link>
        ))}
        {tours.length > 3 && (
          <Link
            href={`/tours?destination=${encodeURIComponent(destination)}`}
            onClick={onNavigate}
            className="block text-xs font-medium text-brand-darkRed/70 hover:text-brand-darkRed py-0.5"
          >
            +{tours.length - 3} {isEs ? "mas" : "more"}...
          </Link>
        )}
      </div>
    </div>
  );
}
