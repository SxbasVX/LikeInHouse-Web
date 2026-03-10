"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Globe, Map, ChevronDown, ChevronRight, MapPin, ShoppingCart, X, Youtube, Instagram, Facebook, Twitter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpandedDest, setMobileExpandedDest] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    const cleanPath = pathname.replace(/^\/(es|en)/, "") || "/";
    if (href === "/") return cleanPath === "/";
    return cleanPath.startsWith(href);
  };

  const switchLocale = (loc: "es" | "en") => {
    const cleanPath = pathname.replace(/^\/(es|en)/, "") || "/";
    router.replace(cleanPath, { locale: loc });
  };

  return (
    <header className={cn(
      "fixed left-1/2 -translate-x-1/2 z-50 w-full px-4 sm:px-6 lg:w-fit lg:px-0 transition-all duration-300",
      scrolled ? "top-2" : "top-6"
    )}>
      <div className={cn(
        "relative mx-auto flex h-[52px] w-full lg:w-fit items-center justify-between lg:justify-center rounded-full px-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border transition-all duration-300",
        scrolled ? "bg-[#1c1a17]/95 backdrop-blur-xl border-white/20" : "bg-[#1c1a17]/80 backdrop-blur-md border-white/10"
      )}>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 pl-2">
          <Link
            href="/"
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
              isActive("/") ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
            )}
          >
            {t("home")}
          </Link>

          {/* Tours Mega Menu */}
          <ToursMegaMenu
            destinations={destinations}
            toursByDest={toursByDest}
            featuredTours={featuredTours?.slice(0, 2) || []}
            isEs={isEs}
            isActive={isActive("/tours")}
            toursLabel={t("tours")}
          />

          {rightLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                isActive(link.href) ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        {/* Separator Desktop */}
        <div className="hidden lg:block w-[1px] h-6 bg-white/10 mx-2" />

        {/* Right side Desktop */}
        <div className="hidden lg:flex items-center gap-2 pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-0">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => switchLocale("es")} className="rounded-lg cursor-pointer">Espanol</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLocale("en")} className="rounded-lg cursor-pointer">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 focus-visible:ring-0">
            <ShoppingCart className="h-4 w-4" />
          </Button>

          <Button asChild className="h-8 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/10 px-4 text-xs font-semibold shadow-none transition-all ml-1">
            <Link href="/contacto" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {t("book")}
            </Link>
          </Button>
        </div>

        {/* Mobile Left side: showing Logo just to not be empty, or just text */}
        <div className="flex lg:hidden items-center pl-3">
          <Map className="h-5 w-5 text-white mr-2" />
          <span className="text-lg font-bold tracking-tight text-white">LikeInHouse</span>
        </div>

        {/* Mobile Menu */}
        <div className="flex lg:hidden flex-1 justify-end pr-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[95vw] sm:w-[500px] p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] m-2 sm:m-4 h-[calc(100vh-16px)] sm:h-[calc(100vh-32px)] border-0 shadow-2xl overflow-y-auto flex flex-col [&>button]:hidden">

              {/* Menu Header with Custom Close & Logo */}
              <div className="flex items-center justify-between mb-12">
                <SheetClose asChild>
                  <button className="h-12 w-12 flex items-center justify-center rounded-2xl border border-border/80 text-foreground hover:bg-muted transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </SheetClose>
                <div className="flex-1 flex justify-center">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group">
                    <Map className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold tracking-widest uppercase text-foreground">LikeInHouse</span>
                  </Link>
                </div>
                <div className="w-12" /> {/* Spacer to perfectly center the logo */}
              </div>

              {/* Primary Links */}
              <div className="space-y-6">
                {[
                  { label: t("home"), href: "/" },
                  { label: t("tours"), href: "/tours" },
                  { label: t("about"), href: "/nosotros" },
                  { label: t("blog"), href: "/blog" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex justify-between items-center group"
                  >
                    <span className="text-3xl font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a4746] text-white group-hover:bg-primary transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex-1" />

              {/* Secondary Links Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-12 pt-8 border-t border-border/60">
                {[
                  { label: t("faq"), href: "/faq" },
                  { label: t("contact"), href: "/contacto" },
                  { label: isEs ? "Destinos" : "Destinations", href: "/tours" },
                  { label: isEs ? "Privacidad" : "Privacy", href: "#" },
                  { label: isEs ? "Términos" : "Terms", href: "#" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center group"
                  >
                    <span className="text-[15px] font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>

              {/* Socials Box */}
              <div className="mt-8 mb-4">
                <div className="flex items-center justify-between p-4 sm:px-6 border border-border/80 rounded-[20px]">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground">SOCIALS</span>
                  <div className="flex items-center gap-4">
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Youtube className="h-4 w-4" /></a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram className="h-4 w-4" /></a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Facebook className="h-4 w-4" /></a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="h-4 w-4" /></a>
                  </div>
                </div>
              </div>

              {/* Language + Book Button */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl h-12 font-medium" onClick={() => { switchLocale(isEs ? "en" : "es"); setMobileOpen(false); }}>
                  {isEs ? "English" : "Español"}
                </Button>
                <Button className="flex-1 rounded-xl h-12 font-medium bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { router.push("/contacto"); setMobileOpen(false); }}>
                  {t("book")}
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
        className={cn(
          "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
          isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
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
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-default",
          isActive || open ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
        )}
      >
        {toursLabel}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>

      {/* Mega Menu Panel */}
      {open && (
        <div className="absolute left-1/2 top-[calc(100%+12px)] -translate-x-1/2 z-50">
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
