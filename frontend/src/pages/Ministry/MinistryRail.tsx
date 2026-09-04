import type { Column } from '../../types/column'
import andongProfile from '../../assets/andong.png'
import { SERIF, monthAnchorId, type MonthGroup } from './letterFormat'

export interface RailHighlight {
  column: Column
  quote: string
}

interface MinistryRailProps {
  language: string
  /** 발신인 카드용 — 최신 편지의 저자·직분 */
  featured: Column | null
  totalLetters: number
  railHighlights: RailHighlight[]
  monthGroups: MonthGroup[]
  /** 헤더 실측 높이 — 타이틀 행 아래(피처드 카드 윗선)에 맞춘다 */
  topOffset: number
  onOpen: (column: Column) => void
}

/**
 * 우측 위젯 레일 (lg+) — 편지의 '발신인·편지함·아카이브'.
 * 새 API 없이 이미 받아둔 목록만 재사용한다.
 */
const MinistryRail = ({ language, featured, totalLetters, railHighlights, monthGroups, topOffset, onOpen }: MinistryRailProps) => (
  <aside
    className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]"
    style={{ marginTop: topOffset }}
  >
    {/* 발신인 — 본문 인트로(lg:hidden)가 이 자리로 옮겨왔다 */}
    {featured && (
      <section className="feed-card rounded-2xl p-5 text-center">
        <img
          src={andongProfile}
          alt={featured.author}
          className="w-16 h-16 rounded-full object-cover mx-auto ring-1 ring-black/[0.07] dark:ring-white/[0.12]"
        />
        <p className="mt-3 text-[15px] font-semibold text-ink-strong tracking-[-0.01em]" style={{ fontFamily: SERIF }}>
          {featured.author} {featured.role}
        </p>
        <p className="mt-1.5 text-[12.5px] text-gray-500 dark:text-gray-400 leading-[1.6]">
          {language === 'ko'
            ? '매주 마음을 담아 성도님들께 띄우는 목회 서신입니다'
            : 'A weekly letter to our congregation, written with care'}
        </p>
      </section>
    )}

    {/* 편지함 — 지금까지 쌓인 편지 통수 */}
    {totalLetters > 0 && (
      <section className="feed-card rounded-2xl p-4">
        <p className="mb-2 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-gray-400">
          {language === 'ko' ? '편지함' : 'Letters'}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[24px] font-semibold text-ink-strong tabular-nums leading-none">{totalLetters}</span>
          <span className="text-[13px] text-gray-500 dark:text-gray-400">
            {language === 'ko' ? '통의 편지' : totalLetters === 1 ? 'letter' : 'letters'}
          </span>
        </div>
        {railHighlights.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-border-light dark:border-white/[0.08]">
            <p className="mb-2 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-gray-400">
              {language === 'ko' ? '밑줄 그은 문장' : 'Underlined'}
            </p>
            <div className="flex flex-col gap-1.5 -mx-1">
              {railHighlights.map(({ column, quote }) => (
                <button
                  key={column.id}
                  type="button"
                  onClick={() => onOpen(column)}
                  className="px-1 py-1 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors group"
                >
                  <p className="text-[12.5px] text-ink-strong leading-[1.65] line-clamp-2" style={{ fontFamily: SERIF }}>
                    “{quote}”
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 group-hover:text-[var(--brand)] transition-colors">
                    {column.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    )}

    {/* 지난 편지 아카이브 — 월 카드로 바로 이동 */}
    {monthGroups.length > 1 && (
      <section className="feed-card rounded-2xl p-4">
        <p className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-gray-400">
          {language === 'ko' ? '지난 편지' : 'Earlier Letters'}
        </p>
        <div className="flex flex-col -mx-1">
          {monthGroups.map((group, gi) => (
            <button
              key={group.label}
              type="button"
              onClick={() =>
                document.getElementById(monthAnchorId(gi))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors"
            >
              <span className="text-[12.5px] font-semibold text-ink-strong truncate">{group.label}</span>
              <span className="text-[11.5px] tabular-nums text-gray-400 dark:text-gray-500 shrink-0">{group.items.length}</span>
            </button>
          ))}
        </div>
      </section>
    )}
  </aside>
)

export default MinistryRail
