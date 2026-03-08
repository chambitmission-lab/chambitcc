import { useState, useRef, useCallback } from 'react'

interface UseSpeechRecognitionProps {
  onResult: (transcript: string, isFinal: boolean) => void
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
  const isListeningRef = useRef<boolean>(false)
  const shouldRestartRef = useRef<boolean>(false)
  const initialTextRef = useRef<string>('')
  const accumulatedTextRef = useRef<string>('')  // 누적된 확정 텍스트
  
  // 모바일 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  
  // 간단한 중복 방지
  const lastSentTextRef = useRef<string>('')
  const lastInterimRef = useRef<string>('')  // 마지막 interim 텍스트

  // 새로운 recognition 인스턴스 생성
  const createRecognition = useCallback(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      return null
    }

    const recognition = new SpeechRecognition()
    
    // 모바일에서는 continuous false, 데스크톱에서는 true
    recognition.continuous = isMobile ? false : continuous
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 1

    // 결과 처리
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      
      // 가장 최근 결과만 처리 (resultIndex부터)
      let currentFinal = ''
      let currentInterim = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript.trim()
        
        if (result.isFinal) {
          currentFinal = text
        } else {
          currentInterim = text
        }
      }
      
      // 최종 텍스트 조합
      // fullText = initialText + accumulatedText + currentText
      let fullText = ''
      
      // 1. initialText (시작할 때 있던 텍스트 - 변하지 않음)
      if (initialTextRef.current) {
        fullText = initialTextRef.current
      }
      
      // 2. accumulatedText (이번 세션에서 누적된 확정 텍스트)
      if (accumulatedTextRef.current) {
        fullText = fullText ? `${fullText} ${accumulatedTextRef.current}` : accumulatedTextRef.current
      }
      
      // 3. 현재 결과 (final 또는 interim)
      if (currentFinal) {
        fullText = fullText ? `${fullText} ${currentFinal}` : currentFinal
      } else if (currentInterim) {
        fullText = fullText ? `${fullText} ${currentInterim}` : currentInterim
      }
      
      fullText = fullText.trim()
      
      const isFinalResult = !!currentFinal
      
      // 중복 체크 - 단, final 결과는 항상 전송
      if (!isFinalResult && fullText === lastSentTextRef.current) {
        return
      }
      
      // interim이 이전과 같으면 무시 (모바일에서 같은 interim이 반복됨)
      if (!isFinalResult && currentInterim === lastInterimRef.current) {
        return
      }
      
      if (!isFinalResult) {
        lastInterimRef.current = currentInterim
      }
      
      // 빈 결과 무시
      if (!fullText || fullText === initialTextRef.current) {
        return
      }
      
      lastSentTextRef.current = fullText
      onResult(fullText, isFinalResult)
      
      // final 결과면 accumulatedText에 추가 (initialText는 포함하지 않음!)
      if (isFinalResult && currentFinal) {
        // accumulatedText는 initialText를 제외한 순수 누적 텍스트만
        accumulatedTextRef.current = accumulatedTextRef.current 
          ? `${accumulatedTextRef.current} ${currentFinal}`.trim()
          : currentFinal
        
        lastInterimRef.current = ''
      }
    }

    // 에러 처리
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      
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
      // continuous가 true이고, shouldRestart가 true일 때만 재시작
      // continuous가 false면 한 번만 인식하고 끝
      if (continuous && shouldRestartRef.current && isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (err: any) {
              if (!err.message?.includes('already started')) {
                console.error('Failed to restart recognition:', err)
                setIsListening(false)
                isListeningRef.current = false
              }
            }
          }
        }, 100)
      } else {
        setIsListening(false)
        isListeningRef.current = false
      }
    }

    return recognition
  }, [language, continuous, isMobile, onResult, onError])

  // 음성 인식 시작
  const startListening = useCallback((initialText: string = '') => {
    if (!isSupported) {
      onError?.('이 브라우저는 음성 인식을 지원하지 않습니다')
      return
    }

    if (isListeningRef.current) {
      return
    }

    // 기존 인스턴스 정리
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null
    }

    // 상태 초기화
    initialTextRef.current = initialText
    accumulatedTextRef.current = ''
    lastSentTextRef.current = initialText
    lastInterimRef.current = ''

    // 새 인스턴스 생성 및 시작
    recognitionRef.current = createRecognition()
    
    if (!recognitionRef.current) {
      onError?.('음성 인식을 사용할 수 없습니다')
      return
    }

    try {
      recognitionRef.current.start()
      setIsListening(true)
      isListeningRef.current = true
      shouldRestartRef.current = true
    } catch (err) {
      console.error('Failed to start recognition:', err)
      onError?.('음성 인식을 시작할 수 없습니다')
      recognitionRef.current = null
      isListeningRef.current = false
      shouldRestartRef.current = false
    }
  }, [isSupported, isMobile, createRecognition, onError])

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) {
      return
    }

    try {
      shouldRestartRef.current = false
      isListeningRef.current = false
      
      recognitionRef.current.stop()
      recognitionRef.current = null
      
      setIsListening(false)
      initialTextRef.current = ''
      accumulatedTextRef.current = ''
      lastSentTextRef.current = ''
      lastInterimRef.current = ''
    } catch (error) {
      console.error('Failed to stop recognition:', error)
      shouldRestartRef.current = false
      recognitionRef.current = null
      setIsListening(false)
      isListeningRef.current = false
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
