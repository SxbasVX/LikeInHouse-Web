"use client";

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
  imageUrl: string | null;
  priceUsd: number | null;
  tourType: string;
  addedAt: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "addedAt">) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
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
    }),
    {
      name: "lih-cart",
    }
  )
);
