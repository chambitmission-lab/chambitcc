import type { BibleBook } from '../../../../types/bible'
import type { ResumePosition } from '../../../../api/bibleReading'
import { genreStyle } from '../../../../components/bible/bookGenre'
import { gaugeWidth, pctLabel, type BookReadInfo } from '../readingProgressInfo'
import type { BookSelectorLang, BookSelectorTexts } from './bookSelectorTexts'

interface BookListRowProps {
  book: BibleBook
  /** 목록 안 순서 — 스태거 딜레이용 */
  index: number
  info: BookReadInfo | undefined
  resume: ResumePosition | undefined
  /** 가장 최근에 펼친 책인가(완독 여부와 무관 — 완독한 책은 행이 알아서 강조를 끈다) */
  isCurrent: boolean
  isNext: boolean
  language: BookSelectorLang
  t: BookSelectorTexts
  onSelect: () => void
  /** 권 개관 미리보기 호버 핸들러 묶음(useBookIntroPeek) */
  peek: object
}

/**
 * 목록 보기 한 행 — "글자 게이지". 게이지를 따로 그리지 않고 책 이름 글자 자체를 왼쪽부터
 * 장르색으로 채운다(안 읽은 책은 옅은 글자, 완독은 꽉 찬 글자). 한 행의 요소는 순번·이름·숫자
 * 셋뿐이라 글씨를 가장 크게 쓸 수 있고, 훑어 내리며 "다음에 읽을 책"을 고르는 속도가 살아난다.
 * 순번은 필터와 무관하게 성경 권 번호(1~66)를 그대로 쓴다 — 신약 필터에서 40부터 시작하는 것이
 * 정답이지, 매번 1부터 세면 위치 감각이 끊긴다.
 */
const BookListRow = ({
  book,
  index,
  info,
  resume,
  isCurrent: isLatestOpened,
  isNext,
  language,
  t,
  onSelect,
  peek,
}: BookListRowProps) => {
  const rate = info?.rate ?? 0
  const readChapters = info?.readChapters ?? 0
  const totalChapters = info?.totalChapters ?? book.chapter_count
  const isComplete = rate >= 100
  const hasProgress = rate > 0
  const isCurrent = isLatestOpened && !isComplete
  const bookName = language === 'en' && book.book_name_en ? book.book_name_en : book.book_name_ko

  // 이어 읽기 위치가 읽은 양보다 앞설 때만 연한 구간 — 격자·최근 읽은 책 칩과 같은 규칙
  const resumePct =
    resume && !isComplete && totalChapters > 0
      ? Math.max(0, Math.min(100, (resume.chapter / totalChapters) * 100))
      : 0
  const aheadPct = resumePct > rate + 1 ? resumePct : 0
  // 글자 채움 폭 — 0.4% 같은 값도 첫 획은 물들도록 게이지 최소 두께를 그대로 쓴다
  const fillPct = isComplete ? 100 : gaugeWidth(rate)

  // 오른쪽 숫자 두 줄: 위는 상태(완독 / 30% / 다음), 아래는 분수.
  // 지금 읽는 책만 "4장 이어 읽기"처럼 갈 곳을 구체적으로 적는다
  const stateLabel = isComplete ? t.complete : hasProgress ? `${pctLabel(rate)}%` : isNext ? t.nextUp : null
  const fracLabel = isComplete
    ? `${totalChapters}${t.chapterUnit}`
    : hasProgress
      ? `${readChapters}/${totalChapters}${t.chapterUnit}`
      : `${totalChapters}${t.chapterUnit}`
  const resumeLabel = isCurrent && resume ? t.continueFrom(resume.chapter) : null

  return (
    <button
      type="button"
      className={`book-row${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}${
        isNext ? ' is-next' : ''
      }${hasProgress ? ' has-progress' : ''}`}
      // 격자와 같은 스태거 — 목록은 행이 많아 딜레이 상한을 더 낮게 묶는다. 장르색은 CSS 변수로
      style={{ ...genreStyle(book.book_number), animationDelay: `${Math.min(index * 12, 280)}ms` }}
      aria-label={[
        bookName,
        isCurrent ? t.reading : null,
        isNext ? t.nextUp : null,
        `${readChapters}/${totalChapters}${t.chapterUnit}`,
        isComplete ? t.complete : `${pctLabel(rate)}%`,
      ]
        .filter(Boolean)
        .join(' · ')}
      onClick={onSelect}
      {...peek}
    >
      <span className="book-row__num" aria-hidden="true">
        {book.book_number}
      </span>
      {/* 글자 게이지 — 옅은 바탕 글자 위에 같은 글자를 장르색으로 겹치고 폭만 잘라낸다 */}
      <span className="book-row__word" aria-hidden="true">
        <span className="book-row__word-base">{bookName}</span>
        {aheadPct > 0 && (
          <span className="book-row__word-ahead" style={{ width: `${aheadPct}%` }}>
            {bookName}
          </span>
        )}
        {fillPct > 0 && (
          <span className="book-row__word-fill" style={{ width: `${fillPct}%` }}>
            {bookName}
          </span>
        )}
      </span>
      <span className="book-row__meta" aria-hidden="true">
        {stateLabel && <span className="book-row__state">{stateLabel}</span>}
        <span className="book-row__frac">
          {fracLabel}
          {resumeLabel && <span className="book-row__resume"> · {resumeLabel}</span>}
        </span>
      </span>
    </button>
  )
}

export default BookListRow
