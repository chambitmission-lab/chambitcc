import { useState } from 'react'
import type { ReactNode } from 'react'
import { useBibleSearchInfinite } from '../../../../hooks/useBible'
import type { BookMatchCount } from '../../../../types/bible'
import SearchVerseCard from '../SearchVerseCard'

// 책별 묶음 보기 — 614절을 책 단위로 접어 두고 많이 나온 책부터 펼친다.
// 펼친 책은 책 칩으로 좁힐 때와 같은 쿼리(book 필터)를 써서 캐시를 함께 쓴다.

const PREVIEW = 4

interface GroupsProps {
  query: string
  scope?: 'OLD' | 'NEW'
  bookCounts: BookMatchCount[]
  lang: 'ko' | 'en'
  renderVerseText: (text: string) => ReactNode
  onOpen: (book: number, chapter: number, verse: number) => void
  /** 그 책 전체를 목록으로 — 책 필터를 걸고 목록 보기로 돌아간다 */
  onMore: (book: number) => void
}

const GroupBody = ({
  query,
  scope,
  book,
  count,
  lang,
  renderVerseText,
  onOpen,
  onMore,
}: Omit<GroupsProps, 'bookCounts'> & { book: BookMatchCount; count: number }) => {
  const { data, isLoading } = useBibleSearchInfinite(query, scope, book.book_number)
  const verses = (data?.pages[0]?.results ?? []).slice(0, PREVIEW)
  if (isLoading) {
    return (
      <div className="search-group__loading" aria-hidden="true">
        <span className="material-icons-round spinning">refresh</span>
      </div>
    )
  }
  return (
    <>
      {verses.map(v => (
        <SearchVerseCard
          key={v.id}
          verse={v}
          bookNumber={book.book_number}
          bookNameKo={book.book_name_ko}
          onOpen={() => onOpen(book.book_number, v.chapter, v.verse)}
        >
          {renderVerseText(v.text)}
        </SearchVerseCard>
      ))}
      {count > PREVIEW && (
        <button type="button" className="search-group__more" onClick={() => onMore(book.book_number)}>
          {lang === 'ko'
            ? `${book.book_name_ko}에서 ${count.toLocaleString()}절 모두 보기`
            : `All ${count.toLocaleString()} in ${book.book_name_ko}`}
          <span className="material-icons-round" aria-hidden="true">chevron_right</span>
        </button>
      )}
    </>
  )
}

const SearchVerseGroups = (props: GroupsProps) => {
  const { bookCounts } = props
  // 처음엔 가장 많이 나온 책 하나만 편다 — 나머지는 머리줄(책 이름·절 수)만으로 분포가 읽힌다
  const [open, setOpen] = useState<Set<number>>(() => new Set(bookCounts[0] ? [bookCounts[0].book_number] : []))
  const toggle = (n: number) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })

  return (
    <div className="search-groups">
      {bookCounts.map(b => {
        const expanded = open.has(b.book_number)
        return (
          <section key={b.book_number} className="search-group">
            <button
              type="button"
              className="search-group__head"
              aria-expanded={expanded}
              onClick={() => toggle(b.book_number)}
            >
              <span className="search-group__name">{b.book_name_ko}</span>
              <span className="search-group__count">
                {props.lang === 'ko' ? `${b.count.toLocaleString()}절` : b.count.toLocaleString()}
              </span>
              <span className="material-icons-round" aria-hidden="true">
                {expanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {expanded && (
              <div className="search-group__body search-verses-list">
                <GroupBody {...props} book={b} count={b.count} />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

export default SearchVerseGroups
