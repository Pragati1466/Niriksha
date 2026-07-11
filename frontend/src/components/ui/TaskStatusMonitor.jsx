import React, { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { inspectionsService } from '../../services/inspections'
import Badge from './Badge'
import Card from './Card'

const TaskStatusMonitor = ({ taskId, onComplete, onError }) => {
  const [status, setStatus] = useState('pending')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    if (!taskId || !polling) return

    const pollInterval = setInterval(async () => {
      try {
        const taskData = await inspectionsService.getTaskStatus(taskId)
        setStatus(taskData.status)
        setProgress(taskData.progress || 0)
        
        if (taskData.status === 'completed') {
          setResult(taskData.result)
          setPolling(false)
          if (onComplete) onComplete(taskData.result)
        } else if (taskData.status === 'failed') {
          setError(taskData.error)
          setPolling(false)
          if (onError) onError(taskData.error)
        }
      } catch (err) {
        setError(err.message)
        setPolling(false)
        if (onError) onError(err)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [taskId, polling, onComplete, onError])

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'started':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'retry':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusVariant = () => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      case 'retry':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Queued'
      case 'started':
        return 'Processing'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'retry':
        return 'Retrying'
      default:
        return status
    }
  }

  if (!taskId) {
    return null
  }

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">Task Status</span>
          </div>
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Progress Bar */}
        {status !== 'completed' && status !== 'failed' && (
          <div className="mb-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm text-success-foreground">
              <strong>Success:</strong> {result.message || 'Task completed successfully'}
            </p>
            {result.data && (
              <pre className="mt-2 text-xs overflow-auto max-h-32">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive-foreground">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Retry Button */}
        {status === 'failed' && (
          <button
            onClick={() => {
              setError(null)
              setPolling(true)
            }}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    </Card>
  )
}

export default TaskStatusMonitor
