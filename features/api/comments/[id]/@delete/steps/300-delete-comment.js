import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { comment } = ctx

  // Delete comment
  await prisma.comment.delete({
    where: { id: comment.id }
  })
}
