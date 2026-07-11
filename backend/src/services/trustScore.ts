import prisma from '../utils/prisma'

export const calculateTrustScore = async (inspectorId: string) => {
  const inspections = await prisma.inspection.findMany({
    where: { inspectorId },
    include: { violations: true, reviews: true },
  })

  if (inspections.length === 0) {
    return await prisma.trustScore.upsert({
      where: { inspectorId },
      create: { inspectorId, score: 100, totalInspections: 0, flaggedInspections: 0 },
      update: { score: 100, totalInspections: 0, flaggedInspections: 0 },
    })
  }

  const totalInspections = inspections.length
  const flaggedInspections = inspections.filter(
    i => {
      try {
        const analysis = i.aiAnalysis ? JSON.parse(i.aiAnalysis) : null
        return analysis?.flaggedItems?.length > 0 || i.reviews.some(r => r.approved === false)
      } catch {
        return i.reviews.some(r => r.approved === false)
      }
    }
  ).length

  const avgConfidence = inspections.reduce((acc, i) => acc + (i.confidenceScore || 0), 0) / totalInspections
  const approvedRate = inspections.filter(i => i.status === 'APPROVED').length / totalInspections

  const score = Math.round(
    (avgConfidence * 0.4) +
    (approvedRate * 100 * 0.4) +
    ((1 - flaggedInspections / totalInspections) * 100 * 0.2)
  )

  return await prisma.trustScore.upsert({
    where: { inspectorId },
    create: { inspectorId, score, totalInspections, flaggedInspections },
    update: { score, totalInspections, flaggedInspections, lastUpdated: new Date() },
  })
}

export const getTrustScore = async (inspectorId: string) => {
  return await prisma.trustScore.findUnique({
    where: { inspectorId },
  })
}

export const getAllTrustScores = async () => {
  const scores = await prisma.trustScore.findMany({
    orderBy: { score: 'desc' },
  })
  
  const inspectors = await prisma.user.findMany({
    where: { id: { in: scores.map(s => s.inspectorId) } },
    select: { id: true, name: true, email: true },
  })
  
  return scores.map(score => ({
    ...score,
    inspector: inspectors.find(i => i.id === score.inspectorId),
  }))
}
