import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { searchQuery, skip, perPage } = ctx

  // Build search condition
  const whereCondition = {
    published: true
  }

  // If search query exists, search in title or content
  // SQLite LIKE is case-insensitive by default
  if (searchQuery) {
    whereCondition.OR = [
      {
        title: {
          contains: searchQuery
        }
      },
      {
        content: {
          contains: searchQuery
        }
      }
    ]
  }

  // Search posts and get total count
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: whereCondition,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: perPage,
      include: {
        author: {
          select: { displayName: true }
        },
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    }),
    prisma.post.count({ where: whereCondition })
  ])

  // Save to context
  ctx.posts = posts
  ctx.total = total
  ctx.totalPages = Math.ceil(total / perPage)
}
