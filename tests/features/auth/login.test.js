// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Login Feature', () => {
  let testUser

  beforeEach(async () => {
    // Initialize data
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()

    // Mark installation complete (bypass install check middleware)
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
        role: 'user',
        isActive: true
      }
    })
  })

  describe('GET /auth/login', () => {
    it('should render login form', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/login'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Login')
    })
  })

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser',
          password: 'Test1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/')

      // Verify userId is stored in session
      // inject() doesn't maintain sessions, so actual session check is difficult
      // Instead, verify set-cookie header exists
      expect(response.headers['set-cookie']).toBeDefined()
    })

    it('should fail login with incorrect password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser',
          password: 'WrongPassword'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('password')
    })

    it('should fail login with non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'nonexistent',
          password: 'Test1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('does not exist')
    })

    it('should fail login with deactivated user', async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false }
      })

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser',
          password: 'Test1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('deactivated')
    })

    it('should return error when required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'testuser'
          // password missing
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('required')
    })
  })
})
