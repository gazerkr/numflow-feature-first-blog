import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/index.js'
import bcrypt from 'bcryptjs'
import { renderMarkdown } from '../lib/markdown.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed data insertion...')

  // Delete then insert User data (related data must be deleted first)
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
  console.log('✨ Existing User and Post data deleted')

  // Create test administrator account
  const hashedPassword = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      displayName: 'Administrator',
      role: 'admin',
      isActive: true,
    },
  })
  console.log(`✅ Administrator account created (username: admin, password: admin1234)`)

  // Create Category
  await prisma.category.deleteMany()
  const techCategory = await prisma.category.create({
    data: {
      name: 'Technology',
      slug: 'tech',
      description: 'Technology related posts',
    },
  })
  console.log('✅ Category created')

  // Delete then insert Feature data
  await prisma.feature.deleteMany()
  console.log('✨ Existing Feature data deleted')

  const features = await prisma.feature.createMany({
    data: [
      {
        title: '100% API Compatible with Express 5.x',
        description: 'Can use all Express 5.x APIs and middleware as-is.',
        icon: '🔌',
        order: 1,
      },
      {
        title: 'Approximately 3x Faster Performance than Express',
        description: 'Provides 211% improved performance on average with Radix Tree-based routing.',
        icon: '⚡',
        order: 2,
      },
      {
        title: 'Feature-First Architecture',
        description: 'Automatically executes complex business logic through folder structure alone.',
        icon: '📁',
        order: 3,
      },
      {
        title: 'Auto-generate APIs with Folder Structure Alone',
        description: 'APIs are auto-generated with just folder structure and filenames, no config files needed.',
        icon: '🎯',
        order: 4,
      },
    ],
  })
  console.log(`✅ ${features.count} Features created`)

  // Delete then insert TechStack data
  await prisma.techStack.deleteMany()
  console.log('✨ Existing TechStack data deleted')

  const techStacks = await prisma.techStack.createMany({
    data: [
      {
        name: 'Numflow',
        category: 'framework',
        version: '0.2.1',
        description: 'Express-compatible high-performance web framework',
        order: 1,
      },
      {
        name: 'EJS',
        category: 'template',
        version: '3.1.10',
        description: 'Simple and efficient template engine',
        order: 2,
      },
      {
        name: 'Prisma',
        category: 'database',
        version: '6.19.0',
        description: 'Next-generation Node.js ORM',
        order: 3,
      },
      {
        name: 'SQLite',
        category: 'database',
        version: '3.x',
        description: 'Lightweight relational database',
        order: 4,
      },
    ],
  })
  console.log(`✅ ${techStacks.count} TechStacks created`)

  // Create Post data (including authorId)
  const post1Content = `
# Numflow and Feature-First Architecture

Numflow is an innovative Node.js web framework that is 100% compatible with Express 5.x while providing 3x faster performance.

## Core of Feature-First

An architecture that automatically executes complex business logic through folder structure alone.

\`\`\`
features/
  about/
    @get/
      steps/
        100-prepare-data.js
        200-render.js
\`\`\`

## Key Advantages

1. **Zero Configuration** - No config files needed
2. **Clear Execution Order** - Order determined by filename numbers
3. **Flexible Management** - Adjust logic by adding/removing files
      `

  const post1 = await prisma.post.create({
    data: {
      title: 'Numflow and Feature-First Architecture',
      slug: 'numflow-feature-first',
      content: post1Content,
      contentHtml: renderMarkdown(post1Content),
      excerpt: 'Introducing Numflow Feature-First Architecture.',
      published: true,
      authorId: admin.id,
      categoryId: techCategory.id,
      publishedAt: new Date(),
    },
  })

  const post2Content = `
# Managing Data with Prisma and SQLite

This blog manages data using Prisma ORM and SQLite.

## Advantages of Prisma

- Type-safe queries
- Automatic migrations
- Intuitive schema definition

## Using UUID

All IDs use UUID for security and scalability.
      `

  const post2 = await prisma.post.create({
    data: {
      title: 'Managing Data with Prisma and SQLite',
      slug: 'prisma-sqlite-setup',
      content: post2Content,
      contentHtml: renderMarkdown(post2Content),
      excerpt: 'Data management methods using Prisma ORM and SQLite',
      published: true,
      authorId: admin.id,
      categoryId: techCategory.id,
      publishedAt: new Date(),
    },
  })

  console.log(`✅ 2 Posts created`)

  console.log('🎉 Seed data insertion complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed data insertion failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
