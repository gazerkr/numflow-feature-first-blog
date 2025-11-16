import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { title, content, categoryId, tagIds, published } = req.body
  const postId = req.params.id

  // Validate required fields
  if (!title || !title.trim()) {
    // Reload post, category, and tag information
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })

    const tags = await prisma.tag.findMany({
      orderBy: [{ name: 'asc' }]
    })

    const selectedTagIds = post.tags.map(pt => pt.tagId)

    return res.status(400).render('admin/posts/edit', {
      error: 'Please enter a title.',
      post: { ...post, title, content, categoryId, published },
      categories,
      tags,
      selectedTagIds,
      currentUser: req.currentUser
    })
  }

  if (!content || !content.trim()) {
    // Reload post, category, and tag information
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })

    const tags = await prisma.tag.findMany({
      orderBy: [{ name: 'asc' }]
    })

    const selectedTagIds = post.tags.map(pt => pt.tagId)

    return res.status(400).render('admin/posts/edit', {
      error: 'Please enter content.',
      post: { ...post, title, content, categoryId, published },
      categories,
      tags,
      selectedTagIds,
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
