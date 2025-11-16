// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../../lib/prisma.js'
import { hashPassword } from '../../lib/auth.js'

describe('Admin Navigation Feature', () => {
  let testUser
  let sessionCookie

  beforeEach(async () => {
    // Initialize data
    await prisma.postTag.deleteMany()
    await prisma.post.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()

    // Mark installation complete
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

    // Login
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'testuser',
        password: 'Test1234'
      }
    })

    sessionCookie = loginResponse.headers['set-cookie']
  })

  describe('GET /admin', () => {
    it('should display all admin navigation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)

      // Verify all admin menu items
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Posts')
      expect(response.payload).toContain('/admin/posts')
      expect(response.payload).toContain('Categories')
      expect(response.payload).toContain('/admin/categories')
      expect(response.payload).toContain('Tags')
      expect(response.payload).toContain('/admin/tags')
      expect(response.payload).toContain('Settings')
      expect(response.payload).toContain('/admin/settings')
      expect(response.payload).toContain('View Blog')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })

  describe('GET /admin/posts', () => {
    it('should display all admin navigation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/posts',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)

      // Verify all admin menu items
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Posts')
      expect(response.payload).toContain('/admin/posts')
      expect(response.payload).toContain('Categories')
      expect(response.payload).toContain('/admin/categories')
      expect(response.payload).toContain('Tags')
      expect(response.payload).toContain('/admin/tags')
      expect(response.payload).toContain('Settings')
      expect(response.payload).toContain('/admin/settings')
      expect(response.payload).toContain('View Blog')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })

  describe('GET /admin/categories', () => {
    it('should display all admin navigation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/categories',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)

      // Verify all admin menu items
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Posts')
      expect(response.payload).toContain('/admin/posts')
      expect(response.payload).toContain('Categories')
      expect(response.payload).toContain('/admin/categories')
      expect(response.payload).toContain('Tags')
      expect(response.payload).toContain('/admin/tags')
      expect(response.payload).toContain('Settings')
      expect(response.payload).toContain('/admin/settings')
      expect(response.payload).toContain('View Blog')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })

  describe('GET /admin/tags', () => {
    it('should display all admin navigation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tags',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)

      // Verify all admin menu items
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Posts')
      expect(response.payload).toContain('/admin/posts')
      expect(response.payload).toContain('Categories')
      expect(response.payload).toContain('/admin/categories')
      expect(response.payload).toContain('Tags')
      expect(response.payload).toContain('/admin/tags')
      expect(response.payload).toContain('Settings')
      expect(response.payload).toContain('/admin/settings')
      expect(response.payload).toContain('View Blog')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })

  describe('GET /admin/settings', () => {
    beforeEach(async () => {
      // Create blog settings
      await prisma.setting.createMany({
        data: [
          { key: 'blog.name', value: 'Test Blog', type: 'string' },
          { key: 'blog.description', value: 'Test Description', type: 'string' }
        ]
      })
    })

    it('should display all admin navigation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)

      // Verify all admin menu items
      expect(response.payload).toContain('Dashboard')
      expect(response.payload).toContain('/admin')
      expect(response.payload).toContain('Posts')
      expect(response.payload).toContain('/admin/posts')
      expect(response.payload).toContain('Categories')
      expect(response.payload).toContain('/admin/categories')
      expect(response.payload).toContain('Tags')
      expect(response.payload).toContain('/admin/tags')
      expect(response.payload).toContain('Settings')
      expect(response.payload).toContain('/admin/settings')
      expect(response.payload).toContain('View Blog')
      expect(response.payload).toContain('Logout')
      expect(response.payload).toContain('Test User')
    })
  })
})
