import api, { OptimisticLockError, GPSValidationError, FileUploadError } from '../lib/api'
import { generateInspections, generateComplianceStats } from '../lib/mockDataGenerator'

// Initialize synthetic data
let syntheticInspections = generateInspections(50)
let syntheticStats = generateComplianceStats()

/**
 * Inspections Service
 * Handles inspection-related API calls with optimistic locking and validation
 * Currently using synthetic data for testing
 */

export const inspectionsService = {
  /**
   * Get all inspections with pagination
   */
  async getInspections(params = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filtered = [...syntheticInspections]
    
    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(insp => 
        insp.establishment_name.toLowerCase().includes(search) ||
        insp.address.toLowerCase().includes(search)
      )
    }
    
    if (params.status) {
      filtered = filtered.filter(insp => insp.status === params.status)
    }
    
    if (params.type) {
      filtered = filtered.filter(insp => insp.inspection_type === params.type)
    }
    
    // Apply pagination
    const page = params.page || 1
    const pageSize = params.page_size || 10
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filtered.slice(startIndex, endIndex)
    
    return {
      inspections: paginated,
      total: filtered.length,
      page: page,
      page_size: pageSize,
      total_pages: Math.ceil(filtered.length / pageSize)
    }
  },

  /**
   * Get inspection by ID
   */
  async getInspection(id) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const inspection = syntheticInspections.find(insp => insp.id === id)
    if (!inspection) {
      throw new Error('Inspection not found')
    }
    return inspection
  },

  /**
   * Create new inspection
   */
  async createInspection(data) {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newInspection = {
      id: `INS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      status: 'Draft',
      is_draft: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      risk_score: null,
      compliance_score: null,
      ai_analysis: null
    }
    
    syntheticInspections.unshift(newInspection)
    return newInspection
  },

  /**
   * Update inspection with optimistic locking
   * @param {string} id - Inspection ID
   * @param {object} data - Update data
   * @param {number} expectedVersion - Expected version for optimistic locking
   */
  async updateInspection(id, data, expectedVersion = null) {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const index = syntheticInspections.findIndex(insp => insp.id === id)
    if (index === -1) {
      throw new Error('Inspection not found')
    }
    
    // Simulate optimistic lock check
    if (expectedVersion && syntheticInspections[index].version !== expectedVersion) {
      throw new OptimisticLockError('Concurrent modification detected')
    }
    
    syntheticInspections[index] = {
      ...syntheticInspections[index],
      ...data,
      updated_at: new Date().toISOString(),
      version: (syntheticInspections[index].version || 0) + 1
    }
    
    return syntheticInspections[index]
  },

  /**
   * Update inspection status with optimistic locking
   */
  async updateStatus(id, status, transitionReason, expectedVersion = null) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = syntheticInspections.findIndex(insp => insp.id === id)
    if (index === -1) {
      throw new Error('Inspection not found')
    }
    
    if (expectedVersion && syntheticInspections[index].version !== expectedVersion) {
      throw new OptimisticLockError('Concurrent modification detected')
    }
    
    syntheticInspections[index] = {
      ...syntheticInspections[index],
      status: status,
      is_draft: status === 'Draft',
      updated_at: new Date().toISOString(),
      version: (syntheticInspections[index].version || 0) + 1
    }
    
    return syntheticInspections[index]
  },

  /**
   * Check in at inspection site with GPS validation
   */
  async checkIn(id, locationData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = syntheticInspections.findIndex(insp => insp.id === id)
    if (index === -1) {
      throw new Error('Inspection not found')
    }
    
    // Simulate GPS validation
    if (locationData && locationData.lat && locationData.lng) {
      syntheticInspections[index] = {
        ...syntheticInspections[index],
        check_in_time: new Date().toISOString(),
        metadata: {
          ...syntheticInspections[index].metadata,
          gps_location: locationData
        }
      }
    }
    
    return syntheticInspections[index]
  },

  /**
   * Check out from inspection site
   */
  async checkOut(id, expectedVersion = null) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = syntheticInspections.findIndex(insp => insp.id === id)
    if (index === -1) {
      throw new Error('Inspection not found')
    }
    
    if (expectedVersion && syntheticInspections[index].version !== expectedVersion) {
      throw new OptimisticLockError('Concurrent modification detected')
    }
    
    syntheticInspections[index] = {
      ...syntheticInspections[index],
      check_out_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: (syntheticInspections[index].version || 0) + 1
    }
    
    return syntheticInspections[index]
  },

  /**
   * Delete inspection with optimistic locking
   */
  async deleteInspection(id, expectedVersion = null) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = syntheticInspections.findIndex(insp => insp.id === id)
    if (index === -1) {
      throw new Error('Inspection not found')
    }
    
    if (expectedVersion && syntheticInspections[index].version !== expectedVersion) {
      throw new OptimisticLockError('Concurrent modification detected')
    }
    
    syntheticInspections.splice(index, 1)
    return { success: true, id }
  },

  /**
   * Get inspection timeline
   */
  async getTimeline(id) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const inspection = syntheticInspections.find(insp => insp.id === id)
    if (!inspection) {
      throw new Error('Inspection not found')
    }
    
    return {
      inspection_id: id,
      events: [
        {
          id: '1',
          event_type: 'created',
          timestamp: inspection.created_at,
          user: inspection.inspector_name,
          details: 'Inspection created'
        },
        ...(inspection.check_in_time ? [{
          id: '2',
          event_type: 'check_in',
          timestamp: inspection.check_in_time,
          user: inspection.inspector_name,
          details: 'Checked in at inspection site'
        }] : []),
        ...(inspection.submitted_at ? [{
          id: '3',
          event_type: 'submitted',
          timestamp: inspection.submitted_at,
          user: inspection.inspector_name,
          details: 'Inspection submitted for review'
        }] : [])
      ]
    }
  },

  /**
   * Get compliance statistics
   */
  async getComplianceStats(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 400))
    return syntheticStats
  },

  /**
   * Get task status for background jobs
   */
  async getTaskStatus(taskId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Simulate task progress
    const statuses = ['pending', 'started', 'completed', 'failed']
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    
    return {
      task_id: taskId,
      status: randomStatus,
      progress: randomStatus === 'completed' ? 100 : Math.floor(Math.random() * 90),
      result: randomStatus === 'completed' ? { message: 'Task completed successfully' } : null,
      error: randomStatus === 'failed' ? { message: 'Task failed' } : null
    }
  },

  /**
   * Trigger AI analysis for inspection
   */
  async triggerAIAnalysis(id) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const index = syntheticInspections.findIndex(insp => insp.id === id)
    if (index === -1) {
      throw new Error('Inspection not found')
    }
    
    // Simulate AI analysis
    syntheticInspections[index] = {
      ...syntheticInspections[index],
      ai_analysis: {
        risk_level: Math.random() > 0.5 ? 'high' : 'low',
        confidence_score: Math.floor(Math.random() * 30) + 70,
        key_findings: [
          'Multiple compliance issues detected',
          'Evidence supports checklist responses',
          'Recommend immediate follow-up'
        ],
        recommendations: [
          'Schedule re-inspection within 30 days',
          'Issue violation notice for critical items',
          'Provide compliance guidance'
        ]
      },
      risk_score: Math.floor(Math.random() * 100),
      compliance_score: Math.floor(Math.random() * 100),
      updated_at: new Date().toISOString()
    }
    
    return {
      task_id: `TASK-${Date.now()}`,
      status: 'started',
      message: 'AI analysis initiated'
    }
  },

  /**
   * Generate inspection report
   */
  async generateReport(id) {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const inspection = syntheticInspections.find(insp => insp.id === id)
    if (!inspection) {
      throw new Error('Inspection not found')
    }
    
    return {
      report_id: `RPT-${Date.now()}`,
      inspection_id: id,
      generated_at: new Date().toISOString(),
      download_url: `/api/reports/${id}/download`,
      summary: {
        establishment: inspection.establishment_name,
        inspection_type: inspection.inspection_type,
        risk_score: inspection.risk_score,
        compliance_score: inspection.compliance_score,
        violations: Math.floor(Math.random() * 10),
        critical_violations: Math.floor(Math.random() * 3)
      }
    }
  },
}
