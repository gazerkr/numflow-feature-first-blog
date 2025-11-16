import { prisma } from '#lib/prisma.js'
import { generateUniqueSlug } from '../../../../../../lib/utils.js'
import { renderMarkdown } from '../../../../../../lib/markdown.js'

export default async (ctx, req, res) => {
  const postId = req.params.id
  const { title, content, categoryId, tagIds, published } = ctx.postData

  try {
    // Fetch existing post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!existingPost) {
      return res.status(404).send('Post not found')
    }

    // Create slug (titleif changed or missing)
    let slug = existingPost.slug
    if (!slug || title !== existingPost.title) {
      slug = await generateUniqueSlug(title, 'post')
    }

    // Convert Markdown to HTML
    const contentHtml = renderMarkdown(content)

    // Check published status change
    let publishedAt = existingPost.publishedAt
    if (published && !existingPost.published) {
      // Draft -> Published: Set publishedAt
      publishedAt = new Date()
    } else if (!published) {
      // Published -> Draft: publishedAt null
      publishedAt = null
    }

    // Delete existing tag relations
    await prisma.postTag.deleteMany({
      where: { postId }
    })

    // post update
    const postUpdateData = {
      title,
      slug,
      content,
      contentHtml,
      published,
      publishedAt,
      categoryId: categoryId || null
    }

    // Create new tag relations
    if (tagIds.length > 0) {
      postUpdateData.tags = {
        create: tagIds.map(tagId => ({
          tagId
        }))
      }
    }

    ctx.post = await prisma.post.update({
      where: { id: postId },
      data: postUpdateData
    })
  } catch (error) {
    console.error('Post update error:', error)

    // post, category, tag Reload information
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
      error: 'post update error occurred.',
      post,
      categories,
      tags,
      selectedTagIds,
      currentUser: req.currentUser
    })
  }
}
