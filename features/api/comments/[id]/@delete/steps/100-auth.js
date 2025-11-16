export default async (ctx, req, res) => {
  // Check if user is logged in
  if (!req.currentUser) {
    return res.redirect('/auth/login')
  }

  // Check administrator permission
  if (req.currentUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden'
    })
  }
}
