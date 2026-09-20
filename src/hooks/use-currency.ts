"use client";

import { useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import { trpc } from "@/lib/trpc";
import { useCurrencyStore, useCurrencyHydration } from "@/lib/currency-store";
import {
  BASE_CURRENCY,
  convertFromUSD,
  formatCurrency,
  formatFromUSD,
  isCurrencyCode,
  type CurrencyCode,
  type ExchangeRates,
} from "@/lib/currency";

/**
 * Único punto de entrada de precios para la interfaz pública.
 *
 * Todo componente que muestre dinero debe usar este hook: recibe importes en
 * USD (la moneda base del sistema) y devuelve el texto ya convertido y
 * formateado en la moneda que el pasajero eligió.
 *
 * Lo que este hook NO hace, a propósito: producir importes para cobrar. El
 * importe que viaja a una pasarela lo calcula el servidor en USD.
 */
export function useCurrency() {
  const locale = useLocale();
  const hydrated = useCurrencyHydration();
  const stored = useCurrencyStore((s) => s.currency);
  const userChosen = useCurrencyStore((s) => s.userChosen);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const suggestCurrency = useCurrencyStore((s) => s.suggestCurrency);

  // Antes de hidratar se muestra USD, que es lo que renderizó el servidor.
  const currency: CurrencyCode = hydrated ? stored : BASE_CURRENCY;

  const { data } = trpc.public.exchangeRates.useQuery(undefined, {
    staleTime: 4 * 60 * 60 * 1000, // 4 h, igual que la caché del servidor
    refetchOnWindowFocus: false,
  });
  const rates = data?.rates as ExchangeRates | undefined;

  // Sugerencia por país: sólo la primera vez y sólo si no eligió nada.
  useEffect(() => {
    if (!hydrated || userChosen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/geo");
        if (!res.ok) return;
        const geo = await res.json();
        if (!cancelled && isCurrencyCode(geo?.currency)) suggestCurrency(geo.currency);
      } catch {
        // Sin geolocalización nos quedamos en USD. No es un error visible.
      }
    })();
    return () => { cancelled = true; };
  }, [hydrated, userChosen, suggestCurrency]);

  /** Importe USD → número en la moneda activa (para cálculos de layout). */
  const convert = useCallback(
    (amountUsd: number) => convertFromUSD(amountUsd, currency, rates),
    [currency, rates]
  );

  /** Importe USD → texto listo para pintar ("S/ 350.00"). */
  const display = useCallback(
    (amountUsd: number, options?: { compact?: boolean; withCode?: boolean }) =>
      formatFromUSD(amountUsd, currency, rates, { locale, ...options }),
    [currency, rates, locale]
  );

  /** Formatea un importe que YA está en esa moneda (no convierte). */
  const format = useCallback(
    (amount: number, code: CurrencyCode = currency, options?: { compact?: boolean; withCode?: boolean }) =>
      formatCurrency(amount, code, { locale, ...options }),
    [currency, locale]
  );

  return {
    currency,
    setCurrency,
    /** true cuando el store ya leyó la preferencia guardada. */
    ready: hydrated,
    /** true si se está mostrando una moneda distinta de la de cobro (USD). */
    isConverted: currency !== BASE_CURRENCY,
    rates,
    rate: rates?.[currency] ?? (currency === BASE_CURRENCY ? 1 : undefined),
    convert,
    display,
    format,
  };
}
