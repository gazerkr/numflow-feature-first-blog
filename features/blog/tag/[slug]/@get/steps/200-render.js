export default async (ctx, req, res) => {
  res.render('blog/tag', {
    title: `${ctx.tag.name} - Tag`,
    tag: ctx.tag,
    posts: ctx.posts || [],
    pagination: ctx.pagination || { page: 1, totalPages: 1, hasNext: false, hasPrev: false }
  })
}
