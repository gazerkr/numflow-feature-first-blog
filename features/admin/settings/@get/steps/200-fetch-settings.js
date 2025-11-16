import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  // Fetch blog settings
  const blogName = await prisma.setting.findUnique({
    where: { key: 'blog.name' }
  })

  const blogDescription = await prisma.setting.findUnique({
    where: { key: 'blog.description' }
  })

  ctx.settings = {
    blogName: blogName?.value || '',
    blogDescription: blogDescription?.value || ''
  }
}
