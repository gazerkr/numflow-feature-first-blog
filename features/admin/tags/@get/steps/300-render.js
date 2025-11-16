export default async (ctx, req, res) => {
  res.render('admin/tags/index', {
    tags: ctx.tags
  })
}
