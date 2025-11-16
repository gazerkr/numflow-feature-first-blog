// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Blog Tag Posts Feature', () => {
  let testUser
  let javascriptTag
  let nodejsTag

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

    // Create test user
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: await hashPassword('Test1234'),
        displayName: 'Test Author',
        role: 'admin',
        isActive: true
      }
    })

    // Create test tag
    javascriptTag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
        slug: 'javascript'
      }
    })

    nodejsTag = await prisma.tag.create({
      data: {
        name: 'Node.js',
        slug: 'nodejs'
      }
    })
  })

  describe('GET /blog/tag/:slug', () => {
    it('should display published post list for specific tag', async () => {
      // Posts with JavaScript tag
      const post1 = await prisma.post.create({
        data: {
          title: 'JS Post 1',
          slug: 'js-post-1',
          content: '# JS 1',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      await prisma.postTag.create({
        data: {
          postId: post1.id,
          tagId: javascriptTag.id
        }
      })

      const post2 = await prisma.post.create({
        data: {
          title: 'JS Post 2',
          slug: 'js-post-2',
          content: '# JS 2',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      await prisma.postTag.create({
        data: {
          postId: post2.id,
          tagId: javascriptTag.id
        }
      })

      // Post with only Node.js tag (should not be displayed)
      const post3 = await prisma.post.create({
        data: {
          title: 'Node Post',
          slug: 'node-post',
          content: '# Node',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      await prisma.postTag.create({
        data: {
          postId: post3.id,
          tagId: nodejsTag.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/tag/javascript'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('JavaScript')
      expect(response.payload).toContain('JS Post 1')
      expect(response.payload).toContain('JS Post 2')
      expect(response.payload).not.toContain('Node Post')
    })

    it('should not display draft posts', async () => {
      // Public post
      const publishedPost = await prisma.post.create({
        data: {
          title: 'Published Post',
          slug: 'published-post',
          content: '# Published',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      await prisma.postTag.create({
        data: {
          postId: publishedPost.id,
          tagId: javascriptTag.id
        }
      })

      // Draft post
      const draftPost = await prisma.post.create({
        data: {
          title: 'Draft Post',
          slug: 'draft-post',
          content: '# Draft',
          published: false,
          authorId: testUser.id
        }
      })

      await prisma.postTag.create({
        data: {
          postId: draftPost.id,
          tagId: javascriptTag.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/tag/javascript'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Published Post')
      expect(response.payload).not.toContain('Draft Post')
    })

    it('should return 404 for non-existent tag', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/tag/non-existent'
      })

      expect(response.statusCode).toBe(404)
    })

    it('should display empty status for tag with no posts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/tag/javascript'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('JavaScript')
      expect(response.payload).toContain('No posts yet')
    })

    it('should have link to detail page in post title', async () => {
      // Create post with tag
      const post = await prisma.post.create({
        data: {
          title: 'Test Post with Link',
          slug: 'test-post-link',
          content: '# Test',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      await prisma.postTag.create({
        data: {
          postId: post.id,
          tagId: javascriptTag.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/tag/javascript'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Test Post with Link')
      // Should have link to post detail page
      expect(response.payload).toContain('/blog/test-post-link')
    })

    it('should have link to category page in category', async () => {
      // Create category
      const category = await prisma.category.create({
        data: {
          name: 'Tech',
          slug: 'tech'
        }
      })

      // Create post with category and tag
      const post = await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          content: '# Test',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: category.id
        }
      })

      await prisma.postTag.create({
        data: {
          postId: post.id,
          tagId: javascriptTag.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/tag/javascript'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Tech')
      // Should have link to category page
      expect(response.payload).toContain('/blog/category/tech')
    })
  })
})
