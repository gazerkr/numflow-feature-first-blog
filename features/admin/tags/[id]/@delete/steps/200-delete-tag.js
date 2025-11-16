import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const tagId = req.params.id

  try {
    await prisma.tag.delete({
      where: { id: tagId }
    })
  } catch (error) {
    // tagIgnore if not found
    if (error.code === 'P2025') {
      // Not found
      return res.redirect('/admin/tags')
    }
    throw error
  }
}
