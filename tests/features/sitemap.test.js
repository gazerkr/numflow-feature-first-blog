// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../../lib/prisma.js'
import { hashPassword } from '../../lib/auth.js'

describe('Sitemap Feature', () => {
  let testUser
  let testCategory1
  let testCategory2
  let testTag1
  let testTag2

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

    // Create test categories
    testCategory1 = await prisma.category.create({
      data: {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech posts'
      }
    })

    testCategory2 = await prisma.category.create({
      data: {
        name: 'Design',
        slug: 'design',
        description: 'Design posts'
      }
    })

    // Create test tags
    testTag1 = await prisma.tag.create({
      data: {
        name: 'JavaScript',
        slug: 'javascript'
      }
    })

    testTag2 = await prisma.tag.create({
      data: {
        name: 'TypeScript',
        slug: 'typescript'
      }
    })
  })

  describe('GET /sitemap.xml', () => {
    it('should return XML with correct content type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('application/xml')
    })

    it('should return valid XML structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(response.payload).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
      expect(response.payload).toContain('</urlset>')
    })

    it('should include homepage URL', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('<loc>http://localhost:5555/</loc>')
      expect(response.payload).toContain('<priority>1.0</priority>')
    })

    it('should include static pages', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('<loc>http://localhost:5555/blog</loc>')
      expect(response.payload).toContain('<loc>http://localhost:5555/about</loc>')
    })

    it('should include published posts only', async () => {
      // Create published post
      await prisma.post.create({
        data: {
          title: 'Published Post',
          slug: 'published-post',
          content: '# Content',
          published: true,
          publishedAt: new Date('2024-01-15T10:00:00Z'),
          authorId: testUser.id
        }
      })

      // Create draft post
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
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/published-post</loc>')
      expect(response.payload).not.toContain('<loc>http://localhost:5555/blog/draft-post</loc>')
    })

    it('should include lastmod for posts', async () => {
      await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          content: '# Test',
          published: true,
          publishedAt: new Date('2024-01-15T10:00:00Z'),
          authorId: testUser.id,
          updatedAt: new Date('2024-01-20T15:30:00Z')
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/test-post</loc>')
      expect(response.payload).toContain('<lastmod>2024-01-20</lastmod>')
    })

    it('should include all categories', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/category/technology</loc>')
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/category/design</loc>')
    })

    it('should include all tags', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/tag/javascript</loc>')
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/tag/typescript</loc>')
    })

    it('should set correct priority for different page types', async () => {
      await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          content: '# Test',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)

      // Homepage has highest priority
      const homepageMatch = response.payload.match(/<url>[\s\S]*?<loc>http:\/\/localhost:5555\/<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>/)
      expect(homepageMatch[1]).toBe('1.0')

      // Blog posts have medium priority
      const postMatch = response.payload.match(/<url>[\s\S]*?<loc>http:\/\/localhost:5555\/blog\/test-post<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>/)
      expect(postMatch[1]).toBe('0.8')
    })

    it('should set correct changefreq for different page types', async () => {
      await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          content: '# Test',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)

      // Homepage changes daily
      expect(response.payload).toMatch(/<url>[\s\S]*?<loc>http:\/\/localhost:5555\/<\/loc>[\s\S]*?<changefreq>daily<\/changefreq>/)

      // Blog posts change weekly
      expect(response.payload).toMatch(/<url>[\s\S]*?<loc>http:\/\/localhost:5555\/blog\/test-post<\/loc>[\s\S]*?<changefreq>weekly<\/changefreq>/)
    })

    it('should handle multiple posts with correct ordering', async () => {
      // Create multiple posts
      await prisma.post.create({
        data: {
          title: 'Post 1',
          slug: 'post-1',
          content: '# Post 1',
          published: true,
          publishedAt: new Date('2024-01-10'),
          authorId: testUser.id
        }
      })

      await prisma.post.create({
        data: {
          title: 'Post 2',
          slug: 'post-2',
          content: '# Post 2',
          published: true,
          publishedAt: new Date('2024-01-20'),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/post-1</loc>')
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/post-2</loc>')
    })

    it('should escape special XML characters in URLs', async () => {
      await prisma.post.create({
        data: {
          title: 'Post with & ampersand',
          slug: 'post-with-ampersand',
          content: '# Test',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/sitemap.xml'
      })

      expect(response.statusCode).toBe(200)
      // XML should be valid (no unescaped special characters)
      expect(response.payload).toContain('<loc>http://localhost:5555/blog/post-with-ampersand</loc>')
    })
  })
})
