// Home page - Fetch post list
import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  // From database Fetch only published posts
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      createdAt: true,
    }
  })

  ctx.posts = posts
}
