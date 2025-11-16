import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { post, commentData } = ctx

  // Create comment
  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      authorName: commentData.authorName,
      authorEmail: commentData.authorEmail,
      content: commentData.content
    }
  })

  ctx.comment = comment
}
