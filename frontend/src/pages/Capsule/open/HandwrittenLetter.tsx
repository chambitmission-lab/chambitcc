// 개봉 후 — 손으로 쓴 편지가 편지지 위에서 다시 써진다.
// 획 JSON(ink_url)을 받아 쓴 순서대로 재생하고, 받지 못하면(CORS·구버전) 투명 PNG 를 그대로 보여준다.
// 종이는 그리지 않는다 — 이 컴포넌트는 .capsule-paper 위에 괘선과 잉크만 얹는다.
// 잉크는 늘 라이트 팔레트(먹색) — 편지지가 라이트·다크 모두 크림이라(letter.css 팔레트 주석 참고)
// 다크용 크림 잉크를 올리면 종이와 같은 색이 되어 글씨가 사라진다(2026-10-27 모바일 다크 재현).
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CapsuleHandwritingPage } from '../../../types/timeCapsule'
import {
  INK_LINE_GAP,
  INK_LINE_TOP,
  INK_PAGE_W,
  inkPointCount,
  parseInkPageFile,
  type InkPage,
} from '../ink/inkModel'
import { clearCanvas, drawStroke, drawStrokes, fitCanvas } from '../ink/inkRender'

const MIN_MS = 4500
const MAX_MS = 13000
const MS_PER_POINT = 9

/** 종이가 크림이면 잉크는 먹색 — 테마와 무관 */
const INK_THEME = 'light' as const

type Status = 'idle' | 'playing' | 'done'

const ReplayPage = ({
  page,
  replayKey,
  startAt,
}: {
  page: CapsuleHandwritingPage
  /** 바뀌면 처음부터 다시 쓴다 */
  replayKey: number
  /** 둘째 장부터는 앞 장이 끝난 뒤에 시작하도록 지연을 준다 */
  startAt: number
}) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ink, setInk] = useState<InkPage | null | 'failed'>(null)
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  // status 는 화면 표시용일 뿐 재생 효과의 의존성이 아니다 — 넣으면 'playing' 으로 바뀌는 순간
  // 정리 함수가 막 시작한 애니메이션을 취소해 빈 종이에서 멈춘다. 재생은 skipped(탭하면 끝까지)로만 움직인다.
  const [status, setStatus] = useState<Status>('idle')
  const [skipped, setSkipped] = useState(false)
  const doneRef = useRef(false)

  // 획 JSON — 실패하면 PNG 로
  useEffect(() => {
    let alive = true
    if (!page.ink_url) {
      setInk('failed')
      return
    }
    fetch(page.ink_url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!alive) return
        setInk(parseInkPageFile(json) ?? 'failed')
      })
      .catch(() => alive && setInk('failed'))
    return () => {
      alive = false
    }
  }, [page.ink_url])

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // 재생 — 보이기 시작하면 쓴 순서대로. 탭하면 끝까지 바로.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width <= 0 || !ink || ink === 'failed') return
    const fitted = fitCanvas(canvas, width)
    if (!fitted) return
    const { ctx } = fitted
    const strokes = ink.strokes
    const drawAll = () => {
      clearCanvas(ctx)
      drawStrokes(ctx, strokes, INK_THEME)
      doneRef.current = true
      setStatus('done')
    }

    const total = inkPointCount(ink)
    if (skipped || doneRef.current || total === 0) {
      drawAll()
      return
    }
    if (!visible) return

    const duration = Math.min(MAX_MS, Math.max(MIN_MS, total * MS_PER_POINT))
    let raf = 0
    let strokeIdx = 0
    let drawnPoints = 0 // 완전히 그려진 획들의 점 수 합
    const begin = performance.now() + startAt
    clearCanvas(ctx)
    setStatus('playing')

    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / duration))
      // 앞은 느리고 중간은 빠르게 — 사람이 쓰는 리듬에 가깝다
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const target = Math.floor(eased * total)
      // 끝난 획은 완성본으로 한 번 확정해 그리고 넘어간다
      while (strokeIdx < strokes.length && drawnPoints + strokes[strokeIdx].p.length / 3 <= target) {
        drawStroke(ctx, strokes[strokeIdx], INK_THEME)
        drawnPoints += strokes[strokeIdx].p.length / 3
        strokeIdx++
      }
      if (strokeIdx < strokes.length) {
        const partial = target - drawnPoints
        if (partial > 0) drawStroke(ctx, strokes[strokeIdx], INK_THEME, partial, false)
      }
      if (t >= 1) {
        // 마지막 획까지 확정본으로
        drawAll()
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // 다시 보기는 부모가 key 를 바꿔 이 컴포넌트를 새로 마운트한다(replayKey 는 그 신호를 겸한다)
  }, [ink, width, visible, skipped, startAt, replayKey])

  const ratio = page.height && page.width ? page.height / page.width : 1.414
  const scale = width / INK_PAGE_W

  return (
    <div
      ref={wrapRef}
      className={`ink-letter__page ${status === 'playing' ? 'ink-letter__page--writing' : ''}`}
      style={{
        aspectRatio: `1 / ${ratio}`,
        ['--ink-gap' as string]: `${INK_LINE_GAP * scale}px`,
        ['--ink-top' as string]: `${INK_LINE_TOP * scale}px`,
        ['--ink-margin' as string]: `${72 * scale}px`,
      }}
      onClick={() => status === 'playing' && setSkipped(true)}
      role={status === 'playing' ? 'button' : undefined}
      aria-label={status === 'playing' ? '손글씨 다 보기' : undefined}
    >
      {ink === 'failed' ? (
        <img
          src={page.url}
          alt="손으로 쓴 편지"
          className="ink-letter__img"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <canvas ref={canvasRef} className="ink-letter__canvas" aria-label="손으로 쓴 편지" role="img" />
      )}
    </div>
  )
}

const HandwrittenLetter = ({ pages }: { pages: CapsuleHandwritingPage[] }) => {
  const [replayKey, setReplayKey] = useState(0)
  if (pages.length === 0) return null
  return (
    <div className="ink-letter">
      {pages.map((p, i) => (
        <div key={`${p.url}-${replayKey}`}>
          {i > 0 && (
            <p className="ink-letter__break" aria-hidden>
              <span>{i + 1}장</span>
            </p>
          )}
          <ReplayPage page={p} replayKey={replayKey} startAt={0} />
        </div>
      ))}
      <button type="button" className="ink-letter__replay" onClick={() => setReplayKey((k) => k + 1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 20l3.5-.9L19 7.6a2 2 0 0 0 0-2.9l-.7-.7a2 2 0 0 0-2.9 0L4 15.5V20Z" />
        </svg>
        쓰는 모습 다시 보기
      </button>
    </div>
  )
}

export default HandwrittenLetter
