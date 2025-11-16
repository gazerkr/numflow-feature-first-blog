// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Post Management Feature', () => {
  let adminUser
  let testCategory
  let testTag1
  let testTag2

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

    // Create test categories and tags
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description'
      }
    })

    testTag1 = await prisma.tag.create({
      data: {
        name: 'Test Tag 1',
        slug: 'test-tag-1'
      }
    })

    testTag2 = await prisma.tag.create({
      data: {
        name: 'Test Tag 2',
        slug: 'test-tag-2'
      }
    })
  })

  describe('GET /admin/posts', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/posts'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('Logged in administrator should be able to view post list', async () => {
      // Create test posts
      await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          content: '# Test Content',
          authorId: adminUser.id,
          categoryId: testCategory.id,
          published: true
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

      // Fetch post list
      const response = await app.inject({
        method: 'GET',
        url: '/admin/posts',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Post Management')
      expect(response.payload).toContain('Test Post')
      expect(response.payload).toContain('Test Category')
    })

    it('Should display empty status if post list is empty', async () => {
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
        url: '/admin/posts',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('No posts')
    })
  })

  describe('GET /admin/posts/new', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/posts/new'
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('Should render post creation form and display category and tag lists', async () => {
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
        url: '/admin/posts/new',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('New Post')
      expect(response.payload).toContain('Test Category')
      expect(response.payload).toContain('Test Tag 1')
      expect(response.payload).toContain('Test Tag 2')
    })

    it('Should have image upload button and file input field', async () => {
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
        url: '/admin/posts/new',
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      // Check image upload elements
      expect(response.payload).toContain('id="imageUploadBtn"')
      expect(response.payload).toContain('type="file"')
      expect(response.payload).toContain('accept="image/*"')
    })
  })

  describe('POST /admin/posts', () => {
    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/posts',
        payload: {
          title: 'Test',
          content: 'Test'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('with valid data postshould create (published=true)', async () => {
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
        url: '/admin/posts',
        payload: {
          title: 'New Post',
          content: '# Heading\n\nContent here',
          categoryId: testCategory.id,
          tagIds: [testTag1.id, testTag2.id],
          published: 'true'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/posts')

      // DB check
      const post = await prisma.post.findFirst({
        where: { title: 'New Post' },
        include: { tags: true }
      })
      expect(post).toBeDefined()
      expect(post.slug).toBe('new-post')
      expect(post.content).toBe('# Heading\n\nContent here')
      expect(post.contentHtml).toContain('<h1>Heading</h1>')
      expect(post.categoryId).toBe(testCategory.id)
      expect(post.authorId).toBe(adminUser.id)
      expect(post.published).toBe(true)
      expect(post.publishedAt).toBeDefined()
      expect(post.tags).toHaveLength(2)
    })

    it('Draft postshould create (published=false)', async () => {
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
        url: '/admin/posts',
        payload: {
          title: 'Draft Post',
          content: 'Draft content'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)

      const post = await prisma.post.findFirst({
        where: { title: 'Draft Post' }
      })
      expect(post.published).toBe(false)
      expect(post.publishedAt).toBeNull()
      expect(post.categoryId).toBeNull()
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
        url: '/admin/posts',
        payload: {},
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('Please enter a title.')
    })

    it('Should create posts with different slugs when titles are the same', async () => {
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

      // Create first post
      await app.inject({
        method: 'POST',
        url: '/admin/posts',
        payload: {
          title: 'Same Title',
          content: 'Content 1'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      // Create second post with same title
      const response = await app.inject({
        method: 'POST',
        url: '/admin/posts',
        payload: {
          title: 'Same Title',
          content: 'Content 2'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)

      // Check both posts created (with different slugs)
      const posts = await prisma.post.findMany({
        where: { title: 'Same Title' }
      })
      expect(posts).toHaveLength(2)
      expect(posts[0].slug).not.toBe(posts[1].slug)
    })
  })

  describe('GET /admin/posts/:id/edit', () => {
    let testPost

    beforeEach(async () => {
      // Create test posts
      testPost = await prisma.post.create({
        data: {
          title: 'Edit Test Post',
          slug: 'edit-test-post',
          content: '# Original Content',
          authorId: adminUser.id,
          categoryId: testCategory.id,
          published: true,
          tags: {
            create: [
              { tagId: testTag1.id }
            ]
          }
        }
      })
    })

    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/admin/posts/${testPost.id}/edit`
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('Should render post update form and display existing data', async () => {
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
        url: `/admin/posts/${testPost.id}/edit`,
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Edit Post')
      expect(response.payload).toContain('Edit Test Post')
      expect(response.payload).toContain('# Original Content')
      expect(response.payload).toContain('Test Category')
    })
  })

  describe('PUT /admin/posts/:id', () => {
    let testPost

    beforeEach(async () => {
      testPost = await prisma.post.create({
        data: {
          title: 'Update Test Post',
          slug: 'update-test-post',
          content: '# Original',
          authorId: adminUser.id,
          categoryId: testCategory.id,
          published: false,
          tags: {
            create: [{ tagId: testTag1.id }]
          }
        }
      })
    })

    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/admin/posts/${testPost.id}`,
        payload: { title: 'Updated', content: 'Updated' },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('postshould update', async () => {
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
        method: 'PUT',
        url: `/admin/posts/${testPost.id}`,
        payload: {
          title: 'Updated Title',
          content: '# Updated Content',
          categoryId: testCategory.id,
          tagIds: [testTag2.id],
          published: 'true'
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/posts')

      // DB check
      const updated = await prisma.post.findUnique({
        where: { id: testPost.id },
        include: { tags: true }
      })
      expect(updated.title).toBe('Updated Title')
      expect(updated.content).toBe('# Updated Content')
      expect(updated.contentHtml).toContain('<h1>Updated Content</h1>')
      expect(updated.slug).toBe('updated-title')
      expect(updated.published).toBe(true)
      expect(updated.publishedAt).toBeDefined()
      expect(updated.tags).toHaveLength(1)
      expect(updated.tags[0].tagId).toBe(testTag2.id)
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
        method: 'PUT',
        url: `/admin/posts/${testPost.id}`,
        payload: {
          title: '',
          content: ''
        },
        headers: {
          'content-type': 'application/json',
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(400)
      expect(response.payload).toContain('Please enter a title.')
    })
  })

  describe('DELETE /admin/posts/:id', () => {
    let testPost

    beforeEach(async () => {
      testPost = await prisma.post.create({
        data: {
          title: 'Delete Test Post',
          slug: 'delete-test-post',
          content: 'Content',
          authorId: adminUser.id
        }
      })
    })

    it('Should redirect to login page if not logged in', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/admin/posts/${testPost.id}`
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/auth/login')
    })

    it('postshould delete', async () => {
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
        url: `/admin/posts/${testPost.id}`,
        headers: {
          cookie: cookies
        }
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/admin/posts')

      // DB check
      const deleted = await prisma.post.findUnique({
        where: { id: testPost.id }
      })
      expect(deleted).toBeNull()
    })
  })
})
