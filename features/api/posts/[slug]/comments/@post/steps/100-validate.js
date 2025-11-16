export default async (ctx, req, res) => {
  const { authorName, authorEmail, content } = req.body

  // Validate required fields
  if (!authorName || !authorName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'authorName is required'
    })
  }

  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      error: 'content is required'
    })
  }

  // Save validated data to context
  ctx.commentData = {
    authorName: authorName.trim(),
    authorEmail: authorEmail?.trim() || null,
    content: content.trim()
  }
}
