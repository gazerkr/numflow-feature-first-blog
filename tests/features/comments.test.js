import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../setup.js'
import { hashPassword } from '../../lib/auth.js'

describe('Comment System Feature', () => {
  let testUser
  let testPost

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

    // Create test posts
    testPost = await prisma.post.create({
      data: {
        title: 'Test post',
        slug: 'test-post',
        content: '# Test Content',
        contentHtml: '<h1>Test Content</h1>',
        published: true,
        publishedAt: new Date(),
        authorId: testUser.id
      }
    })
  })

  describe('POST /api/posts/:slug/comments', () => {
    it('should be able to write comment', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/posts/${testPost.slug}/comments`,
        payload: {
          authorName: 'Visitor',
          authorEmail: 'visitor@example.com',
          content: 'Thank you for the great article!'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(201)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.comment).toBeDefined()
      expect(result.comment.content).toBe('Thank you for the great article!')
      expect(result.comment.authorName).toBe('Visitor')

      // Check database
      const comments = await prisma.comment.findMany({
        where: { postId: testPost.id }
      })
      expect(comments).toHaveLength(1)
      expect(comments[0].content).toBe('Thank you for the great article!')
    })

    it('should return 400 error if required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/posts/${testPost.slug}/comments`,
        payload: {
          authorName: 'Visitor'
          // Missing content
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(400)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(false)
    })

    it('should not be able to comment on non-existent post', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/posts/non-existent-slug/comments',
        payload: {
          authorName: 'Visitor',
          content: 'Test comment'
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /api/posts/:slug/comments', () => {
    beforeEach(async () => {
      // Create test comments
      await prisma.comment.createMany({
        data: [
          {
            postId: testPost.id,
            authorName: 'Visitor1',
            content: 'First comment'
          },
          {
            postId: testPost.id,
            authorName: 'Visitor2',
            authorEmail: 'visitor2@example.com',
            content: 'Second comment'
          }
        ]
      })
    })

    it('should be able to fetch comment list of post', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/posts/${testPost.slug}/comments`
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.comments).toHaveLength(2)
      expect(result.comments[0].content).toBe('First comment')
      expect(result.comments[1].content).toBe('Second comment')
    })

    it('should return empty array for post with no comments', async () => {
      // Create new post (no comments)
      const newPost = await prisma.post.create({
        data: {
          title: 'Post without comments',
          slug: 'no-comments-post',
          content: 'Content',
          contentHtml: '<p>Content</p>',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: `/api/posts/${newPost.slug}/comments`
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.comments).toHaveLength(0)
    })
  })

  describe('DELETE /api/comments/:id', () => {
    let testComment

    beforeEach(async () => {
      testComment = await prisma.comment.create({
        data: {
          postId: testPost.id,
          authorName: 'Test Comment Author',
          content: 'Comment to delete'
        }
      })
    })

    it('should be able to delete comment as administrator', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: 'username=testuser&password=Test1234',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      const sessionCookie = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/comments/${testComment.id}`,
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)

      // Check in database
      const comment = await prisma.comment.findUnique({
        where: { id: testComment.id }
      })
      expect(comment).toBeNull()
    })

    it('should not be able to delete comment if not logged in', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/comments/${testComment.id}`
      })

      expect(response.statusCode).toBe(302) // Redirect to login page
    })

    it('should return 404 when trying to delete non-existent comment', async () => {
      // Login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: 'username=testuser&password=Test1234',
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      const sessionCookie = loginResponse.headers['set-cookie']

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/comments/non-existent-id',
        headers: {
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
