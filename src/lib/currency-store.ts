"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BASE_CURRENCY, isCurrencyCode, type CurrencyCode } from "./currency";

/**
 * Moneda de VISUALIZACIÓN elegida por el pasajero.
 *
 * No tiene nada que ver con la moneda de cobro (siempre USD). Se persiste en
 * localStorage y, además, en una cookie para que el servidor pueda leerla en
 * futuros renders sin esperar a la hidratación.
 */

const COOKIE_NAME = "lih-currency";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

function writeCookie(currency: CurrencyCode) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${COOKIE_NAME}=${currency}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // Cookies bloqueadas: localStorage sigue funcionando, no es crítico.
  }
}

interface CurrencyState {
  currency: CurrencyCode;
  /** true si la eligió el usuario a mano; una sugerencia por país no cuenta. */
  userChosen: boolean;
  setCurrency: (currency: CurrencyCode) => void;
  /** Sugerencia por país: sólo se aplica si el usuario no ha elegido nunca. */
  suggestCurrency: (currency: CurrencyCode) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: BASE_CURRENCY,
      userChosen: false,

      setCurrency: (currency) => {
        if (!isCurrencyCode(currency)) return;
        writeCookie(currency);
        set({ currency, userChosen: true });
      },

      suggestCurrency: (currency) => {
        // La elección manual SIEMPRE tiene prioridad sobre la geolocalización.
        if (get().userChosen) return;
        if (!isCurrencyCode(currency)) return;
        writeCookie(currency);
        set({ currency });
      },
    }),
    {
      name: "lih-currency",
      skipHydration: true,
    }
  )
);

/**
 * Hidratación segura del store (mismo patrón que el carrito).
 *
 * Hasta que devuelve true, los componentes deben mostrar USD: es el valor con
 * el que renderiza el servidor, así que evita desajustes de hidratación.
 */
export function useCurrencyHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useCurrencyStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
}
