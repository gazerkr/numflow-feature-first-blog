// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../../lib/prisma.js'
import { hashPassword } from '../../lib/auth.js'

describe('Navigation Feature', () => {
  let testUser
  let sessionCookie
  let testPost

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

    // Create test posts
    testPost = await prisma.post.create({
      data: {
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        published: true,
        authorId: testUser.id,
        publishedAt: new Date()
      }
    })

    // Login
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: 'username=testuser&password=Test1234',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    })

    sessionCookie = loginResponse.headers['set-cookie']
  })

  describe('GET /', () => {
    it('Should display Login link when logged out', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Login')
      expect(response.payload).toContain('/auth/login')
    })

    it('Should display Dashboard link and Logout button when logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })

  describe('GET /blog', () => {
    it('Should display Login link when logged out', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Login')
      expect(response.payload).toContain('/auth/login')
    })

    it('Should display Dashboard link and Logout button when logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })

  describe('GET /blog/:slug', () => {
    it('Should display Login link when logged out', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/test-post'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Login')
      expect(response.payload).toContain('/auth/login')
    })

    it('Should display Dashboard link and Logout button when logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/test-post',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })

  describe('GET /about', () => {
    it('Should display Login link when logged out', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/about'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Login')
      expect(response.payload).toContain('/auth/login')
    })

    it('Should display Dashboard link and Logout button when logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/about',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })

  describe('Menu link consistency', () => {
    it('Should display Home, Blog, and About links on all pages', async () => {
      const pages = ['/', '/blog', '/about', '/blog/test-post']

      for (const page of pages) {
        const response = await app.inject({
          method: 'GET',
          url: page
        })

        expect(response.statusCode).toBe(200)
        expect(response.payload).toContain('href="/"')
        expect(response.payload).toContain('href="/blog"')
        expect(response.payload).toContain('href="/about"')
      }
    })
  })
})
