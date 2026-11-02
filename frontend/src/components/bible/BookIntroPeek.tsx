import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useBookIntro } from '../../hooks/useBibleBookIntro'
import { listBookIntros } from '../../api/bibleBookIntro'
import type { BibleBookIntro } from '../../types/bibleBookIntro'
import { preloadBudget, scheduleAfterFirstScreen } from '../../utils/idlePreload'
import { getBookGenre, genreStyle, parseBookStructure, parseKeyChapters } from './bookGenre'
import './BookIntroPeek.css'

/**
 * /bible 책 목록(여정·격자·목록)에서 책에 마우스를 올리면 '권 개관'을 미리 보여주는 말풍선.
 *
 * 마우스가 있는 기기(hover: hover + pointer: fine)에서만 켠다 — 터치는 탭이 곧 진입이라
 * 미리보기가 끼어들 틈이 없다.
 *
 * 데이터는 66권을 한 번에(gzip 50KB 남짓) 첫 화면이 끝난 뒤 유휴 시간에 받아 둔다.
 * 책마다 호버할 때 받으면 첫 호버는 매번 스켈레톤부터 보였다. 유휴 예약 전에 먼저
 * 호버하면 그 순간 바로 출발한다. 일괄 요청이 실패했을 때만 책별 조회로 물러선다.
 * 일괄 캐시 키(BOOK_INTRO_ALL_KEY)는 크기 때문에 persist 에서 뺀다(main.tsx).
 *
 * 말풍선은 읽기 전용(pointer-events: none)이라 아래 요소의 클릭을 가로막지 않는다.
 */

const WIDTH = 340
const OPEN_MS = 300
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

/** main.tsx persist 제외 목록과 짝 — 키를 바꾸면 거기도 같이 */
export const BOOK_INTRO_ALL_KEY = ['bibleBookIntro', 'all'] as const

export interface PeekBook {
  bookNumber: number
  bookName: string
  totalChapters: number
}

// select 는 참조가 같아야 결과를 다시 계산하지 않는다 — 컴포넌트 밖에 둔다
const toIntroMap = (list: BibleBookIntro[]) => new Map(list.map(i => [i.book_number, i]))

