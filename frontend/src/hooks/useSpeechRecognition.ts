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
  const lastProcessedIndexRef = useRef<number>(0)

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
      console.log('=== onresult event START ===')
      console.log('resultIndex:', event.resultIndex, 'results.length:', event.results.length)
      console.log('initialText:', initialTextRef.current)
      console.log('lastProcessedIndex:', lastProcessedIndexRef.current)

      let interimTranscript = ''
      let finalTranscript = ''

      // resultIndex부터 시작하여 새로운 결과만 처리
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const isFinal = event.results[i].isFinal
        console.log(`  Result[${i}]: "${transcript}", isFinal: ${isFinal}`)
        
        if (isFinal) {
          finalTranscript += transcript + ' '
          lastProcessedIndexRef.current = i + 1
        } else {
          interimTranscript += transcript
        }
      }

      // 최종 결과 처리
      finalTranscript = finalTranscript.trim()
      interimTranscript = interimTranscript.trim()
      
      console.log('finalTranscript:', finalTranscript)
      console.log('interimTranscript:', interimTranscript)
      
      if (finalTranscript || interimTranscript) {
        // 초기 텍스트(기존 텍스트) + 이번 세션의 새로운 음성
        let newText = finalTranscript || interimTranscript
        let result = initialTextRef.current
        if (newText) {
          result += (result ? ' ' : '') + newText
        }
        result = result.trim()
        
        // 최종 결과인 경우 initialText를 업데이트하여 다음 음성 입력에 누적되도록 함
        const isFinal = !!finalTranscript && !interimTranscript
        if (isFinal) {
          initialTextRef.current = result
          console.log('Updated initialText to:', result)
        }
        
        console.log('isFinal:', isFinal, 'result:', result)
        console.log('=== onresult event END ===\n')
        onResult(result, isFinal)
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
      console.log('Speech recognition ended, shouldRestart:', shouldRestartRef.current, 'isListening:', isListeningRef.current)
      
      // 의도적으로 중지한 경우가 아니라면 계속 듣기
      if (shouldRestartRef.current && isListeningRef.current) {
        console.log('Auto-restarting speech recognition')
        // 자동 재시작 시 lastProcessedIndex 초기화
        lastProcessedIndexRef.current = 0
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              // 재시작 전에 현재 상태 확인
              if (recognitionRef.current) {
                recognitionRef.current.start()
              }
            } catch (err: any) {
              // 이미 시작된 경우는 무시
              if (err.message && err.message.includes('already started')) {
                console.log('Recognition already started, ignoring')
              } else {
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
        initialTextRef.current = ''
      }
    }

    return recognition
  }, [language, continuous, onResult, onError])

  // 음성 인식 시작
  const startListening = useCallback((initialText: string = '') => {
    console.log('startListening called, isListeningRef:', isListeningRef.current, 'initialText:', initialText)
    
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
    initialTextRef.current = initialText
    lastProcessedIndexRef.current = 0
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
      console.log('Speech recognition started with initialText:', initialText)
    } catch (err) {
      console.error('Failed to start recognition:', err)
      onError?.('음성 인식을 시작할 수 없습니다')
      recognitionRef.current = null
      isListeningRef.current = false
      shouldRestartRef.current = false
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
      shouldRestartRef.current = false
      isListeningRef.current = false
      setIsListening(false)
      recognitionRef.current.stop()
      recognitionRef.current = null
      initialTextRef.current = ''
    } catch (error) {
      console.error('Failed to stop recognition:', error)
      shouldRestartRef.current = false
      recognitionRef.current = null
      setIsListening(false)
      isListeningRef.current = false
      initialTextRef.current = ''
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
