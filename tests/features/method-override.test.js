import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../setup.js'
import { hashPassword } from '../../lib/auth.js'

describe('Method Override Feature', () => {
  let testUser
  let sessionCookie

  beforeEach(async () => {
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

  describe('POST with _method=PUT query parameter', () => {
    it('Should be able to update private post to public', async () => {
      // Private post create
      const post = await prisma.post.create({
        data: {
          title: 'Private Test post',
          slug: 'unpublished-test-post',
          content: '# Test Content',
          contentHtml: '<h1>Test Content</h1>',
          published: false,
          authorId: testUser.id
        }
      })

      expect(post.published).toBe(false)
      expect(post.publishedAt).toBeNull()

      // Change to published using POST with _method=PUT
      const response = await app.inject({
        method: 'POST',
        url: `/admin/posts/${post.id}?_method=PUT`,
        payload: `title=${encodeURIComponent('Private Test post')}&content=${encodeURIComponent('# Test Content')}&published=true`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: sessionCookie
        }
      })

      // 302 should redirect or succeed
      expect([200, 302]).toContain(response.statusCode)
      expect(response.statusCode).not.toBe(404)

      // Check in database
      const updatedPost = await prisma.post.findUnique({
        where: { id: post.id }
      })

      expect(updatedPost.published).toBe(true)
      expect(updatedPost.publishedAt).not.toBeNull()
    })

    it('Should be able to update public post to private', async () => {
      // Public post create
      const post = await prisma.post.create({
        data: {
          title: 'Public Test post',
          slug: 'published-test-post',
          content: '# Public Content',
          contentHtml: '<h1>Public Content</h1>',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      expect(post.published).toBe(true)
      expect(post.publishedAt).not.toBeNull()

      // Change to published using POST with _method=PUT
      const response = await app.inject({
        method: 'POST',
        url: `/admin/posts/${post.id}?_method=PUT`,
        payload: `title=${encodeURIComponent('Public Test post')}&content=${encodeURIComponent('# Public Content')}&published=false`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: sessionCookie
        }
      })

      // 302 should redirect or succeed
      expect([200, 302]).toContain(response.statusCode)
      expect(response.statusCode).not.toBe(404)

      // Check in database
      const updatedPost = await prisma.post.findUnique({
        where: { id: post.id }
      })

      expect(updatedPost.published).toBe(false)
      expect(updatedPost.publishedAt).toBeNull()
    })

    it('Should return 404 error when POST without _method=PUT', async () => {
      // post create
      const post = await prisma.post.create({
        data: {
          title: 'Test post',
          slug: 'test-post-404',
          content: '# Content',
          contentHtml: '<h1>Content</h1>',
          published: false,
          authorId: testUser.id
        }
      })

      // POST request without _method
      const response = await app.inject({
        method: 'POST',
        url: `/admin/posts/${post.id}`,
        payload: `title=Updated&content=Updated`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: sessionCookie
        }
      })

      // POST /admin/posts/:id should return 404 as route does not exist
      expect(response.statusCode).toBe(404)
    })
  })
})
