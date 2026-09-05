// 오디오북 "잠들기 전 듣기" — 수면 타이머(페이드 아웃 일시정지) + 듣기 범위(○장까지).
// BibleAudioPlayer 에서 분리: 플레이어는 재생·절 동기화만 다루고, 타이머 판정·페이드·
// 남은 시간 틱은 여기서 담당한다. 화면 문구는 notify 로 호출부가 띄운다.
import { useEffect, useRef, useState, type RefObject } from 'react'

/** 수면 타이머 남은 시간 — 1분 미만은 초, 그 외엔 분(올림)으로 짧게 */
export const formatRemain = (ms: number): string =>
  ms < 60_000 ? `${Math.max(1, Math.ceil(ms / 1000))}초` : `${Math.ceil(ms / 60_000)}분`

interface UseAudioSleepTimerOptions {
  audioRef: RefObject<HTMLAudioElement | null>
  /** 타이머 만료로 재생을 멈추기 직전 — 다음 장 자동 재생 대기 등 플레이어 쪽 상태를 정리한다 */
  onExpire: () => void
  /** 안내 문구 표시 (토스트 등) */
  notify: (message: string) => void
}

const FADE_MS = 2500

export const useAudioSleepTimer = ({ audioRef, onExpire, notify }: UseAudioSleepTimerOptions) => {
  // 수면 타이머 만료 시각(epoch ms). setTimeout은 화면이 꺼지면 스로틀되므로
  // 재생 중 계속 발생하는 timeupdate 이벤트 + 1초 인터벌에서 실측 시각으로 판정한다.
  const [sleepUntil, setSleepUntil] = useState<number | null>(null)
  const sleepUntilRef = useRef<number | null>(null)
  // 듣기 범위: 이 장(포함)까지 듣고 연속 재생을 멈춘다. null이면 제한 없음
  const [endChapter, setEndChapter] = useState<number | null>(null)
  // 남은 시간 표시 갱신용 1초 틱 — 타이머가 켜져 있는 동안만 돈다
  const [, setSleepTick] = useState(0)
  const fadeTimerRef = useRef<number | null>(null)
  // 콜백은 ref로 보관 — 렌더마다 바뀌어도 인터벌/핸들러를 재구성하지 않는다
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  const notifyRef = useRef(notify)
  notifyRef.current = notify

  const cancelSleepFade = () => {
    if (fadeTimerRef.current != null) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
      const audio = audioRef.current
      if (audio) audio.volume = 1
    }
  }

  // 수면 타이머 만료 → 볼륨을 몇 초간 서서히 줄인 뒤 일시정지(위치 보존 → 이어듣기 가능).
  // iOS는 미디어 볼륨 설정이 무시되므로 페이드 없이 잠시 뒤 조용히 일시정지된다.
  // 페이드 진행률은 스텝 수가 아닌 경과 시각 기준 — 백그라운드에서 인터벌이
  // 1초로 스로틀돼도 제때 끝난다.
  const startSleepFade = () => {
    sleepUntilRef.current = null
    setSleepUntil(null)
    onExpireRef.current()
    const audio = audioRef.current
    // 이미 조용한 상태(수동 일시정지·장 전환 대기 등) — 타이머만 조용히 해제
    if (!audio || audio.paused) return
    if (fadeTimerRef.current != null) return
    const fadeStart = Date.now()
    fadeTimerRef.current = window.setInterval(() => {
      const p = (Date.now() - fadeStart) / FADE_MS
      if (p >= 1) {
        if (fadeTimerRef.current != null) clearInterval(fadeTimerRef.current)
        fadeTimerRef.current = null
        audio.pause()
        audio.volume = 1
        notifyRef.current('설정한 시간이 되어 재생을 멈췄어요 🌙')
      } else {
        audio.volume = Math.max(0, 1 - p)
      }
    }, 100)
  }

  /** 재생 중 timeupdate 마다 호출 — 화면이 꺼진 채 재생 중에도 만료를 판정한다 */
  const checkSleepTimer = () => {
    if (sleepUntilRef.current != null && Date.now() >= sleepUntilRef.current) startSleepFade()
  }

  // 타이머가 켜져 있는 동안 1초마다 남은 시간 표시를 갱신하고 만료를 판정한다.
  useEffect(() => {
    if (sleepUntil == null) return
    const id = window.setInterval(() => {
      setSleepTick((t) => t + 1)
      checkSleepTimer()
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepUntil])

  // 언마운트 시 진행 중이던 페이드 정리
  useEffect(() => () => {
    if (fadeTimerRef.current != null) clearInterval(fadeTimerRef.current)
  }, [])

  const setSleepMinutes = (m: number | null) => {
    cancelSleepFade()
    if (m == null) {
      const wasOn = sleepUntilRef.current != null
      sleepUntilRef.current = null
      setSleepUntil(null)
      if (wasOn) notifyRef.current('수면 타이머를 껐어요')
      return
    }
    const until = Date.now() + m * 60_000
    sleepUntilRef.current = until
    setSleepUntil(until)
    notifyRef.current(`${m}분 뒤에 소리를 줄이며 멈출게요 🌙`)
  }

  const sleepRemainingMs = sleepUntil != null ? Math.max(0, sleepUntil - Date.now()) : null

  return { sleepRemainingMs, endChapter, setEndChapter, checkSleepTimer, setSleepMinutes }
}
