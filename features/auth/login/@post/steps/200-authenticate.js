import { prisma } from '#lib/prisma.js'
import { verifyPassword } from '#lib/auth.js'

export default async (ctx, req, res) => {
  const { username, password } = ctx.credentials

  // Find user
  const user = await prisma.user.findUnique({
    where: { username }
  })

  if (!user) {
    return res.status(400).render('auth/login', {
      error: 'Invalid username or password. (User does not exist)',
      formData: req.body
    })
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password)
  if (!isPasswordValid) {
    return res.status(400).render('auth/login', {
      error: 'Invalid username or password.',
      formData: req.body
    })
  }

  // Check active status
  if (!user.isActive) {
    return res.status(400).render('auth/login', {
      error: 'Account is deactivated. Please contact administrator.',
      formData: req.body
    })
  }

  ctx.user = user
}
