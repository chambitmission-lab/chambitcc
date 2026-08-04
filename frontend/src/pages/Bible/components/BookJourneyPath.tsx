/**
 * 성경 여정 경로 — 창세기에서 계시록까지, 굽이치는 길 위의 정거장으로 책을 표현한다.
 *
 * 균일한 버튼 그리드가 "메뉴 목록"으로 읽히던 것을 "걸어온 길"의 서사로 바꾼다:
 * - 점선 트레일 = 아직 걷지 않은 길, 완독한 책 사이 구간은 실선(포장된 길)으로 바뀐다
 * - 노드 상태: 완독(채움+체크) / 읽는 중(진행률 링+%) / 안 읽음(약칭이 든 빈 원)
 * - 가장 최근 읽은 책 위에 펄스 + "지금 여기" 칩 — 여정의 현재 위치
 * - 전체 필터에서는 분류 경계마다 이정표 배너(모세오경 42% 등)가 길을 끊어 준다
 *
 * 잠금(lock)은 없다 — 통독은 순서 강제가 아니라 자유 이동이므로 어느 정거장이든 바로 진입.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { BibleBook } from '../../../types/bible'
import type { ResumePosition } from '../../../api/bibleReading'
import { parseApiDate } from '../../../utils/dateUtils'
import { bookAbbrev } from './bibleBookAbbrev'
import { aggregateRange, type BookInfoMap } from './readingProgressInfo'

interface Milestone {
  id: string
  label: string
  min: number
  max: number
}

interface BookJourneyPathProps {
  books: BibleBook[]
  infoMap: BookInfoMap
  resumeMap?: Map<number, ResumePosition>
  onBookSelect: (bookId: number, bookName: string, resume?: ResumePosition) => void
  /** 전체 필터일 때만 전달 — 분류 경계 이정표 배너 */
  milestones?: Milestone[]
  /** 진행 기록이 하나도 없으면 이정표의 0%는 노이즈이므로 숨긴다 */
  showRates: boolean
  language: 'ko' | 'en'
}

/** 노드 지름·행 높이 — CSS(.bjp-node 등)와 함께 맞춰야 한다.
 *  클래스 접두사가 bjp-인 이유: jp-는 블루마블 CSS가 선점한 전역 이름이라 충돌한다. */
const NODE = 56
const BOOK_H = 88
const MILESTONE_H = 60
const PAD_TOP = 16
const PAD_BOTTOM = 24

/** 0보다 크면 최소 1% — 시작했는데 0%로 보이는 일을 막는다(그리드 시절과 동일 규칙) */
const pctLabel = (rate: number) => (rate > 0 ? Math.max(1, Math.round(rate)) : 0)

type PathItem =
  | { kind: 'milestone'; key: string; top: number; label: string; rate: number; hasRead: boolean }
  | {
      kind: 'book'
      key: string
      top: number
      /** 노드 중심 좌표 */
      cx: number
      cy: number
      side: 'left' | 'right'
      book: BibleBook
      bookIdx: number
    }

