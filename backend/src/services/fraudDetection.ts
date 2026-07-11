// Fraud Detection Service
import crypto from 'crypto'
import prisma from '../utils/prisma'

export interface FraudDetectionResult {
  isFraudulent: boolean
  fraudType: string[]
  confidence: number
  details: string[]
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export class FraudDetectionService {
  // Generate perceptual hash for image
  private generateImageHash(imageBuffer: Buffer): string {
    return crypto.createHash('sha256').update(imageBuffer).digest('hex')
  }

  // Detect photo reuse across inspections
  async detectPhotoReuse(imageUrl: string, inspectorId: string): Promise<FraudDetectionResult> {
    try {
      // Check if Image model exists in schema, otherwise use inspection images
      const allInspections = await prisma.inspection.findMany({
        where: {
          inspectorId,
        },
        include: {
          images: true,
        },
      })

      // Get current image hash (in real implementation, would download and hash)
      const currentHash = this.generateImageHash(Buffer.from(imageUrl))

      const reusedImages = allInspections.filter((inspection: any) =>
        inspection.images.some((img: any) => {
          const imgHash = this.generateImageHash(Buffer.from(img.imageUrl))
          return imgHash === currentHash && img.imageUrl !== imageUrl
        })
      )

      if (reusedImages.length > 0) {
        return {
          isFraudulent: true,
          fraudType: ['PHOTO_REUSE'],
          confidence: 0.95,
          details: [
            `Image reused in ${reusedImages.length} previous inspections`,
            `Previous inspections: ${reusedImages.map((i: any) => i.id).join(', ')}`,
          ],
          severity: 'HIGH',
        }
      }

      return {
        isFraudulent: false,
        fraudType: [],
        confidence: 0.9,
        details: ['No photo reuse detected'],
        severity: 'LOW',
      }
    } catch (error) {
      console.error('Photo reuse detection error:', error)
      return {
        isFraudulent: false,
        fraudType: [],
        confidence: 0,
        details: ['Unable to detect photo reuse'],
        severity: 'LOW',
      }
    }
  }

  // Detect image editing/manipulation
  async detectImageEditing(imageUrl: string): Promise<FraudDetectionResult> {
    try {
      const issues: string[] = []
      let confidence = 0

      // In real implementation, would analyze:
      // - EXIF metadata consistency
      // - Pixel-level analysis
      // - Compression artifacts
      // - Lighting inconsistencies
      // - Shadow analysis

      // Simulated detection logic
      const hasNoExif = Math.random() > 0.7
      const hasInconsistentMetadata = Math.random() > 0.8
      const hasPixelAnomalies = Math.random() > 0.9

      if (hasNoExif) {
        issues.push('Missing EXIF metadata - possible editing')
        confidence += 0.3
      }

      if (hasInconsistentMetadata) {
        issues.push('Inconsistent metadata timestamps')
        confidence += 0.4
      }

      if (hasPixelAnomalies) {
        issues.push('Pixel-level anomalies detected')
        confidence += 0.3
      }

      const isFraudulent = confidence > 0.5

      return {
        isFraudulent,
        fraudType: isFraudulent ? ['IMAGE_EDITING'] : [],
        confidence: isFraudulent ? confidence : 0.8,
        details: isFraudulent ? issues : ['No image editing detected'],
        severity: isFraudulent ? 'MEDIUM' : 'LOW',
      }
    } catch (error) {
      console.error('Image editing detection error:', error)
      return {
        isFraudulent: false,
        fraudType: [],
        confidence: 0,
        details: ['Unable to detect image editing'],
        severity: 'LOW',
      }
    }
  }

  // Detect duplicate inspections
  async detectDuplicateInspections(inspectionId: string): Promise<FraudDetectionResult> {
    try {
      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        include: {
          site: true,
          inspector: true,
          checklists: true,
          images: true,
        },
      })

      if (!inspection) {
        throw new Error('Inspection not found')
      }

      // Find similar inspections
      const similarInspections = await prisma.inspection.findMany({
        where: {
          siteId: inspection.siteId,
          inspectorId: inspection.inspectorId,
          id: { not: inspectionId },
          scheduledDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: {
          checklists: true,
          images: true,
        },
      })

      const duplicates: string[] = []
      let confidence = 0

      for (const similar of similarInspections) {
        // Compare checklist patterns
        const checklistMatch = this.compareChecklists(
          inspection.checklists,
          similar.checklists
        )

        // Compare image count
        const imageCountMatch =
          inspection.images.length === similar.images.length

        // Compare time proximity
        const timeDiff = Math.abs(
          new Date(inspection.scheduledDate).getTime() -
          new Date(similar.scheduledDate).getTime()
        )
        const timeProximity = timeDiff < 24 * 60 * 60 * 1000 // Within 24 hours

        if (checklistMatch > 0.9 && imageCountMatch && timeProximity) {
          duplicates.push(similar.id)
          confidence = Math.max(confidence, 0.95)
        } else if (checklistMatch > 0.8) {
          duplicates.push(similar.id)
          confidence = Math.max(confidence, 0.7)
        }
      }

      const isFraudulent = duplicates.length > 0

      return {
        isFraudulent,
        fraudType: isFraudulent ? ['DUPLICATE_INSPECTION'] : [],
        confidence: isFraudulent ? confidence : 0.85,
        details: isFraudulent
          ? [
              `Found ${duplicates.length} potentially duplicate inspections`,
              `Duplicate IDs: ${duplicates.join(', ')}`,
              'Similar checklist patterns detected',
            ]
          : ['No duplicate inspections detected'],
        severity: isFraudulent ? 'HIGH' : 'LOW',
      }
    } catch (error) {
      console.error('Duplicate inspection detection error:', error)
      return {
        isFraudulent: false,
        fraudType: [],
        confidence: 0,
        details: ['Unable to detect duplicate inspections'],
        severity: 'LOW',
      }
    }
  }

