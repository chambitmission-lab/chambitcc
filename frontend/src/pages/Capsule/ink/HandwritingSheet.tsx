// 손글씨 편지 쓰기 — 전체화면 편지지(책상 위에 펼친 종이)와 도구 막대.
// 작성 화면(/capsule/new)이 pages 상태를 들고 있고, 이 시트는 그 위에서 쓰고 고치기만 한다.
// 닫기 = 완료(쓴 것은 그대로 남는다). 버리고 싶으면 '이 장 지우기'.
// 손글씨 필사대회(/handwriting)도 같은 시트를 한 장짜리로 쓴다 — eyebrow·heading·guide·maxPages 로 바꾼다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'
import InkPad, { type InkTool } from './InkPad'
import {
  INK_COLORS,
  INK_MAX_PAGES,
  INK_SIZES,
  emptyInkPage,
  isInkPageEmpty,
  type InkColorIndex,
  type InkPage,
  type InkStroke,
} from './inkModel'

const ZOOMS = [1, 1.35, 1.8, 2.4]
const MAX_UNDO = 60
const PEN_HINT_KEY = 'capsule-ink-pen-hint'

interface Props {
  pages: InkPage[]
  onChange: (pages: InkPage[]) => void
  onClose: () => void
  /** 편지지 머리에 적힐 받는 사람 — "미래의 나" / 이름 */
  addressee?: string
  /** 머리 위 작은 글씨 (기본: 손으로 쓰는 편지) */
  eyebrow?: string
  /** 머리 큰 글씨 — 주면 'To. 받는 사람' 대신 쓴다 */
  heading?: string
  /** 머리와 종이 사이에 보여 줄 것 — 필사대회의 '따라 쓸 구절' */
  guide?: React.ReactNode
  /** 장 수 상한 (기본 INK_MAX_PAGES). 1이면 장 넘기기 도구를 숨긴다 */
  maxPages?: number
  /** 다 쓴 뒤 안내 — 기본: 'N장을 썼어요 · 완료를 누르면 편지에 담겨요' */
  writtenHint?: (written: number) => string
}

