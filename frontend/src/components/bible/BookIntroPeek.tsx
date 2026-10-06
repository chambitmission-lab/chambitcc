import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useBookIntro } from '../../hooks/useBibleBookIntro'
import { getBookIntro } from '../../api/bibleBookIntro'
import { getBookGenre, genreStyle, parseBookStructure, parseKeyChapters } from './bookGenre'
import './BookIntroPeek.css'

/**
 * /bible 책 목록(여정·격자·목록)에서 책에 마우스를 올리면 '권 개관'을 미리 보여주는 말풍선.
 *
 * 마우스가 있는 기기(hover: hover + pointer: fine)에서만 켠다 — 터치는 탭이 곧 진입이라
 * 미리보기가 끼어들 틈이 없다. 목록을 훑고 지나갈 때마다 66권 요청이 나가지 않게
 * 머문 지 PREFETCH_MS 뒤에야 받고, OPEN_MS 뒤에 띄운다.
 *
 * 말풍선은 읽기 전용(pointer-events: none)이라 아래 요소의 클릭을 가로막지 않는다.
 */

const WIDTH = 340
const OPEN_MS = 380
const PREFETCH_MS = 140
const CLOSE_MS = 140
const GAP = 12
const SCROLL_QUIET_MS = 400

const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

interface PeekTarget {
  bookNumber: number
  bookName: string
  totalChapters: number
  rect: DOMRect
}

export interface PeekBook {
  bookNumber: number
  bookName: string
  totalChapters: number
}

export const useBookIntroPeek = () => {
  const qc = useQueryClient()
  const [target, setTarget] = useState<PeekTarget | null>(null)
  const openTimer = useRef<number | undefined>(undefined)
  const prefetchTimer = useRef<number | undefined>(undefined)
  const closeTimer = useRef<number | undefined>(undefined)
  const enabled = useRef(canHover())

  const clearAll = () => {
    window.clearTimeout(openTimer.current)
    window.clearTimeout(prefetchTimer.current)
    window.clearTimeout(closeTimer.current)
  }

  const close = useCallback(() => {
    clearAll()
    setTarget(null)
  }, [])

  const scheduleClose = useCallback(() => {
    window.clearTimeout(openTimer.current)
    window.clearTimeout(prefetchTimer.current)
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setTarget(null), CLOSE_MS)
  }, [])

  // 스크롤·리사이즈하면 말풍선이 책에서 떨어져 떠 있게 되므로 그냥 닫는다.
  // 휠로 굴리는 동안 커서 밑을 지나가는 책마다 열리지 않도록, 직전 스크롤 시각도 기억해 둔다
  const lastScrollAt = useRef(0)
  useEffect(() => {
    if (!enabled.current) return
    const onScroll = () => {
      lastScrollAt.current = performance.now()
      clearAll()
      setTarget(null)
    }
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => clearAll, [])

  const peekProps = (book: PeekBook) => {
    if (!enabled.current) return {}
    return {
      onPointerEnter: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== 'mouse') return
        const el = e.currentTarget
        clearAll()
        prefetchTimer.current = window.setTimeout(() => {
          void qc.prefetchQuery({
            queryKey: ['bibleBookIntro', 'book', book.bookNumber],
            queryFn: () => getBookIntro(book.bookNumber),
            staleTime: 1000 * 60 * 10,
          })
        }, PREFETCH_MS)
        // 이미 다른 책 말풍선이 떠 있으면 기다리지 않고 바로 옮겨 탄다 — 훑어보기가 끊기지 않게
        const delay = target ? 60 : OPEN_MS
        openTimer.current = window.setTimeout(() => {
          if (performance.now() - lastScrollAt.current < SCROLL_QUIET_MS) return
          setTarget({ ...book, rect: el.getBoundingClientRect() })
        }, delay)
      },
      onPointerLeave: scheduleClose,
      onPointerDown: close,
    }
  }

  const node = target ? (
    <BookIntroPeekBubble
      key={target.bookNumber}
      target={target}
    />
  ) : null

  return { peekProps, peekNode: node }
}

interface BubbleProps {
  target: PeekTarget
}

/** 구조 단락이 이보다 많으면 막대 아래 한 줄 라벨이 뭉개져서, 두 칸 범례로 바꿔 보여준다 */
const STRUCT_INLINE_MAX = 4

/** 개관은 마크다운으로 저장된 필드가 있다 — 말풍선은 평문이라 굵게 표시만 걷어낸다 */
const plain = (text: string) => text.replace(/\*\*/g, '').trim()

