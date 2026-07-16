import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('\n🔍 Database Connection Diagnostics:')
    console.log(`Process CWD: ${process.cwd()}`)
    console.log(`DATABASE_URL env: ${process.env.DATABASE_URL || 'not set'}`)
    
    // Check the database that actually exists
const dbPath = path.join(process.cwd(), "prisma", "dev.db")

console.log(`Database path: ${dbPath}`)

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath)
  console.log(`Database file exists: YES (${stats.size} bytes)`)
} else {
  console.log(`Database file exists: NO`)
}

    // Raw SQL query to verify database connection
    const rawResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Inspection`
    console.log(
  "\n🔍 Raw SQL Result:",
  JSON.stringify(
    rawResult,
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  )
)
    // Total inspections
    const totalInspections = await prisma.inspection.count()
    console.log(`\n📊 Inspection Statistics:`)
    console.log(`Total inspections: ${totalInspections}`)

    // Count by status
    const statusCounts = await prisma.inspection.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log(`\nCount by status:`)
    statusCounts.forEach(item => {
      console.log(`  ${item.status}: ${item._count.status}`)
    })

    // Count with completedDate != null
    const completedCount = await prisma.inspection.count({
      where: {
        completedDate: { not: null }
      }
    })
    console.log(`\nInspections with completedDate != null: ${completedCount}`)

    // Count by status for completed inspections
    const completedByStatus = await prisma.inspection.groupBy({
      by: ['status'],
      where: {
        completedDate: { not: null }
      },
      _count: {
        status: true
      }
    })
    
    console.log(`\nCompleted inspections by status:`)
    completedByStatus.forEach(item => {
      console.log(`  ${item.status}: ${item._count.status}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
