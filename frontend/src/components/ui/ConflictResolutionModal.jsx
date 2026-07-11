import React from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import Button from './Button'
import Card from './Card'
import Badge from './Badge'

const ConflictResolutionModal = ({
  isOpen,
  onClose,
  onResolve,
  conflictData,
  currentData,
  latestData
}) => {
  if (!isOpen) return null

  const handleOverwrite = () => {
    onResolve({ action: 'overwrite', version: latestData.version })
  }

  const handleMerge = () => {
    onResolve({ action: 'merge', currentData, latestData })
  }

  const handleReload = () => {
    onResolve({ action: 'reload', data: latestData })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Version Conflict Detected</h3>
                <p className="text-sm text-muted-foreground">
                  This record was modified by another user
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conflict Details */}
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                <strong>Conflict:</strong> {conflictData?.message || 'The record you are trying to update has been modified since you last viewed it.'}
              </p>
            </div>

            {/* Version Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Your Version</p>
                <Badge variant="secondary">v{currentData?.version || 'unknown'}</Badge>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Latest Version</p>
                <Badge variant="success">v{latestData?.version || 'unknown'}</Badge>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3">What Changed</h4>
            <div className="space-y-2">
              {Object.keys(latestData || {}).map(key => {
                if (key === 'id' || key === 'version' || key === 'created_at' || key === 'updated_at') {
                  return null
                }
                
                const currentValue = currentData?.[key]
                const latestValue = latestData?.[key]
                
                if (currentValue !== latestValue) {
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-medium">{String(currentValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Changed to</p>
                        <p className="text-sm font-medium text-primary">{String(latestValue)}</p>
                      </div>
                    </div>
                  )
                }
                return null
              })}
              
              {Object.keys(latestData || {}).filter(key => 
                key !== 'id' && key !== 'version' && key !== 'created_at' && key !== 'updated_at' &&
                currentData?.[key] !== latestData?.[key]
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No visible field changes detected
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              How would you like to resolve this conflict?
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={handleReload}
                variant="secondary"
                className="w-full justify-start"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Latest Version
              </Button>
              
              <Button
                onClick={handleOverwrite}
                variant="default"
                className="w-full justify-start"
              >
                Overwrite with My Changes
              </Button>
              
              <Button
                onClick={handleMerge}
                variant="outline"
                className="w-full justify-start"
              >
                Merge Changes (Manual)
              </Button>
            </div>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ConflictResolutionModal
