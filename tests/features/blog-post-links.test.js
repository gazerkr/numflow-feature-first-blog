import { describe, it, expect } from 'vitest'
import app from '../../app.js'
import { prisma } from '../setup.js'
import bcrypt from 'bcryptjs'

describe('Blog Post Links Feature', () => {

  describe('GET /blog', () => {
    it('should have links from blog list post titles to detail pages', async () => {
      // Mark installation as complete
      await prisma.setting.create({
        data: {
          key: 'installed',
          value: 'true'
        }
      })

      // Create test user
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          displayName: 'Test User'
        }
      })

      // Create 2 test posts
      const post1 = await prisma.post.create({
        data: {
          title: 'First Post',
          slug: 'first-post',
          content: 'This is the first post content.',
          published: true,
          publishedAt: new Date(),
          authorId: user.id
        }
      })

      const post2 = await prisma.post.create({
        data: {
          title: 'Second Post',
          slug: 'second-post',
          content: 'This is the second post content.',
          published: true,
          publishedAt: new Date(),
          authorId: user.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)

      // Check first post link
      expect(response.payload).toContain('First Post')
      expect(response.payload).toContain('/blog/first-post')
      expect(response.payload).toMatch(/href="\/blog\/first-post"/)

      // Check second post link
      expect(response.payload).toContain('Second Post')
      expect(response.payload).toContain('/blog/second-post')
      expect(response.payload).toMatch(/href="\/blog\/second-post"/)
    })

    it('should not have links when there are no posts', async () => {
      // Mark installation as complete
      await prisma.setting.create({
        data: {
          key: 'installed',
          value: 'true'
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('No posts yet')
      // Should not have post links (excluding navigation /blog link)
      expect(response.payload).not.toMatch(/<a href="\/blog\/[^"]+">[\s\S]*?<\/a>/)
    })

    it('should have entire post card be clickable', async () => {
      // Mark installation as complete
      await prisma.setting.create({
        data: {
          key: 'installed',
          value: 'true'
        }
      })

      // Create test user
      const user = await prisma.user.create({
        data: {
          username: 'testuser2',
          email: 'test2@example.com',
          password: await bcrypt.hash('password123', 10),
          displayName: 'Test User 2'
        }
      })

      // Create test post
      await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          content: 'This is test content.',
          published: true,
          publishedAt: new Date(),
          authorId: user.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)

      // Should have link inside post-card
      expect(response.payload).toContain('<div class="post-card">')
      expect(response.payload).toContain('href="/blog/test-post"')
      expect(response.payload).toMatch(/<h2[^>]*>Test Post<\/h2>/)
    })
  })
})
