export default async (ctx, req, res) => {
  // req.currentUser already set by loadCurrentUser middleware
  if (!req.currentUser) {
    return res.redirect('/auth/login')
  }

  // Check inactive account
  if (!req.currentUser.isActive) {
    req.session.destroy()
    return res.redirect('/auth/login')
  }

  // Check admin permission
  if (req.currentUser.role !== 'admin') {
    return res.status(403).send('Permission denied.')
  }

  // Copy to ctx (for use within Feature)
  ctx.currentUser = req.currentUser
}
