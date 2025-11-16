// About page Prepare data (From database fetch)
import { prisma } from '#lib/prisma.js'

export default async (ctx, req, res) => {
  const PORT = process.env.PORT || 3000
  const NODE_ENV = process.env.NODE_ENV || 'development'
  const APP_NAME = process.env.APP_NAME || 'Numflow Blog'

  // From database Feature Fetch list
  const featuresFromDB = await prisma.feature.findMany({
    orderBy: { order: 'asc' }
  })

  // From database TechStack Fetch list
  const techStacksFromDB = await prisma.techStack.findMany({
    orderBy: { order: 'asc' }
  })

  // Store data in context
  ctx.pageData = {
    title: 'About',
    description: 'Numflow is 100% compatible with Express 5.x while providing 3x faster performance.',
    port: PORT,
    appName: APP_NAME,
    nodeEnv: NODE_ENV,
    features: featuresFromDB.map(f => `${f.icon} ${f.title}`),
    techStacks: techStacksFromDB
  }
}
