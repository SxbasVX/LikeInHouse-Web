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
import { Search, SlidersHorizontal, X } from "lucide-react";

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

  function clearAll() {
    setSearch("");
    setActiveSearch(undefined);
    setDestination(undefined);
    setCategory(undefined);
    setPage(1);
  }

  const hasFilters: boolean = page > 1 || !!destination || !!category || !!activeSearch || sort !== "newest";

  const { data, isLoading } = trpc.public.tours.useQuery(
    { page, limit: 9, search: activeSearch, destination, category, sort },
    { initialData: hasFilters ? undefined : initialData, enabled: hasFilters as boolean }
  );

  const displayData = data || initialData;
  const activeFilterCount = [destination, category, activeSearch].filter(Boolean).length;

  return (
    <section className="bg-white min-h-screen">

      {/* Hero Header */}
      <div className="bg-[#faf8f5] border-b border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-4">
              {t("catalog_subtitle")}
            </p>
            <h1 className="font-heading text-4xl font-light text-brand-darkRed sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              {t("catalog").split(" ")[0]}{" "}
              <span className="font-serif italic font-normal text-brand-teal">
                {t("catalog").split(" ").slice(1).join(" ")}
              </span>
            </h1>
          </div>

          {/* Filter Bar */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search_placeholder")}
                  className="h-12 w-64 rounded-full border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-colors shadow-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setActiveSearch(undefined); setPage(1); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button type="submit" className="h-12 rounded-full bg-brand-darkRed hover:bg-brand-orange text-white px-6 font-medium shadow-sm transition-all">
                {tc("search")}
              </Button>
            </form>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* Destination */}
            <Select value={destination || "all"} onValueChange={(v) => { setDestination(v === "all" ? undefined : v); setPage(1); }}>
              <SelectTrigger className="h-12 w-48 rounded-full border-gray-200 bg-white shadow-sm text-sm focus:ring-brand-teal/30">
                <SelectValue placeholder={t("filter_destination")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{t("filter_all")}</SelectItem>
                {destinations.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Category */}
            <Select value={category || "all"} onValueChange={(v) => { setCategory(v === "all" ? undefined : v); setPage(1); }}>
              <SelectTrigger className="h-12 w-48 rounded-full border-gray-200 bg-white shadow-sm text-sm focus:ring-brand-teal/30">
                <SelectValue placeholder={t("filter_category")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">{t("filter_all")}</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="h-12 w-48 rounded-full border-gray-200 bg-white shadow-sm text-sm focus:ring-brand-teal/30">
                <SelectValue placeholder={t("sort_by")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="newest">{t("sort_newest")}</SelectItem>
                <SelectItem value="price_asc">{t("sort_price_asc")}</SelectItem>
                <SelectItem value="price_desc">{t("sort_price_desc")}</SelectItem>
                <SelectItem value="popular">{t("sort_popular")}</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 h-12 rounded-full px-5 text-sm font-medium text-gray-500 hover:text-brand-darkRed border border-gray-200 bg-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-16 lg:py-20">

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-gray-400 font-light mb-10">
            {displayData.total} {displayData.total === 1 ? "tour encontrado" : "tours encontrados"}
            {activeFilterCount > 0 && " · "}
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-brand-teal hover:underline">
                ver todos
              </button>
            )}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-[4/3] rounded-[2rem]" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
                <Skeleton className="h-6 w-full rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-3/4 rounded-full" />
              </div>
            ))}
          </div>
        ) : displayData.tours.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {displayData.tours.map((tour: any) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>

            {displayData.pages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-12 rounded-full px-8 border-gray-200 hover:border-brand-darkRed hover:text-brand-darkRed transition-colors"
                >
                  {tc("previous")}
                </Button>
                <span className="text-sm text-gray-400 font-light px-4">
                  {displayData.page} / {displayData.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= displayData.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-12 rounded-full px-8 border-gray-200 hover:border-brand-darkRed hover:text-brand-darkRed transition-colors"
                >
                  {tc("next")}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center max-w-sm mx-auto">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gray-50 border border-gray-100">
              <SlidersHorizontal className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-brand-darkRed mb-2">{tc("no_results")}</h3>
            {activeSearch && (
              <p className="text-gray-500 font-light mb-6 text-sm">
                No encontramos tours para{" "}
                <span className="font-medium text-gray-700">&ldquo;{activeSearch}&rdquo;</span>
              </p>
            )}
            <Button
              onClick={clearAll}
              className="rounded-full bg-brand-darkRed hover:bg-brand-orange text-white px-8 h-12 font-medium transition-all"
            >
              <X className="h-4 w-4 mr-2" />
              {t("filter_all")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export function ToursCatalog(props: ToursCatalogProps) {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="aspect-[4/3] rounded-[2rem]" />
              <Skeleton className="h-4 w-2/3 rounded-full" />
              <Skeleton className="h-6 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ToursCatalogInner {...props} />
    </Suspense>
  );
}
