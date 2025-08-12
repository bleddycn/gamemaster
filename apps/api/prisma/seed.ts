import { prisma } from "../src/db";

async function main() {
  // Upsert two clubs
  const cavan = await prisma.club.upsert({
    where: { slug: "cavan-gaa" },
    update: {},
    create: { name: "Cavan GAA", slug: "cavan-gaa" }
  });

  const monaghan = await prisma.club.upsert({
    where: { slug: "monaghan-gaa" },
    update: {},
    create: { name: "Monaghan GAA", slug: "monaghan-gaa" }
  });

  console.log("Seeded clubs:", { cavan: cavan.id, monaghan: monaghan.id });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});