// 좌석 배치도 — 성도 예약·관리자 현황·배치 편집이 함께 쓰는 한 장의 지도.
//
// 무엇을 그릴지(좌석 상태)는 호출부가 stateOf 로 정하고, 이 컴포넌트는 모양·크기·입력만 맡는다.
// - 폭 맞춤: 화면 폭에 전체 배치가 한눈에 들어오도록 좌석 크기를 계산한다(12~34px).
// - 확대: 좌석이 작아 누르기 어려우면 '크게 보기'로 32px 이상 + 가로 스크롤.
// - 칠하기(paintable): 관리자 편집에서 누른 채 쓸면 여러 칸을 한 번에 바꾼다.
//   ★pointerdown 에서 setPointerCapture 를 쓰지 않는다(클릭 대상이 바뀌는 버그 — pointer-capture-click-retarget).
//   터치의 암묵적 캡처 때문에 pointermove 는 처음 칸에서만 오므로 elementFromPoint 로 칸을 찾는다.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { SeatLayout } from '../../types/seatEvent'
import { buildGrid } from './seatLayout'
import './seat-map.css'

export type SeatVisual =
  | 'available' // 고를 수 있음
  | 'selected' // 이번에 고른 자리
  | 'mine' // 이미 예약한 내 자리
  | 'mine-remove' // 취소하려고 고른 내 자리
  | 'taken' // 다른 사람이 예약
  | 'held' // 관리자 보류
  | 'disabled' // 자리 없음 (통로·기둥)
  | 'member' // (관리자) 앱 예약
  | 'assigned' // (관리자) 대리 예약
  | 'checked' // (관리자) 입장 완료
  | 'focus' // (관리자) 지금 고른 자리

const VISUAL: Record<SeatVisual, string> = {
  available:
    'bg-white dark:bg-white/[0.07] border-[1.5px] border-gray-300 dark:border-white/25 text-gray-500 dark:text-white/60 hover:border-brand hover:bg-[var(--brand-soft)] hover:text-brand',
  selected:
    'bg-brand border-[1.5px] border-brand text-white shadow-[0_4px_12px_-3px_var(--brand-glow)]',
  mine: 'bg-emerald-500 border-[1.5px] border-emerald-500 text-white dark:bg-emerald-400 dark:border-emerald-400 dark:text-emerald-950',
  'mine-remove':
    'bg-red-50 border-[1.5px] border-red-400 text-red-500 line-through dark:bg-red-500/15 dark:border-red-400 dark:text-red-300',
  taken: 'bg-gray-200 border-[1.5px] border-gray-200 text-transparent dark:bg-white/[0.1] dark:border-transparent',
  held: 'seat-hatch bg-gray-50 border-[1.5px] border-gray-300 text-gray-300 dark:bg-white/[0.03] dark:border-white/15 dark:text-white/15',
  disabled: 'opacity-0',
  member:
    'bg-[var(--brand-soft-strong)] border-[1.5px] border-[var(--brand-soft-strong)] text-brand',
  assigned:
    'bg-amber-100 border-[1.5px] border-amber-300 text-amber-800 dark:bg-amber-500/20 dark:border-amber-400/50 dark:text-amber-200',
  checked: 'bg-emerald-500 border-[1.5px] border-emerald-500 text-white dark:bg-emerald-400 dark:border-emerald-400 dark:text-emerald-950',
  focus:
    'bg-brand border-[1.5px] border-brand text-white ring-2 ring-offset-1 ring-brand ring-offset-white dark:ring-offset-[#1c1c26]',
}

/** 편집 화면에서만 — 막힌 칸도 점선으로 보여 다시 살릴 수 있게 */
const DISABLED_EDIT =
  'border-[1.5px] border-dashed border-gray-300 dark:border-white/20 text-transparent bg-transparent'

const AXIS = 16
const AISLE = 14
const MIN_SEAT = 12
const MAX_SEAT = 34
const ZOOM_SEAT = 32

