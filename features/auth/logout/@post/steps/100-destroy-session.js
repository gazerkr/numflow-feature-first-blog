export default async (ctx, req, res) => {
  // Destroy session
  if (req.session) {
    req.session.destroy()
  }
}
