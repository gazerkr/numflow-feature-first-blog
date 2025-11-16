import { describe, it, expect } from 'vitest'
import { prisma } from '../../lib/prisma.js'

describe('lib/prisma.js', () => {
  it('should properly export Prisma Client singleton', () => {
    expect(prisma).toBeDefined()
    expect(prisma.user).toBeDefined()
    expect(prisma.post).toBeDefined()
    expect(prisma.category).toBeDefined()
    expect(prisma.tag).toBeDefined()
  })

  it('should have Foreign Keys enabled', async () => {
    const result = await prisma.$queryRaw`PRAGMA foreign_keys`
    expect(result).toBeDefined()
    // SQLite returns integers as BigInt
    expect(result[0].foreign_keys).toBe(1n)
  })

  it('should have working database connection', async () => {
    // SQLite returns integers as BigInt
    await expect(prisma.$queryRaw`SELECT 1 as value`).resolves.toEqual([{ value: 1n }])
  })
})
