import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { slug } = req.params

  // Fetch tag
  const tag = await prisma.tag.findUnique({
    where: { slug: slug }
  })

  // Return 404 if tag not found
  if (!tag) {
    return res.status(404).send('Tag not found')
  }

  // Pagination settings
  const page = parseInt(req.query.page) || 1
  const perPage = 10
  const skip = (page - 1) * perPage

  // Fetch published posts with this tag and calculate total count
  const [postTags, total] = await Promise.all([
    prisma.postTag.findMany({
      where: {
        tagId: tag.id,
        post: {
          published: true
        }
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                displayName: true
              }
            },
            category: true
          }
        }
      },
      orderBy: {
        post: {
          publishedAt: 'desc'
        }
      },
      skip,
      take: perPage
    }),
    prisma.postTag.count({
      where: {
        tagId: tag.id,
        post: {
          published: true
        }
      }
    })
  ])

  // Extract posts from postTags
  const posts = postTags.map(pt => pt.post)

  const totalPages = Math.ceil(total / perPage)

  ctx.tag = tag
  ctx.posts = posts
  ctx.pagination = {
    page,
    perPage,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}
