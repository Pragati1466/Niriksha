import { Badge } from '@/components/ui/badge'
import { InspectionStatus } from '@/types'

const statusColors: Record<InspectionStatus, string> = {
  DRAFT: 'bg-slate-500',
  ASSIGNED: 'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  VERIFYING: 'bg-indigo-500',
  VERIFIED: 'bg-emerald-500',
  HOLD_FOR_REVIEW: 'bg-red-600',
  SUBMITTED: 'bg-purple-500',
  UNDER_REVIEW: 'bg-orange-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
}

export function InspectionStatusBadge({ status }: { status: InspectionStatus | string }) {
  return <Badge className={statusColors[status as InspectionStatus] || 'bg-gray-500'}>{status.replace(/_/g, ' ')}</Badge>
}
