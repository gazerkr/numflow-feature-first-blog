/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../../lib/markdown.js'

describe('lib/markdown.js', () => {
  describe('renderMarkdown', () => {
    it('should convert basic markdown to HTML', () => {
      const markdown = '# Hello World\n\nThis is **bold** text.'
      const html = renderMarkdown(markdown)

      expect(html).toContain('<h1>')
      expect(html).toContain('Hello World')
      expect(html).toContain('<strong>bold</strong>')
    })

    it('should render code blocks', () => {
      const markdown = '```javascript\nconst foo = "bar"\n```'
      const html = renderMarkdown(markdown)

      expect(html).toContain('<code')
      expect(html).toContain('const foo')
    })

    it('should render links', () => {
      const markdown = '[Google](https://google.com)'
      const html = renderMarkdown(markdown)

      expect(html).toContain('<a')
      expect(html).toContain('href="https://google.com"')
      expect(html).toContain('Google')
    })

    it('should return empty string for empty string', () => {
      const html = renderMarkdown('')
      expect(html).toBe('')
    })

    it('should return empty string for null', () => {
      const html = renderMarkdown(null)
      expect(html).toBe('')
    })

    it('should return empty string for undefined', () => {
      const html = renderMarkdown(undefined)
      expect(html).toBe('')
    })

    it('should defend against XSS attacks (remove script tags)', () => {
      const markdown = '<script>alert("XSS")</script>\n\n# Hello'
      const html = renderMarkdown(markdown)

      // DOMPurify should remove script tag
      expect(html).not.toContain('<script>')
      expect(html).not.toContain('alert')
      expect(html).toContain('Hello')
    })

    it('should defend against XSS attacks (remove onerror attribute)', () => {
      const markdown = '<img src="x" onerror="alert(1)">\n\n# Test'
      const html = renderMarkdown(markdown)

      // DOMPurify should remove onerror attribute
      expect(html).not.toContain('onerror')
      expect(html).not.toContain('alert')
    })

    it('should keep safe HTML as-is', () => {
      const markdown = '# Hello\n\n<div>Safe HTML</div>'
      const html = renderMarkdown(markdown)

      expect(html).toContain('Hello')
      expect(html).toContain('<div>')
      expect(html).toContain('Safe HTML')
    })
  })
})
