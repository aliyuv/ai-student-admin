// prisma.config.ts
import "dotenv/config";                    // 确保能读取 .env 文件
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },

  datasource: {
    // prisma generate 不需要真实连接，仅 migrate/seed 时使用
    // Vercel 构建阶段 postinstall 运行 generate 时 .env 不存在，用占位值兜底
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});