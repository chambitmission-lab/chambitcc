import { useState, useEffect, useRef, useCallback } from 'react'

interface UsePrayerTimerProps {
  onComplete?: () => void
  /** 진행률이 50%를 지나는 순간 1회 호출 — 중간 말씀 fade-in 등에 사용 */
  onHalfway?: () => void
}

// 모바일 브라우저는 백그라운드 탭의 setInterval 을 심하게 스로틀하므로
// "매 틱 -1초" 방식 대신 종료 시각(deadline)을 기준으로 남은 시간을 재계산한다.
// 화면 복귀(visibilitychange/focus) 시 즉시 보정되어 잠금·전화·앱 전환에도 시간이 밀리지 않는다.
export const usePrayerTimer = ({ onComplete, onHalfway }: UsePrayerTimerProps = {}) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)

  const intervalRef = useRef<number | null>(null)
  const endAtRef = useRef<number>(0)            // 실행 중 종료 시각 (epoch ms)
  const pausedRemainingRef = useRef<number>(0)  // 일시정지 시점 남은 ms
  const halfwayFiredRef = useRef<boolean>(false)
  const completeFiredRef = useRef<boolean>(false)
  const totalRef = useRef<number>(0)
  const runningRef = useRef<boolean>(false)

  const onCompleteRef = useRef(onComplete)
  const onHalfwayRef = useRef(onHalfway)
  onCompleteRef.current = onComplete
  onHalfwayRef.current = onHalfway

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // deadline 기준으로 남은 시간을 다시 계산해 상태에 반영
  const sync = useCallback(() => {
    if (!runningRef.current) return
    const leftMs = endAtRef.current - Date.now()
    const left = Math.max(0, Math.ceil(leftMs / 1000))
    setTimeLeft(left)

    if (!halfwayFiredRef.current && totalRef.current > 0 && left <= totalRef.current / 2 && left > 0) {
      halfwayFiredRef.current = true
      onHalfwayRef.current?.()
    }

    if (left <= 0 && !completeFiredRef.current) {
      completeFiredRef.current = true
      runningRef.current = false
      clearTimer()
      setIsRunning(false)
      setIsComplete(true)
      onCompleteRef.current?.()
    }
  }, [clearTimer])

  const startTicking = useCallback(() => {
    clearTimer()
    // 500ms 틱 — 초 표시가 밀리지 않을 만큼만 촘촘하게
    intervalRef.current = window.setInterval(sync, 500)
  }, [clearTimer, sync])

  const startTimer = useCallback((seconds: number) => {
    setTimeLeft(seconds)
    setTotalSeconds(seconds)
    setIsRunning(true)
    setIsPaused(false)
    setIsComplete(false)
    endAtRef.current = Date.now() + seconds * 1000
    pausedRemainingRef.current = 0
    halfwayFiredRef.current = false
    completeFiredRef.current = false
    totalRef.current = seconds
    runningRef.current = true
    startTicking()
  }, [startTicking])

  const pauseTimer = useCallback(() => {
    if (!runningRef.current) return
    pausedRemainingRef.current = Math.max(0, endAtRef.current - Date.now())
    runningRef.current = false
    clearTimer()
    setIsPaused(true)
  }, [clearTimer])

  const resumeTimer = useCallback(() => {
    if (completeFiredRef.current) return
    setIsPaused(false)
    endAtRef.current = Date.now() + pausedRemainingRef.current
    runningRef.current = true
    startTicking()
  }, [startTicking])

  // 기도가 길어질 때 남은 시간을 늘린다 (일시정지 중에도 허용)
  const extendTimer = useCallback((seconds: number) => {
    if (completeFiredRef.current) return
    totalRef.current += seconds
    setTotalSeconds((prev) => prev + seconds)
    if (runningRef.current) {
      endAtRef.current += seconds * 1000
      sync()
    } else {
      pausedRemainingRef.current += seconds * 1000
      setTimeLeft((prev) => prev + seconds)
    }
  }, [sync])

  const resetTimer = useCallback(() => {
    clearTimer()
    runningRef.current = false
    setTimeLeft(0)
    setTotalSeconds(0)
    setIsRunning(false)
    setIsPaused(false)
    setIsComplete(false)
    endAtRef.current = 0
    pausedRemainingRef.current = 0
    halfwayFiredRef.current = false
    completeFiredRef.current = false
    totalRef.current = 0
  }, [clearTimer])

  // 백그라운드에서 복귀하면 즉시 보정 (스로틀된 인터벌을 기다리지 않는다)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', sync)
    return () => {
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', sync)
    }
  }, [sync])

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
    extendTimer,
  }
}
