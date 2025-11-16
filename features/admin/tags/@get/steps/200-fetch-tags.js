import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  // tag Fetch list (Sort by name)
  ctx.tags = await prisma.tag.findMany({
    orderBy: [
      { name: 'asc' }
    ]
  })
}
