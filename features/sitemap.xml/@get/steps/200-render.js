/**
 * Render sitemap.xml using EJS template
 */
export default async (ctx, req, res) => {
  // Set XML content type
  res.set('Content-Type', 'application/xml; charset=utf-8')

  // Render sitemap template with URLs
  res.render('sitemap', {
    urls: ctx.urls
  })
}
