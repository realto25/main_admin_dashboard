import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a single Prisma client instance
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL!,
      },
    },
  });

// Assign client to global in development to persist across hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Optional: log successful connection and handle errors
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to the database.");
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  }
})();

export { prisma };
