import { useMemo } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../hooks/useAuth'
import { useBookReadingProgress } from '../../../hooks/useBibleReading'
import { useMyBookmarks } from '../../../hooks/useBibleBookmark'

// 책 카드 렌더에 필요한 최소 형태 — 백엔드 검색 결과(BibleSearchBook)와 전체 책 목록(BibleBook) 공통 필드
export interface BookCard {
  book_number: number
  book_name_ko: string
  book_name_en: string
  testament: string
  chapter_count: number
}

interface SearchBookCardProps {
  book: BookCard
  /** BibleBook.id — 읽기 진행도 조회용. 매핑 실패(0) 시 진행도 표시만 생략 */
  bookId: number
  onSelectChapter: (bookNumber: number, chapter: number) => void
  /** 책 헤더 탭 → 다른 책으로 빠르게 전환하는 퀵 피커 열기 */
  onOpenPicker: () => void
}

/**
 * 검색 결과의 책 카드 + 장 선택 그리드.
 * - 5열 고정 그리드: 두 줄이 정확히 10장이라 "23장"이 어디쯤인지 십진법 감각으로 바로 짚인다
 * - 로그인 시 장별 컨텍스트를 얹는다: 완독한 장은 ✓, 읽는 중인 장은 하단 진행바,
 *   밑줄/메모를 남긴 장은 우상단 점(dot)
 */
const SearchBookCard = ({ book, bookId, onSelectChapter, onOpenPicker }: SearchBookCardProps) => {
  const { language } = useLanguage()
  const { isLoggedIn } = useAuth()
  const loggedIn = isLoggedIn()

  const { data: bookProgress } = useBookReadingProgress(bookId, loggedIn && bookId > 0)
  // 이 책의 북마크만 조회 — 전역 최신순 목록에서는 오래된 북마크가 page_size에 밀려 빠질 수 있다
  const { data: bookmarks } = useMyBookmarks(
    { book_number: book.book_number, page_size: 100 },
    loggedIn
  )

  const texts = {
    ko: {
      old: '구약',
      new: '신약',
      chapters: '장',
      selectChapter: '장 선택',
      changeBook: '다른 책으로 바꾸기',
      read: '읽음',
      reading: '읽는 중',
      marked: '밑줄·메모',
      chapterAria: (ch: number) => `${ch}장`,
      readSuffix: ' · 읽음',
      progressOf: (done: number, total: number) => `읽은 장 ${done}/${total}`,
    },
    en: {
      old: 'OT',
      new: 'NT',
      chapters: 'chapters',
      selectChapter: 'Select chapter',
      changeBook: 'Change book',
      read: 'Read',
      reading: 'Reading',
      marked: 'Notes',
      chapterAria: (ch: number) => `Chapter ${ch}`,
      readSuffix: ' · read',
      progressOf: (done: number, total: number) => `${done}/${total} chapters read`,
    },
  }
  const t = texts[language]

  // 장 번호 → 진행 상태 (완독 여부 · 진행률 0~100)
  const chapterInfo = useMemo(() => {
    const map = new Map<number, { completed: boolean; progress: number }>()
    bookProgress?.chapters?.forEach(c =>
      map.set(c.chapter, { completed: c.completed, progress: c.progress })
    )
    return map
  }, [bookProgress])

  // 밑줄/메모/즐겨찾기를 남긴 장 집합
  const markedChapters = useMemo(() => {
    const set = new Set<number>()
    bookmarks?.items?.forEach(b => {
      if (b.book_number === book.book_number) set.add(b.chapter)
    })
    return set
  }, [bookmarks, book.book_number])

  const readCount = useMemo(
    () => Array.from(chapterInfo.values()).filter(c => c.completed).length,
    [chapterInfo]
  )
  const hasAnyMarker = readCount > 0 || markedChapters.size > 0 ||
    Array.from(chapterInfo.values()).some(c => c.progress > 0)

  return (
    <div className="search-book-card">
      <button
        type="button"
        className="search-book-head"
        onClick={onOpenPicker}
        aria-label={`${book.book_name_ko} — ${t.changeBook}`}
        title={t.changeBook}
      >
        <span className="material-icons-round search-book-head__icon">menu_book</span>
        <span className="search-book-head__body">
          <span className="search-book-head__title">
            {book.book_name_ko}
            <span className="search-book-head__en">{book.book_name_en}</span>
          </span>
          <span className="search-book-head__meta">
            {book.testament === 'OLD' ? t.old : t.new} · {book.chapter_count}
            {t.chapters}
            {readCount > 0 && <> · {t.progressOf(readCount, book.chapter_count)}</>}
          </span>
        </span>
        <span className="material-icons-round search-book-head__chevron">unfold_more</span>
      </button>

      <div className="chapter-grid-header">
        <span className="chapter-grid-label">{t.selectChapter}</span>
        {loggedIn && hasAnyMarker && (
          <span className="chapter-legend" aria-hidden="true">
            <span className="chapter-legend__item">
              <span className="material-icons-round chapter-legend__check">check</span>
              {t.read}
            </span>
            <span className="chapter-legend__item">
              <span className="chapter-legend__bar" />
              {t.reading}
            </span>
            <span className="chapter-legend__item">
              <span className="chapter-legend__dot" />
              {t.marked}
            </span>
          </span>
        )}
      </div>

      <div className="chapter-grid">
        {Array.from({ length: book.chapter_count }, (_, i) => i + 1).map(ch => {
          const info = chapterInfo.get(ch)
          const completed = !!info?.completed
          const partial = !completed && (info?.progress ?? 0) > 0
          const marked = markedChapters.has(ch)
          return (
            <button
              key={ch}
              type="button"
              className={`chapter-cell${completed ? ' chapter-cell--read' : ''}`}
              onClick={() => onSelectChapter(book.book_number, ch)}
              aria-label={`${t.chapterAria(ch)}${completed ? t.readSuffix : ''}`}
            >
              <span className="chapter-cell__num">{ch}</span>
              {completed && (
                <span className="material-icons-round chapter-cell__check" aria-hidden="true">
                  check
                </span>
              )}
              {partial && (
                <span
                  className="chapter-cell__bar"
                  // 최소 25% — 조금만 읽은 장도 "읽는 중"임이 한눈에 보이게
                  style={{ width: `${Math.max(25, info!.progress)}%` }}
                  aria-hidden="true"
                />
              )}
              {marked && <span className="chapter-cell__dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SearchBookCard
