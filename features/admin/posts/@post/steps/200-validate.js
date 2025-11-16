import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { title, content, categoryId, tagIds, published } = req.body

  // Validate required fields
  if (!title || !title.trim()) {
    // Reload category and tag lists
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })
    const tags = await prisma.tag.findMany({
      orderBy: [{ name: 'asc' }]
    })

    return res.status(400).render('admin/posts/new', {
      error: 'Please enter a title.',
      formData: req.body,
      categories,
      tags,
      currentUser: req.currentUser
    })
  }

  if (!content || !content.trim()) {
    // Reload category and tag lists
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })
    const tags = await prisma.tag.findMany({
      orderBy: [{ name: 'asc' }]
    })

    return res.status(400).render('admin/posts/new', {
      error: 'Please enter content.',
      formData: req.body,
      categories,
      tags,
      currentUser: req.currentUser
    })
  }

  // Store validated data
  ctx.postData = {
    title: title.trim(),
    content: content.trim(),
    categoryId: categoryId || null,
    tagIds: Array.isArray(tagIds) ? tagIds : (tagIds ? [tagIds] : []),
    published: published === 'true'
  }
}
