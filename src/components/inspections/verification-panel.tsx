'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Camera } from 'lucide-react'

interface VerificationFinding {
  id: string
  checklistItemId?: string
  checklistLabel: string
  finding: string
  confidence: number
  evidenceReference?: string
  createdAt: string
}

interface VerificationPanelProps {
  findings: VerificationFinding[]
  images?: Array<{ id: string; imageUrl: string; description?: string }>
  confidenceScore?: number
}

export function VerificationPanel({ findings, images = [], confidenceScore }: VerificationPanelProps) {
  if (!findings?.length && !confidenceScore) return null

  const avgConfidence = findings.length
    ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length
    : confidenceScore || 0

  const hasIssues = findings.some(f => f.confidence < 0.7)

  return (
    <Card className="border-purple-500/20 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              AI Reality Verification
            </CardTitle>
            <CardDescription className="text-white/50">
              Cross-checking checklist claims against visual evidence
            </CardDescription>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${avgConfidence >= 80 ? 'text-green-400' : avgConfidence >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {Math.round(avgConfidence)}%
            </div>
            <div className="text-xs text-white/40">Confidence</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${hasIssues ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          <div className="flex items-center gap-2">
            {hasIssues ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <span className={`font-medium ${hasIssues ? 'text-red-400' : 'text-green-400'}`}>
              {hasIssues ? 'Discrepancies Detected — Review Required' : 'All Claims Verified'}
            </span>
          </div>
          <p className="text-sm text-white/60 mt-1">
            {findings.length} item{findings.length !== 1 ? 's' : ''} checked against {images.length} evidence image{images.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Individual Findings */}
        {findings.map((finding) => {
          const matchedImage = images.find(img => finding.evidenceReference?.includes(img.id))
          return (
            <div key={finding.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={finding.confidence >= 0.8 ? 'bg-green-500/20 text-green-400' : finding.confidence >= 0.6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}>
                      {Math.round(finding.confidence * 100)}%
                    </Badge>
                    <span className="text-white font-medium text-sm">{finding.checklistLabel}</span>
                  </div>
                  <p className="text-sm text-white/60 mt-1">{finding.finding}</p>
                </div>
                {matchedImage && (
                  <div className="flex-shrink-0">
                    <img src={matchedImage.imageUrl} alt={matchedImage.description || 'Evidence'} className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                  </div>
                )}
              </div>
              {/* Confidence Bar */}
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    finding.confidence >= 0.8 ? 'bg-green-500' : finding.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${finding.confidence * 100}%` }}
                />
              </div>
            </div>
          )
        })}

        {/* Evidence Gallery */}
        {images.length > 0 && (
          <div>
            <p className="text-sm text-white/50 mb-2 flex items-center gap-1">
              <Camera className="w-4 h-4" /> Evidence Images ({images.length})
            </p>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.imageUrl} alt={img.description || 'Evidence'} className="w-full h-20 object-cover rounded-lg border border-white/10" />
                  {img.description && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                      <p className="text-xs text-white text-center">{img.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}