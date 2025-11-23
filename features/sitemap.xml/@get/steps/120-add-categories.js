import { prisma } from '#lib/prisma.js'

/**
 * Add category pages to sitemap
 * Single Responsibility: Fetch and add category URLs
 */
export default async (ctx, req, res) => {
  const { baseUrl } = ctx
  const today = new Date().toISOString().split('T')[0]

  // Fetch all categories
  const categories = await prisma.category.findMany({
    select: {
      slug: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Add each category to URLs
  categories.forEach(category => {
    ctx.urls.push({
      loc: `${baseUrl}/blog/category/${category.slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.6'
    })
  })
}
