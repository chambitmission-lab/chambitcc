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
        // continuous가 true이고 의도적으로 중지하지 않았다면 자동 재시작
        if (continuous && isListening) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start()
            } catch (err) {
              console.log('Auto-restart failed:', err)
            }
          }, 100)
        }
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
      // 이미 실행 중이면 중지 후 재시작
      if (isListening) {
        recognitionRef.current.stop()
      }
      
      // 누적 텍스트 초기화
      fullTranscriptRef.current = ''
      
      // 약간의 지연 후 시작 (이전 세션이 완전히 종료되도록)
      setTimeout(() => {
        try {
          recognitionRef.current.start()
          setIsListening(true)
        } catch (err) {
          // 이미 시작된 경우 무시
          if ((err as Error).message?.includes('already started')) {
            console.log('Speech recognition already started')
            setIsListening(true)
          } else {
            console.error('Failed to start recognition:', err)
            onError?.('음성 인식을 시작할 수 없습니다')
          }
        }
      }, 100)
    } catch (error) {
      console.error('Failed to start recognition:', error)
      onError?.('음성 인식을 시작할 수 없습니다')
    }
  }, [isSupported, isListening, onError])

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
        // 중지 시 누적 텍스트 초기화
        fullTranscriptRef.current = ''
      } catch (error) {
        console.error('Failed to stop recognition:', error)
        setIsListening(false)
      }
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
