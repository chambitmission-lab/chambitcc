// 말씀 퍼즐 맞추기 — 전체 화면(body 포털). 아래 보관함의 조각을 끌어 판에 놓으면 제자리 근처에서 딸깍 붙는다.
// 다 맞추면 조각 사이 선이 빛으로 사라지고, 그림 아래쪽에 구절이 한 글자씩 써진 뒤 칭호 팝업이 이어진다.
// 판 위엔 그림이 아주 흐리게 깔려 있어 어린이도 맞출 수 있다(질문은 쉽게 — 퀴즈 난이도 정책과 같은 결).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { PUZZLE_IMAGES, type Puzzle } from '../../api/puzzles'
import type { TitleStatus } from '../../api/titles'
import { useCompletePuzzle } from '../../hooks/usePuzzles'
import { emitTitleUnlocks } from '../../utils/titleUnlockBus'
import { GRID, MARGIN, buildEdges, piecePath } from './jigsaw'
import { isPuzzleSoundOn, playPuzzleSound, prefetchPuzzleSounds, primePuzzleSounds, setPuzzleSoundOn } from './puzzleSound'
import './PuzzleBoard.css'

interface Props {
  puzzle: Puzzle
  /** 미리 맞춰보기(관리자) — 완성 기록·칭호 없이 놀이만 */
  preview?: boolean
  onClose: () => void
}

interface PieceState {
  x: number // 칸 왼쪽 위(판 영역 기준 px)
  y: number
  inTray: boolean
  locked: boolean
  z: number
}

interface Layout {
  cell: number
  boardX: number
  boardY: number
  trayX: number
  trayY: number
  trayW: number
  trayH: number
  width: number
  height: number
}

const TRAY_SCALE = 0.72
const SNAP = 0.24 // 칸 크기 대비 붙는 거리
const TYPE_MS = 55

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 판·보관함 배치 — 넓으면 좌우, 좁으면 위아래 */
const computeLayout = (w: number, h: number): Layout => {
  const gap = 16
  const side = w >= 760
  let board: number
  if (side) {
    board = Math.min(560, (w - gap) / (1 + TRAY_SCALE * 1.12), h - 8)
  } else {
    board = Math.min(520, w, (h - gap) / (1 + TRAY_SCALE * 1.12))
  }
  board = Math.max(210, Math.floor(board / GRID) * GRID)
  const cell = board / GRID
  const trayW = side ? board * TRAY_SCALE * 1.12 : board
  const trayH = side ? board : board * TRAY_SCALE * 1.12
  if (side) {
    const width = board + gap + trayW
    return { cell, boardX: 0, boardY: 0, trayX: board + gap, trayY: 0, trayW, trayH, width, height: board }
  }
  return { cell, boardX: 0, boardY: 0, trayX: 0, trayY: board + gap, trayW, trayH, width: board, height: board + gap + trayH }
}

/** 보관함 칸 9개를 섞어 배치(약간 흐트러지게) */
const trayPositions = (L: Layout, order: number[]): Array<{ x: number; y: number }> => {
  const slotW = L.trayW / GRID
  const slotH = L.trayH / GRID
  return order.map((slot, i) => {
    const jitter = ((i * 37) % 11) / 11 - 0.5
    const cx = L.trayX + slotW * (slot % GRID) + slotW / 2 + jitter * slotW * 0.12
    const cy = L.trayY + slotH * Math.floor(slot / GRID) + slotH / 2 - jitter * slotH * 0.1
    return { x: cx - L.cell / 2, y: cy - L.cell / 2 }
  })
}

