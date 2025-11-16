export default async (ctx, req, res) => {
  res.render('blog/post', {
    title: ctx.post.title,
    post: ctx.post,
    comments: ctx.comments || [],
    currentUser: req.currentUser || null
  })
}
