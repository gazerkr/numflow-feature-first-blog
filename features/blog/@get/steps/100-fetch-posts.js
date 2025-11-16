import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  // Pagination settings
  const page = parseInt(req.query.page) || 1
  const perPage = 10
  const skip = (page - 1) * perPage

  // Fetch published posts and calculate total count
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true
      },
      include: {
        author: {
          select: {
            displayName: true
          }
        },
        category: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip,
      take: perPage
    }),
    prisma.post.count({
      where: {
        published: true
      }
    })
  ])

  const totalPages = Math.ceil(total / perPage)

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
