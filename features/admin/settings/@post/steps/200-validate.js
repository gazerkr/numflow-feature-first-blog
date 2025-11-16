import { prisma } from '#lib/prisma.js'
import { validateEmail, validatePassword } from '../../../../../lib/validators.js'

export default async (ctx, req, res) => {
  const { blogName, blogDescription, displayName, email, currentPassword, newPassword, newPasswordConfirm } = req.body
  const errors = []

  // Validate blog information
  if (!blogName || blogName.trim().length === 0) {
    errors.push('Please enter blog name.')
  }

  // Validate user profile
  if (!displayName || displayName.trim().length === 0) {
    errors.push('Please enter display name.')
  }

  if (!validateEmail(email)) {
    errors.push('Please enter a valid email.')
  }

  // Validate password change (optional)
  if (currentPassword || newPassword || newPasswordConfirm) {
    if (!currentPassword) {
      errors.push('Please enter current password.')
    }

    if (!newPassword) {
      errors.push('Please enter new password.')
    }

    if (!newPasswordConfirm) {
      errors.push('Please enter new password confirmation.')
    }

    if (newPassword && newPasswordConfirm && newPassword !== newPasswordConfirm) {
      errors.push('Passwords do not match.')
    }

    if (newPassword) {
      const passwordErrors = validatePassword(newPassword)
      errors.push(...passwordErrors)
    }
  }

  if (errors.length > 0) {
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
      errors,
      successMessage: null
    })
  }

  ctx.validatedData = {
    blogName: blogName.trim(),
    blogDescription: blogDescription?.trim() || '',
    displayName: displayName.trim(),
    email: email.trim(),
    currentPassword,
    newPassword
  }
}
