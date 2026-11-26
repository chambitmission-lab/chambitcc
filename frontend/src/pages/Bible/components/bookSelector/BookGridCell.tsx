import type { BibleBook } from '../../../../types/bible'
import type { ResumePosition } from '../../../../api/bibleReading'
import { bookAbbrev } from '../bibleBookAbbrev'
import { gaugeWidth, pctLabel, type BookReadInfo } from '../readingProgressInfo'
import type { BookSelectorLang, BookSelectorTexts } from './bookSelectorTexts'

// 격자 "지금 읽는 책" 카드의 장 칸 상한 — 넘으면 칸이 실처럼 가늘어져 막대로 그린다
const HERO_CELL_MAX = 40

// 작은 카드 진행 링 둘레 (r=10)
const RING_LEN = 2 * Math.PI * 10

interface BookGridCellProps {
  book: BibleBook
  /** 목록 안 순서 — 스태거 딜레이용 */
  index: number
  info: BookReadInfo | undefined
  resume: ResumePosition | undefined
  /** 가장 최근에 펼친 책인가(완독 여부와 무관) */
  isCurrent: boolean
  isNext: boolean
  language: BookSelectorLang
  t: BookSelectorTexts
  onSelect: () => void
  /** 권 개관 미리보기 호버 핸들러 묶음(useBookIntroPeek) */
  peek: object
}

/**
 * 격자 보기 한 칸 — 큰 약어 카드. 시선이 갈 곳은 "지금 읽는 책" 한 장뿐이라 그 카드만 2×2로 키운다
 * (다크 = 집중 기도 화면의 유리컵 촛불, 라이트 = 브랜드 테두리). 완독은 체크 하나로 조용히 물러난다.
 */
const BookGridCell = ({ book, index, info, resume, isCurrent, isNext, language, t, onSelect, peek }: BookGridCellProps) => {
  const rate = info?.rate ?? 0
  const readChapters = info?.readChapters ?? null
  const totalChapters = info?.totalChapters ?? book.chapter_count
  const isComplete = rate >= 100
  const hasProgress = rate > 0

  const isHero = isCurrent && !isComplete
  const name = language === 'en' && book.book_name_en ? book.book_name_en : book.book_name_ko
  const abbrev = bookAbbrev(book.book_number, language)

  let metaText: string
  if (isComplete) {
    metaText = `${t.complete} · ${totalChapters}${t.chapterUnit}`
  } else if (readChapters !== null && readChapters > 0) {
    metaText = `${readChapters}/${totalChapters}${t.chapterUnit} · ${pctLabel(rate)}%`
  } else if (hasProgress) {
    // 완독한 장이 아직 없는 단계 — 비율 대신 "몇 장을 읽는 중"이라는 위치를 알려준다
    metaText = resume ? `${resume.chapter}${t.chapterUnit} ${t.reading}` : t.reading
  } else {
    metaText = `${isNext ? `${t.nextBook} · ` : ''}${totalChapters}${t.chapterUnit}`
  }

  const buttonProps = {
    // 필터 전환 시 앞에서부터 순차적으로 떠오르는 스태거 — 뒤쪽 칸은 딜레이 상한으로 묶는다
    style: { animationDelay: `${Math.min(index * 14, 320)}ms` },
    'aria-label': [name, isCurrent ? t.reading : null, isNext ? t.nextUp : null, metaText]
      .filter(Boolean)
      .join(' · '),
    onClick: onSelect,
    ...peek,
  }

  if (isHero) {
    // 이어 읽을 장 — 마지막으로 펼친 장. 기록이 없으면 다 읽은 장 다음
    const resumeChapter = resume?.chapter ?? Math.min((readChapters ?? 0) + 1, totalChapters)
    // 장 칸은 "몇 장을 읽었나"의 눈금이다(어느 장인지는 집계에 없다) — 앞에서부터 읽은 수만큼 채우고,
    // 이어 읽을 장이 그 뒤에 있으면 그 칸만 테두리로 짚는다. 장이 많은 책은 칸이 실처럼 가늘어져 막대로
    const filled = readChapters ?? 0
    return (
      <button {...buttonProps} className="book-cell book-hero">
        <span className="book-hero__head">
          <span className="book-hero__eyebrow">{t.nowReading}</span>
          <span className="book-hero__abbr">{abbrev}</span>
          <span className="book-hero__name">{name}</span>
        </span>
        <span className="book-hero__foot" aria-hidden="true">
          {totalChapters <= HERO_CELL_MAX ? (
            <span className="book-hero__cells">
              {Array.from({ length: totalChapters }, (_, i) => (
                <span
                  key={i}
                  className={i < filled ? 'is-read' : i + 1 === resumeChapter ? 'is-now' : undefined}
                />
              ))}
            </span>
          ) : (
            <span className="book-hero__track">
              <span style={{ width: `${gaugeWidth(rate)}%` }} />
            </span>
          )}
          <span className="book-hero__meta">{metaText}</span>
          <span className="book-hero__cta">
            {t.continueFrom(resumeChapter)}
            <span className="material-icons-round">arrow_forward</span>
          </span>
        </span>
      </button>
    )
  }

  return (
    <button
      {...buttonProps}
      className={`book-cell${isComplete ? ' is-complete' : ''}${isNext ? ' is-next' : ''}${
        hasProgress ? '' : ' is-untouched'
      }`}
    >
      {/* 오른쪽 위 표식 하나 — 완독 체크 / 읽는 중 진행 링 / 안 읽은 책은 권 번호 */}
      {isComplete ? (
        <span className="book-cell__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : hasProgress ? (
        <svg className="book-cell__ring" viewBox="0 0 26 26" aria-hidden="true">
          <circle cx="13" cy="13" r="10" />
          <circle
            cx="13"
            cy="13"
            r="10"
            className="book-cell__ring-fill"
            strokeDasharray={`${(RING_LEN * gaugeWidth(rate)) / 100} ${RING_LEN}`}
          />
        </svg>
      ) : (
        <span className="book-cell__no" aria-hidden="true">
          {book.book_number}
        </span>
      )}
      <span className="book-cell__abbr" aria-hidden="true">
        {abbrev}
      </span>
      <span className="book-cell__foot">
        <span className="book-cell__name">{name}</span>
        <span className="book-cell__meta" aria-hidden="true">
          {metaText}
        </span>
      </span>
    </button>
  )
}

export default BookGridCell
