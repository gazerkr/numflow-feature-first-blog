import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const postId = req.params.id

  // Fetch post (including tags)
  ctx.post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  if (!ctx.post) {
    return res.status(404).send('Post not found')
  }

  // categoryand tag Fetch list
  ctx.categories = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }]
  })

  ctx.tags = await prisma.tag.findMany({
    orderBy: [{ name: 'asc' }]
  })
}
