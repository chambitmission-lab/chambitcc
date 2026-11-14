import { useEffect, useRef, useState } from 'react'
import { useCurrentWeather } from '../../../../hooks/useWeather'
import type { RailWeatherMode, RailTheme } from './railWeatherScene'
import { weatherToRailMode } from './railWeatherMode'

/* 레일 하단 삽화 위 날씨 연출 — 비·뇌우·눈·폭설일 때만 캔버스를 띄운다.
 * 맑은 날·흐림·안개는 아무것도 그리지 않고, 엔진(railWeatherScene)도 받지 않는다.
 * 부모 .rail-bottom-art 의 네 변 페이드 마스크를 그대로 함께 받는다.
 * 소리는 없다(묵상 화면 자동 소리 금지 원칙). 동작 줄이기 설정이면 끈다. */

/* 개발·확인용: localStorage 'rail-weather-preview' = drizzle | rain | storm | snow | blizzard */
const PREVIEW_KEY = 'rail-weather-preview'
const PREVIEW_MODES: RailWeatherMode[] = ['drizzle', 'rain', 'storm', 'snow', 'blizzard']

const readPreview = (): RailWeatherMode | null => {
  try {
    const v = localStorage.getItem(PREVIEW_KEY)
    return v && (PREVIEW_MODES as string[]).includes(v) ? (v as RailWeatherMode) : null
  } catch {
    return null
  }
}

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

/* 레일 루프는 모든 화면에 떠 있으므로 30fps 로 묶는다 */
const FRAME_MS = 1000 / 30

interface Props {
  /** 지금 테마의 삽화 경로 (RAIL_BOTTOM 쌍 중 하나) */
  src: string
  theme: RailTheme
}

export default function RailWeatherFx({ src, theme }: Props) {
  const { weather } = useCurrentWeather()
  const reduced = usePrefersReducedMotion()
  const [preview] = useState(readPreview)
  const mode = preview ?? weatherToRailMode(weather)
  const active = !!mode && !reduced
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!active || !mode || !canvas) return
    let disposed = false
    let raf = 0
    let ro: ResizeObserver | null = null
    let cleanupScene: (() => void) | null = null

    void (async () => {
      const [{ RailWeatherScene, buildArtRes }, img] = await Promise.all([
        import('./railWeatherScene'),
        new Promise<HTMLImageElement | null>((resolve) => {
          const i = new Image()
          i.decoding = 'async'
          i.onload = () => resolve(i)
          i.onerror = () => resolve(null)
          i.src = src
        }),
      ])
      if (disposed || !img) return
      const scene = new RailWeatherScene(canvas, mode)
      const bg =
        getComputedStyle(document.documentElement).getPropertyValue('--desktop-chrome').trim() ||
        (theme === 'dark' ? '#131313' : '#f1f3f6')
      scene.setArt(buildArtRes(img, theme), theme, bg)

      let sized = false
      const resize = () => {
        const r = canvas.getBoundingClientRect()
        // 높이 티어가 낮아 칸이 숨겨지면(display:none) 0 — 그동안은 그리지 않는다
        sized = r.width > 0 && r.height > 0
        if (sized) scene.resize(r.width, r.height, Math.min(2, window.devicePixelRatio || 1))
      }
      resize()
      ro = new ResizeObserver(resize)
      ro.observe(canvas)

      let last = performance.now()
      let acc = 0
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        const dt = Math.min(0.1, (now - last) / 1000)
        last = now
        acc += dt * 1000
        if (acc < FRAME_MS || !sized) return
        const step = Math.min(0.05, acc / 1000)
        acc = 0
        scene.update(step)
        scene.draw()
      }
      raf = requestAnimationFrame(loop)
      setReady(true)
      cleanupScene = () => scene.dispose()
    })()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro?.disconnect()
      cleanupScene?.()
      setReady(false)
    }
  }, [active, mode, src, theme])

  if (!active) return null
  return (
    <canvas
      ref={canvasRef}
      className={`rail-weather-fx${ready ? ' is-ready' : ''}`}
      data-mode={mode ?? undefined}
      aria-hidden
    />
  )
}