const BookIntroPeekBubble = ({ target }: BubbleProps) => {
  const { data: intro, isLoading } = useBookIntro(target.bookNumber)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; side: 'right' | 'left' | 'below' } | null>(null)

  // 실제 높이를 잰 뒤 자리를 잡는다 — 오른쪽 → 왼쪽 → 아래 순으로 들어갈 곳을 찾는다
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const w = WIDTH
    const h = el.offsetHeight
    const r = target.rect
    const vw = window.innerWidth
    const vh = window.innerHeight
    const clampY = (y: number) => Math.max(GAP, Math.min(vh - h - GAP, y))
    const clampX = (x: number) => Math.max(GAP, Math.min(vw - w - GAP, x))
    const anchorY = r.top + Math.min(r.height, 64) / 2 - 28
    if (r.right + GAP + w <= vw - GAP) {
      setPos({ left: r.right + GAP, top: clampY(anchorY), side: 'right' })
    } else if (r.left - GAP - w >= GAP) {
      setPos({ left: r.left - GAP - w, top: clampY(anchorY), side: 'left' })
    } else {
      const below = r.bottom + 8
      const top = below + h <= vh - GAP ? below : r.top - 8 - h
      setPos({ left: clampX(r.left + 56), top: Math.max(GAP, top), side: 'below' })
    }
  }, [target, intro, isLoading])

  // 개관이 아직 없는 책은 아무것도 띄우지 않는다 (관리자 추가 유도는 책 안쪽 바가 맡는다)
  if (!isLoading && !intro) return null

  const genre = getBookGenre(target.bookNumber)
  const sections = intro ? parseBookStructure(intro.structure, target.totalChapters) : []
  const keyChapters = intro ? peekKeyChapters(intro.key_chapters) : []

  const segOpacity = (i: number) => 1 - i * (0.55 / Math.max(1, sections.length))
  const theme = intro?.theme && plain(intro.theme) !== plain(intro.one_liner) ? plain(intro.theme) : null

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className={`bip${pos ? ' is-placed' : ''}`}
      data-side={pos?.side}
      style={{
        ...genreStyle(target.bookNumber),
        width: WIDTH,
        left: pos?.left ?? -9999,
        top: pos?.top ?? 0,
      }}
    >
      <div className="bip-eyebrow">
        <span className="material-icons-round bip-eyebrow__icon">{genre.icon}</span>
        {genre.label}
        <span className="bip-eyebrow__dot" aria-hidden="true">·</span>
        <span className="bip-eyebrow__ch">{target.totalChapters}장</span>
      </div>
      <p className="bip-title">{target.bookName}</p>

      {isLoading || !intro ? (
        <div className="bip-skel" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <>
          <p className="bip-oneliner">{plain(intro.one_liner)}</p>
          {theme && <p className="bip-theme">{theme}</p>}

          {sections.length > 0 && (
            <div className="bip-struct">
              <p className="bip-cap">이렇게 흘러가요</p>
              <div className="bip-struct__bar" aria-hidden="true">
                {sections.map((s, i) => (
                  <span
                    key={i}
                    className="bip-struct__seg"
                    style={{ flexGrow: s.to - s.from + 1, opacity: segOpacity(i) }}
                  />
                ))}
              </div>
              {sections.length <= STRUCT_INLINE_MAX ? (
                <div className="bip-struct__labels">
                  {sections.map((s, i) => (
                    <span key={i} className="bip-struct__label" style={{ flexGrow: s.to - s.from + 1 }}>
                      <b>{s.from === s.to ? s.from : `${s.from}-${s.to}`}</b>
                      {s.label}
                    </span>
                  ))}
                </div>
              ) : (
                <ul className="bip-struct__legend">
                  {sections.map((s, i) => (
                    <li key={i}>
                      <span className="bip-struct__dot" style={{ opacity: segOpacity(i) }} aria-hidden="true" />
                      <b>{s.from === s.to ? s.from : `${s.from}-${s.to}`}</b>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {keyChapters.length > 0 && (
            <div className="bip-keys">
              <p className="bip-cap">꼭 읽어볼 장</p>
              <ul>
                {keyChapters.slice(0, 3).map((k, i) => (
                  <li key={i}>
                    <b>{k.range}</b>
                    <span>{plain(k.desc)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bip-foot">
            {intro.author_period && (
              <span className="bip-foot__author">
                <span className="material-icons-round">edit_note</span>
                {plain(intro.author_period)}
              </span>
            )}
            <span className="bip-foot__hint">눌러서 읽기</span>
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}

/**
 * 핵심 장 — 콜론 형식은 parseKeyChapters 가 맡고, "1-3장 세상과…" 처럼 콜론 없이
 * 줄·세미콜론으로 나열한 데이터도 많아 말풍선에선 그 형태까지 받아준다.
 */
const peekKeyChapters = (raw: string | null | undefined) => {
  const parsed = parseKeyChapters(raw)
  if (parsed.length > 0 || !raw) return parsed
  return raw
    .split(/\n|;|,\s*(?=\d+\s*(?:[-~–]\s*\d+)?\s*장)/)
    .map(line => line.trim().match(/^(\d+(?:\s*[-~–]\s*\d+)?\s*장)\s*(.+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map(m => ({ range: m[1].replace(/\s+/g, ''), desc: m[2] }))
}
