export default async (ctx, req, res) => {
  res.render('auth/login', {
    error: null,
    formData: null
  })
}
