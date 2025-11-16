import { prisma } from '#lib/prisma.js'
import { verifyPassword, hashPassword } from '#lib/auth.js'

export default async (ctx, req, res) => {
  const { currentPassword, newPassword } = ctx.validatedData

  // Only process if password change is requested
  if (!currentPassword || !newPassword) {
    return
  }

  // Get current user information (including password)
  const user = await prisma.user.findUnique({
    where: { id: ctx.currentUser.id }
  })

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.password)

  if (!isValidPassword) {
    // Get blog settings
    const blogNameSetting = await prisma.setting.findUnique({
      where: { key: 'blog.name' }
    })

    const blogDescriptionSetting = await prisma.setting.findUnique({
      where: { key: 'blog.description' }
    })

    return res.render('admin/settings', {
      settings: {
        blogName: blogNameSetting?.value || '',
        blogDescription: blogDescriptionSetting?.value || ''
      },
      currentUser: ctx.currentUser,
      errors: ['Current password is incorrect.'],
      successMessage: null
    })
  }

  // Hash and update new password
  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: ctx.currentUser.id },
    data: {
      password: hashedPassword
    }
  })
}
