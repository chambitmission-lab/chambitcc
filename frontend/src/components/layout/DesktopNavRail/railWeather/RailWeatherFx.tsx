import { useEffect, useRef, useState } from 'react'
import { useCurrentWeather } from '../../../../hooks/useWeather'
import type { RailSceneMode, RailWeatherMode, RailTheme } from './railWeatherScene'
import { weatherToRailMode } from './railWeatherMode'
import { clearSnowMemory, hasSnowLeft } from './railSnowMemory'

/* 레일 하단 삽화 위 날씨 연출 — 비·뇌우·눈·폭설일 때만 캔버스를 띄운다.
 * 맑은 날·흐림·안개는 아무것도 그리지 않고, 엔진(railWeatherScene)도 받지 않는다.
 * 부모 .rail-bottom-art 의 네 변 페이드 마스크를 그대로 함께 받는다.
 * 소리는 없다(묵상 화면 자동 소리 금지 원칙).
 *
 * - 눈이 그치면 곧바로 거두지 않는다: 쌓인 눈만 남겨 천천히 녹인다(thaw). 비로 바뀌면 눈은 씻겨 나간다.
 * - 날씨가 개면 캔버스는 0.8초에 걸쳐 스러진 뒤 내려간다(들어올 때와 같은 빠르기).
 * - 동작 줄이기 설정이면 루프 없이 정지 화면 한 장만 그린다 — 흐린 하늘·먹구름·쌓인 눈으로
 *   날씨는 알리되 움직이는 것은 없다. (예전에는 통째로 꺼서 궂은 날 빈 삽화만 남았다) */

/* 개발·확인용: localStorage 'rail-weather-preview' = drizzle | rain | storm | snow | blizzard | thaw
 * 장대비(비 + 잦은 먼 번쩍임)는 'downpour' */
const PREVIEW_KEY = 'rail-weather-preview'
const PREVIEW_HEAVY = 'downpour'
const PREVIEW_MODES: RailSceneMode[] = ['drizzle', 'rain', 'storm', 'snow', 'blizzard', 'thaw']

const readPreview = (): RailSceneMode | null => {
  try {
    const v = localStorage.getItem(PREVIEW_KEY)
    if (v === PREVIEW_HEAVY) return 'rain'
    return v && (PREVIEW_MODES as string[]).includes(v) ? (v as RailSceneMode) : null
  } catch {
    return null
  }
}

