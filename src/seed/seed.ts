import { prisma } from "../db/client";
import { seedDatabase } from "./seed-db";

seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
