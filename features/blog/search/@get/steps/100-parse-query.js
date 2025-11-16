export default async (ctx, req, res) => {
  // Parse search query (q parameter)
  const query = req.query.q || ''

  // Parse page
  const page = parseInt(req.query.page) || 1
  const perPage = 10

  // Save to context
  ctx.searchQuery = query.trim()
  ctx.page = page
  ctx.perPage = perPage
  ctx.skip = (page - 1) * perPage
}
