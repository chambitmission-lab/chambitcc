// 작품 크게 보기 — 글씨가 쓴 순서대로 종이 위에 다시 써진다(어떻게 썼는지 보이게).
// 획 JSON 은 서버 프록시(/ink)로 받는다. 받기 전·실패하면 출품 PNG 를 그대로 보여 준다.
// 구도는 갤러리 썸네일과 같다(쓴 자리만 잘라 크림 종이 가운데) — 열어도 화면이 튀지 않게.
// 재생 리듬은 타임캡슐 손글씨(open/HandwrittenLetter)와 같다: 앞은 느리게·중간은 빠르게, 탭하면 끝까지.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useContestEntryInk } from '../../hooks/useHandwritingContest'
import type { ContestEntry } from '../../types/handwritingContest'
import { inkPointCount, parseInkPageFile } from '../Capsule/ink/inkModel'
import { drawStroke } from '../Capsule/ink/inkRender'
import { PaperThumb } from './contestShared'
import { inkBounds } from './inkCard'

const MIN_MS = 4000
const MAX_MS = 12000
const MS_PER_POINT = 8
const MAX_DPR = 2
/** .hw-paper img 의 inset 7% 와 같은 여백 */
const INSET = 0.07

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface Props {
  entry: ContestEntry
  maxRatio?: number
  className?: string
  /** 종이 비율(세로/가로)을 고정한다 — 히어로처럼 자리가 정해진 곳. 글씨는 그 안에 contain */
  ratio?: number
  /** 아래 안내·다시 보기 버튼과 종이 탭(끝까지 보기)을 뺀다 — 스토리·히어로처럼 바깥이 제스처를 맡을 때 */
  bare?: boolean
  /** 재생을 시작할 때 걸리는 시간(ms)을 알린다. 한 번에 다 그리면(획 없음·실패·동작 줄이기) 0 */
  onPlay?: (ms: number) => void
  style?: CSSProperties
}

const InkReplay = ({ entry, maxRatio = 1.5, className = '', ratio: fixedRatio, bare = false, onPlay, style }: Props) => {
  const ink = useContestEntryInk(entry.contest_id, entry.id, entry.has_ink)
  const page = useMemo(() => (ink.data ? parseInkPageFile(ink.data) : null), [ink.data])
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  // playing 은 화면 문구용일 뿐 재생 효과의 의존성이 아니다 — 넣으면 'playing' 으로 바뀌는 순간
  // 정리 함수가 진행 중인 애니메이션을 취소한다. 재생은 replayKey(처음부터)·skipped(끝까지)로만 움직인다.
  const [playing, setPlaying] = useState(false)
  const [skipped, setSkipped] = useState(prefersReducedMotion)
  const [replayKey, setReplayKey] = useState(0)

  const ratio = fixedRatio ?? (entry.width && entry.height ? Math.min(maxRatio, Math.max(0.55, entry.height / entry.width)) : 1)
  // 효과 의존성에 넣지 않는다(부모가 매번 새 함수를 내려도 재생이 다시 시작되지 않게)
  const onPlayRef = useRef(onPlay)
  onPlayRef.current = onPlay
  const noInk = !entry.has_ink || ink.isError
  useEffect(() => {
    if (noInk) onPlayRef.current?.(0)
  }, [noInk, entry.id])

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [page])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !page || size.w <= 0 || size.h <= 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const areaW = size.w * (1 - INSET * 2)
    const areaH = size.h * (1 - INSET * 2)
    canvas.width = Math.round(areaW * dpr)
    canvas.height = Math.round(areaH * dpr)
    canvas.style.width = `${areaW}px`
    canvas.style.height = `${areaH}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 출품 PNG 와 같은 잘라 내기(여백 36) → 종이 안쪽에 contain
    const b = inkBounds(page)
    const s = Math.min(areaW / b.w, areaH / b.h) * dpr
    const ox = (canvas.width - b.w * s) / 2 - b.x * s
    const oy = (canvas.height - b.h * s) / 2 - b.y * s
    const reset = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(s, 0, 0, s, ox, oy)
    }
    const strokes = page.strokes

    const drawAll = () => {
      reset()
      for (const st of strokes) drawStroke(ctx, st, 'light')
      setPlaying(false)
    }
    const total = inkPointCount(page)
    if (skipped || total === 0) {
      drawAll()
      onPlayRef.current?.(0)
      return
    }
    const duration = Math.min(MAX_MS, Math.max(MIN_MS, total * MS_PER_POINT))
    onPlayRef.current?.(duration + 350)
    let strokeIdx = 0
    let drawnPoints = 0
    // 시트가 올라오는 동안은 기다렸다가 쓰기 시작한다
    const begin = performance.now() + 350
    let raf = 0
    reset()
    setPlaying(true)

    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / duration))
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const target = Math.floor(eased * total)
      while (strokeIdx < strokes.length && drawnPoints + strokes[strokeIdx].p.length / 3 <= target) {
        drawStroke(ctx, strokes[strokeIdx], 'light')
        drawnPoints += strokes[strokeIdx].p.length / 3
        strokeIdx++
      }
      if (strokeIdx < strokes.length) {
        const partial = target - drawnPoints
        if (partial > 0) drawStroke(ctx, strokes[strokeIdx], 'light', partial, false)
      }
      if (t >= 1) {
        drawAll()
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [page, size.w, size.h, skipped, replayKey])

  // 받기 전·획 없음·실패 — 출품 PNG
  if (!page) return <PaperThumb entry={entry} maxRatio={maxRatio} ratio={fixedRatio} className={className} style={style} />

  const paper = (
    <div
      ref={wrapRef}
      className={`hw-paper ${playing && !bare ? 'cursor-pointer' : ''} ${className}`}
      style={{ ...style, aspectRatio: `1 / ${ratio}` }}
      onClick={bare ? undefined : () => playing && setSkipped(true)}
      role={playing && !bare ? 'button' : 'img'}
      aria-label={playing && !bare ? '손글씨 다 보기' : `${entry.verse_ref} 손글씨`}
    >
      <canvas ref={canvasRef} className="absolute" style={{ left: `${INSET * 100}%`, top: `${INSET * 100}%` }} aria-hidden />
    </div>
  )
  if (bare) return paper

  return (
    <div>
      {paper}
      <div className="mt-2 flex justify-center">
        {playing ? (
          <p className="text-[11.5px] text-ink-muted">쓰는 중이에요 · 종이를 누르면 바로 다 보여요</p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSkipped(false)
              setReplayKey((k) => k + 1)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-ink-muted bg-gray-100 dark:bg-white/[0.06]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 20l3.5-.9L19 7.6a2 2 0 0 0 0-2.9l-.7-.7a2 2 0 0 0-2.9 0L4 15.5V20Z" />
            </svg>
            쓰는 모습 다시 보기
          </button>
        )}
      </div>
    </div>
  )
}

export default InkReplay
