import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance in development to avoid exhausting
// connections during HMR. Production deployments use a single fresh client.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
