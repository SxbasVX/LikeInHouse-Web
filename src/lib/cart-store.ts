"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  durationHours: number | null;
  imageUrl: string | null;
  priceUsd: number | null;
  originalPriceUsd: number | null;
  discountPercent: number;
  promoLabel: string | null;
  tourType: string;
  addedAt: number;
  travelDate?: string; // ISO date string "YYYY-MM-DD"
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "addedAt">) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  updateItemDate: (id: string, date: string | undefined) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) return; // already in cart
        set((state) => ({
          items: [...state.items, { ...item, addedAt: Date.now() }],
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      clearCart: () => set({ items: [] }),

      isInCart: (id) => get().items.some((i) => i.id === id),

      updateItemDate: (id, date) => {
        set((state) => ({
          items: state.items.map((i) => i.id === id ? { ...i, travelDate: date } : i),
        }));
      },
    }),
    {
      name: "lih-cart",
      skipHydration: true,
    }
  )
);

/**
 * Hook that handles safe hydration of the cart store.
 * Returns true once the store is hydrated from localStorage (client-side only).
 * Use this in components that read from the cart to avoid SSR/CSR mismatch.
 */
export function useCartHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
}