const BookJourneyPath = ({
  books,
  infoMap,
  resumeMap,
  onBookSelect,
  milestones,
  showRates,
  language,
}: BookJourneyPathProps) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const currentNodeRef = useRef<HTMLButtonElement>(null)
  const [width, setWidth] = useState(0)
  // "지금 위치로" 플로팅 버튼 표시 여부 — 현재 노드가 화면 밖일 때만 띄운다
  const [showJump, setShowJump] = useState(false)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width)
      setWidth(prev => (prev === w ? prev : w))
    })
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const t = language === 'en'
    ? {
        complete: 'Done',
        reading: (ch: number) => `Reading ch ${ch}`,
        readingNoCh: 'Reading',
        chapters: (n: number) => `${n} ch`,
        here: 'You are here',
        next: 'Up next',
        jump: 'My position',
      }
    : {
        complete: '완독',
        reading: (ch: number) => `${ch}장 읽는 중`,
        readingNoCh: '읽는 중',
        chapters: (n: number) => `${n}장`,
        here: '지금 여기',
        next: '다음 순서',
        jump: '지금 위치로',
      }

  // 여정의 현재 위치 — 표시 중인 책들 가운데 가장 최근에 읽은 책.
  // 객체 하나에 담지 않고 원시값 둘로 두는 이유: 콜백 안에서만 재할당되는 let 객체는
  // TS가 반환 지점에서 null로 좁혀 버려(tsc -b에서 never 에러) 빌드가 깨진다
  const currentBookNumber = useMemo(() => {
    let bestNumber: number | undefined
    let bestTime = -Infinity
    books.forEach(b => {
      const pos = resumeMap?.get(b.book_number)
      if (!pos?.read_at) return
      const time = parseApiDate(pos.read_at).getTime()
      if (time > bestTime) {
        bestTime = time
        bestNumber = b.book_number
      }
    })
    return bestNumber
  }, [books, resumeMap])

  // 다음 정거장 — 현재 위치 바로 뒤에서 아직 완독하지 않은 첫 책 하나.
  // 순서 강제는 아니지만 "여기 다음은 어디"를 눈으로 집어 주는 힌트라 딱 하나만 밝힌다.
  // 읽은 기록이 아직 없으면 목록의 첫 미완독 책이 곧 출발점이 된다.
  const nextBookNumber = useMemo(() => {
    const startIdx =
      currentBookNumber === undefined
        ? 0
        : books.findIndex(b => b.book_number === currentBookNumber) + 1
    if (startIdx <= 0 && currentBookNumber !== undefined) return undefined
    const next = books.slice(startIdx).find(b => (infoMap.get(b.book_number)?.rate ?? 0) < 100)
    return next?.book_number
  }, [books, infoMap, currentBookNumber])

  // 레이아웃 계산 — 이정표를 사이사이 끼워 넣으며 y를 누적하고,
  // 책 노드 x는 사인 곡선(주기 6)으로 좌우를 오가는 뱀길을 그린다
  const { items, totalHeight } = useMemo(() => {
    const out: PathItem[] = []
    if (width === 0) return { items: out, totalHeight: 240 }

    // 라벨이 들어갈 반대편 공간을 남기고 진폭을 정한다
    const amp = Math.min(width * 0.26, 120)
    const msByFirstBook = new Map<number, Milestone>()
    ;(milestones ?? []).forEach(m => {
      const first = books.find(b => b.book_number >= m.min && b.book_number <= m.max)
      if (first) msByFirstBook.set(first.book_number, m)
    })

    let y = PAD_TOP
    let bookIdx = 0
    books.forEach(book => {
      const m = msByFirstBook.get(book.book_number)
      if (m) {
        const agg = aggregateRange(books, infoMap, m.min, m.max)
        out.push({
          kind: 'milestone',
          key: `ms-${m.id}`,
          top: y,
          label: m.label,
          rate: agg.rate,
          hasRead: agg.readVerses > 0 || agg.readChapters > 0,
        })
        y += MILESTONE_H
      }
      const offset = Math.sin(bookIdx * (Math.PI / 3))
      const cx = width / 2 + offset * amp
      out.push({
        kind: 'book',
        key: `b-${book.id}`,
        top: y,
        cx,
        cy: y + BOOK_H / 2,
        side: cx > width / 2 ? 'left' : 'right',
        book,
        bookIdx,
      })
      y += BOOK_H
      bookIdx += 1
    })

    return { items: out, totalHeight: y + PAD_BOTTOM }
  }, [books, infoMap, milestones, width])

  // 트레일 세그먼트 — 연속한 두 정거장을 세로 접선 베지어로 잇는다.
  // 양끝 모두 완독이면 '포장된 길'(실선), 한쪽만 완독이면 절반쯤 닦인 길(반투명 파선)
  const segments = useMemo(() => {
    const nodes = items.filter((it): it is Extract<PathItem, { kind: 'book' }> => it.kind === 'book')
    const segs: { d: string; state: 'done' | 'half' | 'todo'; key: string }[] = []
    for (let i = 1; i < nodes.length; i++) {
      const a = nodes[i - 1]
      const b = nodes[i]
      const dy = (b.cy - a.cy) * 0.55
      const d = `M ${a.cx} ${a.cy} C ${a.cx} ${a.cy + dy}, ${b.cx} ${b.cy - dy}, ${b.cx} ${b.cy}`
      const aDone = (infoMap.get(a.book.book_number)?.rate ?? 0) >= 100
      const bDone = (infoMap.get(b.book.book_number)?.rate ?? 0) >= 100
      segs.push({
        d,
        state: aDone && bDone ? 'done' : aDone || bDone ? 'half' : 'todo',
        key: `${a.book.id}-${b.book.id}`,
      })
    }
    return segs
  }, [items, infoMap])

  const scrollToCurrent = useCallback(() => {
    const node = currentNodeRef.current
    if (!node) return
    // 이 앱의 실제 페이지 스크롤러는 window가 아니라 body다(html/body overflow-x:hidden 구조,
    // ScrollRestoration 참고). scrollIntoView(smooth)는 위쪽 방향 스크롤이 환경에 따라
    // 무시되는 문제가 실제로 보고되어, 스크롤러를 직접 찾아 scrollTop을 rAF로 애니메이션한다.
    const scroller =
      [document.body, document.documentElement, document.getElementById('root')].find(
        el => el && el.scrollHeight > el.clientHeight + 1
      ) ?? document.body
    const rect = node.getBoundingClientRect()
    const start = scroller.scrollTop
    const maxTop = scroller.scrollHeight - scroller.clientHeight
    const target = Math.min(
      maxTop,
      Math.max(0, start + rect.top + rect.height / 2 - window.innerHeight / 2)
    )
    const dist = target - start
    if (Math.abs(dist) < 2) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scroller.scrollTop = target
      return
    }

    // 거리 비례 + 상한 — 창세기→계시록 끝에서 끝이라도 0.7초 안에 도착
    const duration = Math.min(700, 250 + Math.abs(dist) * 0.15)
    const t0 = performance.now()
    const easeInOutCubic = (p: number) =>
      p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
    let raf = 0
    // 사용자가 직접 스크롤을 시작하면 즉시 양보한다
    const cancel = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
    }
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      scroller.scrollTop = start + dist * easeInOutCubic(p)
      if (p < 1) {
        raf = requestAnimationFrame(step)
      } else {
        cancel()
      }
    }
    raf = requestAnimationFrame(step)
  }, [])

  // 현재 노드가 화면에 보이는 동안엔 점프 버튼을 숨긴다.
  // 이 앱은 스크롤 컨테이너가 #root/body라 window scroll 이벤트를 못 믿는다 —
  // document 캡처 단계에서 모든 스크롤을 받아 rAF로 묶어 판정한다.
  useEffect(() => {
    // 현재 노드가 없으면 판정 자체가 무의미 — 렌더 조건이 버튼을 이미 가린다
    if (currentBookNumber === undefined) return
    let raf = 0
    const check = () => {
      raf = 0
      const node = currentNodeRef.current
      const r = node?.getBoundingClientRect()
      // 위쪽은 상단 헤더+책 내비, 아래쪽은 하단 네비 높이만큼 여유를 두고 "보인다"로 판정
      const visible = !!r && r.bottom > 140 && r.top < window.innerHeight - 120
      setShowJump(prev => (prev === !visible ? prev : !visible))
    }
    // 초기 판정도 rAF로 — 이펙트 본문 동기 setState는 연쇄 렌더를 만든다(react-hooks 규칙)
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    schedule()
    document.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      document.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [currentBookNumber, items])

  return (
    <div className="bjp-wrap" ref={wrapRef} style={{ height: totalHeight }}>
      {width > 0 && (
        <svg
          className="bjp-trail"
          width={width}
          height={totalHeight}
          viewBox={`0 0 ${width} ${totalHeight}`}
          aria-hidden="true"
        >
          {segments.map(seg => (
            <path key={seg.key} className={`bjp-seg bjp-seg--${seg.state}`} d={seg.d} />
          ))}
        </svg>
      )}

      {/* 화면 고정 플로팅 — 컨테이너 안 absolute였을 땐 페이지와 함께 스크롤돼
          정작 필요한 순간(멀리 내려갔을 때)엔 버튼이 화면 밖에 있었다 */}
      {currentBookNumber !== undefined && showJump && (
        <button type="button" className="bjp-jump" onClick={scrollToCurrent}>
          <span className="material-icons-round">my_location</span>
          {t.jump}
        </button>
      )}

      {items.map(item => {
        if (item.kind === 'milestone') {
          return (
            <div className="bjp-milestone" key={item.key} style={{ top: item.top, height: MILESTONE_H }}>
              <span className="bjp-milestone__pill">
                <span className="material-icons-round bjp-milestone__flag">flag</span>
                <span className="bjp-milestone__label">{item.label}</span>
                {showRates && item.hasRead && (
                  <span className="bjp-milestone__pct">{pctLabel(item.rate)}%</span>
                )}
              </span>
            </div>
          )
        }

        const { book, cx, side, bookIdx } = item
        const info = infoMap.get(book.book_number)
        const rate = info?.rate ?? 0
        const readChapters = info?.readChapters ?? null
        const totalChapters = info?.totalChapters ?? book.chapter_count
        const isComplete = rate >= 100
        const hasProgress = rate > 0
        const resume = resumeMap?.get(book.book_number)
        const isCurrent = book.book_number === currentBookNumber
        const isNext = book.book_number === nextBookNumber

        let meta: string
        let metaTone: 'brand' | 'muted' = 'brand'
        if (isComplete) {
          meta = `${t.complete} · ${t.chapters(totalChapters)}`
        } else if (readChapters !== null && readChapters > 0) {
          meta = `${readChapters}/${t.chapters(totalChapters)} · ${pctLabel(rate)}%`
        } else if (hasProgress) {
          meta = `${resume ? t.reading(resume.chapter) : t.readingNoCh} · ${pctLabel(rate)}%`
        } else {
          meta = t.chapters(totalChapters)
          metaTone = 'muted'
        }

        const state = isComplete ? 'done' : hasProgress ? 'active' : 'todo'
        const horizontal =
          side === 'right'
            ? { left: cx - NODE / 2 }
            : { right: width - cx - NODE / 2 }
        // 노드 시작점부터 반대편 가장자리까지가 행(노드+라벨)이 쓸 수 있는 전체 폭 —
        // 이를 넘으면 긴 책 이름이 컨테이너 밖으로 흘러 가로 스크롤이 생긴다
        const maxRowWidth =
          (side === 'right' ? width - (cx - NODE / 2) : cx + NODE / 2) - 8

        return (
          <button
            key={item.key}
            type="button"
            ref={isCurrent ? currentNodeRef : undefined}
            className={`bjp-row bjp-row--${side} bjp-row--${state}${isCurrent ? ' bjp-row--current' : ''}${isNext ? ' bjp-row--next' : ''}`}
            style={{
              top: item.top,
              height: BOOK_H,
              maxWidth: maxRowWidth,
              ...horizontal,
              animationDelay: `${Math.min(bookIdx * 18, 360)}ms`,
            }}
            aria-label={`${book.book_name_ko} · ${meta}${isCurrent ? ` · ${t.here}` : ''}${isNext ? ` · ${t.next}` : ''}`}
            onClick={() => onBookSelect(book.id, book.book_name_ko, resume)}
          >
            <span
              className="bjp-node"
              style={hasProgress && !isComplete ? { ['--bjp-rate' as string]: `${Math.max(4, rate)}%` } : undefined}
            >
              <span className="bjp-node__inner">
                {isComplete ? (
                  <span className="material-icons-round bjp-node__check">check</span>
                ) : hasProgress ? (
                  <span className="bjp-node__pct">
                    {pctLabel(rate)}
                    <small>%</small>
                  </span>
                ) : (
                  <span className="bjp-node__abbrev">{bookAbbrev(book.book_number, language)}</span>
                )}
              </span>
              {isCurrent && (
                <span className="bjp-here" aria-hidden="true">
                  {t.here}
                </span>
              )}
            </span>
            <span className="bjp-label">
              <span className="bjp-label__name">{book.book_name_ko}</span>
              <span className={`bjp-label__meta bjp-label__meta--${metaTone}`}>{meta}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default BookJourneyPath
