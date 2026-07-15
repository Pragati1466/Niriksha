import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import csv from 'csv-parser'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

// ---- Deterministic, per-inspection generators for related records ----
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

  // Unique checklist labels for this inspection
  const labels = shuffle(CHECKLIST_POOL, rng).slice(0, randInt(3, 8))
  const checklists: any[] = labels.map((label) => {
    // ~25% non-compliant, rest compliant/not-applicable
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

  // Verification findings only from failed (NON_COMPLIANT) checklist items
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

  // Violations only from NON_COMPLIANT checklist items
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

  // Realistic confidence: mostly high, minority low
  const confidenceScore = rng() < 0.85 ? randInt(70, 99) : randInt(40, 69)

  return { checklists, verificationFindings, violations, confidenceScore }
}

const CSV_DIR = path.join(__dirname, '../../dataset')

async function seedDepartments() {
  console.log('📁 Seeding departments...')
  
  const departments: any[] = []
  
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(path.join(CSV_DIR, 'departments.csv'))
      .pipe(csv())
      .on('data', (row: any) => {
        departments.push({
          id: row.department_id,
          name: row.name,
          code: row.code,
          description: `${row.name} Department`
        })
      })
      .on('end', resolve)
      .on('error', reject)
  })

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: dept
    })
  }

  console.log(`✅ Seeded ${departments.length} departments`)
}
async function seedInspectionTemplates() {
  console.log('📋 Seeding inspection templates...')

  const departments = await prisma.department.findMany()

  for (const dept of departments) {
    await prisma.inspectionTemplate.upsert({
      where: {
        id: `template-${dept.id}`
      },
      update: {},
      create: {
        id: `template-${dept.id}`,
        name: `${dept.name} Standard Inspection`,
        departmentId: dept.id,
        checklistItems: JSON.stringify([])
      }
    })
  }

  console.log(`✅ Seeded ${departments.length} inspection templates`)
}
async function seedUsers() {
  console.log('👥 Seeding users...')
  
  const users: any[] = []
  
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(path.join(CSV_DIR, 'users.csv'))
      .pipe(csv())
      .on('data', (row: any) => {
        const role = row.role.toUpperCase()
        users.push({
          id: row.user_id,
          email: row.email,
          name: row.name,
          password: bcrypt.hashSync('password123', 10), // Default password
          role: role === 'INSPECTOR' ? 'INSPECTOR' : role === 'SUPERVISOR' ? 'SUPERVISOR' : 'ADMIN',
          departmentId: row.department_id,
          phone: row.phone,
          employeeId: row.employee_id,
          jurisdiction: row.jurisdiction,
          createdAt: row.created_at ? new Date(row.created_at) : new Date()
        })
      })
      .on('end', resolve)
      .on('error', reject)
  })

  let count = 0
  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user
      })
      count++
    } catch (error) {
      console.error(`Error seeding user ${user.id}:`, error)
    }
  }

  console.log(`✅ Seeded ${count} users`)
}

async function seedEstablishments() {
  console.log('🏢 Seeding establishments (this may take a while)...')
  
  const batchSize = 1000
  let processed = 0
  
  const stream = fs.createReadStream(path.join(CSV_DIR, 'establishments.csv'))
    .pipe(csv())
  
  const establishments: any[] = []
  
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (row: any) => {
      establishments.push({
        id: row.establishment_id,
        name: row.name,
        ownerName: row.owner_name,
        address: row.address,
        departmentId: row.department_id,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        pincode: row.pincode,
        businessType: row.business_type,
        category: row.category,
        contactDetails: row.contact_details,
        registrationNumber: row.registration_number,
        registrationDate: row.registration_date ? new Date(row.registration_date) : null,
        expiryDate: row.expiry_date ? new Date(row.expiry_date) : null,
        status: row.status || 'ACTIVE',
        metadata: row.metadata,
        createdAt: row.created_at ? new Date(row.created_at) : new Date()
      })

      if (establishments.length >= batchSize) {
        stream.pause()
        processBatch(establishments.splice(0, batchSize)).then(() => {
          processed += batchSize
          console.log(`   Processed ${processed} establishments...`)
          stream.resume()
        }).catch(reject)
      }
    })
    .on('end', async () => {
      if (establishments.length > 0) {
        await processBatch(establishments)
        processed += establishments.length
      }
      resolve()
    })
    .on('error', reject)
  })

  console.log(`✅ Seeded ${processed} establishments`)
}