const readPreviewHeavy = (): boolean => {
  try {
    return localStorage.getItem(PREVIEW_KEY) === PREVIEW_HEAVY
  } catch {
    return false
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
/* 눈 그친 뒤는 거의 멈춘 그림이다(녹는 눈·가끔 반짝임) — 10fps 면 충분하다 */
const THAW_FRAME_MS = 1000 / 10
/* .rail-weather-fx 의 opacity 전환 시간(DesktopNavRail.css)과 같은 값 */
const FADE_MS = 800

const isSnowMode = (m: RailWeatherMode | null) => m === 'snow' || m === 'blizzard'

interface Props {
  /** 지금 테마의 삽화 경로 (RAIL_BOTTOM 쌍 중 하나) */
  src: string
  theme: RailTheme
  /** 시연용 — 실제 날씨·미리보기 키 대신 이 장면을 띄운다 */
  forceMode?: RailSceneMode
}

export default function RailWeatherFx({ src, theme, forceMode }: Props) {
  const { weather } = useCurrentWeather()
  const reduced = usePrefersReducedMotion()
  const [storedPreview] = useState(readPreview)
  const preview = forceMode ?? storedPreview
  const [previewHeavy] = useState(readPreviewHeavy)
  const live = weatherToRailMode(weather)

  /* 눈 그친 뒤 — 방금까지 눈이 왔거나, 레일이 다시 떴는데 기억해 둔 눈이 남아 있으면 켠다 */
  const [thaw, setThaw] = useState(hasSnowLeft)
  const [prevLive, setPrevLive] = useState(live)
  if (live !== prevLive) {
    setPrevLive(live)
    if (isSnowMode(prevLive) && !live) setThaw(true)
    else if (live) setThaw(false)
  }
  /* 비가 오면 쌓인 눈은 씻겨 나간다 — 비 그친 뒤에 눈이 되살아나지 않게 기억도 지운다.
   * (눈 장면이 내려가며 기억을 적는 것은 정리 단계라, 같은 커밋의 이 효과보다 먼저 끝난다) */
  useEffect(() => {
    if (live && !isSnowMode(live)) clearSnowMemory()
  }, [live])

  // 정지 화면에서는 녹는 과정을 보여 줄 수 없으니 thaw 를 쓰지 않는다
  const mode: RailSceneMode | null = preview ?? live ?? (thaw && !reduced ? 'thaw' : null)
  /* 장대비 — 비 장면의 먼 번쩍임이 잦아진다(미리보기는 'downpour' 키로만) */
  const heavy = mode === 'rain' && (preview ? previewHeavy && !forceMode : !!weather?.isHeavyRain)
  /* 약한 비 — 비는 내리되 번쩍임은 없다(미리보기 'rain' 은 보통 비로 본다) */
  const calm = mode === 'rain' && !preview && !!weather?.isLightRain
  const active = !!mode

  /* 날씨가 개어도 캔버스는 스러지는 동안(FADE_MS) 남겨 둔다 */
  const [mounted, setMounted] = useState(active)
  if (active && !mounted) setMounted(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (active) return
    const timer = setTimeout(() => {
      setMounted(false)
      setReady(false)
    }, FADE_MS)
    return () => clearTimeout(timer)
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!mode || !canvas) return
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
      const scene = new RailWeatherScene(canvas, mode, { still: reduced, demo: preview === 'thaw', heavy, calm })
      const bg =
        getComputedStyle(document.documentElement).getPropertyValue('--desktop-chrome').trim() ||
        (theme === 'dark' ? '#131313' : '#f1f3f6')
      scene.setArt(buildArtRes(img, theme), theme, bg)
      cleanupScene = () => scene.dispose()

      let sized = false
      const resize = () => {
        const r = canvas.getBoundingClientRect()
        // 높이 티어가 낮아 칸이 숨겨지면(display:none) 0 — 그동안은 그리지 않는다
        sized = r.width > 0 && r.height > 0
        if (!sized) return
        scene.resize(r.width, r.height, Math.min(2, window.devicePixelRatio || 1))
        // 정지 화면은 루프가 없다 — 크기가 정해질 때마다 한 장만 그린다
        if (reduced) scene.draw()
      }
      resize()
      ro = new ResizeObserver(resize)
      ro.observe(canvas)
      setReady(true)
      if (reduced) return

      const frameMs = mode === 'thaw' ? THAW_FRAME_MS : FRAME_MS
      // 한 걸음의 상한 — 프레임 간격보다 조금 넉넉하게(느린 프레임에서 시간이 느려지지 않게)
      const maxStep = Math.max(0.05, (frameMs / 1000) * 1.5)
      let last = performance.now()
      let acc = 0
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop)
        const dt = Math.min(0.1, (now - last) / 1000)
        last = now
        acc += dt * 1000
        /* 문턱은 조금 낮춰 잡는다 — 60Hz 에서 두 프레임(33.3ms)이 30fps 문턱(33.33ms)에 아슬아슬하게 못 미치면
         * 한 프레임을 더 기다려 30fps·20fps 가 뒤섞였고, 느린 먹구름이 끊겨 보였다(2026-11-26) */
        if (acc < frameMs - 4 || !sized) return
        const step = Math.min(maxStep, acc / 1000)
        acc = 0
        scene.update(step)
        scene.draw()
        if (scene.done) {
          // 눈이 다 녹았다 — 루프를 멈추고 캔버스를 거둔다(미리보기는 마지막 그림으로 남는다)
          cancelAnimationFrame(raf)
          setThaw(false)
        }
      }
      raf = requestAnimationFrame(loop)
    })()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro?.disconnect()
      cleanupScene?.()
    }
  }, [mode, src, theme, reduced, preview, heavy, calm])

  if (!mounted) return null
  /* ready 는 장면이 바뀌어도 내리지 않는다 — 새 장면이 첫 장을 그릴 때까지 앞 장면의 마지막 그림이
   * 그대로 남아, 눈 → 눈 그친 뒤처럼 이어지는 전환에서 캔버스가 깜빡 꺼졌다 켜지지 않는다 */
  return (
    <canvas
      ref={canvasRef}
      className={`rail-weather-fx${ready && active ? ' is-ready' : ''}`}
      data-mode={mode ?? undefined}
      aria-hidden
    />
  )
}
