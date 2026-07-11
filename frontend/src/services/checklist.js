import api from '../lib/api'

/**
 * Checklist Service
 * Handles checklist-related API calls
 */

export const checklistService = {
  /**
   * Create checklist responses
   */
  async createResponses(data) {
    const response = await api.post('/checklist/responses', data)
    return response.data
  },

  /**
   * Update checklist response
   */
  async updateResponse(id, data) {
    const response = await api.put(`/checklist/responses/${id}`, data)
    return response.data
  },

  /**
   * Get checklist template
   */
  async getTemplate(id) {
    const response = await api.get(`/checklist/templates/${id}`)
    return response.data
  },

  /**
   * Get all checklist templates
   */
  async getTemplates(params = {}) {
    const response = await api.get('/checklist/templates', { params })
    return response.data
  },

  /**
   * Get checklist responses for inspection
   */
  async getInspectionResponses(inspectionId) {
    const response = await api.get(`/checklist/responses/inspection/${inspectionId}`)
    return response.data
  },
}
