export default async (ctx, req, res) => {
  const { name, slug, description, order } = req.body

  // Check required fields
  if (!name || name.trim() === '') {
    return res.status(400).render('admin/categories/new', {
      error: 'Category name is required.',
      formData: req.body
    })
  }

  // Validate slug (only if provided)
  if (slug && slug.trim() !== '') {
    const slugPattern = /^[a-z0-9-]+$/
    if (!slugPattern.test(slug.trim())) {
      return res.status(400).render('admin/categories/new', {
        error: 'Slug can only contain lowercase letters, numbers, and hyphens (-).',
        formData: req.body
      })
    }
  }

  ctx.categoryData = {
    name: name.trim(),
    slug: slug?.trim() || null,
    description: description?.trim() || null,
    order: order ? parseInt(order) : 0
  }
}
