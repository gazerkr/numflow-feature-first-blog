// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Tag Management Feature', () => {
  let adminUser

  beforeEach(async () => {
    // Initialize data
    await prisma.tag.deleteMany()
    await prisma.user.deleteMany()
    await prisma.setting.deleteMany()

    // Mark installation as complete
    await prisma.setting.create({
      data: {
        key: 'installed',
        value: 'true'
      }
    })

    // Create administrator user
    adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: await hashPassword('Admin1234'),
        displayName: 'Administrator',
        role: 'admin',
        isActive: true
      }
    })
  })

  describe('GET /admin/tags', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tags'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('Logged in administrator should be able to view tag list', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      // tag Fetch list
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tags',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Tag Management')
    })

    it('tag listshould be displayed', async () => {
      // Test tag create
      await prisma.tag.create({
        data: {
          name: 'JavaScript',
          slug: 'javascript'
        }
      })

      await prisma.tag.create({
        data: {
          name: 'Python',
          slug: 'python'
        }
      })

      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      // tag Fetch list
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tags',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('JavaScript')
      expect(response.payload).toContain('Python')
    })
  })

  describe('GET /admin/tags/new', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/tags/new'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('Should render tag creation form', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'GET',
        url: '/admin/tags/new',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Tag')
    })
  })

  describe('POST /admin/tags', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          name: 'JavaScript'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('with valid data tagshould create', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          name: 'JavaScript'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/tags')

      // DB check
      const tag = await prisma.tag.findUnique({
        where: { slug: 'javascript' }
      })
      expect(tag).toBeDefined()
      expect(tag.name).toBe('JavaScript')
      expect(tag.slug).toBe('javascript')
    })

    it('Should return error if required fields are missing', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          // Missing name
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('required')
    })

    it('Should return error if tag name is duplicate', async () => {
      // Create existing tag
      await prisma.tag.create({
        data: {
          name: 'JavaScript',
          slug: 'javascript'
        }
      })

      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          name: 'JavaScript'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('already exists')
    })

    it('Should be able to create tag with manually entered slug', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          name: 'JavaScript',
          slug: 'js'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/tags')

      // DB check - verify input slug was used
      const tag = await prisma.tag.findUnique({
        where: { slug: 'js' }
      })
      expect(tag).toBeDefined()
      expect(tag.name).toBe('JavaScript')
      expect(tag.slug).toBe('js')
    })

    it('Should auto-generate slug if not provided', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          name: 'React Hooks'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/tags')

      // DB check - verify slug was auto-generated
      const tag = await prisma.tag.findFirst({
        where: { name: 'React Hooks' }
      })
      expect(tag).toBeDefined()
      expect(tag.slug).toBeTruthy()
      expect(tag.slug).toMatch(/^react-hooks/)
    })

    it('Should return error if slug is duplicate', async () => {
      // Create existing tag
      await prisma.tag.create({
        data: {
          name: 'JavaScript',
          slug: 'js'
        }
      })

      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          name: 'JS',
          slug: 'js'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('already exists')
    })

    it('Korean tag names should auto-generate romanized slugs', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          name: 'Frontend'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/tags')

      // DB check - verify slug was romanized
      const tag = await prisma.tag.findFirst({
        where: { name: 'Frontend' }
      })
      expect(tag).toBeDefined()
      expect(tag.slug).toBeTruthy()
      expect(tag.slug).toMatch(/^[a-z0-9-]+$/) // Only English, numbers, hyphens
      expect(tag.slug).not.toMatch(/^-/) // Does not start with hyphen
      expect(tag.slug.length).toBeGreaterThan(0) // Not empty string
    })

    it('Should correctly handle tag names with mixed Korean and English', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'POST',
        url: '/admin/tags',
        payload: {
          name: 'React Tutorial'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/tags')

      // DB check
      const tag = await prisma.tag.findFirst({
        where: { name: 'React Tutorial' }
      })
      expect(tag).toBeDefined()
      expect(tag.slug).toBeTruthy()
      expect(tag.slug).toMatch(/^[a-z0-9-]+$/)
      expect(tag.slug).toContain('react') // English part included
      expect(tag.slug).not.toMatch(/^-/) // Does not start with hyphen
    })
  })

  describe('DELETE /admin/tags/:id', () => {
    it('Should redirect to login page if not logged in', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'JavaScript',
          slug: 'javascript'
        }
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/admin/tags/${tag.id}`
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('tagshould delete', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'JavaScript',
          slug: 'javascript'
        }
      })

      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          username: 'admin',
          password: 'Admin1234'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const cookies = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'DELETE',
        url: `/admin/tags/${tag.id}`,
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/tags')

      // DB check
      const deletedTag = await prisma.tag.findUnique({
        where: { id: tag.id }
      })
      expect(deletedTag).toBeNull()
    })
  })
})
