// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Blog Pagination Feature', () => {
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

    // Create test tag
    testTag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
        slug: 'javascript'
      }
    })
  })

  describe('GET /blog?page=N (Blog Main Pagination)', () => {
    it('should display maximum 10 posts on first page', async () => {
      // Create 15 published posts
      for (let i = 1; i <= 15; i++) {
        await prisma.post.create({
          data: {
            title: `Post ${i}`,
            slug: `post-${i}`,
            content: `Content ${i}`,
            published: true,
            publishedAt: new Date(Date.now() - i * 1000), // Time difference for sorting by newest
            authorId: testUser.id
          }
        })
      }

      const response = await app.inject({
        method: 'GET',
        url: '/blog?page=1'
      })

      expect(response.statusCode).toBe(200)
      // First page shows latest 10 posts (Post 1 ~ Post 10)
      expect(response.payload).toMatch(/<h2[^>]*>Post 1<\/h2>/)
      expect(response.payload).toMatch(/<h2[^>]*>Post 10<\/h2>/)
      expect(response.payload).not.toMatch(/<h2[^>]*>Post 11<\/h2>/)
      expect(response.payload).not.toMatch(/<h2[^>]*>Post 15<\/h2>/)
    })

    it('should display remaining posts on second page', async () => {
      // Create 15 published posts
      for (let i = 1; i <= 15; i++) {
        await prisma.post.create({
          data: {
            title: `Post ${i}`,
            slug: `post-${i}`,
            content: `Content ${i}`,
            published: true,
            publishedAt: new Date(Date.now() - i * 1000),
            authorId: testUser.id
          }
        })
      }

      const response = await app.inject({
        method: 'GET',
        url: '/blog?page=2'
      })

      expect(response.statusCode).toBe(200)
      // Second page shows Post 11 ~ Post 15
      expect(response.payload).toMatch(/<h2[^>]*>Post 11<\/h2>/)
      expect(response.payload).toMatch(/<h2[^>]*>Post 15<\/h2>/)
      expect(response.payload).not.toMatch(/<h2[^>]*>Post 1<\/h2>/)
      expect(response.payload).not.toMatch(/<h2[^>]*>Post 10<\/h2>/)
    })

    it('should display pagination navigation', async () => {
      // Create 25 published posts (3 pages)
      for (let i = 1; i <= 25; i++) {
        await prisma.post.create({
          data: {
            title: `Post ${i}`,
            slug: `post-${i}`,
            content: `Content ${i}`,
            published: true,
            publishedAt: new Date(Date.now() - i * 1000),
            authorId: testUser.id
          }
        })
      }

      const response = await app.inject({
        method: 'GET',
        url: '/blog?page=2'
      })

      expect(response.statusCode).toBe(200)
      // Check pagination links
      expect(response.payload).toContain('page=1') // Page 1 link
      expect(response.payload).toContain('class="current">2<') // Current page (page 2)
      expect(response.payload).toContain('page=3') // Page 3 link
    })

    it('should display first page if page parameter not available', async () => {
      // Create 5 published posts
      for (let i = 1; i <= 5; i++) {
        await prisma.post.create({
          data: {
            title: `Post ${i}`,
            slug: `post-${i}`,
            content: `Content ${i}`,
            published: true,
            publishedAt: new Date(Date.now() - i * 1000),
            authorId: testUser.id
          }
        })
      }

      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Post 1')
      expect(response.payload).toContain('Post 5')
    })
  })

  describe('GET /blog/category/:slug?page=N (Category Pagination)', () => {
    it('should support pagination for category page', async () => {
      // Create 15 public posts (all same category)
      for (let i = 1; i <= 15; i++) {
        await prisma.post.create({
          data: {
            title: `Tech Post ${i}`,
            slug: `tech-post-${i}`,
            content: `Content ${i}`,
            published: true,
            publishedAt: new Date(Date.now() - i * 1000),
            authorId: testUser.id,
            categoryId: testCategory.id
          }
        })
      }

      // First page
      const response1 = await app.inject({
        method: 'GET',
        url: '/blog/category/tech?page=1'
      })

      expect(response1.statusCode).toBe(200)
      expect(response1.payload).toContain('Tech Post 1')
      expect(response1.payload).toContain('Tech Post 10')
      expect(response1.payload).not.toContain('Tech Post 11')

      // Second page
      const response2 = await app.inject({
        method: 'GET',
        url: '/blog/category/tech?page=2'
      })

      expect(response2.statusCode).toBe(200)
      expect(response2.payload).toContain('Tech Post 11')
      expect(response2.payload).toContain('Tech Post 15')
      expect(response2.payload).toContain('class="current">2<') // Check current page 2 display
      // First page link exists but first page posts should not be displayed
      expect(response2.payload).toContain('/blog/category/tech?page=1')
    })
  })

  describe('GET /blog/tag/:slug?page=N (Tag Pagination)', () => {
    it('should support pagination for tag page', async () => {
      // Create 15 public posts (all same tag)
      for (let i = 1; i <= 15; i++) {
        const post = await prisma.post.create({
          data: {
            title: `JS Post ${i}`,
            slug: `js-post-${i}`,
            content: `Content ${i}`,
            published: true,
            publishedAt: new Date(Date.now() - i * 1000),
            authorId: testUser.id
          }
        })

        await prisma.postTag.create({
          data: {
            postId: post.id,
            tagId: testTag.id
          }
        })
      }

      // First page
      const response1 = await app.inject({
        method: 'GET',
        url: '/blog/tag/javascript?page=1'
      })

      expect(response1.statusCode).toBe(200)
      expect(response1.payload).toContain('/blog/js-post-1"')
      expect(response1.payload).toContain('/blog/js-post-10"')
      expect(response1.payload).not.toContain('/blog/js-post-11"')

      // Second page
      const response2 = await app.inject({
        method: 'GET',
        url: '/blog/tag/javascript?page=2'
      })

      expect(response2.statusCode).toBe(200)
      expect(response2.payload).toContain('/blog/js-post-11"')
      expect(response2.payload).toContain('/blog/js-post-15"')
      expect(response2.payload).not.toContain('/blog/js-post-1"')
    })
  })
})
