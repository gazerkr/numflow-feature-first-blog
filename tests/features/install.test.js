// Load environment variables first (before other imports!)
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../../lib/prisma.js'

describe('Install Feature', () => {
  beforeEach(async () => {
    // Initialize installation data
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()
  })

  describe('GET /install', () => {
    it('should render installation form', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/install'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Install')
    })

    it('should redirect to home if already installed', async () => {
      // Mark installation complete
      await prisma.setting.create({
        data: {
          key: 'installed',
          value: 'true'
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/install'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/')
    })
  })

  describe('POST /install', () => {
    it('should create administrator with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/install',
        payload: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'Admin1234',
          passwordConfirm: 'Admin1234',
          displayName: 'Administrator'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')

      // Verify DB
      const user = await prisma.user.findUnique({
        where: { username: 'admin' }
      })
      expect(user).toBeDefined()
      expect(user.email).toBe('admin@example.com')
      expect(user.role).toBe('admin')
      expect(user.isActive).toBe(true)

      // Verify installation complete
      const installed = await prisma.setting.findUnique({
        where: { key: 'installed' }
      })
      expect(installed).toBeDefined()
      expect(installed.value).toBe('true')
    })

    it('should return error if required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/install',
        payload: {
          username: 'admin'
          // email, password missing
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('required')
    })

    it('should return error if passwords do not match', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/install',
        payload: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'Admin1234',
          passwordConfirm: 'Different123',
          displayName: 'Administrator'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('Passwords do not match')
    })

    it('should return error if password is less than 8 characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/install',
        payload: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'Admin12',
          passwordConfirm: 'Admin12',
          displayName: 'Administrator'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('8 characters')
    })

    it('should return error if already installed', async () => {
      // Mark installation complete
      await prisma.setting.create({
        data: {
          key: 'installed',
          value: 'true'
        }
      })

      const response = await app.inject({
        method: 'POST',
        url: '/install',
        payload: {
          username: 'admin',
          email: 'admin@example.com',
          password: 'Admin1234',
          passwordConfirm: 'Admin1234',
          displayName: 'Administrator'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('already')
    })

    it('should return error if username is duplicate', async () => {
      // Create existing user
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'existing@example.com',
          password: 'hashed',
          displayName: 'Existing',
          role: 'admin'
        }
      })

      const response = await app.inject({
        method: 'POST',
        url: '/install',
        payload: {
          username: 'admin',
          email: 'new@example.com',
          password: 'Admin1234',
          passwordConfirm: 'Admin1234',
          displayName: 'Administrator'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('already in use')
    })
  })
})
