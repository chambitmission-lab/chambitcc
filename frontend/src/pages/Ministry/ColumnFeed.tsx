import type { Column } from '../../types/column'
import { HandHeartIcon } from '../../components/icons/ActionIcons'
import andongProfile from '../../assets/andong.png'
import { removeHighlightTags } from './highlightMarkup'
import {
  SERIF,
  firstHighlight,
  formatLetterDate,
  highlightKeyword,
  isThisWeek,
  monthAnchorId,
  readingLabel,
  type MonthGroup,
} from './letterFormat'

interface ColumnFeedProps {
  language: string
  loading: boolean
  /** 검색 중이면 피처드 없이 전부 인덱스 행으로 */
  appliedQuery: string
  /** 최신 편지 (검색 중엔 null) */
  featured: Column | null
  /** 피처드를 제외한 나머지 — 검색 중엔 결과 전체 */
  restColumns: Column[]
  monthGroups: MonthGroup[]
  onOpen: (column: Column) => void
}

/** 목양칼럼 목록 — 인트로·피처드 카드·지난 편지 인덱스(월별 그룹) */
const ColumnFeed = ({ language, loading, appliedQuery, featured, restColumns, monthGroups, onOpen }: ColumnFeedProps) => {
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
          ? language === 'ko'
            ? `"${appliedQuery}" 검색 결과가 없습니다`
            : `No results for "${appliedQuery}"`
          : language === 'ko'
            ? '등록된 목양컬럼이 없습니다'
            : 'No columns available'}
      </div>
    )
  }

  const featuredQuote = featured ? firstHighlight(featured.content) : null

  // 인덱스 행 — 일반 목록과 검색 결과가 공유
  const renderIndexRow = (column: Column) => (
    <button key={column.id} className="w-full text-left py-4 group" onClick={() => onOpen(column)}>
      <h3 className="min-w-0">
        <span
          className="text-[16px] font-semibold text-ink-strong line-clamp-1 tracking-[-0.01em] leading-[1.4] group-hover:text-[var(--brand)] transition-colors"
          style={{ fontFamily: SERIF }}
        >
          {highlightKeyword(column.title, appliedQuery)}
        </span>
      </h3>
      <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1 leading-[1.6] mt-1.5">
        {highlightKeyword(removeHighlightTags(column.content), appliedQuery)}
      </p>
      <div className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-1.5">
        {formatLetterDate(column.date, language)}
        <span className="mx-1.5 opacity-60">·</span>
        {readingLabel(column.content, language)}
      </div>
    </button>
  )

  return (
    <div className="px-4 pb-8 lg:px-0">
      {/* 인트로 — 작성자는 한 분이므로 사진은 여기서 단 한 번만 */}
      {featured && (
        <div className="px-1 pt-6 pb-5 flex items-center gap-4 lg:hidden">
          <img
            src={andongProfile}
            alt={featured.author}
            className="w-14 h-14 rounded-full object-cover ring-1 ring-black/[0.07] dark:ring-white/[0.12] flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold text-ink-strong text-[15px] tracking-[-0.01em]">
              {featured.author} {featured.role}
            </div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-[1.5] mt-1">
              {language === 'ko'
                ? '매주 마음을 담아 성도님들께 띄우는 목회 서신입니다'
                : 'A weekly letter to our congregation, written with care'}
            </p>
          </div>
        </div>
      )}

      {/* 피처드 — 최신 편지 한 통을 크게 */}
      {featured && (
        <article
          className="feed-card relative rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:border-[var(--brand-glow)] hover:shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all duration-200 cursor-pointer"
          onClick={() => onOpen(featured)}
        >
          {/* 다크모드 표면 그라데이션 — 홈 피드 카드와 동일 문법 */}
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl"></div>

          {/* lg+: 2단 분할 대신 한 흐름(배지→날짜→제목→인용→발췌)으로 두고
              줄 길이만 max-w로 제한 — 폭이 넓어도 "편지 한 통"으로 읽히게 */}
          <div className="relative z-10 p-6 lg:p-9 lg:max-w-[72ch]">
            <div>
              {isThisWeek(featured.date) && (
                <span className="inline-flex items-center px-2.5 py-1 mb-3 rounded-full bg-[var(--brand-soft-strong)] text-[var(--brand)] text-[11px] font-semibold tracking-[-0.005em]">
                  {language === 'ko' ? '이번 주 편지' : "This Week's Letter"}
                </span>
              )}
              <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-2.5">
                {formatLetterDate(featured.date, language)}
                <span className="mx-1.5 opacity-60">·</span>
                {readingLabel(featured.content, language, true)}
                {/* 아멘은 모인 편지에만 조용히 — 지난 편지 인덱스에는 숫자를 두지 않는다 */}
                {(featured.amen_count ?? 0) > 0 && (
                  <>
                    <span className="mx-1.5 opacity-60">·</span>
                    <span className="inline-flex items-center gap-1 text-brand">
                      <HandHeartIcon size={13} strokeWidth={1.9} />
                      {featured.amen_count}
                    </span>
                  </>
                )}
              </div>
              <h2
                className="text-[21px] lg:text-[26px] font-semibold text-ink-strong mb-3 lg:mb-5 line-clamp-2 tracking-[-0.01em] leading-[1.4]"
                style={{ fontFamily: SERIF }}
              >
                {featured.title}
              </h2>
            </div>

            <div>
              {featuredQuote ? (
                // 목사님이 하이라이트한 문장을 인용구로 — 편지의 핵심 한 줄이 먼저 닿게
                <>
                  <blockquote className="border-l-2 pl-4 py-0.5" style={{ borderColor: 'var(--brand-muted)' }}>
                    <p
                      className="text-[15.5px] lg:text-[17px] text-ink-strong line-clamp-3 leading-[1.75] tracking-[-0.01em]"
                      style={{ fontFamily: SERIF }}
                    >
                      “{featuredQuote}”
                    </p>
                  </blockquote>
                  <p className="text-[14px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-[1.8] tracking-[-0.01em] mt-3.5">
                    {removeHighlightTags(featured.content)}
                  </p>
                </>
              ) : (
                <p className="text-[15px] text-gray-600 dark:text-gray-300 line-clamp-4 leading-[1.8] tracking-[-0.01em]">
                  {removeHighlightTags(featured.content)}
                </p>
              )}
            </div>
          </div>
        </article>
      )}

      {/* 지난 편지 — 컴팩트 인덱스, 월별 그룹 (검색 중에는 결과 전체가 평면 리스트) */}
      {restColumns.length > 0 &&
        (appliedQuery ? (
          <div className="feed-card rounded-2xl px-5 divide-y divide-border-light dark:divide-white/[0.06] mt-4">
            {restColumns.map(renderIndexRow)}
          </div>
        ) : (
          <>
            <div className="px-1 mt-8 mb-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 tracking-[-0.005em]">
              {language === 'ko' ? '지난 편지' : 'Earlier Letters'}
            </div>
            {/* lg+: 넓어진 본문을 세로로만 쓰지 않도록 월 카드를 2열로
                (한 달치뿐이면 그대로 한 줄) */}
            <div className={monthGroups.length > 1 ? 'lg:grid lg:grid-cols-2 lg:gap-x-5 lg:gap-y-6 lg:items-start' : ''}>
              {monthGroups.map((group, gi) => (
                <div key={group.label} id={monthAnchorId(gi)} className="scroll-mt-20">
                  {/* 한 달치뿐이면 월 라벨은 소음 — 여러 달 쌓였을 때만 */}
                  {monthGroups.length > 1 && (
                    <div
                      className={`px-1 mb-2 text-[12px] font-medium text-gray-400 dark:text-gray-500 lg:mt-0 ${gi > 0 ? 'mt-6' : ''}`}
                    >
                      {group.label}
                    </div>
                  )}
                  <div className="feed-card rounded-2xl px-5 divide-y divide-border-light dark:divide-white/[0.06]">
                    {group.items.map(renderIndexRow)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ))}
    </div>
  )
}

export default ColumnFeed
