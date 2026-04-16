// prisma.config.ts
import "dotenv/config";                    // 确保能读取 .env 文件
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",             // 如果你有 migrations 文件夹
  },

  datasource: {
    url: "file:./dev.db",               // CLI 用本地文件，运行时通过 adapter 连 Turso
  },
});