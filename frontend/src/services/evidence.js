import api from '../lib/api'
import { generateEvidenceGallery } from '../lib/mockDataGenerator'

// Initialize synthetic data
let syntheticEvidence = generateEvidenceGallery(100)

/**
 * Evidence Service
 * Handles evidence-related API calls
 * Currently using synthetic data for testing
 */

export const evidenceService = {
  /**
   * Get presigned URL for upload
   */
  async getPresignedUrl(data) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      upload_url: `https://storage.example.com/upload/${Date.now()}`,
      file_id: `EVI-${Date.now()}`,
      expires_in: 3600
    }
  },

  /**
   * Upload photo evidence
   */
  async uploadPhoto(data) {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newEvidence = {
      id: `EVI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: data.filename || `photo_${Date.now()}.jpg`,
      file_size: data.file_size || Math.floor(Math.random() * 5000000) + 100000,
      mime_type: 'image/jpeg',
      url: data.url || `https://via.placeholder.com/400x300?text=Uploaded+Photo`,
      thumbnail_url: data.thumbnail_url || `https://via.placeholder.com/150x150?text=Thumb`,
      uploaded_at: new Date().toISOString(),
      virus_scan_status: 'clean',
      inspection_id: data.inspection_id,
      metadata: {
        gps_location: data.gps_location || { lat: 0, lng: 0 },
        device_info: data.device_info || 'Unknown Device',
        timestamp: new Date().toISOString()
      }
    }
    
    syntheticEvidence.unshift(newEvidence)
    return newEvidence
  },

  /**
   * Upload document evidence
   */
  async uploadDocument(data) {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newEvidence = {
      id: `EVI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: data.filename || `document_${Date.now()}.pdf`,
      file_size: data.file_size || Math.floor(Math.random() * 10000000) + 50000,
      mime_type: 'application/pdf',
      url: data.url || `https://via.placeholder.com/400x300?text=Document`,
      thumbnail_url: data.thumbnail_url || `https://via.placeholder.com/150x150?text=PDF`,
      uploaded_at: new Date().toISOString(),
      virus_scan_status: 'clean',
      inspection_id: data.inspection_id,
      metadata: {
        gps_location: data.gps_location || { lat: 0, lng: 0 },
        device_info: data.device_info || 'Unknown Device',
        timestamp: new Date().toISOString()
      }
    }
    
    syntheticEvidence.unshift(newEvidence)
    return newEvidence
  },

  /**
   * Get evidence by ID
   */
  async getEvidence(id) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const evidence = syntheticEvidence.find(ev => ev.id === id)
    if (!evidence) {
      throw new Error('Evidence not found')
    }
    return evidence
  },

  /**
   * Get evidence for inspection
   */
  async getInspectionEvidence(inspectionId) {
    await new Promise(resolve => setTimeout(resolve, 400))
    return syntheticEvidence.filter(ev => ev.inspection_id === inspectionId)
  },

  /**
   * Get all evidence with pagination
   */
  async getAllEvidence(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filtered = [...syntheticEvidence]
    
    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(ev => 
        ev.filename.toLowerCase().includes(search)
      )
    }
    
    if (params.type) {
      filtered = filtered.filter(ev => ev.mime_type.startsWith(params.type))
    }
    
    if (params.inspection_id) {
      filtered = filtered.filter(ev => ev.inspection_id === params.inspection_id)
    }
    
    // Apply pagination
    const page = params.page || 1
    const pageSize = params.page_size || 20
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filtered.slice(startIndex, endIndex)
    
    return {
      evidence: paginated,
      total: filtered.length,
      page: page,
      page_size: pageSize,
      total_pages: Math.ceil(filtered.length / pageSize)
    }
  },

  /**
   * Update evidence metadata
   */
  async updateEvidence(id, data) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = syntheticEvidence.findIndex(ev => ev.id === id)
    if (index === -1) {
      throw new Error('Evidence not found')
    }
    
    syntheticEvidence[index] = {
      ...syntheticEvidence[index],
      ...data
    }
    
    return syntheticEvidence[index]
  },

  /**
   * Delete evidence
   */
  async deleteEvidence(id) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = syntheticEvidence.findIndex(ev => ev.id === id)
    if (index === -1) {
      throw new Error('Evidence not found')
    }
    
    syntheticEvidence.splice(index, 1)
    return { success: true, id }
  },

  /**
   * Get verification status
   */
  async getVerificationStatus(id) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const evidence = syntheticEvidence.find(ev => ev.id === id)
    if (!evidence) {
      throw new Error('Evidence not found')
    }
    
    return {
      evidence_id: id,
      verification_status: Math.random() > 0.2 ? 'verified' : 'pending',
      confidence_score: Math.floor(Math.random() * 30) + 70,
      verified_at: new Date().toISOString(),
      ai_analysis: {
        matches_checklist: Math.random() > 0.3,
        confidence: Math.floor(Math.random() * 30) + 70,
        notes: 'AI verification complete'
      }
    }
  },
}
