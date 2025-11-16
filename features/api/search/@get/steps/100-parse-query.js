export default async (ctx, req, res) => {
  // Extract query parameters
  const searchQuery = req.query.q || ''
  const page = parseInt(req.query.page) || 1
  const perPage = parseInt(req.query.perPage) || 10

  // Save to context
  ctx.searchQuery = searchQuery
  ctx.page = page
  ctx.perPage = perPage
  ctx.skip = (page - 1) * perPage
}
