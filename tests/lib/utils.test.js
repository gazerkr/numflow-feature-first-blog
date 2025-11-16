import { describe, it, expect, beforeEach } from 'vitest'
import { generateUniqueSlug } from '../../lib/utils.js'
import { prisma } from '../../lib/prisma.js'

describe('lib/utils.js', () => {
  beforeEach(async () => {
    // Clean up test data (relationship order is important)
    await prisma.post.deleteMany()
    await prisma.category.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('generateUniqueSlug', () => {
    it('should create basic slug', async () => {
      const slug = await generateUniqueSlug('Hello World', 'post')
      expect(slug).toBe('hello-world')
    })

    it('should convert non-ASCII characters to romanized', async () => {
      const slug = await generateUniqueSlug('Café München Naïve', 'post')
      expect(slug).toBe('cafe-munchen-naive')
    })

    it('should convert special characters to hyphens', async () => {
      const slug = await generateUniqueSlug('Hello@World!Test', 'post')
      expect(slug).toBe('hello-world-test')
    })

    it('should merge consecutive hyphens into one', async () => {
      const slug = await generateUniqueSlug('Hello   World', 'post')
      expect(slug).toBe('hello-world')
    })

    it('should remove hyphens from both ends', async () => {
      const slug = await generateUniqueSlug('--Hello World--', 'post')
      expect(slug).toBe('hello-world')
    })

    it('should add number if duplicate slug exists', async () => {
      // Create first post
      await prisma.user.create({
        data: {
          username: 'utilstestuser',
          email: 'utils-test@example.com',
          password: 'hashed',
          displayName: 'Utils Test User',
        }
      })

      const user = await prisma.user.findUnique({
        where: { username: 'utilstestuser' }
      })

      await prisma.post.create({
        data: {
          title: 'Hello World',
          slug: 'hello-world',
          content: 'content',
          excerpt: 'excerpt',
          authorId: user.id,
        }
      })

      // Create slug with same title
      const slug = await generateUniqueSlug('Hello World', 'post')
      expect(slug).toBe('hello-world-2')
    })

    it('should keep incrementing number if duplicated multiple times', async () => {
      const user = await prisma.user.create({
        data: {
          username: 'utilstestuser2',
          email: 'utils-test2@example.com',
          password: 'hashed',
          displayName: 'Utils Test User 2',
        }
      })

      // Create hello-world, hello-world-2, hello-world-3
      await prisma.post.create({
        data: {
          title: 'Hello World',
          slug: 'hello-world',
          content: 'content',
          excerpt: 'excerpt',
          authorId: user.id,
        }
      })

      await prisma.post.create({
        data: {
          title: 'Hello World 2',
          slug: 'hello-world-2',
          content: 'content',
          excerpt: 'excerpt',
          authorId: user.id,
        }
      })

      await prisma.post.create({
        data: {
          title: 'Hello World 3',
          slug: 'hello-world-3',
          content: 'content',
          excerpt: 'excerpt',
          authorId: user.id,
        }
      })

      const slug = await generateUniqueSlug('Hello World', 'post')
      expect(slug).toBe('hello-world-4')
    })

    it('should also work with category model', async () => {
      await prisma.category.create({
        data: {
          name: 'Tech',
          slug: 'tech',
          description: 'Tech category',
        }
      })

      const slug = await generateUniqueSlug('Tech', 'category')
      expect(slug).toBe('tech-2')
    })

    it('should also work with tag model', async () => {
      await prisma.tag.create({
        data: {
          name: 'JavaScript',
          slug: 'javascript',
        }
      })

      const slug = await generateUniqueSlug('JavaScript', 'tag')
      expect(slug).toBe('javascript-2')
    })

    it('should throw error when using incorrect model name', async () => {
      await expect(generateUniqueSlug('Test', 'unknown')).rejects.toThrow('Unknown model: unknown')
    })
  })
})
