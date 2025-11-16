import { prisma } from './prisma.js'
import { slugify } from 'transliteration'

/**
 * Convert string to URL-friendly slug and generate unique slug if duplicate
 * @param {string} text - Text to convert
 * @param {string} modelName - Model name ('post', 'tag', 'category')
 * @returns {Promise<string>} Unique slug
 */
export async function generateUniqueSlug(text, modelName = 'post') {
  // Model mapping (direct mapping as prisma['post'] doesn't work)
  const modelMap = {
    'post': prisma.post,
    'tag': prisma.tag,
    'category': prisma.category
  }

  const model = modelMap[modelName]
  if (!model) {
    throw new Error(`Unknown model: ${modelName}`)
  }

  // Use transliteration to convert various languages including Korean to Latin alphabet
  // slugify automatically converts to lowercase, removes special chars, replaces spaces with hyphens
  let baseSlug = slugify(text, {
    lowercase: true,
    separator: '-',
    trim: true
  })

  // Remove leading/trailing hyphens
  baseSlug = baseSlug.replace(/^-+|-+$/g, '')

  // Use default value if slug is empty
  if (!baseSlug || baseSlug.length === 0) {
    baseSlug = 'untitled'
  }

  // Check for duplicates and add number if needed
  let currentSlug = baseSlug
  let counter = 2

  while (await model.findUnique({ where: { slug: currentSlug } })) {
    currentSlug = `${baseSlug}-${counter}`
    counter++
  }

  return currentSlug
}
