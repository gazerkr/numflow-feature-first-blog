// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Blog Main Page Feature', () => {
  let testUser
  let testCategory
  let testTag

  beforeEach(async () => {
    // Initialize data
    await prisma.postTag.deleteMany()
    await prisma.post.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()

    // Mark as installed
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

    // Create test tag
    testTag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
        slug: 'javascript'
      }
    })
  })

  describe('GET /blog', () => {
    it('should display list of published posts', async () => {
      // Create published posts
      await prisma.post.create({
        data: {
          title: 'Published Post 1',
          slug: 'published-post-1',
          content: '# Content 1',
          published: true,
          publishedAt: new Date('2024-01-15'),
          authorId: testUser.id,
          categoryId: testCategory.id
        }
      })

      await prisma.post.create({
        data: {
          title: 'Published Post 2',
          slug: 'published-post-2',
          content: '# Content 2',
          published: true,
          publishedAt: new Date('2024-01-20'),
          authorId: testUser.id
        }
      })

      // Draft post (should not be displayed)
      await prisma.post.create({
        data: {
          title: 'Draft Post',
          slug: 'draft-post',
          content: '# Draft',
          published: false,
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Published Post 1')
      expect(response.payload).toContain('Published Post 2')
      expect(response.payload).not.toContain('Draft Post')
    })

    it('should display latest posts first', async () => {
      await prisma.post.create({
        data: {
          title: 'Old Post',
          slug: 'old-post',
          content: '# Old',
          published: true,
          publishedAt: new Date('2024-01-01'),
          authorId: testUser.id
        }
      })

      await prisma.post.create({
        data: {
          title: 'New Post',
          slug: 'new-post',
          content: '# New',
          published: true,
          publishedAt: new Date('2024-01-20'),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)

      // New Post should appear before Old Post
      const newPostIndex = response.payload.indexOf('New Post')
      const oldPostIndex = response.payload.indexOf('Old Post')
      expect(newPostIndex).toBeLessThan(oldPostIndex)
    })

    it('should display category information', async () => {
      await prisma.post.create({
        data: {
          title: 'Tech Post',
          slug: 'tech-post',
          content: '# Tech',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: testCategory.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Tech Post')
      expect(response.payload).toContain('Tech')
    })

    it('should display empty state when no posts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('No posts yet')
    })
  })
})
