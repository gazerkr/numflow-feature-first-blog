import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { slug } = req.params

  // Find post
  const post = await prisma.post.findUnique({
    where: {
      slug,
      published: true  // Only allow comments on published posts
    }
  })

  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    })
  }

  ctx.post = post
}
