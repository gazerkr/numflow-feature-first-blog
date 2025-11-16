import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  try {
    const installed = await prisma.setting.findUnique({
      where: { key: 'installed' }
    })

    if (installed && installed.value === 'true') {
      return res.redirect('/')
    }
  } catch (error) {
    // Ignore error as DB may not exist yet
    console.log('Installation check:', error.message)
  }
}
