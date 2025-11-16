import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  // categoryand tag Fetch list
  ctx.categories = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }]
  })

  ctx.tags = await prisma.tag.findMany({
    orderBy: [{ name: 'asc' }]
  })
}
