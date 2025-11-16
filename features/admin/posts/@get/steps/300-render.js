export default async (ctx, req, res) => {
  res.render('admin/posts/index', {
    posts: ctx.posts,
    currentUser: req.currentUser
  })
}
