export default async (ctx, req, res) => {
  const { comments } = ctx

  return res.status(200).json({
    success: true,
    comments
  })
}
