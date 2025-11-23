import { prisma } from '#lib/prisma.js'

/**
 * Add tag pages to sitemap
 * Single Responsibility: Fetch and add tag URLs
 */
export default async (ctx, req, res) => {
  const { baseUrl } = ctx
  const today = new Date().toISOString().split('T')[0]

  // Fetch all tags
  const tags = await prisma.tag.findMany({
    select: {
      slug: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Add each tag to URLs
  tags.forEach(tag => {
    ctx.urls.push({
      loc: `${baseUrl}/blog/tag/${tag.slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.6'
    })
  })
}
