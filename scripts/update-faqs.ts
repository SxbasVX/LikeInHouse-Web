import { PrismaClient } from "@prisma/client";
import { LIKE_IN_HOUSE_FAQS } from "../prisma/faqs-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Actualizando FAQs...");

  await prisma.fAQ.deleteMany();
  console.log("  FAQs anteriores eliminadas");

  await prisma.fAQ.createMany({
    data: LIKE_IN_HOUSE_FAQS,
  });

  console.log(`  ${LIKE_IN_HOUSE_FAQS.length} FAQs creadas`);
  console.log("Listo.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Error:", e);
    prisma.$disconnect();
    process.exit(1);
  });
