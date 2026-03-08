import { useState, useCallback } from 'react'
import { useSpeechRecognition } from './useSpeechRecognition'
import { verifyVerseReading } from '../utils/textSimilarity'

interface UseVerseReadingProps {
  verseText: string
  onSuccess: (similarity: number) => void
  onError?: (error: string) => void
  threshold?: number
}

export const useVerseReading = ({
  verseText,
  onSuccess,
  onError,
  threshold = 0.75
}: UseVerseReadingProps) => {
  const [spokenText, setSpokenText] = useState('')
  const [feedback, setFeedback] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

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

  const handleResult = useCallback((transcript: string, isFinal: boolean) => {
    setSpokenText(transcript)

    // 최종 결과일 때만 검증
    if (isFinal) {
      const result = verifyVerseReading(verseText, transcript, threshold)
      
      if (result.isValid) {
        setFeedback({
          message: result.message,
          type: 'success'
        })
        onSuccess(result.similarity)
        // 성공 후 자동으로 중지
        setTimeout(() => {
          stopReading()
        }, 1000)
      } else {
        setFeedback({
          message: result.message,
          type: 'error'
        })
        // 실패 시 다시 시도할 수 있도록 텍스트 초기화
        setTimeout(() => {
          setSpokenText('')
          setFeedback(null)
        }, 3000)
      }
    }
  }, [verseText, threshold, onSuccess])

  const handleError = useCallback((error: string) => {
    setFeedback({
      message: error,
      type: 'error'
    })
    onError?.(error)
  }, [onError])

  const {
    isListening,
    isSupported,
    startListening,
    stopListening
  } = useSpeechRecognition({
    onResult: handleResult,
    onError: handleError,
    continuous: false, // 한 번에 한 구절씩
    language: 'ko-KR'
  })

  const startReading = useCallback(() => {
    setSpokenText('')
    setFeedback(null)
    startListening('')
  }, [startListening])

  const stopReading = useCallback(() => {
    stopListening()
    setSpokenText('')
    setFeedback(null)
  }, [stopListening])

  return {
    isReading: isListening,
    isSupported,
    spokenText,
    feedback,
    startReading,
    stopReading,
    manualVerify
  }
}
