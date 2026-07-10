import api from './api'

/**
 * AI Service
 * Handles AI-related API calls for evidence verification, risk scoring, and report generation
 */

export const aiService = {
  /**
   * Trigger evidence verification
   */
  async verifyEvidence(evidenceId, fileUrl, fileType, metadata) {
    const response = await api.post('/ai/verify-evidence', {
      evidence_id: evidenceId,
      file_url: fileUrl,
      file_type: fileType,
      metadata,
    })
    return response.data
  },

  /**
   * Calculate risk score for inspection
   */
  async calculateRiskScore(inspectionId) {
    const response = await api.post('/ai/risk-score', {
      inspection_id: inspectionId,
    })
    return response.data
  },

  /**
   * Generate inspection report
   */
  async generateReport(inspectionId, options = {}) {
    const response = await api.post('/ai/generate-report', {
      inspection_id: inspectionId,
      report_type: options.reportType || 'detailed',
      include_recommendations: options.includeRecommendations !== false,
      include_charts: options.includeCharts !== false,
    })
    return response.data
  },

  /**
   * Check AI service health
   */
  async checkHealth() {
    const response = await api.get('/ai/health')
    return response.data
  },
}
