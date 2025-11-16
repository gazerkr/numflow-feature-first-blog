import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { slug } = req.params

  // Fetch category
  const category = await prisma.category.findUnique({
    where: { slug: slug }
  })

  // Return 404 if category not found
  if (!category) {
    return res.status(404).send('Category not found')
  }

  // Pagination settings
  const page = parseInt(req.query.page) || 1
  const perPage = 10
  const skip = (page - 1) * perPage

  // Fetch published posts in this category and calculate total count
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        categoryId: category.id,
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
        categoryId: category.id,
        published: true
      }
    })
  ])

  const totalPages = Math.ceil(total / perPage)

  ctx.category = category
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
