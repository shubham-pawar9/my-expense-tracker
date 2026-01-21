'use client'

import { useEffect, useRef, useState } from 'react'
import { ParsedExpense, parseVoiceCommand } from '../utils/voiceParser'
import { Typography } from '@mui/material'

type VoiceMicProps = {
    onResult: (data: ParsedExpense) => void
}

export default function VoiceMic({ onResult }: VoiceMicProps) {
    const recognitionRef = useRef<any>(null)
    const [listening, setListening] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) {
            setError('Speech Recognition not supported')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.lang = 'en-IN'
        recognition.interimResults = false
        recognition.continuous = false

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            const parsed = parseVoiceCommand(transcript)

            if (parsed) {
                onResult(parsed)
            } else {
                setError(`Could not understand: "${transcript}"`)
            }

            setListening(false)
        }

        recognition.onerror = () => {
            setError('Voice recognition failed')
            setListening(false)
        }

        recognition.onend = () => {
            setListening(false)
        }

        recognitionRef.current = recognition
    }, [onResult])

    const startListening = () => {
        setError(null)
        setListening(true)
        recognitionRef.current?.start()
    }

    return (
        <div style={{ textAlign: 'center' }}>

            <button
                onClick={startListening}
                disabled={listening}
                style={{
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent'
                }}
            >
                <img src="./microphone.gif" height={60} width={60} />
            </button>

            {listening && <Typography style={{ fontSize: '8px' }}>Listening...</Typography>}
            {error && <Typography style={{ color: 'red', fontSize: '10px' }}>{error}</Typography>}
        </div>
    )
}
