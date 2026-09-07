import { useCallback, useEffect, useRef, useState } from 'react'
import type { AtlasJourney } from './atlasTypes'
import { PLACES } from './data/places'
import { project } from './projection'

/**
 * "걸어보기" 재생 엔진.
 *
 * 이 화면의 핵심 장치다. 글을 한 줄도 읽지 않아도 경로가 자라나는 것만 보면
 * 여정의 흐름이 들어오게 만드는 것이 목적이라, 두 가지를 지킨다.
 *  - 구간 길이에 따라 이동 시간이 달라진다 (먼 바닷길은 실제로 오래 걸린 느낌)
 *  - 지점에 도착하면 잠깐 멈춘다 (자막을 읽을 틈)
 *
 * 되짚어 가는 구간(이미 들른 장소)은 짧게 지나간다 — 같은 설명을 두 번
 * 기다리게 하면 지루해진다.
 */

const MIN_LEG_MS = 780
const MAX_LEG_MS = 2200
const DWELL_MS = 1100
const DWELL_REVISIT_MS = 600

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export interface JourneyPlayer {
  /** 도달한 지점 index */
  index: number
  /** index → index+1 구간의 진행도 0~1 */
  legProgress: number
  playing: boolean
  /** 한 번이라도 재생했는가 — 첫 화면의 문구를 가른다 */
  hasPlayed: boolean
  /** 재생을 마치고 마지막 지점에 서 있는가 */
  finished: boolean
  toggle: () => void
  play: () => void
  pause: () => void
  restart: () => void
  skipToEnd: () => void
  /** 특정 지점으로 건너뛰기 (목록에서 탭) */
  seekTo: (index: number) => void
}

export const useJourneyPlayer = (journey: AtlasJourney): JourneyPlayer => {
  const last = journey.stops.length - 1
  const [index, setIndex] = useState(last)
  const [legProgress, setLegProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  // 구간별 이동 시간 — 지도상 거리에 비례
  const legDurations = useRef<number[]>([])
  useEffect(() => {
    legDurations.current = journey.stops.slice(1).map((stop, i) => {
      const a = PLACES[journey.stops[i].place]
      const b = PLACES[stop.place]
      if (!a || !b) return MIN_LEG_MS
      const pa = project(a.lat, a.lng)
      const pb = project(b.lat, b.lng)
      const d = Math.hypot(pb.x - pa.x, pb.y - pa.y)
      return Math.min(Math.max(700 + d * 6, MIN_LEG_MS), MAX_LEG_MS)
    })
  }, [journey])

  // 여정이 바뀌면 처음 상태(전체 공개)로
  useEffect(() => {
    setIndex(journey.stops.length - 1)
    setLegProgress(0)
    setPlaying(false)
    setHasPlayed(false)
  }, [journey])

  const rafRef = useRef(0)
  const stateRef = useRef({ index: last, leg: 0, dwellLeft: 0, prevTs: 0 })

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current)
      return
    }
    stateRef.current.index = index
    stateRef.current.leg = legProgress
    stateRef.current.prevTs = 0

    const tick = (ts: number) => {
      const s = stateRef.current
      const dt = s.prevTs ? Math.min(ts - s.prevTs, 64) : 0 // 탭 복귀 시 점프 방지
      s.prevTs = ts

      if (s.index >= last) {
        setPlaying(false)
        return
      }

      if (s.dwellLeft > 0) {
        s.dwellLeft -= dt
      } else {
        const duration = legDurations.current[s.index] ?? MIN_LEG_MS
        s.leg += dt / duration
        if (s.leg >= 1) {
          s.index += 1
          s.leg = 0
          // 이미 들렀던 장소면 짧게 — 되짚어 가는 길
          const placeId = journey.stops[s.index]?.place
          const firstVisit =
            journey.stops.findIndex((stop) => stop.place === placeId) === s.index
          s.dwellLeft = firstVisit ? DWELL_MS : DWELL_REVISIT_MS
          setIndex(s.index)
          setLegProgress(0)
          if (s.index >= last) {
            setPlaying(false)
            return
          }
        } else {
          setLegProgress(s.leg)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // index/legProgress 는 시작 시점 값만 필요하다 — 매 프레임 재구독하면 안 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, journey, last])

  const play = useCallback(() => {
    setHasPlayed(true)
    if (prefersReducedMotion()) {
      setIndex(last)
      setLegProgress(0)
      return
    }
    setIndex((prev) => {
      // 끝에서 다시 누르면 처음부터
      if (prev >= last) {
        setLegProgress(0)
        return 0
      }
      return prev
    })
    setPlaying(true)
  }, [last])

  const pause = useCallback(() => setPlaying(false), [])

  const toggle = useCallback(() => {
    if (playing) pause()
    else play()
  }, [playing, pause, play])

  const restart = useCallback(() => {
    setHasPlayed(true)
    setIndex(0)
    setLegProgress(0)
    setPlaying(!prefersReducedMotion())
  }, [])

  const skipToEnd = useCallback(() => {
    setHasPlayed(true)
    setPlaying(false)
    setIndex(last)
    setLegProgress(0)
  }, [last])

  const seekTo = useCallback(
    (next: number) => {
      setHasPlayed(true)
      setPlaying(false)
      setIndex(Math.min(Math.max(next, 0), last))
      setLegProgress(0)
    },
    [last]
  )

  return {
    index,
    legProgress,
    playing,
    hasPlayed,
    finished: hasPlayed && index >= last && !playing,
    toggle,
    play,
    pause,
    restart,
    skipToEnd,
    seekTo,
  }
}
