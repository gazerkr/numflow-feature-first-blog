import { prisma } from '#lib/prisma.js'
import { generateUniqueSlug } from '../../../../../lib/utils.js'

export default async (ctx, req, res) => {
  const { name, slug: inputSlug, description, order } = ctx.categoryData

  try {
    // Determine slug: use input if provided, otherwise auto-generate
    let slug
    if (inputSlug) {
      // Check for duplicate slug
      const existingCategory = await prisma.category.findUnique({
        where: { slug: inputSlug }
      })

      if (existingCategory) {
        return res.status(400).render('admin/categories/new', {
          error: 'Slug already exists.',
          formData: req.body
        })
      }

      slug = inputSlug
    } else {
      // Auto-generate
      slug = await generateUniqueSlug(name, 'category')
    }

    // Create category
    ctx.category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        order
      }
    })
  } catch (error) {
    // Handle unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).render('admin/categories/new', {
        error: 'Category name already exists.',
        formData: req.body
      })
    }

    throw error
  }
}
