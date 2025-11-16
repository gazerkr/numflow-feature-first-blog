export default async (ctx, req, res) => {
  res.render('admin/posts/new', {
    categories: ctx.categories,
    tags: ctx.tags,
    currentUser: req.currentUser,
    formData: {},
    error: null
  })
}
