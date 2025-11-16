// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Blog Category Posts Feature', () => {
  let testUser
  let techCategory
  let lifestyleCategory

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
        displayName: 'Test Author',
        role: 'admin',
        isActive: true
      }
    })

    // Create test category
    techCategory = await prisma.category.create({
      data: {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech posts'
      }
    })

    lifestyleCategory = await prisma.category.create({
      data: {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Life posts'
      }
    })
  })

  describe('GET /blog/category/:slug', () => {
    it('should display published post list for specific category', async () => {
      // Technology category post
      await prisma.post.create({
        data: {
          title: 'Tech Post 1',
          slug: 'tech-post-1',
          content: '# Tech 1',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: techCategory.id
        }
      })

      await prisma.post.create({
        data: {
          title: 'Tech Post 2',
          slug: 'tech-post-2',
          content: '# Tech 2',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: techCategory.id
        }
      })

      // Lifestyle category post (should not be displayed)
      await prisma.post.create({
        data: {
          title: 'Lifestyle Post',
          slug: 'lifestyle-post',
          content: '# Life',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: lifestyleCategory.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/category/technology'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Technology')
      expect(response.payload).toContain('Tech Post 1')
      expect(response.payload).toContain('Tech Post 2')
      expect(response.payload).not.toContain('Lifestyle Post')
    })

    it('should not display draft posts', async () => {
      // Public post
      await prisma.post.create({
        data: {
          title: 'Published Post',
          slug: 'published-post',
          content: '# Published',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: techCategory.id
        }
      })

      // Draft post
      await prisma.post.create({
        data: {
          title: 'Draft Post',
          slug: 'draft-post',
          content: '# Draft',
          published: false,
          authorId: testUser.id,
          categoryId: techCategory.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/category/technology'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Published Post')
      expect(response.payload).not.toContain('Draft Post')
    })

    it('should return 404 for non-existent category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/category/non-existent'
      })

      expect(response.statusCode).toBe(404)
    })

    it('should display empty status for category with no posts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/category/technology'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Technology')
      expect(response.payload).toContain('No posts yet')
    })

    it('should have link to detail page in post title', async () => {
      // Create post with category
      await prisma.post.create({
        data: {
          title: 'Test Post with Link',
          slug: 'test-post-link',
          content: '# Test',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: techCategory.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/category/technology'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Test Post with Link')
      // Should have link to post detail page
      expect(response.payload).toContain('/blog/test-post-link')
    })

    it('should have link to category page in category', async () => {
      // Create post with category
      await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          content: '# Test',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: techCategory.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/category/technology'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Technology')
      // Should have link to category page
      expect(response.payload).toContain('/blog/category/technology')
    })
  })
})
