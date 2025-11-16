// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Logout Feature', () => {
  beforeEach(async () => {
    // Initialize data
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()

    // Mark installation as complete
    await prisma.setting.create({
      data: {
        key: 'installed',
        value: 'true'
      }
    })

    // Create test user for logout
    await prisma.user.create({
      data: {
        username: 'logoutuser',
        email: 'logout@example.com',
        password: await hashPassword('Test1234'),
        displayName: 'Logout Test User',
        role: 'user',
        isActive: true
      }
    })
  })

  describe('POST /auth/logout', () => {
    it('should destroy session and redirect to login page on logout', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })
  })
})
