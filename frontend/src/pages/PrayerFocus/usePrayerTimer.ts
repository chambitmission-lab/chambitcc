import { useState, useEffect, useRef, useCallback } from 'react'

interface UsePrayerTimerProps {
  onComplete?: () => void
}

export const usePrayerTimer = ({ onComplete }: UsePrayerTimerProps = {}) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  
  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

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

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer()
          setIsRunning(false)
          setIsComplete(true)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer, onComplete])

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
          return prev - 1
        })
      }, 1000)
    }
  }, [isPaused, clearTimer, onComplete])

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