export const useBookIntroPeek = () => {
  const [target, setTargetState] = useState<PeekTarget | null>(null)
  // 이벤트 핸들러·타이머 안에서 "지금 떠 있는 책"을 보려고 ref 로도 같이 둔다
  const targetRef = useRef<PeekTarget | null>(null)
  const setTarget = useCallback((t: PeekTarget | null) => {
    targetRef.current = t
    setTargetState(t)
  }, [])
  const openTimer = useRef<number | undefined>(undefined)
  const closeTimer = useRef<number | undefined>(undefined)
  // 지금 커서가 올라가 있는 책(pointerenter~pointerleave 사이)과 마지막 커서 좌표.
  // 스크롤이 끝난 뒤 "커서 밑에 남은 책"을 다시 열 때, 그리고 pointerenter 를 놓쳤을 때의 보강에 쓴다
  const hover = useRef<{ el: HTMLElement; book: PeekBook } | null>(null)
  const pointer = useRef({ x: 0, y: 0 })
  // 클릭한 책은 커서를 뗄 때까지 다시 띄우지 않는다
  const suppressed = useRef<number | null>(null)
  // 마우스 기기 여부는 화면이 떠 있는 동안 바뀌지 않는다고 보고 처음 한 번만 잰다
  const [enabled] = useState(canHover)

  // 66권 일괄 — 첫 화면이 끝난 뒤 유휴 시간에, 혹은 그 전에 호버하면 즉시 받는다
  const [wantAll, setWantAll] = useState(false)
  useEffect(() => {
    if (!enabled || preloadBudget() === 'none') return
    return scheduleAfterFirstScreen(() => setWantAll(true), { settleMs: 1200 })
  }, [enabled])
  const all = useQuery({
    queryKey: BOOK_INTRO_ALL_KEY,
    queryFn: listBookIntros,
    enabled: enabled && wantAll,
    staleTime: 1000 * 60 * 30,
    select: toIntroMap,
  })

  const clearAll = () => {
    window.clearTimeout(openTimer.current)
    window.clearTimeout(closeTimer.current)
    openTimer.current = undefined
    closeTimer.current = undefined
  }

  const close = useCallback(() => {
    clearAll()
    setTarget(null)
  }, [setTarget])

  const scheduleClose = useCallback(() => {
    clearAll()
    closeTimer.current = window.setTimeout(() => setTarget(null), CLOSE_MS)
  }, [setTarget])

  // 스크롤·리사이즈하면 말풍선이 책에서 떨어져 떠 있게 되므로 그냥 닫는다.
  // 휠로 굴리는 동안 커서 밑을 지나가는 책마다 열리지 않도록, 직전 스크롤 시각도 기억해 둔다
  const lastScrollAt = useRef(0)

  /**
   * delay 뒤에 커서가 올라가 있는 책의 말풍선을 연다.
   * 스크롤 직후라면 포기하지 않고 조용해질 때까지 미룬다 — 예전엔 여기서 그냥 돌아가서,
   * 휠로 굴리다 카드 위에 멈춘 뒤엔 커서를 뺐다 다시 올리기 전까지 말풍선이 안 떴다.
   * 열기 직전엔 책이 실제로 커서 밑에 있는지(스크롤로 밀려났을 수 있다) 좌표로 확인한다.
   */
  const armOpen = useCallback((delay: number) => {
    window.clearTimeout(openTimer.current)
    const fire = () => {
      openTimer.current = undefined
      const h = hover.current
      if (!h || !h.el.isConnected) return
      if (suppressed.current === h.book.bookNumber) return
      const quiet = SCROLL_QUIET_MS - (performance.now() - lastScrollAt.current)
      if (quiet > 0) {
        openTimer.current = window.setTimeout(fire, quiet)
        return
      }
      const rect = h.el.getBoundingClientRect()
      const { x, y } = pointer.current
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return
      setTarget({ ...h.book, rect })
    }
    openTimer.current = window.setTimeout(fire, delay)
  }, [setTarget])

  useEffect(() => {
    if (!enabled) return
    const onScroll = () => {
      lastScrollAt.current = performance.now()
      clearAll()
      setTarget(null)
      // 스크롤이 멎은 뒤 커서 밑에 남은 책은 다시 띄운다 (커서가 안 움직이면 pointer 이벤트가 안 온다)
      if (hover.current) armOpen(SCROLL_QUIET_MS)
    }
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled, armOpen, setTarget])

  useEffect(() => clearAll, [])

  const peekProps = (book: PeekBook) => {
    if (!enabled) return {}
    return {
      onPointerEnter: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== 'mouse') return
        hover.current = { el: e.currentTarget, book }
        pointer.current = { x: e.clientX, y: e.clientY }
        clearAll()
        setWantAll(true)
        // 이미 다른 책 말풍선이 떠 있으면 기다리지 않고 바로 옮겨 탄다 — 훑어보기가 끊기지 않게
        armOpen(targetRef.current ? 60 : OPEN_MS)
      },
      // 격자가 커서 밑에서 다시 그려지면(스켈레톤→카드, 필터 전환) pointerenter 가 오지 않을 수 있다.
      // 움직임이 있을 때 열려 있지도, 예약돼 있지도 않으면 그때 예약한다
      onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== 'mouse') return
        pointer.current = { x: e.clientX, y: e.clientY }
        if (hover.current?.el !== e.currentTarget) hover.current = { el: e.currentTarget, book }
        if (openTimer.current !== undefined) return
        if (targetRef.current?.bookNumber === book.bookNumber) return
        if (suppressed.current === book.bookNumber) return
        setWantAll(true)
        armOpen(OPEN_MS)
      },
      onPointerLeave: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== 'mouse') return
        if (hover.current?.el === e.currentTarget) hover.current = null
        if (suppressed.current === book.bookNumber) suppressed.current = null
        scheduleClose()
      },
      onPointerDown: () => {
        suppressed.current = book.bookNumber
        close()
      },
    }
  }

  const node = target ? (
    <BookIntroPeekBubble
      key={target.bookNumber}
      target={target}
      allIntros={all.data}
      allFailed={all.isError}
    />
  ) : null

  return { peekProps, peekNode: node }
}

interface BubbleProps {
  target: PeekTarget
  /** 66권 일괄 캐시 — 아직 안 왔으면 undefined */
  allIntros?: Map<number, BibleBookIntro>
  /** 일괄 요청이 실패했으면 책별 조회로 물러선다 */
  allFailed: boolean
}

/** 구조 단락이 이보다 많으면 막대 아래 한 줄 라벨이 뭉개져서, 두 칸 범례로 바꿔 보여준다 */
const STRUCT_INLINE_MAX = 4

/** 개관은 마크다운으로 저장된 필드가 있다 — 말풍선은 평문이라 굵게 표시만 걷어낸다 */
const plain = (text: string) => text.replace(/\*\*/g, '').trim()

const BookIntroPeekBubble = ({ target, allIntros, allFailed }: BubbleProps) => {
  const single = useBookIntro(target.bookNumber, allFailed)
  const intro = allIntros ? (allIntros.get(target.bookNumber) ?? null) : allFailed ? single.data : undefined
  const isLoading = allIntros ? false : allFailed ? single.isLoading : true
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

          {intro.author_period && (
            <p className="bip-foot">
              <span className="material-icons-round">edit_note</span>
              {plain(intro.author_period)}
            </p>
          )}
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
