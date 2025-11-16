export default async (ctx, req, res) => {
  res.render('admin/categories/index', {
    categories: ctx.categories
  })
}
