// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Blog Search Feature', () => {
  let testUser
  let testCategory

  beforeEach(async () => {
    // Initialize data
    await prisma.postTag.deleteMany()
    await prisma.post.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()

    // Mark installation as complete
    await prisma.setting.create({
      data: {
        key: 'installed',
        value: 'true'
      }
    })

    // Create test user
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: await hashPassword('Test1234'),
        displayName: 'Test User',
        role: 'admin',
        isActive: true
      }
    })

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Tech',
        slug: 'tech',
        description: 'Technology posts'
      }
    })

    // Create test posts
    await prisma.post.createMany({
      data: [
        {
          title: 'JavaScript Guide',
          slug: 'javascript-guide',
          content: 'This is a comprehensive guide about JavaScript programming.',
          contentHtml: '<p>This is a comprehensive guide about JavaScript programming.</p>',
          published: true,
          publishedAt: new Date('2025-01-01'),
          authorId: testUser.id,
          categoryId: testCategory.id,
          viewCount: 10
        },
        {
          title: 'Python Tutorial',
          slug: 'python-tutorial',
          content: 'Learn Python programming from scratch.',
          contentHtml: '<p>Learn Python programming from scratch.</p>',
          published: true,
          publishedAt: new Date('2025-01-02'),
          authorId: testUser.id,
          categoryId: testCategory.id,
          viewCount: 5
        },
        {
          title: 'React Basics',
          slug: 'react-basics',
          content: 'Introduction to React JavaScript library.',
          contentHtml: '<p>Introduction to React JavaScript library.</p>',
          published: true,
          publishedAt: new Date('2025-01-03'),
          authorId: testUser.id,
          categoryId: testCategory.id,
          viewCount: 20
        },
        {
          title: 'Draft Post',
          slug: 'draft-post',
          content: 'This post contains JavaScript but is not published.',
          contentHtml: '<p>This post contains JavaScript but is not published.</p>',
          published: false,
          publishedAt: null,
          authorId: testUser.id,
          categoryId: testCategory.id,
          viewCount: 0
        }
      ]
    })
  })

  describe('GET /blog/search', () => {
    it('Should find posts with search term in title', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/search?q=JavaScript'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('JavaScript Guide')
      expect(response.payload).toContain('React Basics')
      expect(response.payload).not.toContain('Python Tutorial')
    })

    it('Should find posts with search term in content', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/search?q=programming'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('JavaScript Guide')
      expect(response.payload).toContain('Python Tutorial')
      expect(response.payload).not.toContain('React Basics')
    })

    it('Should only include published posts in search results', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/search?q=JavaScript'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('JavaScript Guide')
      expect(response.payload).toContain('React Basics')
      expect(response.payload).not.toContain('Draft Post')
    })

    it('Should return all published posts when no search term provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/search'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('JavaScript Guide')
      expect(response.payload).toContain('Python Tutorial')
      expect(response.payload).toContain('React Basics')
      expect(response.payload).not.toContain('Draft Post')
    })

    it('Should search case-insensitively', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/search?q=javascript'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('JavaScript Guide')
      expect(response.payload).toContain('React Basics')
    })

    it('Should display empty results when no matches found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/search?q=NonExistentKeyword'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('No results found')
    })

    it('Should apply pagination to search results', async () => {
      // Create 15 posts (10 per page)
      const posts = []
      for (let i = 1; i <= 15; i++) {
        posts.push({
          title: `Test Post ${i}`,
          slug: `test-post-${i}`,
          content: 'Test content',
          contentHtml: '<p>Test content</p>',
          published: true,
          publishedAt: new Date(`2025-01-${String(i).padStart(2, '0')}`),
          authorId: testUser.id,
          categoryId: testCategory.id,
          viewCount: 0
        })
      }
      await prisma.post.createMany({ data: posts })

      // Check first page
      const response1 = await app.inject({
        method: 'GET',
        url: '/blog/search?q=Test&page=1'
      })

      expect(response1.statusCode).toBe(200)
      expect(response1.payload).toContain('Test Post 15')
      expect(response1.payload).not.toContain('Test Post 5')

      // Check second page
      const response2 = await app.inject({
        method: 'GET',
        url: '/blog/search?q=Test&page=2'
      })

      expect(response2.statusCode).toBe(200)
      expect(response2.payload).toContain('Test Post 5')
      expect(response2.payload).not.toContain('Test Post 15')
    })
  })
})
