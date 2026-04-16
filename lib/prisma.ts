// import { PrismaClient } from "@prisma/client"
// import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
// import path from "path"

// function createPrismaClient() {
//   const dbPath = path.resolve(process.cwd(), "prisma/dev.db")
//   const adapter = new PrismaBetterSqlite3({ url: "file:" + dbPath })
//   return new PrismaClient({ adapter })
// }

// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
// export const prisma = globalForPrisma.prisma ?? createPrismaClient()
// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';   // 注意是 PrismaLibSql（S 小写）

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
