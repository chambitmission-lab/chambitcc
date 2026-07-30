/**
 * 성경 지도 — 66권을 한 화면에 깔고 진행률을 색 농도로 표현하는 히트맵.
 *
 * 책 그리드는 스크롤해야 전체가 보이지만, 이 지도는 "구약 앞쪽만 읽었구나",
 * "선지서가 통째로 비었구나" 같은 판단을 한 눈에 준다. 숫자를 넣지 않고
 * 농도만 쓰는 것이 핵심 — 66개 칸에 숫자를 넣으면 패턴이 사라진다.
 */
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'
import { bookAbbrev } from './bibleBookAbbrev'
import { progressLevel, type BookInfoMap } from './readingProgressInfo'

interface BibleProgressMapProps {
  books: BibleBook[] | undefined
  infoMap: BookInfoMap
  onBookSelect: (book: BibleBook) => void
}

const BibleProgressMap = ({ books, infoMap, onBookSelect }: BibleProgressMapProps) => {
  const { language } = useLanguage()

  const t = language === 'en'
    ? { ot: 'Old Testament', nt: 'New Testament', none: 'Not read', done: 'Complete', hint: 'Tap a book to open it' }
    : { ot: '구약', nt: '신약', none: '안 읽음', done: '완독', hint: '칸을 누르면 그 책으로 이동해요' }

  const renderGroup = (label: string, min: number, max: number) => (
    <div className="bible-map__group">
      <span className="bible-map__group-label">{label}</span>
      <div className="bible-map__grid">
        {(books ?? [])
          .filter(b => b.book_number >= min && b.book_number <= max)
          .map(book => {
            const info = infoMap.get(book.book_number)
            const rate = info?.rate ?? 0
            const name = language === 'en' ? book.book_name_en : book.book_name_ko
            return (
              <button
                key={book.id}
                type="button"
                className="bible-map__cell"
                data-level={progressLevel(rate)}
                // 칸이 작아 텍스트로 수치를 못 넣으므로 접근성 라벨에 정확한 값을 싣는다
                aria-label={`${name} ${Math.round(rate)}%`}
                title={`${name} · ${Math.round(rate)}%`}
                onClick={() => onBookSelect(book)}
              >
                {bookAbbrev(book.book_number, language)}
              </button>
            )
          })}
      </div>
    </div>
  )

  return (
    <div className="bible-map">
      {renderGroup(t.ot, 1, 39)}
      {renderGroup(t.nt, 40, 66)}

      <div className="bible-map__legend">
        <span className="bible-map__legend-text">{t.none}</span>
        {[0, 1, 2, 3, 4].map(level => (
          <span key={level} className="bible-map__legend-swatch" data-level={level} />
        ))}
        <span className="bible-map__legend-text">{t.done}</span>
      </div>
      <p className="bible-map__hint">{t.hint}</p>
    </div>
  )
}

export default BibleProgressMap
