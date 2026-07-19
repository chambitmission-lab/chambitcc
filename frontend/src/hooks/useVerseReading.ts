import { useState, useCallback, useRef, useEffect } from 'react'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useWakeLock } from './useWakeLock'
import { verifyVerseReading } from '../utils/textSimilarity'

interface UseVerseReadingProps {
  verseText: string
  onSuccess: (similarity: number) => void
  onError?: (error: string) => void
  threshold?: number
  silenceTimeout?: number // 침묵 후 자동 검증까지의 시간 (ms)
}

export const useVerseReading = ({
  verseText,
  onSuccess,
  onError,
  threshold = 0.4,
  silenceTimeout = 2000 // 기본 2초
}: UseVerseReadingProps) => {
  const [spokenText, setSpokenText] = useState('')
  const [feedback, setFeedback] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)
  
  const silenceTimerRef = useRef<number | null>(null)
  const isVerifyingRef = useRef(false)
  const lastTextRef = useRef('')
  const spokenTextRef = useRef('')
  const stopReadingRef = useRef<() => void>(() => {})

  // 자동 검증 함수
  const autoVerify = useCallback(() => {
    const currentSpokenText = spokenTextRef.current

    if (isVerifyingRef.current || !currentSpokenText) {
      return
    }

    const result = verifyVerseReading(verseText, currentSpokenText, threshold)

    if (result.isValid) {
      isVerifyingRef.current = true
      setFeedback({
        message: result.message,
        type: 'success'
      })
      onSuccess(result.similarity)
      // 곧바로 종료해 마이크를 해제한다 — 다음 절 시작이 죽어가는 세션과
      // 마이크를 두고 경쟁하면 새 세션이 조용히 실패해 이어 읽기가 끊긴다.
      stopReadingRef.current()
    } else {
      // 실패해도 텍스트를 지우지 않고 계속 듣는다 — 사용자가 남은 부분을
      // 마저 읽으면 handleResult가 검증을 다시 예약한다. (예전 3초 초기화는
      // 그 사이 도착한 낭독까지 지워 검증이 영영 안 도는 상태를 만들었다)
      setFeedback({
        message: result.message,
        type: 'error'
      })
    }
  }, [verseText, threshold, onSuccess])

  // 수동 검증 함수
  const manualVerify = useCallback(() => {
    if (!spokenText) {
      setFeedback({
        message: '읽은 내용이 없습니다',
        type: 'error'
      })
      return
    }

    const result = verifyVerseReading(verseText, spokenText, threshold)

    if (result.isValid) {
      setFeedback({
        message: result.message,
        type: 'success'
      })
      onSuccess(result.similarity)
      stopReadingRef.current()
    } else {
      setFeedback({
        message: result.message,
        type: 'error'
      })
    }
  }, [spokenText, verseText, threshold, onSuccess])

  const handleResult = useCallback((transcript: string) => {
    // 텍스트가 변경되지 않았으면 타이머를 리셋하지 않음
    if (transcript === lastTextRef.current) {
      return
    }

    lastTextRef.current = transcript
    spokenTextRef.current = transcript
    setSpokenText(transcript)

    // 기존 타이머 취소 후 침묵 타이머 재시작 (침묵이 이어지면 자동 검증)
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    silenceTimerRef.current = setTimeout(() => {
      autoVerify()
    }, silenceTimeout) as unknown as number
  }, [silenceTimeout, autoVerify])

  const handleError = useCallback((error: string) => {
    setFeedback({
      message: error,
      type: 'error'
    })
    onError?.(error)
  }, [onError])

  const {
    isListening,
    isStarting,
    isSupported,
    startListening,
    stopListening,
    primeMicrophone
  } = useSpeechRecognition({
    onResult: handleResult,
    onError: handleError,
    continuous: true, // 계속 듣기 모드 (천천히 읽어도 OK)
    language: 'ko-KR'
  })

  // 낭독 중 화면이 어두워지거나 잠기면 음성 인식이 끊긴다 — 읽는 동안 화면 유지
  useWakeLock(isListening)

  const startReading = useCallback(() => {
    setSpokenText('')
    spokenTextRef.current = ''
    setFeedback(null)
    isVerifyingRef.current = false
    lastTextRef.current = ''
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    startListening('')
  }, [startListening])

  const stopReading = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    isVerifyingRef.current = false
    lastTextRef.current = ''
    spokenTextRef.current = ''
    stopListening()
    setSpokenText('')
    setFeedback(null)
  }, [stopListening])

  // autoVerify가 성공 시 즉시 종료를 호출할 수 있도록 항상 최신 stopReading 유지
  stopReadingRef.current = stopReading

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [])

  return {
    isReading: isListening,
    isStarting,
    isSupported,
    spokenText,
    feedback,
    startReading,
    stopReading,
    manualVerify,
    primeMicrophone
  }
}
