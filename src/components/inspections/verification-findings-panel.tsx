import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VerificationFinding } from '@/types'

export function VerificationFindingsPanel({ findings }: { findings: VerificationFinding[] }) {
  if (!findings.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Findings</CardTitle>
        <CardDescription>AI-detected evidence and inconsistencies recorded for this inspection.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {findings.map((finding) => (
          <div key={finding.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{finding.checklistLabel}</p>
              <Badge variant="destructive">AI detected: {(finding.detectedStatus || 'REVIEW_REQUIRED').replace(/_/g, ' ')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{finding.finding}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span><strong>Confidence:</strong> {(finding.confidence <= 1 ? finding.confidence * 100 : finding.confidence).toFixed(1)}%</span>
              {finding.evidenceReference && <span><strong>Evidence:</strong> {finding.evidenceReference}</span>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
