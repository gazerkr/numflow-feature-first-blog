import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { blogName, blogDescription } = ctx.validatedData

  // Update blog settings
  await prisma.setting.upsert({
    where: { key: 'blog.name' },
    update: { value: blogName },
    create: { key: 'blog.name', value: blogName, type: 'string' }
  })

  await prisma.setting.upsert({
    where: { key: 'blog.description' },
    update: { value: blogDescription },
    create: { key: 'blog.description', value: blogDescription, type: 'string' }
  })
}
