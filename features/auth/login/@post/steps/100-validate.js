export default async (ctx, req, res) => {
  const { username, password } = req.body

  // Validate required fields
  if (!username || !password) {
    return res.status(400).render('auth/login', {
      error: 'All required fields must be filled in.',
      formData: req.body
    })
  }

  ctx.credentials = { username, password }
}
