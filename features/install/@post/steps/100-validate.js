import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const { username, email, password, passwordConfirm, displayName } = req.body

  // Check if already installed
  try {
    const installed = await prisma.setting.findUnique({
      where: { key: 'installed' }
    })

    if (installed && installed.value === 'true') {
      return res.status(400).render('install/index', {
        error: 'Installation already completed.',
        formData: req.body
      })
    }
  } catch (error) {
    // Ignore error as DB may not exist
  }

  // Validate required fields
  if (!username || !email || !password || !passwordConfirm || !displayName) {
    return res.status(400).render('install/index', {
      error: 'All required fields must be filled in.',
      formData: req.body
    })
  }

  // Check password match
  if (password !== passwordConfirm) {
    return res.status(400).render('install/index', {
      error: 'Passwords do not match.',
      formData: req.body
    })
  }

  // Check password length
  if (password.length < 8) {
    return res.status(400).render('install/index', {
      error: 'Password must be at least 8 characters long.',
      formData: req.body
    })
  }

  // Check for duplicate username
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return res.status(400).render('install/index', {
        error: 'Username is already in use.',
        formData: req.body
      })
    }
  } catch (error) {
    // Ignore error as DB may not exist
  }

  ctx.validatedData = { username, email, password, displayName }
}
