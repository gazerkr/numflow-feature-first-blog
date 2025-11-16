import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      category: true
    }
  })

  ctx.recentPosts = recentPosts
}
