import { hashPassword } from '#lib/auth.js'
import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { username, email, password, displayName } = ctx.validatedData

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create administrator account
  const admin = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      displayName,
      role: 'admin',
      isActive: true
    }
  })

  ctx.admin = admin
}
