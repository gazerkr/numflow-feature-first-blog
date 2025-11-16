import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const [totalPosts, publishedPosts, totalViewsResult] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.post.aggregate({
      _sum: { viewCount: true }
    })
  ])

  ctx.stats = {
    totalPosts,
    publishedPosts,
    totalViews: totalViewsResult._sum.viewCount || 0
  }
}
