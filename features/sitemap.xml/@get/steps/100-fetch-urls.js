import { prisma } from '#lib/prisma.js'

/**
 * Fetch all URLs for sitemap
 * - Static pages (homepage, blog, about)
 * - Published posts
 * - Categories
 * - Tags
 */
export default async (ctx, req, res) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5555'

  // Initialize urls array
  ctx.urls = []

  // 1. Static pages
  ctx.urls.push({
    loc: `${baseUrl}/`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: '1.0'
  })

  ctx.urls.push({
    loc: `${baseUrl}/blog`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: '0.9'
  })

  ctx.urls.push({
    loc: `${baseUrl}/about`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: '0.5'
  })

  // 2. Published posts
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

  posts.forEach(post => {
    ctx.urls.push({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    })
  })

  // 3. Categories
  const categories = await prisma.category.findMany({
    select: {
      slug: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  categories.forEach(category => {
    ctx.urls.push({
      loc: `${baseUrl}/blog/category/${category.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.6'
    })
  })

  // 4. Tags
  const tags = await prisma.tag.findMany({
    select: {
      slug: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  tags.forEach(tag => {
    ctx.urls.push({
      loc: `${baseUrl}/blog/tag/${tag.slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.6'
    })
  })
}
