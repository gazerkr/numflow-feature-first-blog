import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { slug } = req.params

  // Fetch post (published only, include author/category/tags)
  const post = await prisma.post.findFirst({
    where: {
      slug: slug,
      published: true
    },
    include: {
      author: {
        select: {
          displayName: true
        }
      },
      category: true,
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  // Return 404 if post not found or not published
  if (!post) {
    return res.status(404).send('Post not found')
  }

  // Increment view count
  await prisma.post.update({
    where: { id: post.id },
    data: {
      viewCount: {
        increment: 1
      }
    }
  })

  ctx.post = post
}
