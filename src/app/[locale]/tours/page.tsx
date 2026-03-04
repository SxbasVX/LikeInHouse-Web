"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { TourCard } from "@/components/public/tour-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function ToursPage() {
  const t = useTranslations("tours");
  const tc = useTranslations("common");

  const [page, setPage] = useState(1);
  const [destination, setDestination] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");

  const { data: destinations } = trpc.public.destinations.useQuery();
  const { data: categories } = trpc.public.categories.useQuery();

  const { data, isLoading } = trpc.public.tours.useQuery({
    page,
    limit: 9,
    destination,
    category,
    sort,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("catalog")}</h1>
        <p className="mt-2 text-muted-foreground">{t("catalog_subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Select
          value={destination || "all"}
          onValueChange={(v) => { setDestination(v === "all" ? undefined : v); setPage(1); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("filter_destination")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter_all")}</SelectItem>
            {destinations?.map((d) => (
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
            {categories?.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(v) => setSort(v as typeof sort)}
        >
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

      {/* Tour Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : data && data.tours.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.pages}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg text-muted-foreground">{tc("no_results")}</p>
        </div>
      )}
    </div>
  );
}
