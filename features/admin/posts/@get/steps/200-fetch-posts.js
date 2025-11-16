import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  // Fetch post list (Published descending order, including category)
  ctx.posts = await prisma.post.findMany({
    include: {
      category: true,
      author: {
        select: {
          displayName: true
        }
      }
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}
