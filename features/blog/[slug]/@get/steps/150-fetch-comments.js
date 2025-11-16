import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { post } = ctx

  // Fetch comments (oldest first)
  const comments = await prisma.comment.findMany({
    where: {
      postId: post.id
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  ctx.comments = comments
}
