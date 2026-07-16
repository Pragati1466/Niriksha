import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Migration: Redistribute inspection timestamps and statuses to create realistic historical data
 * 
 * This script:
 * 1. Updates createdAt timestamps to span 12 months (July 2025 - June 2026)
 * 2. Distributes statuses realistically (majority completed/closed for mature platform)
 * 3. Sets completedDate for completed inspections
 * 4. Maintains realistic event ordering for all child records
 * 5. Preserves all AI metrics (violations, ORDI, trust scores, etc.)
 */

async function main() {
  console.log('🔄 Migrating inspection timeline...\n')

  // Get all inspections for Food Safety department (supervisor's scope)
  const inspections = await prisma.inspection.findMany({
    where: {
      site: {
        departmentId: 'a338e2f8-957f-46aa-8d6e-5d00ffabcfda' // Food Safety
      }
    },
    include: {
      site: true,
      violations: true,
      checklists: true,
      reviews: true,
      ordiAssessments: true,
      reports: true,
      reportVersions: true,
      complianceMemoryEvents: true,
      images: true,
    },
    orderBy: { id: 'asc' }
  })

  console.log(`📊 Found ${inspections.length} inspections to migrate`)

  const now = new Date('2026-07-15T00:00:00.000Z') // Current date
  const twelveMonthsAgo = new Date('2025-07-15T00:00:00.000Z')
  const totalDays = 365 // 12 months

  // Realistic status distribution for a mature government Food Safety department
  // 92-95% completed, 3-5% active, 1.5-2.5% review queue
  const statusDistribution = {
    CLOSED: 0.50,        // 50% - fully closed after approval
    APPROVED: 0.28,      // 28% - successfully reviewed and approved
    COMPLETED: 0.15,     // 15% - completed but pending final review
    SUBMITTED: 0.015,    // 1.5% - recently submitted (~150 inspections)
    UNDER_REVIEW: 0.007, // 0.7% - currently being reviewed (~70 inspections)
    HOLD_FOR_REVIEW: 0.003, // 0.3% - on hold for issues (~30 inspections)
    IN_PROGRESS: 0.03,   // 3% - actively being inspected (~300 inspections)
    ASSIGNED: 0.015,     // 1.5% - assigned but not started (~150 inspections)
  }

  // Helper: pick status from distribution with optional weight adjustment
  function pickStatus(dist: Record<string, number>, weights?: Record<string, number>) {
    const adjusted = weights ? Object.fromEntries(
      Object.entries(dist).map(([k, v]) => [k, v * (weights[k] ?? 1)])
    ) : dist
    const total = Object.values(adjusted).reduce((a, b) => a + b, 0)
    const normalized = Object.entries(adjusted).map(([s, w]) => ({ status: s, threshold: w / total }))
    let cumulative = 0
    return normalized.find(s => (cumulative += s.threshold) > Math.random())?.status || 'CLOSED'
  }

  let updated = 0
  let failed = 0

  for (let i = 0; i < inspections.length; i++) {
    const inspection = inspections[i]
    
    try {
      // Calculate position in timeline (0 to 1)
      const position = i / inspections.length
      
      // Distribute across 12 months with realistic ramp-up
      // More inspections in recent months (realistic growth pattern)
      const randomOffset = (Math.random() - 0.5) * 30 // ±15 days
      const daysAgo = (position * totalDays * 0.8 + Math.random() * totalDays * 0.2) + randomOffset
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      // Assign status based on age (older inspections more likely to be completed)
      const ageFactor = 1 - (daysAgo / totalDays) // 0 = oldest, 1 = newest
      
      // Apply small age bias: recent = slightly more active, old = slightly more closed
      const weights: Record<string, number> = ageFactor > 0.7
        ? { ASSIGNED: 1.5, IN_PROGRESS: 1.5, SUBMITTED: 1.2, UNDER_REVIEW: 1.2, HOLD_FOR_REVIEW: 1.2, CLOSED: 1, APPROVED: 1, COMPLETED: 1 }
        : ageFactor > 0.4
        ? {} // use base distribution
        : { CLOSED: 1.5, APPROVED: 1.3, COMPLETED: 1.2, SUBMITTED: 0.7, UNDER_REVIEW: 0.7, HOLD_FOR_REVIEW: 0.7, IN_PROGRESS: 0.7, ASSIGNED: 0.7 }
      
      const status = pickStatus(statusDistribution, weights)

      // Set completedDate for completed/approved/closed inspections
      let completedDate = null
      if (['APPROVED', 'CLOSED', 'COMPLETED'].includes(status)) {
        // Completion happened 5-14 days after creation (realistic workflow)
        const completionDaysAfter = Math.floor(Math.random() * 10) + 5
        completedDate = new Date(createdAt.getTime() + completionDaysAfter * 24 * 60 * 60 * 1000)
      }

      // Update inspection
      await prisma.inspection.update({
        where: { id: inspection.id },
        data: {
          createdAt,
          status,
          completedDate,
          updatedAt: new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Updated within a week
        }
      })

      // Update child records with realistic event ordering
      // 1. Checklists/evidence: 0-3 days after inspection
      const checklistOffset = Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)
      await prisma.inspectionChecklist.updateMany({
        where: { inspectionId: inspection.id },
        data: { createdAt: new Date(createdAt.getTime() + checklistOffset) }
      })

      // 2. Verification findings: 0-3 days after inspection
      await prisma.verificationFinding.updateMany({
        where: { inspectionId: inspection.id },
        data: { createdAt: new Date(createdAt.getTime() + checklistOffset) }
      })

      // 3. Violations: 1-4 days after inspection
      const violationOffset = Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000) + (1 * 24 * 60 * 60 * 1000)
      await prisma.violation.updateMany({
        where: { inspectionId: inspection.id },
        data: { createdAt: new Date(createdAt.getTime() + violationOffset) }
      })

      // 4. ORDI assessment: 2-5 days after inspection (AI analysis phase)
      const ordiOffset = Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000) + (2 * 24 * 60 * 60 * 1000)
      await prisma.ordiAssessment.updateMany({
        where: { inspectionId: inspection.id },
        data: { createdAt: new Date(createdAt.getTime() + ordiOffset) }
      })

      // 5. Report generated: 3-7 days after inspection
      const reportOffset = Math.floor(Math.random() * 4 * 24 * 60 * 60 * 1000) + (3 * 24 * 60 * 60 * 1000)
      await prisma.report.updateMany({
        where: { inspectionId: inspection.id },
        data: { generatedAt: new Date(createdAt.getTime() + reportOffset) }
      })
      await prisma.reportVersion.updateMany({
        where: { inspectionId: inspection.id },
        data: { createdAt: new Date(createdAt.getTime() + reportOffset) }
      })

      // 6. Supervisor review: 4-10 days after inspection
      const reviewOffset = Math.floor(Math.random() * 6 * 24 * 60 * 60 * 1000) + (4 * 24 * 60 * 60 * 1000)
      if (inspection.reviews && inspection.reviews.length > 0) {
        for (const review of inspection.reviews) {
          await prisma.review.update({
            where: { id: review.id },
            data: { reviewedAt: new Date(createdAt.getTime() + reviewOffset) }
          })
        }
      }

      // 7. Compliance memory event: 5-12 days after inspection
      const memoryOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000) + (5 * 24 * 60 * 60 * 1000)
      await prisma.complianceMemoryEvent.updateMany({
        where: { inspectionId: inspection.id },
        data: { occurredAt: new Date(createdAt.getTime() + memoryOffset) }
      })

      // 8. Images uploaded: 0-2 days after inspection
      const imageOffset = Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)
      await prisma.inspectionImage.updateMany({
        where: { inspectionId: inspection.id },
        data: { uploadedAt: new Date(createdAt.getTime() + imageOffset) }
      })

      updated++

      if (updated % 100 === 0) {
        console.log(`   Progress: ${updated}/${inspections.length}`)
      }
    } catch (error) {
      failed++
      console.error(`❌ Failed to update inspection ${inspection.id}:`, error)
    }
  }

  console.log('\n✅ Migration complete!')
  console.log(`   Updated: ${updated}`)
  console.log(`   Failed: ${failed}`)
  console.log(`\n📈 Expected results:`)
  console.log(`   - Monthly trends will show 12 months of data`)
  console.log(`   - Completion rate: ~93% (APPROVED + CLOSED + COMPLETED)`)
  console.log(`   - Active workload: ~4.5% (ASSIGNED + IN_PROGRESS)`)
  console.log(`   - Review queue: ~2.5% (SUBMITTED + UNDER_REVIEW + HOLD_FOR_REVIEW)`)
  console.log(`\n🔍 Event ordering preserved:`)
  console.log(`   - Checklists: 0-3 days after inspection`)
  console.log(`   - Violations: 1-4 days after inspection`)
  console.log(`   - ORDI assessment: 2-5 days after inspection`)
  console.log(`   - Report: 3-7 days after inspection`)
  console.log(`   - Review: 4-10 days after inspection`)
  console.log(`   - Compliance memory: 5-12 days after inspection`)
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })