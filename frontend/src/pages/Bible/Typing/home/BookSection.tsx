import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useBibleBooks } from '../../../../hooks/useBible'
import { useBookReadingProgress } from '../../../../hooks/useBibleReading'
import { useBookTyping } from '../../../../hooks/useBibleTyping'
import type { TypingStats } from '../../../../api/bibleTyping'
import { chapterLabel } from '../../../../utils/bibleLabels'
import { smoothScrollToElement } from '../../../../utils/scrollTo'
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
 * 골라 쓰기 — 대부분은 '오늘 쓰고 싶은 곳'을 들고 온다. 그래서 접지 않고 오늘의 필사 바로 아래에 펼쳐 둔다.
 * 바로가기 입력("요 3:16") + 쓰던 책(또는 추천 장) 칩 + 구약·신약 책 → 장 격자.
 */
const BookSection = ({ loggedIn, loading = false, stats, bookTotals: totalsByBook, onGo }: BookSectionProps) => {
  const { data: books } = useBibleBooks()
  // 성도가 탭을 고르기 전까지는 이어 쓸 책 쪽 탭을 연다
  const [chosenTestament, setTestament] = useState<'OLD' | 'NEW' | null>(null)
  const [pickedBook, setPickedBook] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)

  // 책별 전체 절 수 — 전에는 읽기 진행률(/bible/reading-progress, 12KB 집계)을 따로 받아 빌렸다
  const bookTotals = useMemo(
    () => new Map(Object.entries(totalsByBook ?? {}).map(([k, n]) => [Number(k), n])),
    [totalsByBook],
  )
  const nextTestament = books?.find((b) => b.book_number === stats?.next_position?.book_number)?.testament
  const testament = chosenTestament ?? (nextTestament === 'OLD' ? 'OLD' : 'NEW')
  const bookList = useMemo(() => (books ?? []).filter((b) => b.testament === testament), [books, testament])
  const picked = books?.find((b) => b.book_number === pickedBook) ?? null
  const { data: bookTyping } = useBookTyping(pickedBook)
  const { data: bookReading } = useBookReadingProgress(pickedBook ?? 0, loggedIn)
  const chapterTotals = useMemo(() => new Map((bookReading?.chapters ?? []).map((c) => [c.chapter, c.total_verses])), [bookReading])
  const parsed = useMemo(() => (books ? parsePickRef(books, query) : { kind: 'none' as const }), [books, query])

  // 쓰던 책 — 이어 쓸 책을 맨 앞에, 나머지는 많이 쓴 순. 완필한 책은 뺀다
  const inProgress = useMemo(() => {
    const nextBook = stats?.next_position?.book_number
    return Object.entries(stats?.books ?? {})
      .map(([k, n]) => ({ book: Number(k), n, total: bookTotals.get(Number(k)) ?? 0 }))
      .filter((b) => b.n > 0 && (!b.total || b.n < b.total))
      .sort((a, b) => (a.book === nextBook ? -1 : b.book === nextBook ? 1 : b.n - a.n))
      .slice(0, 6)
  }, [stats, bookTotals])

  // 책을 고르면 격자가 장 목록으로 바뀌며 짧아진다 — 아래쪽 책을 눌렀다면 장 목록 머리로 올려 준다
  useEffect(() => {
    const el = gridRef.current
    if (pickedBook && el && el.getBoundingClientRect().top < 64) smoothScrollToElement(el, { offset: 88 })
  }, [pickedBook])

  const nameOf = (n: number) => books?.find((b) => b.book_number === n)?.book_name_ko ?? ''

  const openBook = (bookNumber: number) => {
    const b = books?.find((x) => x.book_number === bookNumber)
    if (b) setTestament(b.testament === 'OLD' ? 'OLD' : 'NEW')
    setPickedBook(bookNumber)
  }

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

  const hint =
    parsed.kind === 'go'
      ? `${parsed.book.book_name_ko} ${chapterLabel(parsed.book.book_number, parsed.chapter)}${parsed.verse ? ` ${parsed.verse}절` : ''}부터 쓰기`
      : parsed.kind === 'book'
        ? `${parsed.book.book_name_ko} 장 고르기`
        : parsed.kind === 'over'
          ? `${parsed.book.book_name_ko} · ${chapterLabel(parsed.book.book_number, parsed.book.chapter_count)}까지 있어요 · 장 고르기`
          : null

  return (
    <section id={PICK_SECTION_ID} className="bt-card bt-pick" aria-labelledby="bt-pick-title">
      <h2 id="bt-pick-title" className="bt-pick__title">
        원하는 말씀 골라 쓰기
      </h2>
      <p className="bt-pick__sub">책·장을 누르거나 ‘시 23’, ‘요 3:16’처럼 적어 보세요</p>

      <form className="bt-pick__search" role="search" onSubmit={submit}>
        <span className="material-icons-round" aria-hidden>
          search
        </span>
        <input
          type="search"
          enterKeyHint="go"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 시편 23, 요 3:16, 롬 8"
          aria-label="쓰고 싶은 말씀 바로가기"
          autoComplete="off"
        />
        {query && (
          <button type="button" className="bt-pick__clear" onClick={() => setQuery('')} aria-label="지우기">
            <span className="material-icons-round">close</span>
          </button>
        )}
      </form>
      {query.trim() &&
        (hint ? (
          <button type="button" className="bt-pick__hint" onClick={go}>
            <span className="material-icons-round" aria-hidden>
              {parsed.kind === 'go' ? 'edit_note' : 'menu_book'}
            </span>
            <span>{hint}</span>
            <span className="material-icons-round bt-pick__hint-go" aria-hidden>
              arrow_forward
            </span>
          </button>
        ) : (
          <p className="bt-pick__miss">찾는 책이 없어요 · 책 이름이나 약칭(창·요·롬)으로 적어 보세요</p>
        ))}

      {loading ? (
        <div className="bt-quick bt-pick__row" aria-busy="true" aria-label="쓰던 책 불러오는 중">
          {[0, 1, 2].map((i) => (
            <span key={i} className="bt-skel bt-skel--chip" aria-hidden />
          ))}
        </div>
      ) : inProgress.length > 0 ? (
        <div className="bt-quick bt-pick__row" role="group" aria-label="쓰던 책">
          <span className="bt-pick__row-label">쓰던 책</span>
          {inProgress.map((b) => (
            <button
              key={b.book}
              type="button"
              className={`bt-chip${pickedBook === b.book ? ' is-on' : ''}`}
              onClick={() => openBook(b.book)}
            >
              {nameOf(b.book)}
              <span className="bt-pick__chip-pct">{progressLabel(b.n, b.total)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bt-quick bt-pick__row" role="group" aria-label="처음이라면 이 장부터">
          <span className="bt-pick__row-label">추천</span>
          {QUICK_PICKS.map((q) => (
            <button key={q.label} type="button" className="bt-chip" onClick={() => onGo(q.book, q.chapter)}>
              {q.label}
            </button>
          ))}
        </div>
      )}

      <div ref={gridRef} className="bt-pick__grid">
        <div className="bt-seg" role="tablist" aria-label="구약·신약">
          {(['OLD', 'NEW'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={testament === t}
              className={testament === t ? 'is-on' : ''}
              onClick={() => {
                setTestament(t)
                setPickedBook(null)
              }}
            >
              {t === 'OLD' ? '구약' : '신약'}
            </button>
          ))}
        </div>

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
          <div className="bt-books">
            {bookList.map((b) => {
              const n = stats?.books[String(b.book_number)] ?? 0
              const label = n > 0 ? progressLabel(n, bookTotals.get(b.book_number) ?? 0) : null
              return (
                <button
                  key={b.book_number}
                  type="button"
                  className={`bt-book${n ? ' has-typed' : ''}${label === '완필' ? ' is-done' : ''}`}
                  onClick={() => setPickedBook(b.book_number)}
                >
                  <span className="bt-book__name">{b.book_name_ko}</span>
                  {label && (
                    <span className="bt-book__pct" aria-label={`${n}절 필사`}>
                      {label}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default BookSection
