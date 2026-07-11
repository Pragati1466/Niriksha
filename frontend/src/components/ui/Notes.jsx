import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Play, Pause, Trash2, Save, Clock, MessageSquare, Lightbulb, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from './Card'
import Button from './Button'
import Badge from './Badge'

const Notes = ({ inspectionId, onSave, initialNotes = {} }) => {
  const [notes, setNotes] = useState({
    inspector: initialNotes.inspector || '',
    observations: initialNotes.observations || '',
    recommendations: initialNotes.recommendations || '',
    voiceNotes: initialNotes.voiceNotes || []
  })
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(null)
  const [playingTime, setPlayingTime] = useState(0)
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const playingIntervalRef = useRef(null)
  const autoSaveTimeoutRef = useRef(null)

  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    setAutoSaveStatus('saving')
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave()
      setAutoSaveStatus('saved')
    }, 2000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [notes])

  const handleSave = () => {
    if (onSave) {
      onSave(notes)
    }
  }

  const handleNoteChange = (field, value) => {
    setNotes(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        const newVoiceNote = {
          id: Date.now(),
          url: audioUrl,
          duration: recordingTime,
          timestamp: new Date().toISOString()
        }

        setNotes(prev => ({
          ...prev,
          voiceNotes: [...prev.voiceNotes, newVoiceNote]
        }))

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingIntervalRef.current)
    }
  }

  const playVoiceNote = (noteId) => {
    const note = notes.voiceNotes.find(n => n.id === noteId)
    if (!note) return

    const audio = new Audio(note.url)
    
    audio.onplay = () => {
      setIsPlaying(noteId)
      setPlayingTime(0)
      playingIntervalRef.current = setInterval(() => {
        setPlayingTime(prev => prev + 1)
      }, 1000)
    }

    audio.onended = () => {
      setIsPlaying(null)
      setPlayingTime(0)
      clearInterval(playingIntervalRef.current)
    }

    audio.play()
  }

  const pauseVoiceNote = () => {
    setIsPlaying(null)
    setPlayingTime(0)
    clearInterval(playingIntervalRef.current)
  }

  const deleteVoiceNote = (noteId) => {
    setNotes(prev => ({
      ...prev,
      voiceNotes: prev.voiceNotes.filter(n => n.id !== noteId)
    }))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Auto-save Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inspection Notes</h3>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {autoSaveStatus === 'saving' ? 'Saving...' : 'Auto-saved'}
          </span>
        </div>
      </div>

      {/* Inspector Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4" />
            Inspector Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes.inspector}
            onChange={(e) => handleNoteChange('inspector', e.target.value)}
            placeholder="Enter your general observations and notes about this inspection..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Observations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes.observations}
            onChange={(e) => handleNoteChange('observations', e.target.value)}
            placeholder="Document specific observations, violations, or concerns..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="w-4 h-4 text-primary" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes.recommendations}
            onChange={(e) => handleNoteChange('recommendations', e.target.value)}
            placeholder="Provide recommendations for improvement or corrective actions..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </CardContent>
      </Card>

      {/* Voice Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="w-4 h-4" />
            Voice Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                variant="outline"
                className="flex-1"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="danger"
                className="flex-1"
              >
                <MicOff className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
            {isRecording && (
              <Badge variant="error" className="animate-pulse">
                {formatTime(recordingTime)}
              </Badge>
            )}
          </div>

          {/* Voice Notes List */}
          {notes.voiceNotes.length > 0 && (
            <div className="space-y-2">
              {notes.voiceNotes.map(note => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => isPlaying === note.id ? pauseVoiceNote() : playVoiceNote(note.id)}
                    >
                      {isPlaying === note.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <p className="text-sm font-medium">Voice Note</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(note.timestamp)} • {formatTime(note.duration)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteVoiceNote(note.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {notes.voiceNotes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No voice notes recorded yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Manual Save Button */}
      <Button onClick={handleSave} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Save Notes
      </Button>
    </div>
  )
}

export default Notes
