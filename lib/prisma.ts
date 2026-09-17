import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/*
  Client Prisma partage.
  Prisma 7 passe par un driver adapter : le client ne se connecte plus tout seul,
  il recoit un adaptateur SQLite construit avec l'URL de .env.
  En developpement, Next recharge les modules a chaque modification : sans le cache global,
  chaque rechargement ouvrirait une nouvelle connexion a la base.
*/

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
