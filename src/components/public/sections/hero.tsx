"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/tours?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary py-24 text-white lg:py-32">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="animate-slide-up text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {t("hero_title")}
        </h1>
        <p className="animate-slide-up mx-auto mt-4 max-w-2xl text-lg text-white/90 sm:text-xl" style={{ animationDelay: "100ms" }}>
          {t("hero_subtitle")}
        </p>

        {/* Barra de búsqueda */}
        <form
          onSubmit={handleSearch}
          className="animate-slide-up mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full bg-white p-2 shadow-lg"
          style={{ animationDelay: "150ms" }}
        >
          <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="flex-1 bg-transparent px-2 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button type="submit" size="lg" className="rounded-full px-6">
            {tc("search")}
          </Button>
        </form>

        <div className="animate-slide-up mt-6 flex justify-center gap-4" style={{ animationDelay: "250ms" }}>
          <Button size="lg" variant="secondary" className="transition-transform hover:scale-105" asChild>
            <Link href="/tours">{t("hero_cta")}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10 transition-transform hover:scale-105"
            asChild
          >
            <Link href="/contacto">{t("cta_button")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
