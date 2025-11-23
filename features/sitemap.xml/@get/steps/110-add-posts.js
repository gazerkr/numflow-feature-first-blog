import { prisma } from '#lib/prisma.js'

/**
 * Add published blog posts to sitemap
 * Single Responsibility: Fetch and add post URLs
 */
export default async (ctx, req, res) => {
  const { baseUrl } = ctx

  // Fetch all published posts
  const posts = await prisma.post.findMany({
    where: {
      published: true
    },
    select: {
      slug: true,
      updatedAt: true
    },
    orderBy: {
      publishedAt: 'desc'
    }
  })

  // Add each post to URLs
  posts.forEach(post => {
    ctx.urls.push({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    })
  })
}
