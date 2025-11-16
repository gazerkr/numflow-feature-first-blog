import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  // category Fetch list (order Sort by order)
  ctx.categories = await prisma.category.findMany({
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' }
    ]
  })
}