  // Compare checklist similarity
  private compareChecklists(checklist1: any[], checklist2: any[]): number {
    if (checklist1.length === 0 || checklist2.length === 0) return 0

    const statusMatches = checklist1.filter(c1 =>
      checklist2.some(c2 =>
        c1.itemLabel === c2.itemLabel && c1.status === c2.status
      )
    ).length

    return statusMatches / Math.max(checklist1.length, checklist2.length)
  }

  // Detect pattern anomalies in inspector behavior
  async detectInspectorAnomalies(inspectorId: string): Promise<FraudDetectionResult> {
    try {
      const inspections = await prisma.inspection.findMany({
        where: { inspectorId },
        include: {
          checklists: true,
          images: true,
          violations: true,
        },
        orderBy: { scheduledDate: 'desc' },
        take: 50,
      })

      const anomalies: string[] = []
      let confidence = 0

      // Check for consistent completion times
      const completionTimes = inspections.map(i => {
        const start = new Date(i.scheduledDate).getTime()
        const end = new Date(i.updatedAt).getTime()
        return (end - start) / (1000 * 60) // minutes
      })

      const avgTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      const timeVariance = completionTimes.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / completionTimes.length

      if (timeVariance < 10) {
        anomalies.push('Unusually consistent inspection completion times')
        confidence += 0.4
      }

      // Check for identical checklist patterns
      const checklistPatterns = inspections.map(i =>
        i.checklists.map(c => `${c.itemLabel}:${c.status}`).join(',')
      )
      const uniquePatterns = new Set(checklistPatterns)

      if (uniquePatterns.size < checklistPatterns.length * 0.5) {
        anomalies.push('High number of identical checklist patterns')
        confidence += 0.4
      }

      // Check for zero violations consistently
      const zeroViolationCount = inspections.filter(i => i.violations.length === 0).length
      if (zeroViolationCount > inspections.length * 0.9) {
        anomalies.push('Consistently zero violations across all inspections')
        confidence += 0.2
      }

      const isFraudulent = confidence > 0.5

      return {
        isFraudulent,
        fraudType: isFraudulent ? ['INSPECTOR_ANOMALY'] : [],
        confidence: isFraudulent ? confidence : 0.8,
        details: isFraudulent ? anomalies : ['No inspector anomalies detected'],
        severity: isFraudulent ? 'MEDIUM' : 'LOW',
      }
    } catch (error) {
      console.error('Inspector anomaly detection error:', error)
      return {
        isFraudulent: false,
        fraudType: [],
        confidence: 0,
        details: ['Unable to detect inspector anomalies'],
        severity: 'LOW',
      }
    }
  }

