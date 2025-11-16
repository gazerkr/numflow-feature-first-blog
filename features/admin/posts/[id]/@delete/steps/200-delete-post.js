import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const postId = req.params.id

  try {
    await prisma.post.delete({
      where: { id: postId }
    })
  } catch (error) {
    // postIgnore if not found
    if (error.code === 'P2025') {
      // Not found
      return res.redirect('/admin/posts')
    }
    throw error
  }
}