async function processBatch(establishments: any[]) {
  for (const est of establishments) {
    try {
      await prisma.site.upsert({
        where: { id: est.id },
        update: {},
        create: est
      })
    } catch (error) {
      // Skip duplicates
    }
  }
}

async function seedRiskProfiles() {
  console.log('📊 Seeding risk profiles...')
  
  const batchSize = 1000
  let processed = 0
  
  const stream = fs.createReadStream(path.join(CSV_DIR, 'risk_profiles.csv'))
    .pipe(csv())
  
  const riskProfiles: any[] = []
  
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (row: any) => {
      riskProfiles.push({
        id: row.profile_id,
        siteId: row.establishment_id,
        riskScore: parseFloat(row.risk_score),
        riskLevel: row.risk_level,
        factors: row.factors,
        lastInspectionDate: row.last_inspection_date ? new Date(row.last_inspection_date) : null,
        violationCount: parseInt(row.violation_count) || 0,
        complaintCount: parseInt(row.complaint_count) || 0,
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
      })

      if (riskProfiles.length >= batchSize) {
        stream.pause()
        processRiskBatch(riskProfiles.splice(0, batchSize)).then(() => {
          processed += batchSize
          console.log(`   Processed ${processed} risk profiles...`)
          stream.resume()
        }).catch(reject)
      }
    })
    .on('end', async () => {
      if (riskProfiles.length > 0) {
        await processRiskBatch(riskProfiles)
        processed += riskProfiles.length
      }
      resolve()
    })
    .on('error', reject)
  })

  console.log(`✅ Seeded ${processed} risk profiles`)
}

async function processRiskBatch(riskProfiles: any[]) {
  for (const profile of riskProfiles) {
    try {
      // Store risk profile in site metadata for now
      await prisma.site.update({
        where: { id: profile.siteId },
        data: {
          metadata: JSON.stringify({
            riskScore: profile.riskScore,
            riskLevel: profile.riskLevel,
            factors: profile.factors,
            violationCount: profile.violationCount,
            complaintCount: profile.complaintCount
          })
        }
      })
    } catch (error) {
      // Skip if site doesn't exist
    }
  }
}

async function seedInspections() {
  console.log('🔍 Seeding inspections...')
  
  const batchSize = 1000
  let processed = 0
  
  const stream = fs.createReadStream(path.join(CSV_DIR, 'inspections_sample.csv'))
    .pipe(csv())
  
  const inspections: any[] = []
  
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (row: any) => {
      if (processed + inspections.length < 22000) {
        inspections.push({
    id: row.inspection_id,
    siteId: row.establishment_id,
    inspectorId: row.inspector_id,

    // build template id from department
    templateId: `template-${row.department_id}`,

    status: row.status || 'ASSIGNED',

    scheduledDate: row.scheduled_date
        ? new Date(row.scheduled_date)
        : new Date(),

    completedDate: row.actual_date
    ? new Date(row.actual_date)
    : null,

    notes: row.findings,

    createdAt: row.created_at
        ? new Date(row.created_at)
        : new Date()
})
      }

      if (inspections.length >= batchSize) {
        stream.pause()
        processInspectionBatch(inspections.splice(0, batchSize)).then(() => {
          processed += batchSize
          console.log(`   Processed ${processed} inspections...`)
          stream.resume()
        }).catch(reject)
      }
    })
    .on('end', async () => {
      if (inspections.length > 0) {
        await processInspectionBatch(inspections)
        processed += inspections.length
      }
      resolve()
    })
    .on('error', reject)
  })

  console.log(`✅ Seeded ${processed} inspections`)
}

async function processInspectionBatch(inspections: any[]) {
  for (const inspection of inspections) {
    try {
      const createdAt = inspection.createdAt ? new Date(inspection.createdAt) : new Date()
      const { checklists, verificationFindings, violations, confidenceScore } =
        buildInspectionChildren(inspection.id, createdAt)
      await prisma.inspection.create({
        data: {
          ...inspection,
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
        } as any
      })
    } catch (error) {
      console.error('❌ First inspection insert failed:', error)
      console.error('Failed inspection data:', JSON.stringify(inspection, null, 2))
      throw error // Stop the seed to see the exact error
    }
  }
}

async function main() {
  try {
    console.log('🌱 Starting database seed...\n')
    
    await seedDepartments()
    await seedUsers()
    await seedEstablishments()
    await seedRiskProfiles()
    await seedInspectionTemplates()
    await seedInspections()
    
    console.log('\n✨ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