const shuffle = (n: number): number[] => {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  // 제자리 순서 그대로면 너무 쉬우니 한 번 더 돌린다
  return a.every((v, i) => v === i) ? a.reverse() : a
}

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export const PuzzleBoard: React.FC<Props> = ({ puzzle, preview = false, onClose }) => {
  useModalBackButton(onClose)
  const img = PUZZLE_IMAGES[puzzle.key]
  const edges = useMemo(() => buildEdges(puzzle.key), [puzzle.key])
  const paths = useMemo(() => edges.map(piecePath), [edges])
  const stageRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const layoutRef = useRef<Layout | null>(null)
  const [pieces, setPieces] = useState<PieceState[]>([])
  const [round, setRound] = useState(0)
  const zTop = useRef(GRID * GRID)
  const drag = useRef<{ id: number; dx: number; dy: number; pointer: number } | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const startedAt = useRef<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<'play' | 'reveal' | 'done'>('play')
  const [typed, setTyped] = useState(0)
  const earned = useRef<TitleStatus[] | null>(null)
  const completeMut = useCompletePuzzle()
  const [soundOn, setSoundOn] = useState(isPuzzleSoundOn)

  // 효과음 파일은 판을 열 때 미리 받아 둔다
  useEffect(() => {
    prefetchPuzzleSounds()
  }, [])

  const toggleSound = () => {
    const next = !soundOn
    setPuzzleSoundOn(next)
    setSoundOn(next)
    if (next) {
      primePuzzleSounds()
      playPuzzleSound('snap')
    }
  }

  const verseText = puzzle.verse.text ?? ''
  const verseRef = `${puzzle.verse.book_name} ${puzzle.verse.chapter}:${puzzle.verse.verse}`

  // 화면 크기 → 판 배치. 크기가 바뀌면 같은 비율로 조각 위치를 옮긴다
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      const next = computeLayout(r.width - 32, r.height - 24)
      const prev = layoutRef.current
      if (prev && prev.cell === next.cell && prev.width === next.width) return
      if (prev) {
        // 배치가 바뀌면(회전·창 크기) 판 위 조각은 제자리로, 나머지는 새 보관함 자리로
        const pos = trayPositions(next, shuffle(GRID * GRID))
        setPieces((ps) =>
          ps.map((p, i) =>
            p.locked
              ? { ...p, x: next.boardX + (i % GRID) * next.cell, y: next.boardY + Math.floor(i / GRID) * next.cell }
              : { ...p, ...pos[i], inTray: true },
          ),
        )
      }
      layoutRef.current = next
      setLayout(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 판 새로 깔기(처음·다시 맞추기)
  useEffect(() => {
    if (!layout) return
    if (pieces.length && round === 0) return
    const pos = trayPositions(layout, shuffle(GRID * GRID))
    setPieces(pos.map((p, i) => ({ ...p, inTray: true, locked: false, z: i + 1 })))
    setPhase('play')
    setTyped(0)
    setElapsed(0)
    startedAt.current = null
    earned.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout === null, round])

  // 시계 — 첫 조각을 집을 때부터
  useEffect(() => {
    if (phase !== 'play') return
    const t = window.setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
    }, 500)
    return () => window.clearInterval(t)
  }, [phase])

  // 다 맞춤 → 완성 기록(백그라운드) + 연출
  const allLocked = pieces.length === GRID * GRID && pieces.every((p) => p.locked)
  useEffect(() => {
    if (!allLocked || phase !== 'play') return
    const secs = startedAt.current ? Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)) : 1
    setElapsed(secs)
    setPhase('reveal')
    // 마지막 조각 "톡" 뒤에 이어지도록 살짝 늦춰 하프
    window.setTimeout(() => playPuzzleSound('complete'), 260)
    if (!preview) {
      completeMut.mutate(
        { key: puzzle.key, seconds: secs },
        { onSuccess: (res) => { earned.current = res.newly_earned ?? [] } },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLocked])

  // 구절 한 글자씩
  useEffect(() => {
    if (phase !== 'reveal') return
    if (prefersReducedMotion()) {
      setTyped(verseText.length)
      setPhase('done')
      return
    }
    let i = 0
    let timer = 0
    const start = window.setTimeout(function tick() {
      i += 1
      setTyped(i)
      if (i >= verseText.length) {
        setPhase('done')
        return
      }
      timer = window.setTimeout(tick, TYPE_MS)
    }, 1400) // 선이 사라지는 빛 연출 뒤에 쓰기 시작
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(timer)
    }
  }, [phase, verseText])

  // 구절을 다 쓴 뒤 칭호 팝업(응답이 늦으면 오는 대로)
  useEffect(() => {
    if (phase !== 'done' || preview) return
    let tries = 0
    const t = window.setInterval(() => {
      tries += 1
      if (earned.current !== null || tries > 20) {
        window.clearInterval(t)
        if (earned.current?.length) {
          const list = earned.current
          earned.current = []
          window.setTimeout(() => emitTitleUnlocks(list), 700)
        }
      }
    }, 250)
    return () => window.clearInterval(t)
  }, [phase, preview])

  const localPoint = (e: React.PointerEvent | PointerEvent) => {
    const r = areaRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (id: number) => (e: React.PointerEvent) => {
    if (!layout || phase !== 'play') return
    const p = pieces[id]
    if (p.locked || drag.current) return
    e.preventDefault()
    try {
      ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    } catch {
      /* 이미 끝난 포인터 — 캡처 없이도 판 위에서는 따라온다 */
    }
    if (!startedAt.current) startedAt.current = Date.now()
    primePuzzleSounds()
    playPuzzleSound('pickup')
    const pt = localPoint(e)
    const half = layout.cell / 2
    // 보관함에서 집으면 제 크기로 커진다 — 가운데를 기준으로 잡은 자리를 유지
    const k = p.inTray ? TRAY_SCALE : 1
    const cx = p.x + half
    const cy = p.y + half
    drag.current = { id, dx: (pt.x - cx) / k, dy: (pt.y - cy) / k, pointer: e.pointerId }
    zTop.current += 1
    const z = zTop.current
    setDragId(id)
    setPieces((ps) => ps.map((q, i) => (i === id ? { ...q, inTray: false, z } : q)))
  }

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d || !layout || e.pointerId !== d.pointer) return
      const pt = localPoint(e)
      const half = layout.cell / 2
      const x = Math.min(Math.max(pt.x - d.dx - half, -half), layout.width - half)
      const y = Math.min(Math.max(pt.y - d.dy - half, -half), layout.height - half)
      setPieces((ps) => ps.map((q, i) => (i === d.id ? { ...q, x, y } : q)))
    },
    [layout],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d || !layout || e.pointerId !== d.pointer) return
      drag.current = null
      setDragId(null)
      // 빠르게 튕겨 놓으면 마지막 move 가 늦게 온다 — 손을 뗀 자리를 기준으로 판정한다
      const pt = localPoint(e)
      const half = layout.cell / 2
      const ux = Math.min(Math.max(pt.x - d.dx - half, -half), layout.width - half)
      const uy = Math.min(Math.max(pt.y - d.dy - half, -half), layout.height - half)
      const tx = layout.boardX + (d.id % GRID) * layout.cell
      const ty = layout.boardY + Math.floor(d.id / GRID) * layout.cell
      const snapped = Math.hypot(ux - tx, uy - ty) < layout.cell * SNAP
      // 소리·진동은 업데이터 밖에서 — StrictMode 가 업데이터를 두 번 부르면 두 번 울린다
      if (snapped) {
        playPuzzleSound('snap')
        try { navigator.vibrate?.(12) } catch { /* 진동 미지원 */ }
      }
      setPieces((ps) => {
        const p = { ...ps[d.id], x: ux, y: uy }
        if (snapped) return ps.map((q, i) => (i === d.id ? { ...q, x: tx, y: ty, locked: true, z: 1 } : q))
        // 보관함 위에 내려놓으면 다시 작게
        const cx = p.x + layout.cell / 2
        const cy = p.y + layout.cell / 2
        const inTray =
          cx >= layout.trayX && cx <= layout.trayX + layout.trayW && cy >= layout.trayY && cy <= layout.trayY + layout.trayH
        return ps.map((q, i) => (i === d.id ? { ...p, inTray } : q))
      })
    },
    [layout],
  )

  const lockedCount = pieces.filter((p) => p.locked).length
  const best = puzzle.best_seconds

  const content = (
    <div className="pzb" role="dialog" aria-modal="true" aria-label={`${puzzle.title} 퍼즐 맞추기`}>
      <header className="pzb-head">
        <button type="button" className="pzb-close" onClick={onClose} aria-label="닫기">
          <span className="material-icons-round">close</span>
        </button>
        <div className="pzb-head-text">
          <strong>{puzzle.title}</strong>
          <span>{preview ? '미리 맞춰보기 · 기록되지 않아요' : puzzle.subtitle}</span>
        </div>
        <button
          type="button"
          className="pzb-close pzb-sound"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? '효과음 끄기' : '효과음 켜기'}
        >
          <span className="material-icons-round">{soundOn ? 'volume_up' : 'volume_off'}</span>
        </button>
        <div className="pzb-meta" aria-live="off">
          <span className="pzb-count">{lockedCount}/{GRID * GRID}</span>
          <span className="pzb-time">{formatTime(elapsed)}</span>
        </div>
      </header>

      <div className="pzb-stage" ref={stageRef}>
        {layout && (
          <div
            className="pzb-area"
            ref={areaRef}
            style={{ width: layout.width, height: layout.height }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* 판 — 흐린 밑그림 + 칸 자리 */}
            <div
              className={`pzb-board phase-${phase}`}
              style={{ left: layout.boardX, top: layout.boardY, width: layout.cell * GRID, height: layout.cell * GRID }}
            >
              <div className="pzb-ghost" style={{ backgroundImage: `url(${img})` }} aria-hidden />
              <svg className="pzb-slots" viewBox={`0 0 ${GRID} ${GRID}`} aria-hidden>
                {paths.map((d, i) => (
                  <path key={i} d={d} transform={`translate(${i % GRID} ${Math.floor(i / GRID)})`} />
                ))}
              </svg>
            </div>
            <div
              className={`pzb-tray ${phase !== 'play' ? 'is-hidden' : ''}`}
              style={{ left: layout.trayX, top: layout.trayY, width: layout.trayW, height: layout.trayH }}
              aria-hidden
            >
              {phase === 'play' && lockedCount === 0 && <span className="pzb-tray-hint">조각을 끌어 그림 위 제자리에 놓아 보세요</span>}
            </div>

            {/* 조각 */}
            {pieces.map((p, i) => {
              const size = layout.cell * (1 + MARGIN * 2)
              const col = i % GRID
              const row = Math.floor(i / GRID)
              const scale = p.inTray ? TRAY_SCALE : 1
              return (
                <svg
                  key={`${round}-${i}`}
                  className={`pzb-piece ${p.locked ? 'is-locked' : ''} ${dragId === i ? 'is-dragging' : ''}`}
                  width={size}
                  height={size}
                  viewBox={`${-MARGIN} ${-MARGIN} ${1 + MARGIN * 2} ${1 + MARGIN * 2}`}
                  style={{
                    left: p.x - layout.cell * MARGIN,
                    top: p.y - layout.cell * MARGIN,
                    zIndex: p.locked ? 1 : p.z + 10,
                    transform: `scale(${scale})`,
                  }}
                  aria-hidden
                >
                  <defs>
                    <clipPath id={`pzc-${puzzle.key}-${i}`}>
                      <path d={paths[i]} />
                    </clipPath>
                  </defs>
                  <image
                    href={img}
                    x={-col}
                    y={-row}
                    width={GRID}
                    height={GRID}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#pzc-${puzzle.key}-${i})`}
                  />
                  <path className="pzb-seam" d={paths[i]} />
                  <path className="pzb-hit" d={paths[i]} onPointerDown={onPointerDown(i)} />
                </svg>
              )
            })}

            {/* 완성 — 빛이 지나가고 아래쪽에 구절이 써진다 */}
            {phase !== 'play' && (
              <div
                className="pzb-reveal"
                style={{ left: layout.boardX, top: layout.boardY, width: layout.cell * GRID, height: layout.cell * GRID }}
              >
                <div className="pzb-sweep" aria-hidden />
                <div className="pzb-verse">
                  <p className="pzb-verse-text" aria-label={verseText}>
                    <span aria-hidden>{verseText.slice(0, typed)}</span>
                    {phase === 'reveal' && typed > 0 && <span className="pzb-caret" aria-hidden />}
                  </p>
                  <span className={`pzb-verse-ref ${phase === 'done' ? 'is-shown' : ''}`}>{verseRef}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className={`pzb-foot ${phase === 'done' ? 'is-shown' : ''}`}>
        <p className="pzb-foot-msg">
          다 맞췄어요 · {formatTime(elapsed)}
          {!preview && best != null && best < elapsed && <span> (최고 {formatTime(best)})</span>}
        </p>
        <div className="pzb-foot-actions">
          <button type="button" className="pzb-btn is-ghost" onClick={() => setRound((r) => r + 1)}>
            다시 맞추기
          </button>
          <button type="button" className="pzb-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </footer>
    </div>
  )

  return createPortal(content, document.body)
}

export default PuzzleBoard
