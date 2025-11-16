export default async (ctx, req, res) => {
  res.render('admin/categories/new', {
    error: null,
    formData: {}
  })
}
