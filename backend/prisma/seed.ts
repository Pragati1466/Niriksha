import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import csv from 'csv-parser'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
      inspections.push({
        id: row.inspection_id,
        siteId: row.establishment_id,
        inspectorId: row.inspector_id,
        templateId: row.template_id,
        status: row.status || 'ASSIGNED',
        scheduledDate: row.scheduled_date ? new Date(row.scheduled_date) : new Date(),
        completedDate: row.completed_date ? new Date(row.completed_date) : null,
        confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : null,
        aiAnalysis: row.ai_analysis,
        notes: row.notes,
        createdAt: row.created_at ? new Date(row.created_at) : new Date()
      })

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
      await prisma.inspection.create({
        data: inspection
      })
    } catch (error) {
      // Skip duplicates
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
