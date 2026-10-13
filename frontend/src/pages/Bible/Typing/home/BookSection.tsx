import { useEffect, useMemo, useRef, useState } from 'react'
import { useBibleBooks } from '../../../../hooks/useBible'
import { useBookReadingProgress } from '../../../../hooks/useBibleReading'
import { useBookTyping } from '../../../../hooks/useBibleTyping'
import type { TypingStats } from '../../../../api/bibleTyping'

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
  stats?: TypingStats
  /** 책 번호(문자열 키) → 전체 절 수. 허브 묶음의 교회 성경 조각(book_totals)에서 내려온다 */
  bookTotals?: Record<string, number>
  onGo: (book: number, chapter: number, verse?: number) => void
}

/**
 * 어디를 쓸까요 — 쓰는 중인 책만 앞에 두고, 66권 통독표는 접어 둔다.
 * (0% 칸 66개를 펼쳐 두면 성취감보다 '갈 길이 멀다'는 느낌이 먼저 온다)
 */
const BookSection = ({ loggedIn, stats, bookTotals: totalsByBook, onGo }: BookSectionProps) => {
  const { data: books } = useBibleBooks()
  const [open, setOpen] = useState(false)
  const [testament, setTestament] = useState<'OLD' | 'NEW'>('NEW')
  const [pickedBook, setPickedBook] = useState<number | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // 책별 전체 절 수 — 전에는 읽기 진행률(/bible/reading-progress, 12KB 집계)을 따로 받아 빌렸다
  const bookTotals = useMemo(
    () => new Map(Object.entries(totalsByBook ?? {}).map(([k, n]) => [Number(k), n])),
    [totalsByBook],
  )
  const bookList = useMemo(() => (books ?? []).filter((b) => b.testament === testament), [books, testament])
  const picked = books?.find((b) => b.book_number === pickedBook) ?? null
  const { data: bookTyping } = useBookTyping(pickedBook)
  const { data: bookReading } = useBookReadingProgress(pickedBook ?? 0, loggedIn)
  const chapterTotals = useMemo(() => new Map((bookReading?.chapters ?? []).map((c) => [c.chapter, c.total_verses])), [bookReading])

  // 쓰는 중인 책 — 이어 쓸 책을 맨 앞에, 나머지는 많이 쓴 순. 완필한 책은 뺀다
  const inProgress = useMemo(() => {
    const nextBook = stats?.next_position?.book_number
    return Object.entries(stats?.books ?? {})
      .map(([k, n]) => ({ book: Number(k), n, total: bookTotals.get(Number(k)) ?? 0 }))
      .filter((b) => b.n > 0 && (!b.total || b.n < b.total))
      .sort((a, b) => (a.book === nextBook ? -1 : b.book === nextBook ? 1 : b.n - a.n))
      .slice(0, 6)
  }, [stats, bookTotals])

  const nameOf = (n: number) => books?.find((b) => b.book_number === n)?.book_name_ko ?? ''

  const openBook = (bookNumber: number) => {
    const b = books?.find((x) => x.book_number === bookNumber)
    if (b) setTestament(b.testament === 'OLD' ? 'OLD' : 'NEW')
    setPickedBook(bookNumber)
    setOpen(true)
  }
  useEffect(() => {
    if (open && pickedBook) pickerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [open, pickedBook])

  return (
    <section className="bt-section" aria-labelledby="bt-books-title">
      <h2 id="bt-books-title" className="bt-section__title">
        {inProgress.length > 0 ? '쓰는 중인 책' : '처음이라면 이 장부터'}
      </h2>

      {inProgress.length > 0 ? (
        <ul className="bt-shelf">
          {inProgress.map((b) => {
            const pct = b.total ? Math.max(1, Math.floor((b.n / b.total) * 100)) : 0
            return (
              <li key={b.book}>
                <button type="button" className="bt-card bt-shelf__item" onClick={() => openBook(b.book)}>
                  <span className="bt-shelf__name">{nameOf(b.book)}</span>
                  <span className="bt-shelf__meta">
                    {b.n}절{b.total ? ` · ${pct}%` : ''}
                  </span>
                  <span className="bt-shelf__bar" aria-hidden>
                    <span style={{ width: `${pct}%` }} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="bt-quick">
          {QUICK_PICKS.map((q) => (
            <button key={q.label} type="button" className="bt-chip" onClick={() => onGo(q.book, q.chapter)}>
              {q.label}
            </button>
          ))}
        </div>
      )}

      <button type="button" className="bt-disclose" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="material-icons-round" aria-hidden>
          menu_book
        </span>
        성경 전체에서 고르기
        <span className="material-icons-round bt-disclose__chev" aria-hidden>
          expand_more
        </span>
      </button>

      {open && (
        <div ref={pickerRef} className="bt-card bt-picker">
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
      )}
    </section>
  )
}

export default BookSection
