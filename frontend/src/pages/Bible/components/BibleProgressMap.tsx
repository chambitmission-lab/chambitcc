/**
 * 성경 지도 — 66권을 한 화면에 깔고 진행률을 색 농도로 표현하는 히트맵.
 *
 * 책 그리드는 스크롤해야 전체가 보이지만, 이 지도는 "구약 앞쪽만 읽었구나",
 * "선지서가 통째로 비었구나" 같은 판단을 한 눈에 준다. 숫자를 넣지 않고
 * 농도만 쓰는 것이 핵심 — 66개 칸에 숫자를 넣으면 패턴이 사라진다.
 *
 * 구약·신약은 각각 접히는 카드로 — 헤더 한 줄(아이콘·분수·% 배지)만으로도
 * 어느 쪽이 비었는지 읽히고, 완독한 칸에는 체크가 붙어 농도 눈대중을 보조한다.
 */
import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'
import { bookAbbrev } from './bibleBookAbbrev'
import { aggregateRange, progressLevel, type BookInfoMap } from './readingProgressInfo'

interface BibleProgressMapProps {
  books: BibleBook[] | undefined
  infoMap: BookInfoMap
  onBookSelect: (book: BibleBook) => void
}

type Testament = 'ot' | 'nt'

/** 0보다 크면 최소 1%로 올려 표기 — 읽기 시작했는데 "0%"로 보이는 일을 막는다 */
const pctLabel = (rate: number) => (rate > 0 ? Math.max(1, Math.round(rate)) : 0)

/** 구약(두루마리)·신약(책) 아이콘 — 선화 1.8 스트로크, 헤더 색을 currentColor로 받는다 */
const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 4h11a3 3 0 0 1 3 3v1H9" />
    <path d="M6 4a3 3 0 0 0-3 3v1h6" />
    <path d="M6 8v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-1H9" />
    <path d="M9 16v1a3 3 0 0 1-3 3" />
  </svg>
)

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    <path d="M12 7v6M9 10h6" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

const BibleProgressMap = ({ books, infoMap, onBookSelect }: BibleProgressMapProps) => {
  const { language } = useLanguage()
  // 접힘 상태는 세션 한정 — 지도를 다시 열면 둘 다 펼쳐진 기본 모습으로 돌아온다
  const [collapsed, setCollapsed] = useState<Record<Testament, boolean>>({ ot: false, nt: false })

  const t = language === 'en'
    ? {
        ot: 'Old Testament',
        nt: 'New Testament',
        none: 'Not read',
        done: 'Complete',
        hint: 'Tap a book to open it',
        chapterUnit: 'ch',
        collapse: 'Collapse',
        expand: 'Expand',
      }
    : {
        ot: '구약',
        nt: '신약',
        none: '안 읽음',
        done: '완독',
        hint: '칸을 누르면 그 책으로 이동해요',
        chapterUnit: '장',
        collapse: '접기',
        expand: '펼치기',
      }

  const renderGroup = (id: Testament, label: string, min: number, max: number) => {
    const agg = aggregateRange(books, infoMap, min, max)
    const isOpen = !collapsed[id]
    const fraction = agg.hasChapterData
      ? `${agg.readChapters.toLocaleString()} / ${agg.totalChapters.toLocaleString()}${t.chapterUnit}`
      : null

    return (
      <section className="bible-map__group" data-testament={id} data-open={isOpen}>
        <button
          type="button"
          className="bible-map__group-head"
          aria-expanded={isOpen}
          aria-controls={`bible-map-grid-${id}`}
          onClick={() => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))}
        >
          <span className="bible-map__group-icon" aria-hidden="true">
            {id === 'ot' ? <ScrollIcon /> : <BookIcon />}
          </span>
          <span className="bible-map__group-label">
            {label}
            {fraction && <small className="bible-map__group-frac">({fraction})</small>}
          </span>
          <span className="bible-map__group-pct">{pctLabel(agg.rate)}%</span>
          <span className="bible-map__group-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
          <span className="sr-only">{isOpen ? t.collapse : t.expand}</span>
        </button>

        {isOpen && (
          <div className="bible-map__grid" id={`bible-map-grid-${id}`}>
            {(books ?? [])
              .filter(b => b.book_number >= min && b.book_number <= max)
              .map((book, index) => {
                const info = infoMap.get(book.book_number)
                const rate = info?.rate ?? 0
                const level = progressLevel(rate)
                const name = language === 'en' ? book.book_name_en : book.book_name_ko
                return (
                  <button
                    key={book.id}
                    type="button"
                    className="bible-map__cell"
                    data-level={level}
                    // 펼칠 때 앞에서부터 순차로 떠오르는 스태거 — 뒤쪽은 딜레이 상한으로 묶는다
                    style={{ animationDelay: `${Math.min(index * 10, 220)}ms` }}
                    // 칸이 작아 텍스트로 수치를 못 넣으므로 접근성 라벨에 정확한 값을 싣는다
                    aria-label={`${name} ${Math.round(rate)}%`}
                    title={`${name} · ${Math.round(rate)}%`}
                    onClick={() => onBookSelect(book)}
                  >
                    <span className="bible-map__cell-abbr">{bookAbbrev(book.book_number, language)}</span>
                    {/* 완독 칸에만 체크 — 농도가 가장 진한 칸과 "다 읽음"을 한 번 더 못 박는다 */}
                    {level === 4 && (
                      <span className="bible-map__cell-check">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="bible-map">
      {renderGroup('ot', t.ot, 1, 39)}
      {renderGroup('nt', t.nt, 40, 66)}

      <div className="bible-map__foot">
        <div className="bible-map__legend">
          <span className="bible-map__legend-text">{t.none}</span>
          {[0, 1, 2, 3, 4].map(level => (
            <span key={level} className="bible-map__legend-swatch" data-level={level} />
          ))}
          <span className="bible-map__legend-text">{t.done}</span>
        </div>
        <p className="bible-map__hint">{t.hint}</p>
      </div>
    </div>
  )
}

export default BibleProgressMap
