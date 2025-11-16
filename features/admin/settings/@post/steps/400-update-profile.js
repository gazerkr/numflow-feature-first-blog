import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { displayName, email } = ctx.validatedData

  // Update user profile
  await prisma.user.update({
    where: { id: ctx.currentUser.id },
    data: {
      displayName,
      email
    }
  })
}
