import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

// Markdown configuration
marked.setOptions({
  breaks: true,  // Automatically convert line breaks
  gfm: true,     // GitHub Flavored Markdown
  headerIds: true,
  mangle: false
})

// sanitize-html configuration
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'id'],
    'a': ['href', 'name', 'target'],
    'img': ['src', 'alt', 'title', 'width', 'height']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data']
  }
}

/**
 * Convert Markdown to HTML
 *
 * @param {string} markdown - Markdown text
 * @returns {string} HTML
 */
export function renderMarkdown(markdown) {
  if (!markdown) return ''

  // Convert Markdown to HTML
  const rawHtml = marked(markdown)

  // Sanitize to prevent XSS attacks
  const cleanHtml = sanitizeHtml(rawHtml, sanitizeOptions)

  return cleanHtml
}
