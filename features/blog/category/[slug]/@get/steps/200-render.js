export default async (ctx, req, res) => {
  res.render('blog/category', {
    title: `${ctx.category.name} - Category`,
    category: ctx.category,
    posts: ctx.posts || [],
    pagination: ctx.pagination || { page: 1, totalPages: 1, hasNext: false, hasPrev: false }
  })
}
