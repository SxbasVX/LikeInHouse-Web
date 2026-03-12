"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter as useIntlRouter, usePathname as useIntlPathname } from "@/i18n/routing";
import { usePathname as useNextPathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Globe, Map, ChevronDown, ChevronRight, MapPin, ShoppingCart, X, Youtube, Instagram, Facebook, Twitter, ArrowRight, ArrowUpRight } from "lucide-react";
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
  const [mobileExpandedDest, setMobileExpandedDest] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  // Slider states
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Effect to update sliding indicator
  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        const navRect = navRef.current.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: elRect.left - navRect.left,
          width: elRect.width,
          opacity: 1,
        });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    const timeout = setTimeout(updateIndicator, 150); // wait for fonts
    
    return () => {
      window.removeEventListener("resize", updateIndicator);
      clearTimeout(timeout);
    };
  }, [nextPathname, isEs]);

  const { data: toursByDest } = trpc.public.toursByDestination.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 min - tour structure rarely changes
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
    // nextPathname includes locale like /es/tours
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
      "fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 lg:px-8 transition-transform duration-300 pointer-events-none",
      scrolled ? "translate-y-4 lg:translate-y-5" : "translate-y-6 lg:translate-y-[42px]"
    )}>
      <div className="mx-auto max-w-[1400px] flex items-center justify-between relative">

        {/* Left Side: Logo (Always visible) */}
        <Link href="/" className="pointer-events-auto flex items-center group relative z-20">
          <Image
            src="/Logo.svg"
            alt="Like In House Logo"
            width={240}
            height={80}
            className="w-40 sm:w-48 lg:w-[240px] h-auto object-[left_center] object-contain drop-shadow-md transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Center: Glass Pill Navigation (Desktop only) */}
        <div className="hidden lg:flex flex-1 justify-center z-20 mx-6 pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
          <nav 
            ref={navRef}
            className={cn(
            "pointer-events-auto flex items-center gap-0.5 rounded-full p-1.5 shadow-2xl border backdrop-blur-xl relative bg-black/40 border-white/10"
          )}>
            {/* Sliding Pill Indicator */}
            <div 
              className="absolute h-[calc(100%-12px)] top-[6px] rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0"
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
                "relative z-10 px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors duration-300",
                isActive("/") ? "text-brand-darkRed" : "text-white/80 hover:text-white hover:bg-white/10"
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
            />

            {rightLinks.slice(0, 3).map((link) => (
              <Link
                key={link.key}
                href={link.href}
                data-active={isActive(link.href)}
                className={cn(
                  "relative z-10 px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors duration-300",
                  isActive(link.href) ? "text-brand-darkRed" : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side: Actions (Desktop only) */}
        <div className={cn(
          "pointer-events-auto hidden lg:flex items-center gap-2 rounded-full p-1.5 pl-3 shadow-2xl border backdrop-blur-xl relative z-20 bg-black/40 border-white/10"
        )}>
          {/* Cart */}
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/90 hover:text-white hover:bg-white/20 focus-visible:ring-0 relative">
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
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/90 hover:text-white hover:bg-white/20 focus-visible:ring-0">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-white/10 bg-black/80 backdrop-blur-xl text-white">
              <DropdownMenuItem onClick={() => switchLocale("es")} className="rounded-lg cursor-pointer focus:bg-white/20">Español</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLocale("en")} className="rounded-lg cursor-pointer focus:bg-white/20">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Book Now Button styled as in reference */}
          <Button asChild className="h-10 lg:h-11 rounded-full bg-white/20 hover:bg-white text-white hover:text-brand-darkRed border border-white/30 pl-5 pr-1.5 text-[14px] font-semibold shadow-none transition-all ml-1 group">
            <Link href="/contacto" className="flex items-center gap-2.5">
              {t("book", { fallback: "Book now" })}
              <div className="flex items-center justify-center bg-white text-brand-darkRed rounded-full h-8 w-8 group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300 shadow-sm">
                <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              </div>
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="pointer-events-auto flex lg:hidden items-center justify-end">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 shadow-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[95vw] sm:w-[500px] p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] m-2 sm:m-4 h-[calc(100vh-16px)] sm:h-[calc(100vh-32px)] border-0 shadow-2xl overflow-y-auto flex flex-col bg-white">
              {/* Menu Header with Custom Close & Logo */}
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
                <Link href="/carrito" onClick={() => setMobileOpen(false)} className="relative h-12 w-12 flex items-center justify-center rounded-2xl border border-neutral-200 text-black hover:bg-neutral-100 transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white px-1 shadow-md">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Primary Links */}
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

              {/* Language + Book Button */}
              <div className="flex gap-3 mt-12 mb-4">
                <Button variant="outline" className="flex-1 rounded-2xl h-14 font-semibold text-lg border-neutral-200" onClick={() => { switchLocale(isEs ? "en" : "es"); setMobileOpen(false); }}>
                  {isEs ? "English" : "Español"}
                </Button>
                <Button className="flex-1 rounded-2xl h-14 font-semibold text-lg bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg shadow-brand-orange/20" onClick={() => { intlRouter.push("/contacto"); setMobileOpen(false); }}>
                  {t("book", { fallback: "Book now" })}
                </Button>
              </div>

            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// Mega Menu for Tours (Athleats-style)
