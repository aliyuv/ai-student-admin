// prisma.config.ts
import "dotenv/config";                    // 确保能读取 .env 文件
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});