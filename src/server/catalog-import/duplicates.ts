import type { Prisma, PrismaClient } from "@prisma/client";
import type { CatalogTourCandidate } from "./schemas";

function normalize(value: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.85;

  const leftTokens = new Set(left.split(" ").filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 2));
  if (leftTokens.size < 2 || rightTokens.size === 0) return 0;

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap / Math.min(leftTokens.size, rightTokens.size);
}

export interface DuplicateMatch {
  tourId: string;
  score: number;
  reasons: string[];
}

export async function findDuplicateMatches(
  db: PrismaClient | Prisma.TransactionClient,
  candidate: CatalogTourCandidate
): Promise<DuplicateMatch[]> {
  if (!candidate.nameEs && !candidate.nameEn) return [];

  const names = [normalize(candidate.nameEs), normalize(candidate.nameEn)].filter(Boolean);
  const tours = await db.tour.findMany({
    where: {
      isActive: true,
      OR: [
        ...(names.length > 0 ? [{ nameEs: { in: names, mode: "insensitive" as const } }] : []),
        ...(names.length > 0 ? [{ nameEn: { in: names, mode: "insensitive" as const } }] : []),
        ...(candidate.destination ? [{ destination: { contains: candidate.destination, mode: "insensitive" as const } }] : []),
      ],
    },
    select: { id: true, nameEs: true, nameEn: true, destination: true, durationDays: true },
    take: 50,
  });

  return tours.map((tour) => {
    const reasons: string[] = [];
    let score = 0;
    const tourNames = [normalize(tour.nameEs), normalize(tour.nameEn)];
    const similarity = Math.max(...names.flatMap((name) => tourNames.map((tourName) => nameSimilarity(name, tourName))));
    if (similarity === 1) {
      score += 0.8;
      reasons.push("El nombre coincide exactamente.");
    } else if (similarity >= 0.75) {
      score += 0.7;
      reasons.push("El nombre coincide aunque contiene una descripción ampliada.");
    }
    if (candidate.destination && normalize(tour.destination) === normalize(candidate.destination)) {
      score += 0.15;
      reasons.push("El destino coincide.");
    }
    if (candidate.durationDays !== null && tour.durationDays === candidate.durationDays) {
      score += 0.05;
      reasons.push("La duración coincide.");
    }
    return { tourId: tour.id, score: Math.min(score, 1), reasons };
  }).filter((match) => match.score >= 0.8).sort((a, b) => b.score - a.score);
}
