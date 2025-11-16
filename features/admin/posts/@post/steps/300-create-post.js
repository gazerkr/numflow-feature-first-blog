import { prisma } from '#lib/prisma.js'
import { generateUniqueSlug } from '../../../../../lib/utils.js'
import { renderMarkdown } from '../../../../../lib/markdown.js'

export default async (ctx, req, res) => {
  const { title, content, categoryId, tagIds, published } = ctx.postData

  try {
    // Create slug
    const slug = await generateUniqueSlug(title, 'post')

    // Convert Markdown to HTML
    const contentHtml = renderMarkdown(content)

    // Post creation data
    const postCreateData = {
      title,
      slug,
      content,
      contentHtml,
      published,
      publishedAt: published ? new Date() : null,
      authorId: req.currentUser.id,
      categoryId: categoryId || null
    }

    // tagand Create post with
    if (tagIds.length > 0) {
      postCreateData.tags = {
        create: tagIds.map(tagId => ({
          tagId
        }))
      }
    }

    ctx.post = await prisma.post.create({
      data: postCreateData
    })
  } catch (error) {
    console.error('Post creation error:', error)

    // Reload category and tag lists
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })
    const tags = await prisma.tag.findMany({
      orderBy: [{ name: 'asc' }]
    })

    return res.status(400).render('admin/posts/new', {
      error: 'post create error occurred.',
      formData: req.body,
      categories,
      tags,
      currentUser: req.currentUser
    })
  }
}
