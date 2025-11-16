import { PrismaClient } from '../generated/prisma/index.js'

/**
 * Prisma Client Singleton
 * Prevents multiple instances during hot reload in development
 * In test environment, cache is not used (ensures test.db usage)
 */
const globalForPrisma = globalThis

// In test environment, always create new instance (no globalThis cache)
export const prisma = process.env.NODE_ENV === 'test'
  ? new PrismaClient({ log: ['error'] })
  : (globalForPrisma.prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }))

// Cache in globalThis only when not in production or test
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  globalForPrisma.prisma = prisma
}

// SQLite Foreign Keys are manually enabled in setup.js or at app start
// (top-level await removed: prevents execution before env vars load in test environment)
