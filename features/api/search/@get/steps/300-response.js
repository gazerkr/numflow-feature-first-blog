export default async (ctx, req, res) => {
  const { posts, total, totalPages, page } = ctx

  return res.status(200).json({
    success: true,
    posts,
    total,
    page,
    totalPages
  })
}
