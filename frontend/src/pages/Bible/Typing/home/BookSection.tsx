import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBibleVerse } from '../../../../api/bible'
import { bibleKeys } from '../../../../hooks/queryKeys'
import { useBibleBooks } from '../../../../hooks/useBible'
import { useBookReadingProgress } from '../../../../hooks/useBibleReading'
import { useBookTyping } from '../../../../hooks/useBibleTyping'
import type { TypingStats } from '../../../../api/bibleTyping'
import { chapterLabel } from '../../../../utils/bibleLabels'
import { smoothScrollToElement } from '../../../../utils/scrollTo'
import { genreStyle } from '../../../../components/bible/bookGenre'
import { parsePickRef } from './pickRef'

/** 허브의 '골라 쓰기' 버튼이 찾아오는 자리 */
export const PICK_SECTION_ID = 'bt-pick'

// 처음 오는 성도에게 건넬 짧고 친숙한 장들
const QUICK_PICKS: { book: number; chapter: number; label: string }[] = [
  { book: 19, chapter: 23, label: '시편 23편' },
  { book: 19, chapter: 1, label: '시편 1편' },
  { book: 46, chapter: 13, label: '고린도전서 13장' },
  { book: 40, chapter: 5, label: '마태복음 5장' },
  { book: 43, chapter: 1, label: '요한복음 1장' },
  { book: 45, chapter: 8, label: '로마서 8장' },
]

/** 필사 진행 라벨 — 전체 절 수를 모르면 절 수로, 다 쓰면 '완필', 조금이라도 썼으면 최소 1% */
const progressLabel = (n: number, total: number) => {
  if (!total) return `${n}절`
  if (n >= total) return '완필'
  return `${Math.max(1, Math.floor((n / total) * 100))}%`
}

type Filter = 'mine' | 'OLD' | 'NEW'

interface BookSectionProps {
  loggedIn: boolean
  /** 허브 묶음을 기다리는 중 — 첫 방문자용 추천 장을 먼저 그렸다가 '쓰던 책'으로 바꾸면 화면이 튄다 */
  loading?: boolean
  stats?: TypingStats
  /** 책 번호(문자열 키) → 전체 절 수. 허브 묶음의 교회 성경 조각(book_totals)에서 내려온다 */
  bookTotals?: Record<string, number>
  onGo: (book: number, chapter: number, verse?: number) => void
}

/**
 * 골라 쓰기 = 서재 (2026-11-19, 허브 A2 몰입 무대와 짝).
 * 검색이 먼저 — "요 3:16" 을 적으면 그 절 본문을 미리 보여 주고 Enter 로 바로 시작.
 * 아래는 66칸 격자 대신 필터(쓰던 책 · 구약 · 신약) + 목록(장르 점·진행 막대·절 수). 책을 누르면 장 격자.
 */
