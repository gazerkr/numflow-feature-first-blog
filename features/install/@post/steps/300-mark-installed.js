import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  // Mark installation complete
  await prisma.setting.create({
    data: {
      key: 'installed',
      value: 'true'
    }
  })
}