interface SeatMapProps {
  layout: Pick<SeatLayout, 'sections' | 'labeling' | 'stage_label'>
  stateOf: (label: string) => SeatVisual
  /** 누를 수 있는 좌석인가 (없으면 disabled 가 아닌 전부) */
  canPress?: (label: string) => boolean
  onSeatPress?: (label: string) => void
  /** 칠하기 — first 는 한 획의 첫 칸 (호출부가 첫 칸 상태로 칠할 값을 정한다) */
  paintable?: boolean
  onPaint?: (label: string, first: boolean) => void
  titleOf?: (label: string) => string
  /** 편집 화면: 막힌 칸을 점선으로 보인다 */
  showDisabledSlots?: boolean
  showSectionNames?: boolean
  /** 방금 바뀐 좌석 — 한 번 톡 튀는 애니메이션 */
  popLabels?: ReadonlySet<string>
  toolbarExtra?: ReactNode
}

const SeatMap = ({
  layout,
  stateOf,
  canPress,
  onSeatPress,
  paintable = false,
  onPaint,
  titleOf,
  showDisabledSlots = false,
  showSectionNames = false,
  popLabels,
  toolbarExtra,
}: SeatMapProps) => {
  const grid = useMemo(() => buildGrid(layout), [layout])
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const nSec = grid.sections.length
  const cols = Math.max(grid.totalCols, 1)
  const fitSeat = Math.floor((width - AXIS - 6 - (nSec - 1) * AISLE - cols * 3) / cols)
  const fit = Math.max(MIN_SEAT, Math.min(MAX_SEAT, fitSeat || MIN_SEAT))
  const seat = zoomed ? Math.max(ZOOM_SEAT, fit) : fit
  const gap = seat >= 24 ? 4 : 3
  const aisle = Math.max(AISLE, Math.round(seat * 0.7))
  const showLabels = seat >= 24
  const headFont = Math.min(10.5, Math.max(8, seat * 0.5))
  // 폭에 딱 맞으면 확대 버튼이 필요 없다
  const canZoom = fit < ZOOM_SEAT

  // ── 칠하기 ──
  const strokeRef = useRef<Set<string> | null>(null)
  const labelAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    return el?.closest<HTMLElement>('[data-seat]')?.dataset.seat ?? null
  }
  useEffect(() => {
    if (!paintable) return
    const end = () => {
      strokeRef.current = null
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [paintable])

  const paintHandlers = paintable
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          const label = labelAt(e.clientX, e.clientY)
          if (!label) return
          e.preventDefault()
          strokeRef.current = new Set([label])
          onPaint?.(label, true)
        },
        onPointerMove: (e: React.PointerEvent) => {
          const stroke = strokeRef.current
          if (!stroke) return
          const label = labelAt(e.clientX, e.clientY)
          if (!label || stroke.has(label)) return
          stroke.add(label)
          onPaint?.(label, false)
        },
      }
    : {}

  const contentWidth =
    AXIS + 6 + grid.totalCols * seat + (grid.totalCols - nSec) * gap + (nSec - 1) * aisle

  return (
    <div ref={wrapRef} className="relative">
      {(canZoom || toolbarExtra) && width > 0 ? (
        <div className="flex items-center justify-end gap-2 mb-2">
          {toolbarExtra}
          {canZoom ? (
            <button
              type="button"
              onClick={() => setZoomed((v) => !v)}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[12px] font-semibold text-ink hover:border-brand hover:text-brand transition-colors"
              aria-pressed={zoomed}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4.2-4.2" />
                {zoomed ? <path d="M8.5 11h5" /> : <path d="M8.5 11h5M11 8.5v5" />}
              </svg>
              {zoomed ? '한눈에 보기' : '크게 보기'}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* 폭 맞춤이어도 최소 크기(12px)에 걸리면 넘칠 수 있어 가로 스크롤은 항상 열어 둔다 */}
      <div className="overflow-x-auto overscroll-x-contain pb-2 -mx-1 px-1">
        <div style={{ width: contentWidth }} className="mx-auto">
          {/* 무대 */}
          <div className="flex justify-center mb-4" style={{ paddingLeft: AXIS + 6 }}>
            <div className="seat-stage w-[78%] max-w-[420px] h-8 flex items-start justify-center pt-1 bg-[var(--brand-soft)] border-b-2 border-[var(--brand-soft-strong)] text-brand text-[11.5px] font-bold tracking-[0.3em]">
              {layout.stage_label || '무대'}
            </div>
          </div>

          <div
            className={`flex items-start ${paintable ? 'seat-paint' : ''}`}
            {...paintHandlers}
            role="grid"
            aria-label="좌석 배치도"
          >
            {/* 행 머리글 */}
            <div className="shrink-0 flex flex-col" style={{ width: AXIS, marginRight: 6, gap, paddingTop: seat * 0.55 + gap + (showSectionNames && nSec > 1 ? 16 : 0) }}>
              {grid.rowHeads.map((head) => (
                <span
                  key={head}
                  className="flex items-center justify-end font-semibold text-gray-400 dark:text-white/35 tabular-nums"
                  style={{ height: seat, fontSize: headFont }}
                >
                  {head}
                </span>
              ))}
            </div>

            {grid.sections.map((section, si) => (
              <div key={si} className="shrink-0" style={{ marginLeft: si === 0 ? 0 : aisle }}>
                {showSectionNames && nSec > 1 ? (
                  <p className="h-4 mb-0 text-center text-[10px] font-bold text-gray-400 dark:text-white/40 truncate">
                    {section.name}
                  </p>
                ) : null}
                {/* 열 머리글 */}
                <div className="flex" style={{ gap, height: seat * 0.55, marginBottom: gap }}>
                  {section.colHeads.map((head) => (
                    <span
                      key={head}
                      className="flex items-end justify-center font-semibold text-gray-400 dark:text-white/35 tabular-nums"
                      style={{ width: seat, fontSize: headFont }}
                    >
                      {head}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col" style={{ gap }}>
                  {section.cells.map((row, ri) => (
                    <div key={ri} className="flex" style={{ gap }} role="row">
                      {row.map((label) => {
                        const visual = stateOf(label)
                        const isDisabled = visual === 'disabled'
                        const pressable =
                          !paintable && !!onSeatPress && (canPress ? canPress(label) : !isDisabled)
                        const cls =
                          isDisabled && showDisabledSlots ? DISABLED_EDIT : VISUAL[visual]
                        const style = { width: seat, height: seat, fontSize: Math.max(8.5, seat * 0.33) }
                        const common = `seat shrink-0 flex items-center justify-center font-bold tabular-nums leading-none ${cls} ${
                          popLabels?.has(label) ? 'seat-pop' : ''
                        }`
                        const text = showLabels && !isDisabled ? label : ''
                        const title = titleOf?.(label) ?? label

                        if (pressable) {
                          return (
                            <button
                              key={label}
                              type="button"
                              data-seat={label}
                              role="gridcell"
                              title={title}
                              aria-label={title}
                              onClick={() => onSeatPress?.(label)}
                              className={`${common} cursor-pointer active:scale-90`}
                              style={style}
                            >
                              {text}
                            </button>
                          )
                        }
                        return (
                          <span
                            key={label}
                            data-seat={paintable || !isDisabled ? label : undefined}
                            role="gridcell"
                            title={isDisabled && !showDisabledSlots ? undefined : title}
                            aria-label={isDisabled ? undefined : title}
                            aria-hidden={isDisabled && !showDisabledSlots ? true : undefined}
                            className={`${common} ${paintable ? 'cursor-crosshair' : 'cursor-default'}`}
                            style={style}
                          >
                            {text}
                          </span>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SeatMap

// ── 범례 ──────────────────────────────────────────────────────────────

const LEGEND_SWATCH: Partial<Record<SeatVisual, string>> = VISUAL

export const SeatLegend = ({ items }: { items: { visual: SeatVisual; label: string }[] }) => (
  <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
    {items.map((item) => (
      <span key={item.visual} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-500 dark:text-white/55">
        <span className={`seat w-3.5 h-3.5 ${LEGEND_SWATCH[item.visual] ?? ''}`} aria-hidden />
        {item.label}
      </span>
    ))}
  </div>
)
