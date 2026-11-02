import { TRPCError } from "@trpc/server";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const TOUR_DESTINATIONS_KEY = "tourDestinations";

const sortEs = (values: string[]) => [...values].sort((a, b) => a.localeCompare(b, "es"));

// Lista oficial de ciudades. Mientras no se haya guardado, se parte de los destinos ya usados por tours activos.
export async function getTourDestinations(db: Db): Promise<string[]> {
  const setting = await db.setting.findUnique({ where: { key: TOUR_DESTINATIONS_KEY } });
  if (Array.isArray(setting?.value)) {
    return setting.value.filter((v): v is string => typeof v === "string");
  }
  const tours = await db.tour.findMany({
    where: { isActive: true },
    select: { destination: true },
    distinct: ["destination"],
  });
  return sortEs(tours.map((t) => t.destination).filter((d) => d.trim() !== ""));
}

export function normalizeDestinationList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = raw.trim().replace(/\s+/g, " ");
    const key = value.toLocaleLowerCase("es");
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return sortEs(result);
}

export async function assertValidDestination(db: Db, destination: string) {
  const destinations = await getTourDestinations(db);
  if (!destinations.includes(destination)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `"${destination}" no está en la lista de ciudades. Elige una ciudad de la lista o agrégala desde Tours > Ciudades.`,
    });
  }
}
