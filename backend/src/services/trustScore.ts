import prisma from '../utils/prisma'
import { agentOrchestrator } from '../agents/orchestrator'

export const calculateTrustScore = async (inspectorId: string) => {
  await agentOrchestrator.updateTrustScore(inspectorId)
  return prisma.trustScore.findUniqueOrThrow({ where: { inspectorId } })
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
