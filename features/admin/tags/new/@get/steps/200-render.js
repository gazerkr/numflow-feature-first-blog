export default async (ctx, req, res) => {
  res.render('admin/tags/new', {
    error: null,
    formData: {}
  })
}
