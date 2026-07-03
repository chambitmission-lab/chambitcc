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

  // 자동 검증 함수
  const autoVerify = useCallback(() => {
    const currentSpokenText = spokenTextRef.current

    if (isVerifyingRef.current || !currentSpokenText) {
      return
    }

    isVerifyingRef.current = true
    const result = verifyVerseReading(verseText, currentSpokenText, threshold)

    if (result.isValid) {
      setFeedback({
        message: result.message,
        type: 'success'
      })
      onSuccess(result.similarity)
      setTimeout(() => {
        stopReading()
        isVerifyingRef.current = false
      }, 1000)
    } else {
      setFeedback({
        message: result.message,
        type: 'error'
      })
      setTimeout(() => {
        setSpokenText('')
        spokenTextRef.current = ''
        setFeedback(null)
        isVerifyingRef.current = false
      }, 3000)
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
      setTimeout(() => {
        stopReading()
      }, 1000)
    } else {
      setFeedback({
        message: result.message,
        type: 'error'
      })
      setTimeout(() => {
        setSpokenText('')
        setFeedback(null)
      }, 3000)
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
