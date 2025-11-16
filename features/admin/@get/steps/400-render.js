export default async (ctx, req, res) => {
  res.render('admin/dashboard', {
    stats: ctx.stats,
    recentPosts: ctx.recentPosts,
    currentUser: ctx.currentUser
  })
}
