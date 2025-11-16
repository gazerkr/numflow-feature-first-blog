import { PrismaClient } from '../generated/prisma/index.js'
import { execSync } from 'child_process'

// Set test database path
process.env.DATABASE_URL = 'file:./prisma/test.db'

console.log('Creating test database schema...')

try {
  // Execute Prisma db push
  execSync('DATABASE_URL="file:./prisma/test.db" npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' }
  })

  console.log('✅ Test database schema created successfully!')

  // Verify foreign keys activation
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./prisma/test.db'
      }
    }
  })

  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
  const result = await prisma.$queryRawUnsafe('PRAGMA foreign_keys')
  console.log('Foreign keys status:', result)

  await prisma.$disconnect()

} catch (error) {
  console.error('Failed to create test database:', error)
  process.exit(1)
}
