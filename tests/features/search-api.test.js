import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../setup.js'
import { hashPassword } from '../../lib/auth.js'

describe('Search API Feature', () => {
  let testUser
  let testPosts

  beforeEach(async () => {
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

    // Create test posts
    testPosts = await Promise.all([
      prisma.post.create({
        data: {
          title: 'JavaScript Basics',
          slug: 'javascript-basics',
          content: '# JavaScript is a core language for web development.',
          contentHtml: '<h1>JavaScript is a core language for web development.</h1>',
          published: true,
          publishedAt: new Date('2024-01-01'),
          authorId: testUser.id
        }
      }),
      prisma.post.create({
        data: {
          title: 'Python Programming',
          slug: 'python-programming',
          content: '# Python is widely used in data science.',
          contentHtml: '<h1>Python is widely used in data science.</h1>',
          published: true,
          publishedAt: new Date('2024-01-02'),
          authorId: testUser.id
        }
      }),
      prisma.post.create({
        data: {
          title: 'Private post',
          slug: 'private-post',
          content: 'JavaScript content',
          contentHtml: '<p>JavaScript content</p>',
          published: false,
          authorId: testUser.id
        }
      })
    ])
  })

  describe('GET /api/search', () => {
    it('should be able to search posts by keyword', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search?q=JavaScript'
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.posts).toBeDefined()
      expect(result.posts.length).toBe(1)
      expect(result.posts[0].title).toBe('JavaScript Basics')
      expect(result.total).toBe(1)
    })

    it('should return empty array if search results not available', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search?q=Rust'
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.posts).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should not include private posts in search results', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search?q=JavaScript'
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      // 'Private post' also has JavaScript but excluded as published=false
      expect(result.posts.length).toBe(1)
      expect(result.posts[0].slug).toBe('javascript-basics')
    })

    it('should return all published posts when requesting without search keyword', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search'
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.posts.length).toBe(2) // 2 published posts
      expect(result.total).toBe(2)
    })

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/search?page=1&perPage=1'
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.posts.length).toBe(1)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(2)
    })
  })
})
