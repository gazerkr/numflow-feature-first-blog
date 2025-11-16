export default async (ctx, req, res) => {
  if (!req.currentUser) {
    return res.redirect('/auth/login')
  }
}
