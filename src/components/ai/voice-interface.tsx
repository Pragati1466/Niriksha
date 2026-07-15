'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInterface({ onTranscript, disabled = false }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const startListening = useCallback(() => {
    setError(null)
    
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const transcriptText = event.results[current][0].transcript
      setTranscript(transcriptText)

      if (event.results[current].isFinal) {
        onTranscript(transcriptText)
        setIsListening(false)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setError(`Voice error: ${event.error}. Please try again.`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [onTranscript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`relative p-3 rounded-full transition-all ${
          isListening 
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110 animate-pulse' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        {isListening && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
        )}
      </button>
      
      {transcript && !isListening && (
        <div className="flex items-center gap-2 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-full">
          <Volume2 className="w-3 h-3 text-green-400" />
          <span className="max-w-[200px] truncate">{transcript}</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full max-w-[250px]">
          {error}
        </div>
      )}
    </div>
  )
}