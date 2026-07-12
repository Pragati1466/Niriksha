import { Inspection } from '@/types'
import { formatDateTime } from '@/lib/utils'

export function SubmissionTimeline({ inspection }: { inspection: Inspection }) {
  const events = [
    { label: 'Inspection Started', at: inspection.createdAt },
    inspection.confidenceScore !== undefined ? { label: 'Verification Complete', at: inspection.updatedAt || inspection.createdAt } : null,
    inspection.status === 'HOLD_FOR_REVIEW' ? { label: 'Held for Review', at: inspection.updatedAt || inspection.createdAt } : null,
    inspection.submissionOverriddenAt ? { label: 'Override Submitted', at: inspection.submissionOverriddenAt } : null,
    inspection.status === 'SUBMITTED' ? { label: 'Submitted', at: inspection.completedDate || inspection.updatedAt || inspection.createdAt } : null,
  ].filter(Boolean) as Array<{ label: string; at: string }>

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={`${event.label}-${event.at}`} className="flex gap-3">
          <div className="flex flex-col items-center"><span className="mt-1 h-3 w-3 rounded-full bg-primary" />{index < events.length - 1 && <span className="h-8 border-l border-border" />}</div>
          <div className="pb-2"><p className="text-sm font-medium">{event.label}</p><p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p></div>
        </div>
      ))}
    </div>
  )
}
