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
  const micPrimedRef = useRef<boolean>(false)     // 마이크 권한 선확보 여부
  const startingRef = useRef<boolean>(false)      // 시작 진행 중 가드 (중복 탭 방지)
  
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

    // 실제 인식이 시작된 시점을 단일 진실로 사용 (버튼 상태가 실제 상태와 어긋나지 않도록)
    recognition.onstart = () => {
      console.log('Speech recognition started')
      startingRef.current = false
      isListeningRef.current = true
      setIsListening(true)
    }

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
      
      console.log('Speech recognition result:', {
        currentFinal,
        currentInterim,
        initialText: initialTextRef.current,
        accumulatedText: accumulatedTextRef.current,
        resultIndex: event.resultIndex,
        resultsLength: event.results.length
      })
      
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
      
      console.log('Composed fullText:', fullText)
      
      // 빈 결과 무시
      if (!fullText || fullText === initialTextRef.current) {
        console.log('Ignoring empty or initial-only text:', fullText)
        return
      }
      
      const isFinalResult = !!currentFinal
      
      // 중복 체크 (interim 결과만 체크, final은 항상 처리)
      if (!isFinalResult && fullText === lastSentTextRef.current) {
        console.log('Ignoring duplicate interim text:', fullText)
        return
      }
      
      // interim이 이전과 같으면 무시 (모바일에서 같은 interim이 반복됨)
      if (!isFinalResult && currentInterim === lastInterimRef.current) {
        console.log('Ignoring duplicate interim:', currentInterim)
        return
      }
      
      if (!isFinalResult) {
        lastInterimRef.current = currentInterim
      }
      
      console.log('Sending result to callback:', { fullText, isFinalResult })
      lastSentTextRef.current = fullText
      onResult(fullText, isFinalResult)
      
      // final 결과면 accumulatedText에 추가 (initialText는 포함하지 않음!)
      if (isFinalResult && currentFinal) {
        // accumulatedText는 initialText를 제외한 순수 누적 텍스트만
        accumulatedTextRef.current = accumulatedTextRef.current 
          ? `${accumulatedTextRef.current} ${currentFinal}`.trim()
          : currentFinal
        
        console.log('Updated accumulatedText:', accumulatedTextRef.current)
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
      startingRef.current = false
      setIsListening(false)
      isListeningRef.current = false
    }

    // 종료 처리
    recognition.onend = () => {
      console.log('Speech recognition ended. shouldRestart:', shouldRestartRef.current, 'isListening:', isListeningRef.current)
      
      // 모바일에서는 자동으로 재시작 (continuous false이므로)
      if (shouldRestartRef.current && isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try {
              console.log('Restarting speech recognition with accumulated text:', accumulatedTextRef.current)
              // 기존 인스턴스는 그대로 재시작 (ref는 유지됨)
              if (recognitionRef.current) {
                recognitionRef.current.start()
                console.log('Speech recognition restarted successfully')
              }
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
        startingRef.current = false
        setIsListening(false)
        isListeningRef.current = false
      }
    }

    return recognition
  }, [language, continuous, isMobile, onResult, onError])

  // 마이크 권한/오디오 스택을 미리 확보한다.
  // 모바일(특히 Android Chrome)에서 첫 start()가 권한 프롬프트·오디오 초기화와
  // 경쟁하다 조용히 끝나버리는 문제를 막아, 한 번에 인식이 시작되도록 한다.
  const primeMicrophone = useCallback(async () => {
    if (micPrimedRef.current) {
      return
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // 권한만 확보하고 즉시 해제 (SpeechRecognition이 마이크를 사용하도록)
        stream.getTracks().forEach((track) => track.stop())
      }
      micPrimedRef.current = true
    } catch (e) {
      // 권한 거부 등은 이후 recognition.onerror에서 처리됨
      console.warn('Microphone priming failed:', e)
    }
  }, [])

  // 음성 인식 시작
  const startListening = useCallback(async (initialText: string = '') => {
    if (!isSupported) {
      onError?.('이 브라우저는 음성 인식을 지원하지 않습니다')
      return
    }

    // 이미 듣는 중이거나 시작 진행 중이면 무시 (중복 탭으로 인한 상태 꼬임 방지)
    if (isListeningRef.current || startingRef.current) {
      return
    }
    startingRef.current = true

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

    // 마이크 권한이 아직 확보되지 않았다면 먼저 확보한다.
    // 이미 확보된 경우(=2번째 탭 이후)에는 await 없이 동기적으로 진행해
    // iOS Safari의 user-gesture 토큰을 유지한다.
    if (!micPrimedRef.current && navigator.mediaDevices?.getUserMedia) {
      await primeMicrophone()
    }

    // 시작 도중 stop이 호출됐다면 중단
    if (!startingRef.current) {
      return
    }

    // 새 인스턴스 생성 및 시작
    recognitionRef.current = createRecognition()

    if (!recognitionRef.current) {
      startingRef.current = false
      onError?.('음성 인식을 사용할 수 없습니다')
      return
    }

    shouldRestartRef.current = true

    // start()는 직전 인스턴스가 완전히 종료되지 않았을 때 InvalidStateError를
    // 던질 수 있다. 짧게 재시도해 한 번에 시작되도록 한다.
    const tryStart = (attempt = 0) => {
      if (!recognitionRef.current || !startingRef.current) {
        return
      }
      try {
        recognitionRef.current.start()
        // 실제 시작 여부는 recognition.onstart에서 isListening으로 반영된다.
      } catch (err) {
        if (attempt < 2) {
          console.warn(`start() retry (${attempt + 1})`, err)
          setTimeout(() => tryStart(attempt + 1), 200)
        } else {
          console.error('Failed to start recognition:', err)
          startingRef.current = false
          shouldRestartRef.current = false
          onError?.('음성 인식을 시작할 수 없습니다')
          recognitionRef.current = null
          isListeningRef.current = false
        }
      }
    }
    tryStart()
  }, [isSupported, isMobile, createRecognition, onError, primeMicrophone])

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    // 시작 진행 중에 눌린 경우에도 시작을 취소할 수 있도록 가드 해제
    startingRef.current = false

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
