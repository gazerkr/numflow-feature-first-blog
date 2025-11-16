import { prisma } from '#lib/prisma.js'
import { generateUniqueSlug } from '../../../../../lib/utils.js'

export default async (ctx, req, res) => {
  const { name, slug: inputSlug } = ctx.tagData

  try {
    // Determine slug: use input if provided, otherwise auto-generate
    let slug
    if (inputSlug) {
      // Check for duplicate slug
      const existingTag = await prisma.tag.findUnique({
        where: { slug: inputSlug }
      })

      if (existingTag) {
        return res.status(400).render('admin/tags/new', {
          error: 'Slug already exists.',
          formData: req.body
        })
      }

      slug = inputSlug
    } else {
      // Auto-generate
      slug = await generateUniqueSlug(name, 'tag')
    }

    // Create tag
    ctx.tag = await prisma.tag.create({
      data: {
        name,
        slug
      }
    })
  } catch (error) {
    // Handle unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).render('admin/tags/new', {
        error: 'Tag name already exists.',
        formData: req.body
      })
    }

    throw error
  }
}
