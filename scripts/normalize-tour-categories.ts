import { PrismaClient } from "@prisma/client";
import { CATEGORY_SEPARATOR, DEFAULT_TOUR_CATEGORIES, mapLegacyCategory } from "../src/lib/tour-categories";

// Convierte las categorías escritas a mano de los tours a la lista oficial.
// Uso:  npx tsx scripts/normalize-tour-categories.ts          (solo muestra los cambios)
//       npx tsx scripts/normalize-tour-categories.ts --apply  (los guarda)

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const setting = await prisma.setting.findUnique({ where: { key: "tourCategories" } });
  const official = Array.isArray(setting?.value)
    ? setting.value.filter((v): v is string => typeof v === "string")
    : DEFAULT_TOUR_CATEGORIES;
  console.log(`Lista oficial: ${official.join(", ")}\n`);

  const tours = await prisma.tour.findMany({ select: { id: true, nameEs: true, category: true } });
  const changes: { id: string; from: string; to: string }[] = [];
  const problems: { name: string; category: string; unknown: string[] }[] = [];

  for (const tour of tours) {
    const { categories, unknown } = mapLegacyCategory(tour.category, official);
    if (unknown.length > 0 || categories.length === 0) {
      problems.push({ name: tour.nameEs, category: tour.category, unknown });
      continue;
    }
    const to = categories.join(CATEGORY_SEPARATOR);
    if (to !== tour.category) changes.push({ id: tour.id, from: tour.category, to });
  }

  const grouped = new Map<string, number>();
  for (const c of changes) grouped.set(`${JSON.stringify(c.from)} → ${c.to}`, (grouped.get(`${JSON.stringify(c.from)} → ${c.to}`) ?? 0) + 1);
  for (const [line, count] of grouped) console.log(`  ${count}× ${line}`);
  console.log(`\n${changes.length} tours a actualizar, ${tours.length - changes.length - problems.length} ya correctos.`);

  if (problems.length > 0) {
    console.log(`\n${problems.length} tours sin convertir (revisar a mano):`);
    for (const p of problems) console.log(`  - ${p.name}: ${JSON.stringify(p.category)} (no reconocido: ${p.unknown.join(", ") || "vacío"})`);
  }

  if (!apply) {
    console.log("\nModo prueba: no se guardó nada. Ejecuta con --apply para aplicar.");
    return;
  }

  await prisma.$transaction(changes.map((c) => prisma.tour.update({ where: { id: c.id }, data: { category: c.to } })));
  await prisma.setting.upsert({
    where: { key: "tourCategories" },
    create: { key: "tourCategories", value: official },
    update: {},
  });
  console.log(`\nListo: ${changes.length} tours actualizados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
