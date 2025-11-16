import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { prisma } from '../setup.js'
import { hashPassword } from '../../lib/auth.js'

describe('Form Data Encoding Feature', () => {
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

  describe('POST /admin/posts with form-encoded data', () => {
    it('should properly save spaces in title and content', async () => {
      // Encode spaces as + like real browser form submission
      // Browsers encode spaces as + when sending application/x-www-form-urlencoded
      const response = await app.inject({
        method: 'POST',
        url: '/admin/posts',
        payload: 'title=Test+Post&content=%23+Heading+1%0A%0AThis+is+a+test.&published=true',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(302) // Redirect

      // Check post in database
      const post = await prisma.post.findFirst({
        orderBy: { createdAt: 'desc' }
      })

      expect(post).toBeDefined()
      expect(post.title).toBe('Test Post')
      expect(post.content).toContain('# Heading 1')
      expect(post.content).not.toContain('#+Heading') // Should not have +
      expect(post.content).not.toContain('#Heading') // Should have space
    })

    it('should properly convert markdown headers to HTML', async () => {
      // Encode spaces as + like real browser
      const response = await app.inject({
        method: 'POST',
        url: '/admin/posts',
        payload: 'title=Markdown+Test&content=%23+Header+1%0A%23%23+Header+2%0A%23%23%23+Header+3&published=true',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(302)

      // Check post in database
      const post = await prisma.post.findFirst({
        orderBy: { createdAt: 'desc' }
      })

      expect(post).toBeDefined()
      expect(post.contentHtml).toContain('<h1')
      expect(post.contentHtml).toContain('Header 1')
      expect(post.contentHtml).toContain('<h2')
      expect(post.contentHtml).toContain('Header 2')
      expect(post.contentHtml).toContain('<h3')
      expect(post.contentHtml).toContain('Header 3')
    })

    it('should properly handle complex markdown syntax', async () => {
      const markdownContent = `# Title
## Subtitle
- List item 1
- List item 2

**Bold text** and *italic text*.`

      // Encode as application/x-www-form-urlencoded format (spaces as +)
      const encodedContent = encodeURIComponent(markdownContent).replace(/%20/g, '+')

      const response = await app.inject({
        method: 'POST',
        url: '/admin/posts',
        payload: `title=Complex+Markdown&content=${encodedContent}&published=true`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: sessionCookie
        }
      })

      expect(response.statusCode).toBe(302)

      const post = await prisma.post.findFirst({
        orderBy: { createdAt: 'desc' }
      })

      expect(post).toBeDefined()
      expect(post.content).toContain('# Title')
      expect(post.content).toContain('## Subtitle')
      expect(post.content).toContain('- List item 1')
      expect(post.contentHtml).toContain('<h1')
      expect(post.contentHtml).toContain('<h2')
      expect(post.contentHtml).toContain('<ul')
      expect(post.contentHtml).toContain('<strong>')
      expect(post.contentHtml).toContain('<em>')
    })
  })
})
