// Draft management utility for saving and restoring inspection drafts

const DRAFT_STORAGE_KEY = 'niriksha_inspection_drafts'
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export const draftManager = {
  // Save draft to localStorage
  saveDraft: (inspectionData) => {
    try {
      const drafts = draftManager.getAllDrafts()
      
      const draft = {
        id: inspectionData.id || `draft-${Date.now()}`,
        data: inspectionData,
        savedAt: new Date().toISOString(),
        isDraft: true
      }

      // Update existing draft or add new one
      const existingIndex = drafts.findIndex(d => d.id === draft.id)
      if (existingIndex >= 0) {
        drafts[existingIndex] = draft
      } else {
        drafts.push(draft)
      }

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
      return draft
    } catch (error) {
      console.error('Error saving draft:', error)
      throw error
    }
  },

  // Get all drafts from localStorage
  getAllDrafts: () => {
    try {
      const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY)
      return draftsJson ? JSON.parse(draftsJson) : []
    } catch (error) {
      console.error('Error loading drafts:', error)
      return []
    }
  },

  // Get specific draft by ID
  getDraft: (draftId) => {
    try {
      const drafts = draftManager.getAllDrafts()
      return drafts.find(d => d.id === draftId) || null
    } catch (error) {
      console.error('Error getting draft:', error)
      return null
    }
  },

  // Delete draft
  deleteDraft: (draftId) => {
    try {
      const drafts = draftManager.getAllDrafts()
      const filteredDrafts = drafts.filter(d => d.id !== draftId)
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filteredDrafts))
      return true
    } catch (error) {
      console.error('Error deleting draft:', error)
      return false
    }
  },

  // Clear all drafts
  clearAllDrafts: () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Error clearing drafts:', error)
      return false
    }
  },

  // Restore draft for editing
  restoreDraft: (draftId) => {
    try {
      const draft = draftManager.getDraft(draftId)
      if (!draft) {
        throw new Error('Draft not found')
      }
      return draft.data
    } catch (error) {
      console.error('Error restoring draft:', error)
      throw error
    }
  },

  // Convert draft to inspection (remove draft flag)
  convertToInspection: (draftId) => {
    try {
      const draft = draftManager.getDraft(draftId)
      if (!draft) {
        throw new Error('Draft not found')
      }

      const inspectionData = {
        ...draft.data,
        id: `ins-${Date.now()}`, // Generate new inspection ID
        isDraft: false,
        submittedAt: new Date().toISOString()
      }

      // Remove from drafts
      draftManager.deleteDraft(draftId)

      return inspectionData
    } catch (error) {
      console.error('Error converting draft:', error)
      throw error
    }
  },

  // Get draft statistics
  getDraftStats: () => {
    try {
      const drafts = draftManager.getAllDrafts()
      const now = new Date()
      
      return {
        total: drafts.length,
        recent: drafts.filter(d => {
          const savedDate = new Date(d.savedAt)
          const daysDiff = (now - savedDate) / (1000 * 60 * 60 * 24)
          return daysDiff < 7
        }).length,
        old: drafts.filter(d => {
          const savedDate = new Date(d.savedAt)
          const daysDiff = (now - savedDate) / (1000 * 60 * 60 * 24)
          return daysDiff >= 30
        }).length
      }
    } catch (error) {
      console.error('Error getting draft stats:', error)
      return { total: 0, recent: 0, old: 0 }
    }
  },

  // Auto-save hook helper
  createAutoSave: (inspectionData, onSave) => {
    let autoSaveInterval = null

    const startAutoSave = () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval)
      }

      autoSaveInterval = setInterval(() => {
        draftManager.saveDraft(inspectionData)
        if (onSave) {
          onSave()
        }
      }, AUTO_SAVE_INTERVAL)
    }

    const stopAutoSave = () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval)
        autoSaveInterval = null
      }
    }

    const manualSave = () => {
      draftManager.saveDraft(inspectionData)
      if (onSave) {
        onSave()
      }
    }

    return {
      startAutoSave,
      stopAutoSave,
      manualSave
    }
  },

  // Format draft age for display
  formatDraftAge: (savedAt) => {
    const now = new Date()
    const savedDate = new Date(savedAt)
    const diffMs = now - savedDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return savedDate.toLocaleDateString()
  }
}

export default draftManager
