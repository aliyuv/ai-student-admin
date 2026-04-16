import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  const t0 = performance.now()
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  const t1 = performance.now()
  console.log(`[perf] PrismaClient created in ${(t1-t0).toFixed(0)}ms`)
  return client
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// 开发和生产都复用同一个 PrismaClient 实例，避免每次请求重建 SSL 连接
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
