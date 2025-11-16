import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const categoryId = req.params.id

  try {
    await prisma.category.delete({
      where: { id: categoryId }
    })
  } catch (error) {
    // categoryIgnore if not found
    if (error.code === 'P2025') {
      // Not found
      return res.redirect('/admin/categories')
    }
    throw error
  }
}
