import { PrismaClient } from '@/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizeDatabaseUrl } from './db-url';

// Singleton pattern recommended by Prisma in dev (avoids
// multiple connections on Next.js hot-reload).
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
//
// Prisma 7 removed the bundled Rust query engine: the client now talks to
// PostgreSQL through a JavaScript driver adapter, so we hand it a pg-backed
// PrismaPg adapter built from DATABASE_URL.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL) });
  return new PrismaClient({
    adapter,
    // Query logging off even in dev: it spams the terminal on Neon latency
    // and never caught a bug that tests missed. Errors still surface.
    log: ['error', 'warn'],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