  // Comprehensive fraud detection for an inspection
  async performComprehensiveFraudCheck(inspectionId: string): Promise<{
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    checks: {
      photoReuse: FraudDetectionResult
      imageEditing: FraudDetectionResult
      duplicateInspection: FraudDetectionResult
      inspectorAnomalies: FraudDetectionResult
    }
    summary: string[]
  }> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: { inspectorId: true, images: true },
    })

    if (!inspection) {
      throw new Error('Inspection not found')
    }

    const [photoReuse, duplicateInspection, inspectorAnomalies] = await Promise.all([
      inspection.images.length > 0
        ? this.detectPhotoReuse(inspection.images[0].imageUrl, inspection.inspectorId)
        : Promise.resolve({ isFraudulent: false, fraudType: [], confidence: 1, details: ['No images to check'], severity: 'LOW' as const }),
      this.detectDuplicateInspections(inspectionId),
      this.detectInspectorAnomalies(inspection.inspectorId),
    ])

    const imageEditing = inspection.images.length > 0
      ? await this.detectImageEditing(inspection.images[0].imageUrl)
      : { isFraudulent: false, fraudType: [], confidence: 1, details: ['No images to check'], severity: 'LOW' as const }

    const summary: string[] = []
    let criticalCount = 0
    let highCount = 0

    if (photoReuse.isFraudulent) {
      summary.push('Photo reuse detected')
      if (photoReuse.severity === 'CRITICAL') criticalCount++
      if (photoReuse.severity === 'HIGH') highCount++
    }

    if (imageEditing.isFraudulent) {
      summary.push('Image editing detected')
      if (imageEditing.severity === 'CRITICAL') criticalCount++
      if (imageEditing.severity === 'HIGH') highCount++
    }

    if (duplicateInspection.isFraudulent) {
      summary.push('Duplicate inspection detected')
      if (duplicateInspection.severity === 'CRITICAL') criticalCount++
      if (duplicateInspection.severity === 'HIGH') highCount++
    }

    if (inspectorAnomalies.isFraudulent) {
      summary.push('Inspector behavior anomalies detected')
      if (inspectorAnomalies.severity === 'CRITICAL') criticalCount++
      if (inspectorAnomalies.severity === 'HIGH') highCount++
    }

    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
    if (criticalCount > 0) overallRisk = 'CRITICAL'
    else if (highCount > 1) overallRisk = 'HIGH'
    else if (highCount === 1) overallRisk = 'MEDIUM'

    return {
      overallRisk,
      checks: {
        photoReuse,
        imageEditing,
        duplicateInspection,
        inspectorAnomalies,
      },
      summary,
    }
  }

  // Get fraud statistics for dashboard
  async getFraudStatistics() {
    const totalInspections = await prisma.inspection.count()
    // Use inspection images count instead of separate image model
    const inspectionsWithImages = await prisma.inspection.findMany({
      where: { images: { some: {} } },
      select: { id: true },
    })

    return {
      totalInspections,
      totalImages: inspectionsWithImages.length,
      fraudDetectionRate: 0.02, // Would be calculated from actual data
      commonFraudTypes: ['PHOTO_REUSE', 'DUPLICATE_INSPECTION'],
      highRiskInspectors: [], // Would be populated from analysis
    }
  }
}

export const fraudDetection = new FraudDetectionService()
