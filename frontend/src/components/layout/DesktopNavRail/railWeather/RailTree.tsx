import { useEffect, useRef, useState } from 'react'
import { useCurrentWeather } from '../../../../hooks/useWeather'
import type { RailSceneMode, RailTheme } from './railWeatherScene'
import type { RailTreeScene, TreePlacement, TreeRain } from './railTreeScene'
import { weatherToRailMode } from './railWeatherMode'
import { setStrikeHook } from './railStrike'

/* 레일 하단 삽화의 사계절 나무 — 예배당 왼쪽 앞 언덕(2026-11-22 시연).
 * 엔진(railTreeScene)은 지연 청크. 날씨 캔버스(RailWeatherFx) 위에 겹치고, 부모의 네 변 페이드 마스크를 함께 받는다.
 *  - 계절은 오늘 날짜로 정한다(하루하루 이어지는 값 — 3월 눈 틔움 → 4월 꽃 → 여름 초록 → 가을 단풍·낙엽 → 겨울 빈 가지)
 *  - 눈이 오면 가지 위에 눈이 쌓이고, 그치면 아주 천천히 녹는다(새로 떠도 이어지게 모듈 변수에 기억)
 *  - 동작 줄이기면 흔들림·낙엽 없이 한 장
 * 개발·확인용: localStorage 'rail-season-preview' = spring | summer | autumn | winter | MM-DD */

const PREVIEW_KEY = 'rail-season-preview'
const SEASON_DATE: Record<string, string> = { spring: '04-12', summer: '07-15', autumn: '11-05', winter: '01-12' }

const readPreviewDate = (): Date | null => {
  try {
    const v = localStorage.getItem(PREVIEW_KEY)
    if (!v) return null
    const md = SEASON_DATE[v] ?? v
    const m = /^(\d{2})-(\d{2})$/.exec(md)
    if (!m) return null
    return new Date(new Date().getFullYear(), Number(m[1]) - 1, Number(m[2]), 12)
  } catch {
    return null
  }
}

/* 가지 위 눈 — 레일이 잠깐 내려갔다 떠도 이어지게 */
let snowMemory = 0

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

const FRAME_MS = 1000 / 24

interface Props {
  theme: RailTheme
  /** 시연: 이 날짜의 나무(없으면 미리보기 키 → 오늘) */
  date?: Date
  /** 시연: 날씨를 정해 준다(undefined 면 실제 날씨) */
  weatherMode?: RailSceneMode | null
  /** 시연: 꽃 피어나기·새싹 돋기를 처음에 보여 주고 낙엽을 조금 잦게 */
  demo?: boolean
  /** 나무 자리 — 기본 앞 언덕(2026-11-22 사용자 확정, 뒷언덕은 비교용) */
  placement?: TreePlacement
}

export default function RailTree({ theme, date, weatherMode, demo, placement = 'front' }: Props) {
  const { weather } = useCurrentWeather()
  const reduced = usePrefersReducedMotion()
  const [previewDate] = useState(readPreviewDate)
  const [today] = useState(() => new Date())
  const when = date ?? previewDate ?? today
  const mode = weatherMode !== undefined ? weatherMode : weatherToRailMode(weather)
  const snowing = mode === 'snow' || mode === 'blizzard'
  const rain: TreeRain | null = mode === 'drizzle' || mode === 'rain' || mode === 'storm' ? mode : null
  const wind = mode === 'storm' ? 3 : mode === 'blizzard' ? 2.6 : mode === 'rain' ? 1.6 : 1

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<RailTreeScene | null>(null)
  const [ready, setReady] = useState(false)
  const [burning, setBurning] = useState(false)
  const dayKey = `${when.getMonth()}-${when.getDate()}`

  /* 장면 만들기 — 테마·동작 줄이기가 바뀔 때만 새로 */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false
    let raf = 0
    let ro: ResizeObserver | null = null
    let scene: RailTreeScene | null = null

    void import('./railTreeScene').then(({ RailTreeScene }) => {
      if (disposed) return
      scene = new RailTreeScene(canvas, when, { still: reduced, demo, placement, onBurning: setBurning })
      scene.setTheme(theme)
      scene.setSnow(demo ? 0 : snowMemory)
      scene.setWeather(snowing, wind, rain)
      sceneRef.current = scene
      // 같은 칸의 날씨 엔진이 번개를 칠 때 묻는다 — 아주 드물게 나무가 맞는다(다크·폭풍)
      const cell = canvas.parentElement
      const sc = scene
      if (cell) setStrikeHook(cell, () => sc.claimStrike())
      let sized = false
      const resize = () => {
        const r = canvas.getBoundingClientRect()
        sized = r.width > 0 && r.height > 0
        if (!sized || !scene) return
        scene.resize(r.width, r.height, Math.min(2, window.devicePixelRatio || 1))
        scene.draw()
      }
      resize()
      ro = new ResizeObserver(resize)
      ro.observe(canvas)
      setReady(true)
      if (reduced) return

      let last = performance.now()
      let acc = 0
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        const dt = Math.min(0.1, (now - last) / 1000)
        last = now
        acc += dt * 1000
        if (acc < FRAME_MS || !sized || !scene) return
        const step = Math.min(0.08, acc / 1000)
        acc = 0
        scene.update(step)
        scene.draw()
      }
      raf = requestAnimationFrame(loop)
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro?.disconnect()
      if (canvas.parentElement) setStrikeHook(canvas.parentElement, null)
      setBurning(false)
      if (scene && !demo) snowMemory = scene.snowLevel
      scene?.dispose()
      sceneRef.current = null
    }
    // 날짜·날씨는 아래 효과가 장면에 그대로 넘긴다 — 장면을 새로 만들지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, reduced, demo, placement])

  useEffect(() => {
    sceneRef.current?.setWeather(snowing, wind, rain)
  }, [snowing, wind, rain, ready])

  const firstDay = useRef(dayKey)
  useEffect(() => {
    if (firstDay.current === dayKey) return
    firstDay.current = dayKey
    const s = sceneRef.current
    if (!s) return
    s.setDate(when)
    if (reduced) s.draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey])

  // 궂은 날엔 날씨 캔버스가 그림을 어둡게 덮는다 — 그 위에 겹친 나무도 같은 만큼 가라앉힌다(DesktopNavRail.css)
  return (
    <canvas
      ref={canvasRef}
      className={`rail-tree-fx${ready ? ' is-ready' : ''}`}
      data-weather={mode ?? undefined}
      data-burning={burning || undefined}
      aria-hidden
    />
  )
}
