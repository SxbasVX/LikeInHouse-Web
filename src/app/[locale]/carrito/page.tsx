"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, ArrowRight, MapPin, Clock, X, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useScrollAnimation, useStaggerAnimation } from "@/hooks/use-scroll-animation";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const isEs = locale === "es";
  const { items, removeItem, clearCart } = useCartStore();

  const content = useStaggerAnimation({ threshold: 0.1 });

  /* ── CARRITO VACÍO ─────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <>
        {/* Header oscuro */}
        <section className="relative bg-[#1C0D0C] pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-4">
              {isEs ? "Mi carrito" : "My cart"}
            </span>
            <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
              {isEs ? "Tu carrito está" : "Your cart is"}{" "}
              <span className="font-serif italic font-normal text-brand-orange/80">
                {isEs ? "vacío" : "empty"}
              </span>
            </h1>
          </div>
        </section>

        {/* Contenido */}
        <section className="bg-gray-50 py-20 px-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-md border border-gray-100">
              <ShoppingCart className="h-10 w-10 text-brand-darkRed/30" />
            </div>
            <p className="text-gray-500 text-lg mb-10">{t("empty_desc")}</p>
            <Link
              href="/tours"
              className="inline-flex items-center gap-3 rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-7 pr-2 py-2 text-[15px] font-semibold transition-all group shadow-lg"
            >
              {t("browse_tours")}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-brand-darkRed transition-colors">
                <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              </span>
            </Link>
          </div>
        </section>
      </>
    );
  }

  /* ── CARRITO CON ITEMS ─────────────────────────────────────────── */
  return (
    <>
      {/* Header oscuro */}
      <section className="relative bg-[#1C0D0C] pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
        <div className="mx-auto max-w-5xl">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-4">
            {isEs ? "Mi carrito" : "My cart"}
          </span>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            {isEs ? "Tours" : "Tours"}{" "}
            <span className="font-serif italic font-normal text-white/60">
              {isEs ? "seleccionados" : "selected"}
            </span>
          </h1>
          <p className="mt-3 text-white/40 text-sm">
            {items.length} {items.length === 1 ? (isEs ? "tour guardado" : "saved tour") : (isEs ? "tours guardados" : "saved tours")}
          </p>
        </div>
      </section>

      {/* Contenido */}
      <section className="bg-gray-50 py-12 lg:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">

          {/* Items */}
          <div ref={content.ref} className={`space-y-4 ${content.className}`}>
            {items.map((item) => {
              const name = isEs ? item.nameEs : item.nameEn;
              return (
                <div
                  key={item.id}
                  className="group flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-orange/20"
                >
                  {/* Imagen */}
                  <div className="relative w-full sm:w-52 h-36 sm:h-36 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 208px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-darkRed/5">
                        <MapPin className="h-8 w-8 text-brand-darkRed/20" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                        {name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 text-brand-orange" />
                          {item.destination}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-100 px-3 py-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3 text-brand-orange" />
                          {item.durationDays}d / {item.durationNights}n
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {item.tourType === "INFORMATIONAL" ? (
                        <span className="text-sm text-gray-400">{t("informational")}</span>
                      ) : item.priceUsd ? (
                        <p className="text-xl font-bold text-brand-darkRed">
                          ${item.priceUsd.toFixed(0)}{" "}
                          <span className="text-xs font-normal text-gray-400">/ {t("per_person")}</span>
                        </p>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 text-gray-300 hover:border-red-200 hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/tours/${item.slug}`}
                          className="inline-flex items-center gap-2 rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-5 pr-2 py-1.5 text-sm font-semibold transition-all group/btn"
                        >
                          {item.tourType === "INFORMATIONAL" ? t("view_details") : t("book_now")}
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 group-hover/btn:bg-white group-hover/btn:text-brand-darkRed transition-colors">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Acciones inferiores */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={clearCart}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {t("clear_all")}
            </button>
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white hover:border-brand-darkRed hover:text-brand-darkRed px-7 py-3 text-sm font-semibold text-gray-600 transition-all shadow-sm"
            >
              {t("continue_browsing")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}
