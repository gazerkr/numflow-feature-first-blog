export default async (ctx, req, res) => {
  res.render('blog/index', {
    title: 'Blog',
    posts: ctx.posts || [],
    pagination: ctx.pagination || { page: 1, totalPages: 1, hasNext: false, hasPrev: false },
    currentUser: req.currentUser || null
  })
}
