"use client";

import { useState, useEffect, Suspense, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { TourCard } from "@/components/public/tour-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";

interface ToursCatalogProps {
  initialData: {
    tours: any[];
    total: number;
    pages: number;
    page: number;
  };
  destinations: string[];
  categories: string[];
}

function ToursCatalogInner({ initialData, destinations, categories }: ToursCatalogProps) {
  const t = useTranslations("tours");
  const tc = useTranslations("common");

  const searchParams = useSearchParams();
  const urlDestination = searchParams.get("destination") || undefined;
  const urlSearch = searchParams.get("search") || undefined;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string>(urlSearch || "");
  const [activeSearch, setActiveSearch] = useState<string | undefined>(urlSearch);
  const [destination, setDestination] = useState<string | undefined>(urlDestination);
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");

  useEffect(() => {
    if (urlDestination && urlDestination !== destination) {
      setDestination(urlDestination);
      setPage(1);
    }
  }, [urlDestination]);

  useEffect(() => {
    if (urlSearch !== undefined && urlSearch !== activeSearch) {
      setSearch(urlSearch);
      setActiveSearch(urlSearch);
      setPage(1);
    }
  }, [urlSearch]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = search.trim();
    setActiveSearch(trimmed || undefined);
    setPage(1);
  }

  function clearSearch() {
    setSearch("");
    setActiveSearch(undefined);
    setPage(1);
  }

  const hasFilters: boolean = page > 1 || !!destination || !!category || !!activeSearch || sort !== "newest";

  const { data, isLoading } = trpc.public.tours.useQuery(
    { page, limit: 9, search: activeSearch, destination, category, sort },
    { initialData: hasFilters ? undefined : initialData, enabled: hasFilters as boolean }
  );

  const displayData = data || initialData;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-slide-up mb-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("catalog")}</h1>
        <p className="mt-2 text-muted-foreground">{t("catalog_subtitle")}</p>
      </div>

      <div className="animate-fade-in mb-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "100ms" }}>
        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_placeholder")}
              className="h-10 w-56 rounded-md border border-input bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" variant="secondary">
            {tc("search")}
          </Button>
        </form>

        <Select
          value={destination || "all"}
          onValueChange={(v) => { setDestination(v === "all" ? undefined : v); setPage(1); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("filter_destination")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter_all")}</SelectItem>
            {destinations.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={category || "all"}
          onValueChange={(v) => { setCategory(v === "all" ? undefined : v); setPage(1); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("filter_category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter_all")}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("sort_by")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sort_newest")}</SelectItem>
            <SelectItem value="price_asc">{t("sort_price_asc")}</SelectItem>
            <SelectItem value="price_desc">{t("sort_price_desc")}</SelectItem>
            <SelectItem value="popular">{t("sort_popular")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : displayData.tours.length > 0 ? (
        <>
          <div className="stagger-children grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayData.tours.map((tour: any) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>

          {displayData.pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {tc("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">{displayData.page} / {displayData.pages}</span>
              <Button variant="outline" disabled={page >= displayData.pages} onClick={() => setPage((p) => p + 1)}>
                {tc("next")}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="animate-fade-in py-20 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg text-muted-foreground">{tc("no_results")}</p>
        </div>
      )}
    </div>
  );
}

export function ToursCatalog(props: ToursCatalogProps) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12"><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => (<Skeleton key={i} className="h-80 rounded-lg" />))}</div></div>}>
      <ToursCatalogInner {...props} />
    </Suspense>
  );
}
