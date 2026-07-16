/**
 * TEMPORARY ONE-TIME SCRIPT: temp-populate-queue.ts
 *
 * Updates 15 existing Food Safety inspections to status 'SUBMITTED'
 * so they appear in the Supervisor Review Queue for User 801 Reddy.
 *
 * Only changes the `status` field. All other data preserved.
 *
 * Revert: npx ts-node prisma/temp-revert-queue.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Populating Supervisor Review Queue...\n')

  // Supervisor 801 Reddy's department = Food Safety
  const SUPERVISOR_DEPT = 'a338e2f8-957f-46aa-8d6e-5d00ffabcfda'

  // Select 15 inspections in Food Safety with AI data
  const inspections = await prisma.inspection.findMany({
    where: {
      status: { in: ['Closed', 'Completed', 'Reviewed'] },
      confidenceScore: { not: null },
      verificationFindings: { some: {} },
      checklists: { some: {} },
      site: { departmentId: SUPERVISOR_DEPT },
    },
    include: {
      site: { select: { name: true } },
      inspector: { select: { name: true } },
      _count: { select: { verificationFindings: true, checklists: true } },
    },
    take: 15,
    orderBy: { createdAt: 'desc' },
  })

  if (inspections.length === 0) {
    console.log('❌ No suitable inspections found in Food Safety department.')
    return
  }

  // Save snapshot BEFORE updating
  const snapshot = inspections.map(i => ({
    id: i.id,
    oldStatus: i.status,
  }))
  const snapshotPath = path.join(__dirname, 'temp-queue-snapshot.json')
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2))
  console.log(`💾 Snapshot saved to: ${snapshotPath}\n`)

  // Display changes
  console.log('📋 Inspections to update:\n')
  inspections.forEach((i, idx) => {
    const prefix = String(idx + 1).padStart(2)
    console.log(`  ${prefix}. [${i.status.padEnd(10)}] → [SUBMITTED]  ${i.site.name}`)
    console.log(`       Inspector: ${i.inspector.name}  |  Confidence: ${i.confidenceScore}%  |  Findings: ${i._count.verificationFindings}  |  Checklists: ${i._count.checklists}`)
    console.log(`       ID: ${i.id}\n`)
  })

  // Perform update
  const ids = inspections.map(i => i.id)
  const result = await prisma.inspection.updateMany({
    where: { id: { in: ids } },
    data: { status: 'SUBMITTED' },
  })

  console.log(`✅ ${result.count} inspections updated to SUBMITTED`)
  console.log('   User 801 Reddy should now see them in the Review Queue.')
  console.log('\n--- To revert ---')
  console.log('   npx ts-node prisma/temp-revert-queue.ts')
}

main()
  .catch(e => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())