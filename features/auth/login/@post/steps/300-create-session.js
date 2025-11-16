export default async (ctx, req, res) => {
  // Save user ID to session
  req.session.userId = ctx.user.id
}
