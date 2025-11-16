export default async (ctx, req, res) => {
  // Extract selected tag IDs
  const selectedTagIds = ctx.post.tags.map(pt => pt.tagId)

  res.render('admin/posts/edit', {
    post: ctx.post,
    categories: ctx.categories,
    tags: ctx.tags,
    selectedTagIds,
    currentUser: req.currentUser,
    error: null
  })
}
