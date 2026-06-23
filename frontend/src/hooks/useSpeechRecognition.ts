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

// 모듈 전역 조율자: 화면에 절마다 별도 훅 인스턴스가 있어 서로를 모르기 때문에,
// 동시에 하나의 음성 인식만 활성화되도록 여기서 "현재 활성 리더의 stop"을 들고 있는다.
// 새 절이 시작되면 이전 절을 자동 종료시킨다 (= 마지막에 누른 것이 우선).
let activeReaderStop: (() => void) | null = null

export const useSpeechRecognition = ({
  onResult,
  onError,
  language = 'ko-KR',
  continuous = true,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false)
  const [isStarting, setIsStarting] = useState(false)  // 클릭~실제 인식 시작 사이의 과도 상태 (즉각 시각 피드백용)
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
  const stopSelfRef = useRef<() => void>(() => {}) // 이 인스턴스의 stop (전역 조율자에 등록용)
  const startWatchdogRef = useRef<number | null>(null) // onstart가 안 뜰 때 스피너 무한 회전 방지
  
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
      if (startWatchdogRef.current) {
        clearTimeout(startWatchdogRef.current)
        startWatchdogRef.current = null
      }
      startingRef.current = false
      isListeningRef.current = true
      setIsStarting(false)
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
      
      if (startWatchdogRef.current) {
        clearTimeout(startWatchdogRef.current)
        startWatchdogRef.current = null
      }
      onError?.(errorMessage)
      startingRef.current = false
      setIsStarting(false)
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
        setIsStarting(false)
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
      if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
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

    // 다른 절이 듣는 중/시작 중이면 먼저 종료시킨다 (마지막에 누른 절이 우선).
    // 동시에 두 음성 인식이 마이크를 잡으면 새 인스턴스의 onstart가 뜨지 않아
    // 스피너가 무한히 도는 문제가 생긴다.
    if (activeReaderStop && activeReaderStop !== stopSelfRef.current) {
      activeReaderStop()
    }
    activeReaderStop = stopSelfRef.current

    startingRef.current = true
    setIsStarting(true)  // 클릭 즉시 버튼이 "시작 중"으로 반응하도록 (실제 onstart 전까지)

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
    if (!micPrimedRef.current && typeof navigator.mediaDevices?.getUserMedia === 'function') {
      await primeMicrophone()
    }

    // 시작 도중 stop이 호출됐다면 중단
    if (!startingRef.current) {
      setIsStarting(false)
      return
    }

    // 새 인스턴스 생성 및 시작
    recognitionRef.current = createRecognition()

    if (!recognitionRef.current) {
      startingRef.current = false
      setIsStarting(false)
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
          setIsStarting(false)
          onError?.('음성 인식을 시작할 수 없습니다')
          recognitionRef.current = null
          isListeningRef.current = false
        }
      }
    }
    tryStart()

    // 워치독: 일정 시간 안에 onstart가 안 뜨면(=마이크 경쟁 등으로 조용히 실패)
    // 시작 상태를 풀어 스피너가 무한히 돌지 않게 한다.
    if (startWatchdogRef.current) {
      clearTimeout(startWatchdogRef.current)
    }
    startWatchdogRef.current = setTimeout(() => {
      startWatchdogRef.current = null
      if (startingRef.current && !isListeningRef.current) {
        console.warn('Speech recognition did not start in time — resetting')
        stopSelfRef.current()
      }
    }, 5000) as unknown as number
  }, [isSupported, isMobile, createRecognition, onError, primeMicrophone])

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    // 시작 진행 중에 눌린 경우에도 시작을 취소할 수 있도록 가드 해제
    startingRef.current = false
    setIsStarting(false)

    if (startWatchdogRef.current) {
      clearTimeout(startWatchdogRef.current)
      startWatchdogRef.current = null
    }

    // 전역 조율자에서 내가 활성이면 해제
    if (activeReaderStop === stopSelfRef.current) {
      activeReaderStop = null
    }

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

  // 전역 조율자가 호출할 수 있도록 이 인스턴스의 stop을 항상 최신으로 유지
  stopSelfRef.current = stopListening

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
    isStarting,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    primeMicrophone,
  }
}
