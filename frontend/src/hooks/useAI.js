import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { aiService } from '@/services/ai'
import api from '@/lib/api'

/**
 * Custom hook for evidence verification with loading states
 */
export function useEvidenceVerification() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ evidenceId, fileUrl, fileType, metadata }) =>
      aiService.verifyEvidence(evidenceId, fileUrl, fileType, metadata),
    onSuccess: (data) => {
      toast.success('Evidence verification initiated')
      // Invalidate evidence queries to refresh status
      queryClient.invalidateQueries(['evidence'])
    },
    onError: (error) => {
      toast.error('Failed to verify evidence')
      console.error('Evidence verification error:', error)
    },
  })

  return {
    verifyEvidence: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Custom hook for risk score calculation with loading states
 */
export function useRiskScore() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (inspectionId) => aiService.calculateRiskScore(inspectionId),
    onSuccess: (data) => {
      toast.success('Risk score calculated')
      // Invalidate inspection queries to refresh risk score
      queryClient.invalidateQueries(['inspection'])
    },
    onError: (error) => {
      toast.error('Failed to calculate risk score')
      console.error('Risk score calculation error:', error)
    },
  })

  return {
    calculateRiskScore: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Custom hook for report generation with loading states and polling
 */
export function useReportGeneration() {
  const queryClient = useQueryClient()
  const [polling, setPolling] = useState(false)

  const mutation = useMutation({
    mutationFn: ({ inspectionId, options }) =>
      aiService.generateReport(inspectionId, options),
    onSuccess: (data) => {
      toast.success('Report generation initiated')
      setPolling(true)
      // Start polling for report completion
      pollForReport(data.data?.inspection_id)
    },
    onError: (error) => {
      toast.error('Failed to generate report')
      console.error('Report generation error:', error)
    },
  })

  const pollForReport = useCallback(async (inspectionId) => {
    const maxAttempts = 30 // 30 attempts * 2 seconds = 1 minute timeout
    let attempts = 0

    const pollInterval = setInterval(async () => {
      attempts++

      try {
        // Check inspection status
        const response = await queryClient.fetchQuery({
          queryKey: ['inspection', inspectionId],
          queryFn: async () => {
            const res = await api.get(`/inspections/${inspectionId}`)
            return res.data
          },
        })

        // Check if report is ready
        if (response.report_url) {
          clearInterval(pollInterval)
          setPolling(false)
          toast.success('Report generated successfully')
          queryClient.invalidateQueries(['inspection', inspectionId])
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setPolling(false)
          toast.error('Report generation timed out')
        }
      } catch (error) {
        console.error('Polling error:', error)
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setPolling(false)
          toast.error('Report generation failed')
        }
      }
    }, 2000) // Poll every 2 seconds
  }, [queryClient])

  return {
    generateReport: mutation.mutate,
    isLoading: mutation.isPending,
    isPolling: polling,
    error: mutation.error,
  }
}

/**
 * Custom hook for AI health check
 */
export function useAIHealth() {
  const query = useQuery({
    queryKey: ['ai-health'],
    queryFn: aiService.checkHealth,
    refetchInterval: 60000, // Check every minute
    retry: 2,
  })

  return {
    isHealthy: query.data?.success || false,
    isLoading: query.isLoading,
    error: query.error,
    circuitBreakers: query.data?.data?.circuit_breakers,
  }
}

/**
 * Custom hook for evidence verification status polling
 */
export function useEvidenceVerificationStatus(evidenceId) {
  return useQuery({
    queryKey: ['evidence', evidenceId],
    queryFn: async () => {
      const response = await api.get(`/evidence/${evidenceId}`)
      return response.data
    },
    enabled: !!evidenceId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if status is pending or verifying
      if (data?.verification_status === 'pending' || data?.verification_status === 'verifying') {
        return 2000
      }
      return false // Stop polling when verification is complete
    },
  })
}