const G = ({ children, size = 20 }: { children: React.ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
)

const PenGlyph = () => <path d="M4 20l3.5-.9L19 7.6a2 2 0 0 0 0-2.9l-.7-.7a2 2 0 0 0-2.9 0L4 15.5V20ZM13.5 6.4l4.1 4.1" />
const EraserGlyph = () => (
  <>
    <path d="M7.5 19h12M5.3 14.6l8.1-8.1a2 2 0 0 1 2.8 0l3.1 3.1a2 2 0 0 1 0 2.8L13 18.7a1.6 1.6 0 0 1-2.3 0l-5.4-5.4a1.6 1.6 0 0 1 0-2.3Z" />
    <path d="M9.2 10.7l4.9 4.9" />
  </>
)
const UndoGlyph = () => <path d="M8.5 7.5H15a4.5 4.5 0 0 1 0 9H9M8.5 7.5 11 5M8.5 7.5 11 10" />
const TrashGlyph = () => <path d="M5 7h14M9.5 7V5h5v2M8 7l.7 12h6.6L16 7" />
const PlusGlyph = () => <path d="M12 5v14M5 12h14" />
const MinusGlyph = () => <path d="M5 12h14" />
const ChevronGlyph = ({ dir }: { dir: 'l' | 'r' }) =>
  dir === 'l' ? <path d="M14.5 5.5 8 12l6.5 6.5" /> : <path d="M9.5 5.5 16 12l-6.5 6.5" />
const CheckGlyph = () => <path d="M5 12.5 10 17.5 19 7" />
const ZoomGlyph = ({ out }: { out?: boolean }) => (
  <>
    <circle cx="10.5" cy="10.5" r="6.3" />
    <path d="M15.3 15.3 20 20M7.6 10.5h5.8" />
    {!out && <path d="M10.5 7.6v5.8" />}
  </>
)

const HandwritingSheet = ({
  pages,
  onChange,
  onClose,
  addressee = '',
  eyebrow = '손으로 쓰는 편지',
  heading,
  guide,
  maxPages = INK_MAX_PAGES,
  writtenHint = (n) => `${n}장을 썼어요 · 완료를 누르면 편지에 담겨요`,
}: Props) => {
  const [index, setIndex] = useState(() => Math.max(0, pages.length - 1))
  const [tool, setTool] = useState<InkTool>('pen')
  const [color, setColor] = useState<InkColorIndex>(0)
  const [sizeIdx, setSizeIdx] = useState(1)
  const [zoomIdx, setZoomIdx] = useState(0)
  const [penOnly, setPenOnly] = useState(false)
  const [penSeen, setPenSeen] = useState(false)
  const undoRef = useRef<InkPage[][]>([])
  const [undoDepth, setUndoDepth] = useState(0)

  useBodyScrollLock()
  useModalBackButton(onClose)
  useEscapeKey(onClose)

  // 열려 있는 동안 화면이 꺼지지 않게(지원 브라우저만) — 편지는 오래 쓴다
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock?.request('screen').then((l) => {
      lock = l
    }).catch(() => undefined)
    return () => {
      lock?.release().catch(() => undefined)
    }
  }, [])

  const safeIndex = Math.min(index, pages.length - 1)
  const page = pages[safeIndex] ?? emptyInkPage()

  const pushUndo = (prev: InkPage[]) => {
    const stack = undoRef.current
    stack.push(prev)
    if (stack.length > MAX_UNDO) stack.shift()
    setUndoDepth(stack.length)
  }

  const replacePage = (next: InkPage) => {
    pushUndo(pages)
    onChange(pages.map((p, i) => (i === safeIndex ? next : p)))
  }

  const handleCommit = (stroke: InkStroke) => replacePage({ strokes: [...page.strokes, stroke] })
  const handleErase = (strokes: InkStroke[]) => replacePage({ strokes })

  const handleUndo = () => {
    const prev = undoRef.current.pop()
    setUndoDepth(undoRef.current.length)
    if (prev) {
      onChange(prev)
      setIndex((i) => Math.min(i, prev.length - 1))
    }
  }

  const handleClearPage = () => {
    if (isInkPageEmpty(page)) return
    if (!window.confirm('이 장에 쓴 글씨를 모두 지울까요?')) return
    replacePage(emptyInkPage())
  }

  const handleAddPage = () => {
    if (pages.length >= maxPages) {
      showToast(`편지지는 ${maxPages}장까지예요`, 'error')
      return
    }
    pushUndo(pages)
    onChange([...pages, emptyInkPage()])
    setIndex(pages.length)
  }

  const handleRemovePage = () => {
    if (pages.length <= 1) return
    if (!isInkPageEmpty(page) && !window.confirm('이 장을 빼낼까요? 쓴 글씨도 함께 사라져요')) return
    pushUndo(pages)
    onChange(pages.filter((_, i) => i !== safeIndex))
    setIndex((i) => Math.max(0, i - 1))
  }

  const handlePenDetected = () => {
    if (penSeen) return
    setPenSeen(true)
    setPenOnly(true)
    // 세로로 든 폰이면 한 번만 귀띔 — 가로가 두 배 넓다
    try {
      if (window.innerWidth < window.innerHeight && window.innerWidth < 700 && !sessionStorage.getItem(PEN_HINT_KEY)) {
        sessionStorage.setItem(PEN_HINT_KEY, '1')
        showToast('펜을 알아봤어요. 폰을 가로로 돌리면 더 넓게 쓸 수 있어요', 'success')
      }
    } catch {
      /* 저장소 막힌 환경 — 귀띔만 생략 */
    }
  }

  const zoom = ZOOMS[zoomIdx]
  const written = useMemo(() => pages.filter((p) => !isInkPageEmpty(p)).length, [pages])

  return (
    <div className="ink-sheet" role="dialog" aria-modal="true" aria-label={heading ?? '손글씨 편지 쓰기'}>
      <header className="ink-sheet__top">
        <div className="min-w-0">
          <p className="ink-sheet__eyebrow">{eyebrow}</p>
          <p className="ink-sheet__to">{heading ?? `To. ${addressee}`}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {penSeen && (
            <button
              type="button"
              onClick={() => setPenOnly((v) => !v)}
              className={`ink-chip ${penOnly ? 'ink-chip--on' : ''}`}
              title={penOnly ? '손가락은 종이를 넘기고 펜만 씁니다' : '손가락으로도 씁니다'}
            >
              <G size={13}>
                <PenGlyph />
              </G>
              {penOnly ? '펜만 쓰기' : '손가락도 쓰기'}
            </button>
          )}
          <button type="button" onClick={onClose} className="ink-done">
            <G size={16}>
              <CheckGlyph />
            </G>
            완료
          </button>
        </div>
      </header>

      {guide}

      <InkPad
        page={page}
        onCommit={handleCommit}
        onErase={handleErase}
        tool={tool}
        color={color}
        size={INK_SIZES[sizeIdx].size}
        zoom={zoom}
        penOnly={penOnly}
        onPenDetected={handlePenDetected}
      />

      <footer className="ink-sheet__tools">
        <div className="ink-sheet__row">
          <div className="ink-group">
            <button
              type="button"
              className={`ink-tool ${tool === 'pen' ? 'ink-tool--on' : ''}`}
              onClick={() => setTool('pen')}
              aria-pressed={tool === 'pen'}
              aria-label="펜"
            >
              <G>
                <PenGlyph />
              </G>
            </button>
            <button
              type="button"
              className={`ink-tool ${tool === 'eraser' ? 'ink-tool--on' : ''}`}
              onClick={() => setTool('eraser')}
              aria-pressed={tool === 'eraser'}
              aria-label="지우개"
            >
              <G>
                <EraserGlyph />
              </G>
            </button>
            <button type="button" className="ink-tool" onClick={handleUndo} disabled={undoDepth === 0} aria-label="되돌리기">
              <G>
                <UndoGlyph />
              </G>
            </button>
            <button
              type="button"
              className="ink-tool"
              onClick={handleClearPage}
              disabled={isInkPageEmpty(page)}
              aria-label="이 장 지우기"
            >
              <G>
                <TrashGlyph />
              </G>
            </button>
          </div>

          <div className="ink-group">
            <button
              type="button"
              className="ink-tool"
              onClick={() => setZoomIdx((z) => Math.max(0, z - 1))}
              disabled={zoomIdx === 0}
              aria-label="작게 보기"
            >
              <G>
                <ZoomGlyph out />
              </G>
            </button>
            <span className="ink-zoom" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="ink-tool"
              onClick={() => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1))}
              disabled={zoomIdx === ZOOMS.length - 1}
              aria-label="크게 보기"
            >
              <G>
                <ZoomGlyph />
              </G>
            </button>
          </div>
        </div>

        <div className="ink-sheet__row">
          <div className="ink-group" role="radiogroup" aria-label="잉크 색">
            {INK_COLORS.map((c, i) => (
              <button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={color === i}
                aria-label={c.label}
                className={`ink-swatch ${color === i ? 'ink-swatch--on' : ''}`}
                style={{ ['--swatch' as string]: c.light }}
                onClick={() => {
                  setColor(i as InkColorIndex)
                  setTool('pen')
                }}
              />
            ))}
          </div>
          <div className="ink-group" role="radiogroup" aria-label="굵기">
            {INK_SIZES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={sizeIdx === i}
                aria-label={s.label}
                className={`ink-size ${sizeIdx === i ? 'ink-size--on' : ''}`}
                onClick={() => {
                  setSizeIdx(i)
                  setTool('pen')
                }}
              >
                <i style={{ width: 6 + i * 4, height: 6 + i * 4 }} />
              </button>
            ))}
          </div>
          {maxPages > 1 && (
            <div className="ink-group ink-pages">
              <button
                type="button"
                className="ink-tool"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={safeIndex === 0}
                aria-label="앞 장"
              >
                <G size={18}>
                  <ChevronGlyph dir="l" />
                </G>
              </button>
              <span className="ink-pages__label">
                {safeIndex + 1}
                <small>/{pages.length}장</small>
              </span>
              <button
                type="button"
                className="ink-tool"
                onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))}
                disabled={safeIndex >= pages.length - 1}
                aria-label="다음 장"
              >
                <G size={18}>
                  <ChevronGlyph dir="r" />
                </G>
              </button>
              {pages.length > 1 && (
                <button type="button" className="ink-tool" onClick={handleRemovePage} aria-label="이 장 빼기">
                  <G size={18}>
                    <MinusGlyph />
                  </G>
                </button>
              )}
              <button
                type="button"
                className="ink-tool"
                onClick={handleAddPage}
                disabled={pages.length >= maxPages}
                aria-label="장 추가"
              >
                <G size={18}>
                  <PlusGlyph />
                </G>
              </button>
            </div>
          )}
        </div>
        <p className="ink-sheet__hint">
          {written === 0
            ? penSeen
              ? '펜으로 편지지에 바로 쓰세요. 손가락은 종이를 넘겨요'
              : '펜이나 손가락으로 쓰세요. 두 손가락으로 종이를 넘겨요'
            : writtenHint(written)}
        </p>
      </footer>
    </div>
  )
}

export default HandwritingSheet
