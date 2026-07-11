import React, { useState } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { getChecklistProgress } from '../../lib/checklistTemplates'

const Checklist = ({ template, responses, onChange, readOnly = false }) => {
  const [expandedSections, setExpandedSections] = useState(
    template ? template.sections.map((_, index) => index) : []
  )

  if (!template) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No checklist template selected
      </div>
    )
  }

  const toggleSection = (index) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleResponseChange = (itemId, value) => {
    onChange({
      ...responses,
      [itemId]: value
    })
  }

  const progress = getChecklistProgress(responses, template)

  const renderInput = (item) => {
    if (readOnly) {
      // Read-only display
      switch (item.type) {
        case 'checkbox':
          return (
            <div className="flex items-center gap-2">
              {responses[item.id] ? (
                <CheckSquare className="w-5 h-5 text-success" />
              ) : (
                <Square className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm">{responses[item.id] ? 'Yes' : 'No'}</span>
            </div>
          )
        case 'dropdown':
          return (
            <span className="text-sm font-medium">{responses[item.id] || 'Not answered'}</span>
          )
        case 'number':
          return (
            <span className="text-sm font-medium">{responses[item.id] || 'Not answered'}</span>
          )
        case 'text':
          return (
            <p className="text-sm">{responses[item.id] || 'Not answered'}</p>
          )
        default:
          return null
      }
    }

    // Editable inputs
    switch (item.type) {
      case 'checkbox':
        return (
          <button
            type="button"
            onClick={() => handleResponseChange(item.id, !responses[item.id])}
            className="flex-shrink-0"
            disabled={readOnly}
          >
            {responses[item.id] ? (
              <CheckSquare className="w-5 h-5 text-success" />
            ) : (
              <Square className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        )
      case 'dropdown':
        return (
          <select
            value={responses[item.id] || ''}
            onChange={(e) => handleResponseChange(item.id, e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={readOnly}
          >
            <option value="">Select option</option>
            {item.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'number':
        return (
          <input
            type="number"
            value={responses[item.id] || ''}
            onChange={(e) => handleResponseChange(item.id, e.target.value)}
            className="w-24 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={readOnly}
          />
        )
      case 'text':
        return (
          <textarea
            value={responses[item.id] || ''}
            onChange={(e) => handleResponseChange(item.id, e.target.value)}
            placeholder="Enter your response..."
            rows={2}
            className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            disabled={readOnly}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <h3 className="font-semibold">{template.name}</h3>
          <p className="text-sm text-muted-foreground">
            {template.sections.length} sections • {template.sections.reduce((acc, s) => acc + s.items.length, 0)} items
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{Math.round(progress)}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist Sections */}
      <div className="space-y-3">
        {template.sections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.includes(sectionIndex)
          const sectionProgress = getChecklistProgress(responses, { sections: [section] })
          
          return (
            <div key={sectionIndex} className="border border-border rounded-lg overflow-hidden">
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(sectionIndex)}
                className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <h4 className="font-medium">{section.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {section.items.length} items • {Math.round(sectionProgress)}% complete
                    </p>
                  </div>
                </div>
                {sectionProgress === 100 && (
                  <CheckSquare className="w-5 h-5 text-success" />
                )}
              </button>

              {/* Section Items */}
              {isExpanded && (
                <div className="p-4 space-y-3 bg-background">
                  {section.items.map((item, itemIndex) => {
                    const isRequired = item.required && !responses[item.id]
                    
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          isRequired ? 'border-warning/50 bg-warning/5' : 'border-border'
                        }`}
                      >
                        {renderInput(item)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium cursor-pointer">
                              {item.label}
                            </label>
                            {item.required && (
                              <span className="text-destructive">*</span>
                            )}
                          </div>
                          {isRequired && (
                            <p className="text-xs text-warning flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              Required field
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Checklist
