import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../setup.js'
import { hashPassword } from '../../lib/auth.js'
import { existsSync, unlinkSync, mkdirSync } from 'fs'
import { join } from 'path'

describe('Image Upload Feature', () => {
  let testUser
  let sessionCookie
  const uploadDir = join(process.cwd(), 'public/uploads')

  beforeEach(async () => {
    // Create upload directory
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

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

    // Login to get session cookie
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

  describe('POST /api/upload/image', () => {
    it('should be able to upload image file', async () => {
      // Simple PNG image data (1x1 pixel transparent PNG)
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )

      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
      const payload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="image"; filename="test.png"',
        'Content-Type: image/png',
        '',
        pngBuffer.toString('binary'),
        `--${boundary}--`
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload/image',
        payload,
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.url).toBeDefined()
      expect(result.url).toMatch(/^\/uploads\//)
    })

    it('should not be able to upload if not logged in', async () => {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )

      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
      const payload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="image"; filename="test.png"',
        'Content-Type: image/png',
        '',
        pngBuffer.toString('binary'),
        `--${boundary}--`
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload/image',
        payload,
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`
        }
      })

      expect(response.statusCode).toBe(302) // Redirect to login page
    })

    it('should return 400 error if file not available', async () => {
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
      const payload = `--${boundary}--`

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload/image',
        payload,
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(400)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(false)
    })

    it('should return 400 error if not an image file', async () => {
      const textContent = 'This is a text file'
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
      const payload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="image"; filename="test.txt"',
        'Content-Type: text/plain',
        '',
        textContent,
        `--${boundary}--`
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload/image',
        payload,
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(400)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/image/)
    })
  })
})
