import { useState, useRef, useCallback } from 'react'

interface UseSpeechRecognitionProps {
  onResult: (transcript: string) => void
  onError?: (error: string) => void
  language?: string
  continuous?: boolean
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

export const useSpeechRecognition = ({
  onResult,
  onError,
  language = 'ko-KR',
  continuous = true,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false)
  const isSupported = !!(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  )
  
  const recognitionRef = useRef<any>(null)
  const fullTranscriptRef = useRef<string>('')
  const isListeningRef = useRef<boolean>(false)

  // 새로운 recognition 인스턴스 생성
  const createRecognition = useCallback(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 1

    // 결과 처리
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        fullTranscriptRef.current += finalTranscript
        onResult(fullTranscriptRef.current.trim())
      } else if (interimTranscript) {
        onResult((fullTranscriptRef.current + interimTranscript).trim())
      }
    }

    // 에러 처리
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      
      // aborted는 의도적인 중지이므로 에러 메시지 표시 안 함
      if (event.error === 'aborted' || event.error === 'no-speech') {
        return
      }
      
      let errorMessage = '음성 인식 오류가 발생했습니다'
      
      switch (event.error) {
        case 'audio-capture':
          errorMessage = '마이크를 사용할 수 없습니다'
          break
        case 'not-allowed':
          errorMessage = '마이크 권한이 필요합니다'
          break
        case 'network':
          errorMessage = '네트워크 오류가 발생했습니다'
          break
      }
      
      onError?.(errorMessage)
      setIsListening(false)
      isListeningRef.current = false
    }

    // 종료 처리
    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
      isListeningRef.current = false
      fullTranscriptRef.current = ''
    }

    return recognition
  }, [language, continuous, onResult, onError])

  // 음성 인식 시작
  const startListening = useCallback(() => {
    console.log('startListening called, isListeningRef:', isListeningRef.current)
    
    if (!isSupported) {
      onError?.('이 브라우저는 음성 인식을 지원하지 않습니다')
      return
    }

    // 이미 실행 중이면 무시
    if (isListeningRef.current) {
      console.log('Already listening, ignoring')
      return
    }

    // 기존 인스턴스가 있으면 정리
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Error stopping previous instance:', e)
      }
      recognitionRef.current = null
    }

    // 새 인스턴스 생성
    fullTranscriptRef.current = ''
    recognitionRef.current = createRecognition()
    
    if (!recognitionRef.current) {
      onError?.('음성 인식을 사용할 수 없습니다')
      return
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
      isListeningRef.current = true
      console.log('Speech recognition started')
    } catch (err) {
      console.error('Failed to start recognition:', err)
      onError?.('음성 인식을 시작할 수 없습니다')
      recognitionRef.current = null
      isListeningRef.current = false
    }
  }, [isSupported, createRecognition, onError])

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    console.log('stopListening called, isListeningRef:', isListeningRef.current)
    
    if (!recognitionRef.current || !isListeningRef.current) {
      console.log('Not listening or no instance')
      return
    }

    try {
      console.log('Stopping speech recognition')
      recognitionRef.current.stop()
      recognitionRef.current = null
      setIsListening(false)
      isListeningRef.current = false
      fullTranscriptRef.current = ''
    } catch (error) {
      console.error('Failed to stop recognition:', error)
      recognitionRef.current = null
      setIsListening(false)
      isListeningRef.current = false
      fullTranscriptRef.current = ''
    }
  }, [])

  // 토글
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      startListening()
    }
  }, [startListening, stopListening])

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  }
}
