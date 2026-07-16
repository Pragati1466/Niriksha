/**
 * TEMPORARY REVERT SCRIPT: temp-revert-queue.ts
 *
 * Restores inspections changed by temp-populate-queue.ts
 * back to their original statuses using the snapshot file.
 *
 * Usage: npx ts-node prisma/temp-revert-queue.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const snapshotPath = path.join(__dirname, 'temp-queue-snapshot.json')

  if (!fs.existsSync(snapshotPath)) {
    console.log('❌ Snapshot file not found:', snapshotPath)
    console.log('   Cannot revert — no record of original statuses.')
    process.exit(1)
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'))

  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    console.log('❌ Snapshot file is empty or invalid.')
    process.exit(1)
  }

  console.log(`🔧 Reverting ${snapshot.length} inspections to original statuses...\n`)

  for (const item of snapshot) {
    const result = await prisma.inspection.updateMany({
      where: { id: item.id },
      data: { status: item.oldStatus },
    })
    if (result.count > 0) {
      console.log(`   ✓ ${item.id.slice(0, 8)}... → ${item.oldStatus}`)
    }
  }

  console.log(`\n✅ ${snapshot.length} inspections restored.`)
  console.log('   The snapshot file has been preserved for reference.')
  console.log(`   File: ${snapshotPath}`)
}

main()
  .catch(e => {
    console.error('❌ Revert failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())