const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@whyprompt.com" },
    update: {},
    create: {
      email: "admin@whyprompt.com",
      password: hashedPassword,
      name: "Admin",
      role: "admin",
    },
  });

  const partners = [
    { id: "ahmed-khan", name: "Ahmed Khan", sharePercentage: 33.33 },
    { id: "sara-ali", name: "Sara Ali", sharePercentage: 33.33 },
    { id: "usman-raza", name: "Usman Raza", sharePercentage: 33.34 },
  ];

  for (const p of partners) {
    await prisma.partner.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  console.log("✅ Seed data created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
