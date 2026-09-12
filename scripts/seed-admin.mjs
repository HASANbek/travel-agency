import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const email = "admin@travel-agency.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists:", email);
    return;
  }
  const password = "admin123";
  await prisma.user.create({
    data: {
      name: "Administrator",
      email,
      passwordHash: hashPassword(password),
      role: "admin",
      isActive: true,
    },
  });
  console.log("Created admin user:");
  console.log("  email:", email);
  console.log("  password:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
