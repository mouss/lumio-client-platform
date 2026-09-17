import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Configuration de la CLI Prisma (Prisma 7).
// L'URL de la base ne vit plus dans schema.prisma : la CLI la lit ici.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
