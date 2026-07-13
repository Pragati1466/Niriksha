import { PrismaClient, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

// ---- Deterministic generation logic (identical to prisma/seed.ts) ----
function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CHECKLIST_POOL = [
  'Fire Safety', 'Sanitation', 'Documentation', 'Equipment Maintenance', 'Staff Training',
  'Waste Disposal', 'Structural Integrity', 'Ventilation', 'Electrical Safety', 'Pest Control',
  'Water Quality', 'Emergency Exits', 'First Aid', 'Signage', 'Record Keeping',
]
const FINDING_REASONS = [
  'Photo does not match checklist claim', 'Metadata timestamp mismatch', 'GPS location mismatch',
  'Evidence inconclusive or edited', 'Confidence below threshold',
]
const VIOLATION_DESCS = [
  'Blocked fire exit', 'Expired operating license', 'Improper hazardous waste storage',
  'Missing safety signage', 'Contaminated food surface', 'Inadequate ventilation',
  'Unauthorized structural modification', 'Missing first-aid kit',
]
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildInspectionChildren(inspectionId: string, createdAt: Date) {
  const rng = mulberry32(hashSeed(inspectionId))
  const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]

  const labels = shuffle(CHECKLIST_POOL, rng).slice(0, randInt(3, 8))
  const checklists: any[] = labels.map((label) => {
    const r = rng()
    const status = r < 0.25 ? 'NON_COMPLIANT' : r < 0.85 ? 'COMPLIANT' : 'NOT_APPLICABLE'
    return {
      id: randomUUID(),
      itemId: `item-${label.replace(/\s+/g, '-').toLowerCase()}`,
      itemLabel: label,
      status,
      required: rng() > 0.5,
      notes: null,
      createdAt,
    }
  })

  const failed = checklists.filter((c) => c.status === 'NON_COMPLIANT')
  const verificationFindings: any[] = failed.map((c) => ({
    id: randomUUID(),
    checklistItemId: c.id,
    checklistLabel: c.itemLabel,
    finding: pick(FINDING_REASONS),
    confidence: randInt(40, 95) / 100,
    evidenceReference: null,
    createdAt,
  }))

  const violations: any[] = []
  if (failed.length > 0 && rng() > 0.4) {
    const count = Math.min(failed.length, randInt(1, 2))
    for (let i = 0; i < count; i++) {
      const c = failed[i]
      violations.push({
        id: randomUUID(),
        description: pick(VIOLATION_DESCS),
        severity: pick(SEVERITIES),
        checklistItemId: c.id,
        imageEvidence: null,
        status: 'OPEN',
        createdAt,
      })
    }
  }

  const confidenceScore = rng() < 0.85 ? randInt(70, 99) : randInt(40, 69)

  return { checklists, verificationFindings, violations, confidenceScore }
}
// -------------------------------------------------------------------------

async function main() {
  // Idempotent: only backfill inspections that have NO checklists yet and no confidenceScore.
  const where: Prisma.InspectionWhereInput = { checklists: { none: {} }, confidenceScore: null }
  const total = await prisma.inspection.count({ where })
  console.log(`🔧 Inspections to backfill: ${total}`)

  const BATCH = 500
  let processed = 0
  let cursor: string | undefined = undefined

  let successful = 0
  let failed = 0
  const failedIds: string[] = []

  while (processed < total) {
    const queryWhere: Prisma.InspectionWhereInput = cursor ? { ...where, id: { gt: cursor } } : where
    const inspections: Array<{ id: string; createdAt: Date | null }> = await prisma.inspection.findMany({
      where: queryWhere,
      select: { id: true, createdAt: true },
      orderBy: { id: 'asc' },
      take: BATCH,
    })
    if (inspections.length === 0) break

    for (const insp of inspections) {
      const createdAt = insp.createdAt || new Date()
      const { checklists, verificationFindings, violations, confidenceScore } =
        buildInspectionChildren(insp.id, createdAt)
      try {
        await prisma.inspection.update({
          where: { id: insp.id },
          data: {
            confidenceScore,
            checklists: {
              create: checklists.map((c: any) => ({
                id: c.id,
                itemId: c.itemId,
                itemLabel: c.itemLabel,
                status: c.status,
                required: c.required,
                notes: c.notes,
                createdAt: c.createdAt,
              })),
            },
            verificationFindings: {
              create: verificationFindings.map((v: any) => ({
                id: v.id,
                checklistItemId: v.checklistItemId,
                checklistLabel: v.checklistLabel,
                finding: v.finding,
                confidence: v.confidence,
                evidenceReference: v.evidenceReference,
                createdAt: v.createdAt,
              })),
            },
            violations: {
              create: violations.map((v: any) => ({
                id: v.id,
                description: v.description,
                severity: v.severity,
                checklistItemId: v.checklistItemId,
                imageEvidence: v.imageEvidence,
                status: v.status,
                createdAt: v.createdAt,
              })),
            },
          },
        })
        successful++
      } catch (err) {
        failed++
        failedIds.push(insp.id)
        console.error(`❌ Failed inspection ${insp.id}:`, err)
      }
      if ((successful + failed) % 100 === 0) {
        console.log(`   Progress: ${successful + failed}/${total} (ok=${successful}, fail=${failed})`)
      }
    }

    processed += inspections.length
    cursor = inspections[inspections.length - 1].id
  }

  console.log('✅ Backfill complete.')
  console.log(`   successful updates: ${successful}`)
  console.log(`   failed updates: ${failed}`)
  if (failedIds.length) console.log(`   failed inspection ids: ${failedIds.join(', ')}`)
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())