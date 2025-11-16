export default async (ctx, req, res) => {
  const { comment } = ctx

  return res.status(201).json({
    success: true,
    comment
  })
}
