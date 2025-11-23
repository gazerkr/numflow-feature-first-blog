/**
 * Add static pages to sitemap
 * Single Responsibility: Homepage, Blog list, About page
 */
export default async (ctx, req, res) => {
  const { baseUrl } = ctx
  const today = new Date().toISOString().split('T')[0]

  // Homepage
  ctx.urls.push({
    loc: `${baseUrl}/`,
    lastmod: today,
    changefreq: 'daily',
    priority: '1.0'
  })

  // Blog list page
  ctx.urls.push({
    loc: `${baseUrl}/blog`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.9'
  })

  // About page
  ctx.urls.push({
    loc: `${baseUrl}/about`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.5'
  })
}
