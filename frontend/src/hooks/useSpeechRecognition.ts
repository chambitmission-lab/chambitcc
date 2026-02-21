import { useState, useEffect, useRef, useCallback } from 'react'

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
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const fullTranscriptRef = useRef<string>('')

  // 브라우저 지원 확인
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      // 설정
      recognitionRef.current.continuous = continuous
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = language
      recognitionRef.current.maxAlternatives = 1

      // 결과 처리
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        // 모든 결과를 순회하면서 누적
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        // 최종 결과가 있으면 누적 텍스트에 추가
        if (finalTranscript) {
          fullTranscriptRef.current += finalTranscript
          onResult(fullTranscriptRef.current.trim())
        } else if (interimTranscript) {
          // 중간 결과는 누적 텍스트 + 현재 중간 결과
          onResult((fullTranscriptRef.current + interimTranscript).trim())
        }
      }

      // 에러 처리
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        
        let errorMessage = '음성 인식 오류가 발생했습니다'
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '음성이 감지되지 않았습니다'
            break
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
      }

      // 종료 처리
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
      onError?.('이 브라우저는 음성 인식을 지원하지 않습니다')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, continuous, onResult, onError])

  // 음성 인식 시작
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      onError?.('음성 인식을 사용할 수 없습니다')
      return
    }

    try {
      // 누적 텍스트 초기화
      fullTranscriptRef.current = ''
      recognitionRef.current.start()
      setIsListening(true)
    } catch (error) {
      console.error('Failed to start recognition:', error)
      onError?.('음성 인식을 시작할 수 없습니다')
    }
  }, [isSupported, onError])

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      // 중지 시 누적 텍스트 초기화
      fullTranscriptRef.current = ''
    }
  }, [isListening])

  // 토글
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  }
}
