import React from 'react'
import { AlertTriangle, TrendingUp, FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import Card from './Card'
import Badge from './Badge'
import Button from './Button'

const AIRecommendationPanel = ({ recommendation, onAction }) => {
  if (!recommendation) return null

  const getRiskLevel = (score) => {
    if (score >= 80) return { variant: 'error', label: 'High Risk', color: 'text-destructive' }
    if (score >= 60) return { variant: 'warning', label: 'Medium Risk', color: 'text-warning' }
    return { variant: 'success', label: 'Low Risk', color: 'text-success' }
  }

  const riskLevel = getRiskLevel(recommendation.risk_score)

  return (
    <Card>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{recommendation.entity_name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{recommendation.entity_type}</p>
          </div>
          <Badge variant={riskLevel.variant} className="text-xs">
            {riskLevel.label}
          </Badge>
        </div>

        {/* Risk Score */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Risk Score</div>
            <div className={`text-3xl font-bold ${riskLevel.color}`}>
              {recommendation.risk_score}%
            </div>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className={riskLevel.color}
                strokeDasharray={`${(recommendation.risk_score / 100) * 175.9} 175.9`}
              />
            </svg>
          </div>
        </div>

        {/* Reasons */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Risk Factors
          </h4>
          <div className="space-y-2">
            {recommendation.reasons?.map((reason, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
                <span className="text-muted-foreground">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Action */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Recommended Action
          </h4>
          <p className="text-sm text-muted-foreground">{recommendation.recommended_action}</p>
        </div>

        {/* Additional Context */}
        {recommendation.context && (
          <div className="space-y-3">
            {recommendation.context.last_inspection && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Inspection</span>
                <span className="font-medium">{recommendation.context.last_inspection}</span>
              </div>
            )}
            {recommendation.context.violation_count !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Violations</span>
                <span className="font-medium">{recommendation.context.violation_count}</span>
              </div>
            )}
            {recommendation.context.compliance_score && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Compliance Score</span>
                <span className="font-medium">{recommendation.context.compliance_score}%</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => onAction?.('schedule')}
            className="flex-1"
          >
            Schedule Inspection
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onAction?.('details')}
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => onAction?.('dismiss')}
          >
            <Clock className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default AIRecommendationPanel
