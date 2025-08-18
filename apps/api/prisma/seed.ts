import { prisma } from "../src/db";
import { hashPassword } from "../src/auth";

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
  
  // Create sample users with different roles (for development)
  const siteAdminPassword = await hashPassword("admin123");
  const clubAdminPassword = await hashPassword("clubadmin123");
  const playerPassword = await hashPassword("player123");
  
  const siteAdmin = await prisma.user.upsert({
    where: { email: "admin@gamemaster.test" },
    update: {},
    create: {
      email: "admin@gamemaster.test",
      name: "Site Admin",
      passwordHash: siteAdminPassword,
      role: "SITE_ADMIN"
    }
  });
  
  const clubAdmin = await prisma.user.upsert({
    where: { email: "clubadmin@cavan.test" },
    update: {},
    create: {
      email: "clubadmin@cavan.test",
      name: "Club Admin",
      passwordHash: clubAdminPassword,
      role: "CLUB_ADMIN"
    }
  });
  
  const player = await prisma.user.upsert({
    where: { email: "player@gamemaster.test" },
    update: {},
    create: {
      email: "player@gamemaster.test",
      name: "Test Player",
      passwordHash: playerPassword,
      role: "PLAYER"
    }
  });
  
  // Add club admin to Cavan GAA
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: cavan.id, userId: clubAdmin.id } },
    update: {},
    create: { clubId: cavan.id, userId: clubAdmin.id, role: "CLUB_ADMIN" }
  });
  
  console.log("Seeded users:", { 
    siteAdmin: siteAdmin.email, 
    clubAdmin: clubAdmin.email, 
    player: player.email 
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});