// Load environment variables first
import { config } from 'dotenv'
config({ path: '.env.test' })

import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../../app.js'
import { prisma } from '../../../lib/prisma.js'
import { hashPassword } from '../../../lib/auth.js'

describe('Blog Post Detail Feature', () => {
  let testUser
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

    // Mark as installed
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

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech posts'
      }
    })

    // Create test tags
    testTag1 = await prisma.tag.create({
      data: {
        name: 'JavaScript',
        slug: 'javascript'
      }
    })

    testTag2 = await prisma.tag.create({
      data: {
        name: 'Node.js',
        slug: 'nodejs'
      }
    })
  })

  describe('GET /blog/:slug', () => {
    it('should display published post detail', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          content: '# Hello World\n\nThis is **bold** text.',
          contentHtml: '<h1>Hello World</h1>\n<p>This is <strong>bold</strong> text.</p>',
          published: true,
          publishedAt: new Date('2024-01-15'),
          authorId: testUser.id,
          categoryId: testCategory.id,
          tags: {
            create: [
              { tagId: testTag1.id },
              { tagId: testTag2.id }
            ]
          }
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/test-post'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Test Post')
      expect(response.payload).toContain('Hello World')
      expect(response.payload).toContain('<strong>bold</strong>')
      expect(response.payload).toContain('Test Author')
      expect(response.payload).toContain('Technology')
      expect(response.payload).toContain('JavaScript')
      expect(response.payload).toContain('Node.js')
    })

    it('should increment view count', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'View Count Test',
          slug: 'view-count-test',
          content: '# Content',
          contentHtml: '<h1>Content</h1>',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          viewCount: 0
        }
      })

      // First view
      await app.inject({
        method: 'GET',
        url: '/blog/view-count-test'
      })

      let updatedPost = await prisma.post.findUnique({
        where: { id: post.id }
      })
      expect(updatedPost.viewCount).toBe(1)

      // Second view
      await app.inject({
        method: 'GET',
        url: '/blog/view-count-test'
      })

      updatedPost = await prisma.post.findUnique({
        where: { id: post.id }
      })
      expect(updatedPost.viewCount).toBe(2)
    })

    it('should return 404 for draft posts', async () => {
      await prisma.post.create({
        data: {
          title: 'Draft Post',
          slug: 'draft-post',
          content: '# Draft',
          contentHtml: '<h1>Draft</h1>',
          published: false,
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/draft-post'
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 404 for non-existent posts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blog/non-existent-post'
      })

      expect(response.statusCode).toBe(404)
    })

    it('should display published date', async () => {
      await prisma.post.create({
        data: {
          title: 'Date Test',
          slug: 'date-test',
          content: '# Content',
          contentHtml: '<h1>Content</h1>',
          published: true,
          publishedAt: new Date('2024-01-15T10:00:00Z'),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/date-test'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('2024')
    })

    it('should have link to category page in category', async () => {
      // Create post with category
      await prisma.post.create({
        data: {
          title: 'Test Post with Category Link',
          slug: 'test-post-category-link',
          content: '# Test',
          contentHtml: '<h1>Test</h1>',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id,
          categoryId: testCategory.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/test-post-category-link'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Technology')
      // Should have link to category page
      expect(response.payload).toContain('/blog/category/technology')
    })
  })

  describe('Comments UI on Post Page', () => {
    it('should display comments section', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Post with Comments',
          slug: 'post-with-comments',
          content: '# Content',
          contentHtml: '<h1>Content</h1>',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/post-with-comments'
      })

      expect(response.statusCode).toBe(200)
      // Check comments section title
      expect(response.payload).toContain('Comments')
    })

    it('should display comment form', async () => {
      await prisma.post.create({
        data: {
          title: 'Post with Comment Form',
          slug: 'post-with-comment-form',
          content: '# Content',
          contentHtml: '<h1>Content</h1>',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/post-with-comment-form'
      })

      expect(response.statusCode).toBe(200)
      // Check comment form fields
      expect(response.payload).toContain('name="authorName"')
      expect(response.payload).toContain('name="authorEmail"')
      expect(response.payload).toContain('name="content"')
    })

    it('should display existing comments', async () => {
      const post = await prisma.post.create({
        data: {
          title: 'Post with Existing Comments',
          slug: 'post-with-existing-comments',
          content: '# Content',
          contentHtml: '<h1>Content</h1>',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      // Create comments
      await prisma.comment.createMany({
        data: [
          {
            postId: post.id,
            authorName: 'Visitor 1',
            content: 'First comment'
          },
          {
            postId: post.id,
            authorName: 'Visitor 2',
            authorEmail: 'visitor2@example.com',
            content: 'Second comment'
          }
        ]
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/post-with-existing-comments'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Visitor 1')
      expect(response.payload).toContain('First comment')
      expect(response.payload).toContain('Visitor 2')
      expect(response.payload).toContain('Second comment')
    })

    it('should display message when no comments', async () => {
      await prisma.post.create({
        data: {
          title: 'Post without Comments',
          slug: 'post-without-comments',
          content: '# Content',
          contentHtml: '<h1>Content</h1>',
          published: true,
          publishedAt: new Date(),
          authorId: testUser.id
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/blog/post-without-comments'
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Be the first to comment')
    })
  })
})
