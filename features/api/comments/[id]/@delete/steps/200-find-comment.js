import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { id } = req.params

  // Find comment
  const comment = await prisma.comment.findUnique({
    where: { id }
  })

  if (!comment) {
    return res.status(404).json({
      success: false,
      error: 'Comment not found'
    })
  }

  ctx.comment = comment
}
