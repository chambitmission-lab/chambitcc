import { useState, useEffect, useRef, useCallback } from 'react'

interface UsePrayerTimerProps {
  onComplete?: () => void
  /** 진행률이 50%를 지나는 순간 1회 호출 — 중간 말씀 fade-in 등에 사용 */
  onHalfway?: () => void
}

export const usePrayerTimer = ({ onComplete, onHalfway }: UsePrayerTimerProps = {}) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)

  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const halfwayFiredRef = useRef<boolean>(false)
  const totalRef = useRef<number>(0)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = useCallback((seconds: number) => {
    clearTimer()
    setTimeLeft(seconds)
    setTotalSeconds(seconds)
    setIsRunning(true)
    setIsPaused(false)
    setIsComplete(false)
    startTimeRef.current = Date.now()
    pausedTimeRef.current = 0
    halfwayFiredRef.current = false
    totalRef.current = seconds

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer()
          setIsRunning(false)
          setIsComplete(true)
          onComplete?.()
          return 0
        }
        const next = prev - 1
        // 중간 지점(50%) 통과 시점에 1회 발사
        if (!halfwayFiredRef.current && totalRef.current > 0 && next <= totalRef.current / 2) {
          halfwayFiredRef.current = true
          onHalfway?.()
        }
        return next
      })
    }, 1000)
  }, [clearTimer, onComplete, onHalfway])

  const pauseTimer = useCallback(() => {
    if (isRunning && !isPaused) {
      clearTimer()
      setIsPaused(true)
      pausedTimeRef.current = Date.now()
    }
  }, [isRunning, isPaused, clearTimer])

  const resumeTimer = useCallback(() => {
    if (isPaused) {
      setIsPaused(false)

      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer()
            setIsRunning(false)
            setIsComplete(true)
            onComplete?.()
            return 0
          }
          const next = prev - 1
          if (!halfwayFiredRef.current && totalRef.current > 0 && next <= totalRef.current / 2) {
            halfwayFiredRef.current = true
            onHalfway?.()
          }
          return next
        })
      }, 1000)
    }
  }, [isPaused, clearTimer, onComplete, onHalfway])

  const resetTimer = useCallback(() => {
    clearTimer()
    setTimeLeft(0)
    setTotalSeconds(0)
    setIsRunning(false)
    setIsPaused(false)
    setIsComplete(false)
    startTimeRef.current = 0
    pausedTimeRef.current = 0
  }, [clearTimer])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  // 페이지 이탈 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRunning) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isRunning])

  return {
    timeLeft,
    totalSeconds,
    isRunning,
    isPaused,
    isComplete,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  }
}