const BookSection = ({ loggedIn, loading = false, stats, bookTotals: totalsByBook, onGo }: BookSectionProps) => {
  const { data: books } = useBibleBooks()
  const [chosenFilter, setFilter] = useState<Filter | null>(null)
  const [pickedBook, setPickedBook] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [settledQuery, setSettledQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // 책별 전체 절 수 — 전에는 읽기 진행률(/bible/reading-progress, 12KB 집계)을 따로 받아 빌렸다
  const bookTotals = useMemo(
    () => new Map(Object.entries(totalsByBook ?? {}).map(([k, n]) => [Number(k), n])),
    [totalsByBook],
  )
  const next = stats?.next_position ?? null
  const picked = books?.find((b) => b.book_number === pickedBook) ?? null
  const { data: bookTyping } = useBookTyping(pickedBook)
  const { data: bookReading } = useBookReadingProgress(pickedBook ?? 0, loggedIn)
  const chapterTotals = useMemo(() => new Map((bookReading?.chapters ?? []).map((c) => [c.chapter, c.total_verses])), [bookReading])
  const parsed = useMemo(() => (books ? parsePickRef(books, query) : { kind: 'none' as const }), [books, query])

  // 쓰던 책 — 이어 쓸 책을 맨 앞에, 나머지는 많이 쓴 순
  const mine = useMemo(() => {
    const nextBook = next?.book_number
    return Object.entries(stats?.books ?? {})
      .filter(([, n]) => n > 0)
      .sort(([a, na], [b, nb]) => (Number(a) === nextBook ? -1 : Number(b) === nextBook ? 1 : nb - na))
      .map(([k]) => Number(k))
  }, [stats, next])

  // 성도가 필터를 고르기 전에는 — 쓰던 책이 있으면 그것, 없으면 이어 쓸(또는 첫) 책 쪽 언약
  const nextTestament = books?.find((b) => b.book_number === next?.book_number)?.testament
  const filter: Filter = chosenFilter ?? (mine.length ? 'mine' : nextTestament === 'NEW' ? 'NEW' : 'OLD')
  const rows = useMemo(
    () => (filter === 'mine' ? mine : (books ?? []).filter((b) => b.testament === filter).map((b) => b.book_number)),
    [filter, mine, books],
  )

  // 바로 시작할 절 미리보기 — 타자가 멈춘 뒤에만 받는다(한 글자마다 요청하지 않게)
  useEffect(() => {
    const t = window.setTimeout(() => setSettledQuery(query), 260)
    return () => window.clearTimeout(t)
  }, [query])
  const preview = parsed.kind === 'go' && settledQuery === query ? parsed : null
  const { data: previewVerse } = useQuery({
    queryKey: bibleKeys.verse(preview?.book.book_number ?? 0, preview?.chapter ?? 0, preview?.verse ?? 1),
    queryFn: () => getBibleVerse(preview!.book.book_number, preview!.chapter, preview!.verse ?? 1),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!preview,
  })

  // 책을 고르면 목록이 장 격자로 바뀌며 짧아진다 — 아래쪽 책을 눌렀다면 장 격자 머리로 올려 준다
  useEffect(() => {
    const el = listRef.current
    if (pickedBook && el && el.getBoundingClientRect().top < 64) smoothScrollToElement(el, { offset: 88 })
  }, [pickedBook])

  const nameOf = (n: number) => books?.find((b) => b.book_number === n)?.book_name_ko ?? ''

  const openBook = (bookNumber: number) => setPickedBook(bookNumber)

  const go = () => {
    if (parsed.kind === 'go') onGo(parsed.book.book_number, parsed.chapter, parsed.verse)
    else if (parsed.kind === 'book' || parsed.kind === 'over') {
      openBook(parsed.book.book_number)
      setQuery('')
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    go()
  }

  const hitTitle =
    parsed.kind === 'go'
      ? `${parsed.book.book_name_ko} ${chapterLabel(parsed.book.book_number, parsed.chapter)} ${parsed.verse ?? 1}절${parsed.verse ? '' : '부터'}`
      : parsed.kind === 'book'
        ? `${parsed.book.book_name_ko} · 장 고르기`
        : parsed.kind === 'over'
          ? `${parsed.book.book_name_ko} · ${chapterLabel(parsed.book.book_number, parsed.book.chapter_count)}까지 있어요`
          : null

  const filters: [Filter, string][] = [
    ...(mine.length ? ([['mine', `쓰던 책 ${mine.length}`]] as [Filter, string][]) : []),
    ['OLD', '구약 39'],
    ['NEW', '신약 27'],
  ]

  return (
    <section id={PICK_SECTION_ID} className="bt-card bt-lib" aria-labelledby="bt-pick-title">
      <h2 id="bt-pick-title" className="bt-lib__title">
        원하는 말씀 골라 쓰기
      </h2>

      <form className="bt-lib__search" role="search" onSubmit={submit}>
        <span className="material-icons-round" aria-hidden>
          search
        </span>
        <input
          type="search"
          enterKeyHint="go"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="시 23, 요 3:16, 로마서"
          aria-label="쓰고 싶은 말씀 바로가기"
          autoComplete="off"
        />
        {query && (
          <button type="button" className="bt-lib__clear" onClick={() => setQuery('')} aria-label="지우기">
            <span className="material-icons-round">cancel</span>
          </button>
        )}
      </form>

      {query.trim() ? (
        hitTitle ? (
          <button type="button" className={`bt-lib__hit${parsed.kind === 'go' ? ' is-go' : ''}`} onClick={go}>
            <span className="bt-lib__hit-ref">{hitTitle}</span>
            {parsed.kind === 'go' && (
              <span className="bt-lib__hit-text">{previewVerse?.text ?? ' '}</span>
            )}
            <kbd className="bt-lib__kbd">Enter</kbd>
          </button>
        ) : (
          <p className="bt-lib__miss">찾는 책이 없어요 · 책 이름이나 약칭(창·요·롬)으로 적어 보세요</p>
        )
      ) : (
        !loading &&
        !mine.length && (
          <div className="bt-lib__quick" role="group" aria-label="처음이라면 이 장부터">
            {QUICK_PICKS.map((q) => (
              <button key={q.label} type="button" onClick={() => onGo(q.book, q.chapter)}>
                {q.label}
              </button>
            ))}
          </div>
        )
      )}

      <div ref={listRef} className="bt-lib__body">
        {picked ? (
          <>
            <div className="bt-picker__head">
              <button type="button" className="bt-icon-btn" onClick={() => setPickedBook(null)} aria-label="책 다시 고르기">
                <span className="material-icons-round">arrow_back</span>
              </button>
              <span className="bt-picker__book">{picked.book_name_ko}</span>
              <span className="bt-picker__meta">
                {stats?.books[String(picked.book_number)] ? `${stats.books[String(picked.book_number)]}절 필사` : '장을 고르세요'}
              </span>
            </div>
            <div className="bt-chapters">
              {Array.from({ length: picked.chapter_count }, (_, i) => i + 1).map((c) => {
                const n = bookTyping?.[String(c)] ?? 0
                const label = n > 0 ? progressLabel(n, chapterTotals.get(c) ?? 0) : null
                return (
                  <button
                    key={c}
                    type="button"
                    className={`bt-chapter${label === '완필' ? ' is-done' : ''}`}
                    onClick={() => onGo(picked.book_number, c)}
                  >
                    {c}
                    {label && (
                      <span className="bt-book__pct" aria-label={`${n}절 필사`}>
                        {label}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div className="bt-lib__chips" role="tablist" aria-label="책 거르기">
              {loading ? (
                <span className="bt-skel bt-skel--chip" aria-hidden />
              ) : (
                filters.map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={filter === k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>
                    {label}
                  </button>
                ))
              )}
            </div>
            <ul className={`bt-lib__rows${filter === 'mine' ? ' is-mine' : ''}`}>
              {rows.map((bn) => {
                const n = stats?.books[String(bn)] ?? 0
                const total = bookTotals.get(bn) ?? 0
                const label = n > 0 ? progressLabel(n, total) : null
                const width = n > 0 && total ? Math.max(3, Math.min(100, (n / total) * 100)) : 0
                const isNext = next?.book_number === bn
                return (
                  <li key={bn}>
                    <button type="button" className={`bt-lib__row${label === '완필' ? ' is-done' : ''}`} style={genreStyle(bn)} onClick={() => openBook(bn)}>
                      <span className="bt-lib__dot" aria-hidden />
                      <span className="bt-lib__name">{nameOf(bn)}</span>
                      {filter === 'mine' && isNext && next && (
                        <span className="bt-lib__at">
                          {chapterLabel(bn, next.chapter)} {next.verse}절부터
                        </span>
                      )}
                      <span className="bt-lib__bar" aria-hidden>
                        {width > 0 && <i style={{ width: `${width}%` }} />}
                      </span>
                      <span className="bt-lib__n">{label ? (filter === 'mine' ? `${n}절` : label) : ''}</span>
                      <span className="material-icons-round bt-lib__chev" aria-hidden>
                        chevron_right
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

export default BookSection
