// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Admin Settings Feature', () => {
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

    // Mark installation as complete
    await prisma.setting.create({
      data: {
        key: 'installed',
        value: 'true'
      }
    })

    // Blog Settings create
    await prisma.setting.createMany({
      data: [
        { key: 'blog.name', value: 'Test Blog', type: 'string' },
        { key: 'blog.description', value: 'Test Description', type: 'string' }
      ]
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

  describe('GET /admin/settings', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/settings'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('Should be able to render settings page', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Settings')
      expect(response.payload).toContain('Test Blog')
      expect(response.payload).toContain('Test Description')
      expect(response.payload).toContain('Test User')
      expect(response.payload).toContain('test@example.com')
    })
  })

  describe('POST /admin/settings', () => {
    it('Should be able to update blog name and description', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          blogName: 'Updated Blog Name',
          blogDescription: 'Updated Description',
          displayName: 'Test User',
          email: 'test@example.com'
        }
      })

      expect(response.statusCode).toBe(302)

      // Check database
      const blogName = await prisma.setting.findUnique({
        where: { key: 'blog.name' }
      })
      const blogDescription = await prisma.setting.findUnique({
        where: { key: 'blog.description' }
      })

      expect(blogName.value).toBe('Updated Blog Name')
      expect(blogDescription.value).toBe('Updated Description')
    })

    it('Should be able to update user profile', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          blogName: 'Test Blog',
          blogDescription: 'Test Description',
          displayName: 'Updated Name',
          email: 'updated@example.com'
        }
      })

      expect(response.statusCode).toBe(302)

      // Check database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      })

      expect(updatedUser.displayName).toBe('Updated Name')
      expect(updatedUser.email).toBe('updated@example.com')
    })

    it('Should be able to change password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          blogName: 'Test Blog',
          blogDescription: 'Test Description',
          displayName: 'Test User',
          email: 'test@example.com',
          currentPassword: 'Test1234',
          newPassword: 'NewPass1234',
          newPasswordConfirm: 'NewPass1234'
        }
      })

      expect(response.statusCode).toBe(302)

      // Try login with new password
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser',
          password: 'NewPass1234'
        }
      })

      expect(loginResponse.statusCode).toBe(302)
      expect(loginResponse.headers.location).toBe('/')
    })

    it('Should display error when attempting to change with incorrect current password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          blogName: 'Test Blog',
          blogDescription: 'Test Description',
          displayName: 'Test User',
          email: 'test@example.com',
          currentPassword: 'WrongPassword',
          newPassword: 'NewPass1234',
          newPasswordConfirm: 'NewPass1234'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Current password is incorrect')
    })

    it('Should display error if password confirmation does not match', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          blogName: 'Test Blog',
          blogDescription: 'Test Description',
          displayName: 'Test User',
          email: 'test@example.com',
          currentPassword: 'Test1234',
          newPassword: 'NewPass1234',
          newPasswordConfirm: 'DifferentPass1234'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Passwords do not match')
    })

    it('Should display error if email format is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          blogName: 'Test Blog',
          blogDescription: 'Test Description',
          displayName: 'Test User',
          email: 'invalid-email'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Please enter a valid email')
    })

    it('Should display error if required fields are empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/settings',
        headers: {
          cookie: sessionCookie
        },
        payload: {
          blogName: '',
          blogDescription: '',
          displayName: '',
          email: 'test@example.com'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Please enter blog name')
      expect(response.payload).toContain('Please enter display name.')
    })
  })
})
