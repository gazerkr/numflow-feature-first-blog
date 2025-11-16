export default async (ctx, req, res) => {
  res.render('admin/settings', {
    settings: ctx.settings,
    currentUser: ctx.currentUser,
    errors: [],
    successMessage: null
  })
}
