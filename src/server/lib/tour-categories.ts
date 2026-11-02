import { TRPCError } from "@trpc/server";
import type { Prisma, PrismaClient } from "@prisma/client";
import { DEFAULT_TOUR_CATEGORIES, MAX_CATEGORIES_PER_TOUR, splitCategories } from "@/lib/tour-categories";

type Db = PrismaClient | Prisma.TransactionClient;

export const TOUR_CATEGORIES_KEY = "tourCategories";

// Lista oficial de categorías. Mientras no se haya guardado, se usa la lista por defecto.
export async function getTourCategories(db: Db): Promise<string[]> {
  const setting = await db.setting.findUnique({ where: { key: TOUR_CATEGORIES_KEY } });
  if (Array.isArray(setting?.value)) {
    return setting.value.filter((v): v is string => typeof v === "string");
  }
  return DEFAULT_TOUR_CATEGORIES;
}

export async function assertValidCategories(db: Db, value: string) {
  const selected = splitCategories(value);
  if (selected.length === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Elige al menos una categoría." });
  }
  if (selected.length > MAX_CATEGORIES_PER_TOUR) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Elige como máximo ${MAX_CATEGORIES_PER_TOUR} categorías.` });
  }
  const official = await getTourCategories(db);
  const invalid = selected.filter((c) => !official.includes(c));
  if (invalid.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${invalid.map((c) => `"${c}"`).join(", ")} no está en la lista de categorías. Elige de la lista o agrégala desde Tours > Categorías.`,
    });
  }
}
