// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Admin Dashboard Feature', () => {
  let testUser
  let testCategory
  let session

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

    // Create test administrator user
    testUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: await hashPassword('Admin1234'),
        displayName: 'Administrator',
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

    // Login to get session
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'admin',
        password: 'Admin1234'
      }
    })

    // Extract session cookie
    const cookies = loginResponse.cookies
    session = cookies.find(c => c.name === 'connect.sid' || c.name.includes('session'))
  })

  describe('GET /admin (Dashboard)', () => {
    it('should allow authenticated administrator to access dashboard', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin',
        cookies: session ? { [session.name]: session.value } : {}
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Administrator')
      expect(response.payload).toContain('Dashboard')
    })

    it('should redirect unauthenticated user to login page', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('should display statistics (total posts, published posts, total views)', async () => {
      // Create test posts (published 3, draft 2)
      await prisma.post.createMany({
        data: [
          {
            title: 'Published Post 1',
            slug: 'published-post-1',
            content: 'Content 1',
            published: true,
            publishedAt: new Date(),
            authorId: testUser.id,
            viewCount: 10
          },
          {
            title: 'Published Post 2',
            slug: 'published-post-2',
            content: 'Content 2',
            published: true,
            publishedAt: new Date(),
            authorId: testUser.id,
            viewCount: 20
          },
          {
            title: 'Published Post 3',
            slug: 'published-post-3',
            content: 'Content 3',
            published: true,
            publishedAt: new Date(),
            authorId: testUser.id,
            viewCount: 30
          },
          {
            title: 'Draft Post 1',
            slug: 'draft-post-1',
            content: 'Content 4',
            published: false,
            authorId: testUser.id,
            viewCount: 0
          },
          {
            title: 'Draft Post 2',
            slug: 'draft-post-2',
            content: 'Content 5',
            published: false,
            authorId: testUser.id,
            viewCount: 0
          }
        ]
      })

      const response = await app.inject({
        method: 'GET',
        url: '/admin',
        cookies: session ? { [session.name]: session.value } : {}
      })

      expect(response.statusCode).toBe(200)
      // total posts: 5
      expect(response.payload).toMatch(/total posts.*5/si)
      // published posts: 3
      expect(response.payload).toMatch(/published posts.*3/si)
      // total views: 60
      expect(response.payload).toMatch(/total views.*60/si)
    })

    it('should display recent posts list', async () => {
      // 7of post create (should display only 5 most recent)
      for (let i = 1; i <= 7; i++) {
        await prisma.post.create({
          data: {
            title: `Post ${i}`,
            slug: `post-${i}`,
            content: `Content ${i}`,
            published: i <= 4, // Only publish first 4
            publishedAt: i <= 4 ? new Date(Date.now() + i * 1000) : null,
            authorId: testUser.id,
            categoryId: testCategory.id
          }
        })
        // Brief delay after each post creation (ensure createdAt order)
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const response = await app.inject({
        method: 'GET',
        url: '/admin',
        cookies: session ? { [session.name]: session.value } : {}
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Recent Posts')

      // Display only recent 5 posts (Post 7, 6, 5, 4, 3)
      expect(response.payload).toMatch(/<span[^>]*>Post 7<\/span>/)
      expect(response.payload).toMatch(/<span[^>]*>Post 6<\/span>/)
      expect(response.payload).toMatch(/<span[^>]*>Post 5<\/span>/)
      expect(response.payload).toMatch(/<span[^>]*>Post 4<\/span>/)
      expect(response.payload).toMatch(/<span[^>]*>Post 3<\/span>/)

      // Post 1, 2should not be displayed
      expect(response.payload).not.toMatch(/<span[^>]*>Post 1<\/span>/)
      expect(response.payload).not.toMatch(/<span[^>]*>Post 2<\/span>/)
    })

    it('should display post status (published/draft)', async () => {
      await prisma.post.create({
        data: {
          title: 'Published Article',
          slug: 'published-article',
          content: 'Published content',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      await prisma.post.create({
        data: {
          title: 'Draft Article',
          slug: 'draft-article',
          content: 'Draft content',
          published: false,
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/admin',
        cookies: session ? { [session.name]: session.value } : {}
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Published Article')
      expect(response.payload).toContain('Draft Article')
      expect(response.payload).toContain('Published')
      expect(response.payload).toContain('draft')
    })

    it('should provide admin menu navigation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin',
        cookies: session ? { [session.name]: session.value } : {}
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('/admin/posts')
      expect(response.payload).toContain('/admin/categories')
      expect(response.payload).toContain('/admin/tags')
      expect(response.payload).toContain('New Post')
    })
  })
})
