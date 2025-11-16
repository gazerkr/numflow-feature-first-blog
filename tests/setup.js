// Load environment variables first (before other imports!)
import { config } from 'dotenv'
config({ path: '.env.test', override: true })  // override: true to overwrite .env values

import { beforeAll, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '../generated/prisma/index.js'

// Delete globalThis cache (prevent instance sharing with dev server)
delete globalThis.prisma

// Create test-only prisma instance (uses test.db)
export const prisma = new PrismaClient({
  log: ['error']
})

// Before all tests
beforeAll(async () => {
  // Enable foreign keys
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
})

// Clean up data after each test
afterEach(async () => {
  // Delete child tables first due to foreign key constraints
  const tables = ['post_tags', 'posts', 'tags', 'categories', 'users', 'settings']

  // Temporarily disable foreign keys
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF')

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ${table}`)
    } catch (error) {
      // Ignore if table doesn't exist
    }
  }

  // Re-enable foreign keys
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
})

// After all tests complete
afterAll(async () => {
  await prisma.$disconnect()
})
