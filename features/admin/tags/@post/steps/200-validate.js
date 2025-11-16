export default async (ctx, req, res) => {
  const { name, slug } = req.body

  // Check required fields
  if (!name || name.trim() === '') {
    return res.status(400).render('admin/tags/new', {
      error: 'Tag name is required.',
      formData: req.body
    })
  }

  // Validate slug (only if provided)
  if (slug && slug.trim() !== '') {
    const slugPattern = /^[a-z0-9-]+$/
    if (!slugPattern.test(slug.trim())) {
      return res.status(400).render('admin/tags/new', {
        error: 'Slug can only contain lowercase letters, numbers, and hyphens (-).',
        formData: req.body
      })
    }
  }

  ctx.tagData = {
    name: name.trim(),
    slug: slug?.trim() || null
  }
}