function ToursMegaMenu({
  destinations,
  toursByDest,
  featuredTours,
  isEs,
  isActive,
  toursLabel,
}: {
  destinations: string[];
  toursByDest: Record<string, { slug: string; nameEs: string; nameEn: string; destination: string; category: string }[]> | undefined;
  featuredTours: { slug: string; nameEs: string; nameEn: string; shortDescEs: string; shortDescEn: string; images: { url: string; altEs: string | null; altEn: string | null }[] }[];
  isEs: boolean;
  isActive: boolean;
  toursLabel: string;
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (destinations.length === 0) {
    return (
      <Link
        href="/tours"
        data-active={isActive}
        className={cn(
          "relative z-10 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
          isActive ? "text-brand-darkRed" : "text-white/70 hover:text-white hover:bg-white/5"
        )}
      >
        {toursLabel}
      </Link>
    );
  }

  return (
    <div className="h-full flex items-center" onMouseEnter={handleEnter} onMouseLeave={handleLeave} ref={menuRef}>
      <Link
        href="/tours"
        data-active={isActive}
        className={cn(
          "relative z-10 flex items-center gap-1 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 cursor-default",
          isActive ? "text-brand-darkRed" : (open ? "bg-white text-brand-darkRed shadow-lg" : "text-white/80 hover:text-white hover:bg-white/10")
        )}
      >
        {toursLabel}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>

      {/* Mega Menu Panel */}
      {open && (
        <div className="absolute left-1/2 top-[calc(100%+12px)] -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-[720px] rounded-[24px] border bg-[#fcfcfc] shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="grid grid-cols-5">
              {/* Left: Destinations */}
              <div className="col-span-2 bg-muted/30 p-5">
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
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {isEs ? "Ver todos los tours" : "View all tours"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right: Featured Tours */}
              <div className="col-span-3 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                      <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                        {tour.images[0] ? (
                          <img
                            src={tour.images[0].url}
                            alt={(isEs ? tour.images[0].altEs : tour.images[0].altEn) || tour.nameEs}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            <Map className="h-8 w-8 opacity-30" />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
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

// Destination group within mega menu left panel
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
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {destination}
        </span>
      </Link>
      <div className="ml-6 mt-1 space-y-0.5">
        {tours.slice(0, 3).map((tour) => (
          <Link
            key={tour.slug}
            href={`/tours/${tour.slug}`}
            onClick={onNavigate}
            className="block text-xs text-muted-foreground hover:text-primary transition-colors py-0.5"
          >
            {isEs ? tour.nameEs : tour.nameEn}
          </Link>
        ))}
        {tours.length > 3 && (
          <Link
            href={`/tours?destination=${encodeURIComponent(destination)}`}
            onClick={onNavigate}
            className="block text-xs font-medium text-primary/70 hover:text-primary py-0.5"
          >
            +{tours.length - 3} {isEs ? "mas" : "more"}...
          </Link>
        )}
      </div>
    </div>
  );
}
