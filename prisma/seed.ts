import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
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

  // Create 3 partners
  const partners = [
    { name: "Ahmed Khan", sharePercentage: 33.33 },
    { name: "Sara Ali", sharePercentage: 33.33 },
    { name: "Usman Raza", sharePercentage: 33.34 },
  ];

  for (const p of partners) {
    await prisma.partner.upsert({
      where: { id: p.name.replace(" ", "-").toLowerCase() },
      update: {},
      create: {
        id: p.name.replace(" ", "-").toLowerCase(),
        name: p.name,
        sharePercentage: p.sharePercentage,
      },
    });
  }

  // Sample employees
  const employees = [
    { name: "Bilal Mahmood", salary: 45000 },
    { name: "Fatima Zaidi", salary: 55000 },
    { name: "Hassan Sheikh", salary: 40000 },
  ];

  for (const e of employees) {
    await prisma.employee.create({
      data: { name: e.name, salary: e.salary },
    });
  }

  // Sample clients
  const clients = [
    { name: "TechCorp Pakistan", contactInfo: "techcorp@example.com" },
    { name: "Green Foods Ltd", contactInfo: "greenfoodsltd@example.com" },
    { name: "Metro Retail", contactInfo: "metroretail@example.com" },
  ];

  for (const c of clients) {
    await prisma.client.create({ data: c });
  }

  console.log("✅ Seed data created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
