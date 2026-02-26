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
  
  // 간단한 중복 방지: 마지막 전송 내용과 시간
  const lastSentTextRef = useRef<string>('')
  const lastSentTimeRef = useRef<number>(0)
  const debounceTimerRef = useRef<any>(null)

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

    // 결과 처리 - 완전히 새로운 방식
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const now = Date.now()
      
      console.log('=== onresult START ===')
      console.log('Time:', now)
      console.log('resultIndex:', event.resultIndex, 'results.length:', event.results.length)
      
      // 전체 텍스트를 매번 새로 조합
      let finalText = ''
      let interimText = ''
      
      // results를 순회하면서 final과 interim 분리
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        
        console.log(`Result[${i}]: "${text}", isFinal: ${result.isFinal}`)
        
        if (result.isFinal) {
          finalText += text + ' '
        } else {
          // interim은 마지막 것만 사용
          interimText = text
        }
      }
      
      finalText = finalText.trim()
      interimText = interimText.trim()
      
      console.log('Extracted finalText:', finalText)
      console.log('Extracted interimText:', interimText)
      
      // 최종 결과 조합
      let fullText = ''
      if (initialTextRef.current) {
        fullText = initialTextRef.current
      }
      if (finalText) {
        fullText = fullText ? `${fullText} ${finalText}` : finalText
      }
      if (interimText) {
        fullText = fullText ? `${fullText} ${interimText}` : interimText
      }
      
      fullText = fullText.trim()
      
      console.log('Full text:', fullText)
      console.log('Last sent:', lastSentTextRef.current)
      
      // 중복 체크: 같은 텍스트를 100ms 이내에 다시 보내지 않음
      if (fullText === lastSentTextRef.current && (now - lastSentTimeRef.current) < 100) {
        console.log('DUPLICATE - Ignoring (same text within 100ms)')
        console.log('=== onresult END ===\n')
        return
      }
      
      // 빈 결과 무시
      if (!fullText || fullText === initialTextRef.current) {
        console.log('EMPTY or SAME as initial - Ignoring')
        console.log('=== onresult END ===\n')
        return
      }
      
      // 디바운싱: 빠른 연속 호출 방지
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      debounceTimerRef.current = setTimeout(() => {
        const isFinalResult = !!finalText && !interimText
        
        console.log('SENDING to onResult:', fullText)
        console.log('isFinal:', isFinalResult)
        
        lastSentTextRef.current = fullText
        lastSentTimeRef.current = Date.now()
        
        onResult(fullText, isFinalResult)
        
        // final 결과가 있으면 initialText 업데이트
        if (isFinalResult && finalText) {
          const newInitial = initialTextRef.current 
            ? `${initialTextRef.current} ${finalText}`.trim()
            : finalText
          initialTextRef.current = newInitial
          console.log('Updated initialText to:', newInitial)
        }
        
        console.log('=== onresult END ===\n')
      }, 50) // 50ms 디바운스
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
      console.log('Recognition ended, shouldRestart:', shouldRestartRef.current)
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      if (shouldRestartRef.current && isListeningRef.current) {
        console.log('Auto-restarting...')
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (err: any) {
              if (!err.message?.includes('already started')) {
                console.error('Failed to restart:', err)
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
  }, [language, continuous, onResult, onError])

  // 음성 인식 시작
  const startListening = useCallback((initialText: string = '') => {
    console.log('\n========== START LISTENING ==========')
    console.log('initialText:', initialText)
    
    if (!isSupported) {
      onError?.('이 브라우저는 음성 인식을 지원하지 않습니다')
      return
    }

    if (isListeningRef.current) {
      console.log('Already listening')
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
    lastSentTextRef.current = initialText
    lastSentTimeRef.current = 0
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

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
      console.log('Recognition started successfully')
    } catch (err) {
      console.error('Failed to start:', err)
      onError?.('음성 인식을 시작할 수 없습니다')
      recognitionRef.current = null
      isListeningRef.current = false
      shouldRestartRef.current = false
    }
  }, [isSupported, createRecognition, onError])

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    console.log('\n========== STOP LISTENING ==========')
    
    if (!recognitionRef.current || !isListeningRef.current) {
      return
    }

    try {
      shouldRestartRef.current = false
      isListeningRef.current = false
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      recognitionRef.current.stop()
      recognitionRef.current = null
      
      setIsListening(false)
      initialTextRef.current = ''
      lastSentTextRef.current = ''
      lastSentTimeRef.current = 0
      
      console.log('Recognition stopped successfully')
    } catch (error) {
      console.error('Failed to stop:', error)
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
