import type { Column } from '../../types/column'
import { columnPlainText } from './blockFormat'
import { SERIF, firstHighlight, formatLetterDate, highlightKeyword } from './letterFormat'
import { specialSundayLabel } from './letterSeason'
import LetterArrivalCover from './LetterArrivalCover'

interface ColumnFeedProps {
  language: string
  loading: boolean
  /** 검색 중이면 표지 없이 결과 전체를 목록으로 */
  appliedQuery: string
  /** 최신 편지 (검색 중엔 null) */
  featured: Column | null
  /** 표지를 제외한 나머지 — 검색 중엔 결과 전체 */
  restColumns: Column[]
  /** 편지의 호수(몇 번째 편지인지) */
  issueNumberOf: (column: Column) => number
  /** 읽기 모달이 열려 있으면 표지 입자를 멈춘다 */
  coverPaused: boolean
  onOpen: (column: Column) => void
}

/**
 * 목양칼럼 목록 (2026-11 '목회서신 매거진' 개편)
 * 편지 도착 표지(최신 편지) → 이번 호에서 밑줄 그은 문장 → 지난 호 목차(호수·날짜·절기·제목·두 줄).
 */
const ColumnFeed = ({ language, loading, appliedQuery, featured, restColumns, issueNumberOf, coverPaused, onOpen }: ColumnFeedProps) => {
  const ko = language === 'ko'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)]"></div>
      </div>
    )
  }

  if (!featured && restColumns.length === 0) {
    return (
      <div className="text-center py-20 text-gray-600 dark:text-gray-400">
        {appliedQuery
          ? ko
            ? `"${appliedQuery}" 검색 결과가 없습니다`
            : `No results for "${appliedQuery}"`
          : ko
            ? '등록된 목양컬럼이 없습니다'
            : 'No columns available'}
      </div>
    )
  }

  const featuredQuote = featured ? firstHighlight(featured.content) : null

  // 지난 호 한 줄 — 호수 번호 + 날짜·절기 + 세리프 제목 + 두 줄 발췌 (검색 결과와 공유)
  const renderIssueRow = (column: Column) => {
    const special = specialSundayLabel(column.date, ko)
    return (
      <button
        key={column.id}
        onClick={() => onOpen(column)}
        className="group grid grid-cols-[52px_1fr] lg:grid-cols-[72px_1fr] gap-3 lg:gap-4 py-5 lg:py-6 border-b border-gray-200 dark:border-white/10 text-left"
      >
        <div
          className="text-[24px] lg:text-[30px] leading-none font-semibold text-gray-300 dark:text-white/25 group-hover:text-[var(--brand)] transition-colors tabular-nums"
          style={{ fontFamily: SERIF }}
        >
          {String(issueNumberOf(column)).padStart(2, '0')}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-gray-500 dark:text-gray-400 mb-1.5">
            {formatLetterDate(column.date, language)}
            {special && <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">{special}</span>}
          </div>
          <h3
            className="text-[19px] lg:text-[22px] font-semibold text-ink-strong leading-[1.4] tracking-[-0.01em] break-keep group-hover:text-[var(--brand)] transition-colors"
            style={{ fontFamily: SERIF }}
          >
            {highlightKeyword(column.title, appliedQuery)}
          </h3>
          <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-[1.7] mt-2 line-clamp-2 break-keep">
            {highlightKeyword(columnPlainText(column.content), appliedQuery)}
          </p>
        </div>
      </button>
    )
  }

  return (
    <div className="px-4 pb-10 lg:px-0">
      {featured && (
        <LetterArrivalCover
          language={language}
          column={featured}
          issueNumber={issueNumberOf(featured)}
          paused={coverPaused}
          onOpen={onOpen}
        />
      )}

      {/* 이번 호에서 밑줄 그은 문장 — 목사님이 하이라이트한 첫 문장 */}
      {featured && featuredQuote && (
        <button
          onClick={() => onOpen(featured)}
          className="w-full text-left grid lg:grid-cols-[1fr_280px] gap-3 lg:gap-6 mt-8 lg:mt-10 lg:items-end group"
        >
          <blockquote
            className="text-[21px] lg:text-[30px] leading-[1.6] text-ink-strong tracking-[-0.01em] break-keep"
            style={{ fontFamily: SERIF }}
          >
            <span className="text-[var(--brand)]">“</span>
            {featuredQuote}
            <span className="text-[var(--brand)]">”</span>
          </blockquote>
          <div className="text-[14px] lg:text-[15px] text-gray-500 dark:text-gray-400 lg:text-right">
            {ko ? '이번 호에서 밑줄 그은 문장' : 'Underlined in this issue'}
            <div className="mt-1 text-ink-strong font-semibold">{formatLetterDate(featured.date, language)}</div>
          </div>
        </button>
      )}

      {/* 지난 호 목차 — 검색 중엔 결과 */}
      {restColumns.length > 0 && (
        <section className="mt-12 lg:mt-14">
          <div className="flex items-end justify-between border-b-2 border-gray-900 dark:border-white/80 pb-3">
            <h2 className="text-[22px] lg:text-[26px] font-bold text-ink-strong" style={{ fontFamily: SERIF }}>
              {appliedQuery ? (ko ? '찾은 편지' : 'Results') : ko ? '지난 호' : 'Past issues'}
            </h2>
            <span className="text-[14px] lg:text-[15px] text-gray-500 dark:text-gray-400">
              {ko ? `${restColumns.length}통` : `${restColumns.length} letters`}
            </span>
          </div>
          <div className="grid lg:grid-cols-2 lg:gap-x-12">{restColumns.map(renderIssueRow)}</div>
        </section>
      )}
    </div>
  )
}

export default ColumnFeed
