// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Category Management Feature', () => {
  let adminUser
  let adminSession

  beforeEach(async () => {
    // Initialize data
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

  describe('GET /admin/categories', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/categories'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('Logged in administrator should be able to view category list', async () => {
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

      // category Fetch list
      const response = await app.inject({
        method: 'GET',
        url: '/admin/categories',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Category Management')
    })

    it('Should display category list', async () => {
      // Create test category
      await prisma.category.create({
        data: {
          name: 'Technology',
          slug: 'technology',
          description: 'Tech articles',
          order: 1
        }
      })

      await prisma.category.create({
        data: {
          name: 'Lifestyle',
          slug: 'lifestyle',
          description: 'Life articles',
          order: 2
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

      // category Fetch list
      const response = await app.inject({
        method: 'GET',
        url: '/admin/categories',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Technology')
      expect(response.payload).toContain('Lifestyle')
    })
  })

  describe('GET /admin/categories/new', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/categories/new'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('Should render category creation form', async () => {
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
        url: '/admin/categories/new',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Category')
    })
  })

  describe('POST /admin/categories', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/categories',
        payload: {
          name: 'Technology',
          description: 'Tech articles'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('with valid data categoryshould create', async () => {
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
        url: '/admin/categories',
        payload: {
          name: 'Technology',
          description: 'Tech articles',
          order: 1
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/categories')

      // DB check
      const category = await prisma.category.findUnique({
        where: { slug: 'technology' }
      })
      expect(category).toBeDefined()
      expect(category.name).toBe('Technology')
      expect(category.slug).toBe('technology')
      expect(category.description).toBe('Tech articles')
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
        url: '/admin/categories',
        payload: {
          description: 'Tech articles'
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

    it('Should return error if category name is duplicate', async () => {
      // Create existing category
      await prisma.category.create({
        data: {
          name: 'Technology',
          slug: 'technology',
          description: 'Existing category'
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
        url: '/admin/categories',
        payload: {
          name: 'Technology',
          description: 'New category'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('already exists')
    })

    it('Should be able to create category with manually entered slug', async () => {
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
        url: '/admin/categories',
        payload: {
          name: 'Technology',
          slug: 'tech',
          description: 'Tech articles',
          order: 1
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/categories')

      // DB check - verify input slug was used
      const category = await prisma.category.findUnique({
        where: { slug: 'tech' }
      })
      expect(category).toBeDefined()
      expect(category.name).toBe('Technology')
      expect(category.slug).toBe('tech')
      expect(category.description).toBe('Tech articles')
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
        url: '/admin/categories',
        payload: {
          name: 'JavaScript Programming',
          description: 'JS articles',
          order: 1
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/categories')

      // DB check - verify slug was auto-generated
      const category = await prisma.category.findFirst({
        where: { name: 'JavaScript Programming' }
      })
      expect(category).toBeDefined()
      expect(category.slug).toBeTruthy()
      expect(category.slug).toMatch(/^javascript-programming/)
    })

    it('Should return error if slug is duplicate', async () => {
      // Create existing category
      await prisma.category.create({
        data: {
          name: 'Technology',
          slug: 'tech',
          description: 'Existing category'
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
        url: '/admin/categories',
        payload: {
          name: 'Tech News',
          slug: 'tech',
          description: 'New category'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('already exists')
    })

    it('Korean category names should auto-generate romanized slugs', async () => {
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
        url: '/admin/categories',
        payload: {
          name: 'Technology',
          description: 'Technology articles'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/categories')

      // DB check - verify slug was romanized
      const category = await prisma.category.findFirst({
        where: { name: 'Technology' }
      })
      expect(category).toBeDefined()
      expect(category.slug).toBeTruthy()
      expect(category.slug).toMatch(/^[a-z0-9-]+$/) // Only English, numbers, hyphens
      expect(category.slug).not.toMatch(/^-/) // Does not start with hyphen
      expect(category.slug.length).toBeGreaterThan(0) // Not empty string
    })

    it('Should correctly handle category names with mixed Korean and English', async () => {
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
        url: '/admin/categories',
        payload: {
          name: 'JavaScript Programming',
          description: 'JS articles'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/categories')

      // DB check
      const category = await prisma.category.findFirst({
        where: { name: 'JavaScript Programming' }
      })
      expect(category).toBeDefined()
      expect(category.slug).toBeTruthy()
      expect(category.slug).toMatch(/^[a-z0-9-]+$/)
      expect(category.slug).toContain('javascript') // English part included
      expect(category.slug).not.toMatch(/^-/) // Does not start with hyphen
    })
  })

  describe('DELETE /admin/categories/:id', () => {
    it('Should redirect to login page if not logged in', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Technology',
          slug: 'technology',
          description: 'Tech articles'
        }
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/admin/categories/${category.id}`
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('categoryshould delete', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Technology',
          slug: 'technology',
          description: 'Tech articles'
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
        url: `/admin/categories/${category.id}`,
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/categories')

      // DB check
      const deletedCategory = await prisma.category.findUnique({
        where: { id: category.id }
      })
      expect(deletedCategory).toBeNull()
    })
  })
})
