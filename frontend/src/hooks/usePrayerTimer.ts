import { useState, useEffect, useRef } from 'react'

interface UsePrayerTimerResult {
  startTimer: () => void
  stopTimer: () => number // 경과 시간(분) 반환
  elapsedMinutes: number
  isRunning: boolean
  resetTimer: () => void
}

/**
 * 기도 시간을 추적하는 훅
 * - 기도 시작 시 타이머 시작
 * - 기도 완료 시 경과 시간(분) 반환
 */
export const usePrayerTimer = (): UsePrayerTimerResult => {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const isRunning = startTime !== null

  // 타이머 시작
  const startTimer = () => {
    if (isRunning) return // 이미 실행 중이면 무시
    
    const now = Date.now()
    setStartTime(now)
    setElapsedSeconds(0)

    // 1초마다 경과 시간 업데이트
    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - now) / 1000))
    }, 1000)
  }

  // 타이머 정지 및 경과 시간(분) 반환
  const stopTimer = (): number => {
    if (!isRunning) return 0

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const elapsed = Math.floor((Date.now() - startTime!) / 1000)
    const minutes = Math.max(1, Math.round(elapsed / 60)) // 최소 1분

    setStartTime(null)
    setElapsedSeconds(0)

    return minutes
  }

  // 타이머 리셋
  const resetTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setStartTime(null)
    setElapsedSeconds(0)
  }

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [])

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  return {
    startTimer,
    stopTimer,
    elapsedMinutes,
    isRunning,
    resetTimer,
  }
}
