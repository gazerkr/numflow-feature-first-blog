// Login check middleware
export const requireAuth = (req, res, next) => {
  if (!req.currentUser) {
    return res.redirect('/auth/login')
  }
  next()
}

// Admin check middleware
export const requireAdmin = (req, res, next) => {
  if (!req.currentUser) {
    return res.redirect('/auth/login')
  }

  if (req.currentUser.role !== 'admin') {
    return res.status(403).send('Permission denied.')
  }

  next()
}
