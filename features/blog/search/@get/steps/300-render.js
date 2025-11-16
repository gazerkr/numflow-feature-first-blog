export default async (ctx, req, res) => {
  const { posts, searchQuery, page, perPage, total, totalPages } = ctx

  res.render('blog/search', {
    posts,
    searchQuery,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  })
}
