"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCartStore, useCartHydration } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, ArrowRight, MapPin, Clock, X, CalendarDays } from "lucide-react";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const isEs = locale === "es";
  const cartHydrated = useCartHydration();
  const { items, removeItem, clearCart, updateItemDate } = useCartStore();

  if (!cartHydrated) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{isEs ? "Cargando carrito..." : "Loading cart..."}</div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <ShoppingCart className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-brand-darkRed mb-2">
            {t("empty")}
          </h1>
          <p className="text-gray-500 mb-8">{t("empty_desc")}</p>
          <Button asChild className="rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white px-8 h-12">
            <Link href="/tours">
              {t("browse_tours")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-heading text-3xl font-semibold text-brand-darkRed sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-gray-500">
            {items.length} {t("items")}
          </p>
        </div>

        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => {
            const name = isEs ? item.nameEs : item.nameEn;
            return (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md"
              >
                {/* Image */}
                <div className="relative w-full sm:w-48 h-36 sm:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 192px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <MapPin className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-brand-darkRed truncate">
                      {name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.destination}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {item.durationDays}d/{item.durationNights}n
                      </span>
                    </div>
                  </div>

                  {/* Date picker */}
                  <div className="mt-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                          item.travelDate
                            ? "border-brand-orange/40 bg-brand-orange/5 text-brand-darkRed font-medium"
                            : "border-dashed border-gray-300 text-gray-400 hover:border-brand-orange hover:text-brand-darkRed"
                        }`}>
                          <CalendarDays className="h-4 w-4" />
                          {item.travelDate
                            ? format(new Date(item.travelDate + "T00:00:00"), "d 'de' MMMM, yyyy", { locale: isEs ? es : enUS })
                            : isEs ? "Seleccionar fecha de viaje" : "Select travel date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={item.travelDate ? new Date(item.travelDate + "T00:00:00") : undefined}
                          onSelect={(date) => updateItemDate(item.id, date ? format(date, "yyyy-MM-dd") : undefined)}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          locale={isEs ? es : enUS}
                          initialFocus
                        />
                        {item.travelDate && (
                          <div className="border-t px-3 py-2">
                            <button
                              onClick={() => updateItemDate(item.id, undefined)}
                              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                            >
                              {isEs ? "Quitar fecha" : "Clear date"}
                            </button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {item.tourType === "INFORMATIONAL" ? (
                      <span className="text-sm text-gray-400">{t("informational")}</span>
                    ) : item.priceUsd ? (
                      <p className="text-lg font-bold text-brand-darkRed">
                        ${item.priceUsd.toFixed(0)}{" "}
                        <span className="text-sm font-normal text-gray-400">/ {t("per_person")}</span>
                      </p>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 rounded-full h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="rounded-full bg-brand-orange hover:bg-brand-orange/90 text-white px-5 h-9"
                      >
                        <Link href={`/tours/${item.slug}`}>
                          {item.tourType === "INFORMATIONAL" ? t("view_details") : t("book_now")}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={clearCart}
            className="text-gray-400 hover:text-red-500 rounded-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("clear_all")}
          </Button>
          <Button asChild variant="outline" className="rounded-full border-brand-darkRed/20 text-brand-darkRed hover:bg-brand-darkRed hover:text-white px-8 h-12">
            <Link href="/tours">
              {t("continue_browsing")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
