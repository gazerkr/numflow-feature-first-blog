// About page render
export default async (ctx, req, res) => {
  res.render('about', {
    ...ctx.pageData,
    currentUser: req.currentUser || null
  })
}
