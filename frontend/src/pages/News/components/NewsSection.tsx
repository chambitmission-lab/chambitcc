// 교회소식 게시판 섹션 (/news 의 '소식' 탭 본문)
// Single Responsibility: 소식 목록(분류·검색·더보기)과 상세 열람 전환
import { formatDotDate, parseApiDate } from '../../../utils/date'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import NewsDetailView from './NewsDetailView'
import { MegaphoneIcon, SignalIcon, InboxIcon } from './NewsIcons'
import { useNewsCategories, useNewsList } from '../../../hooks/useNews'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { NewsItem } from '../../../types/news'
import '../news-hero.css'
import { can } from '../../../utils/access'

const formatDate = (value: string | null) => (value ? formatDotDate(value) : '')

/** 최근 7일 안에 올라온 글인지 — 주일 날짜로 미리 올린 글(미래)도 포함 */
const isRecent = (value: string | null): boolean => {
  const d = toDate(value)
  if (!d) return false
  return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000
}

/** NEW는 목록에서 게시일이 가장 늦은 글 한 건에만 — 주보는 매주 쌓여서
 *  7일 기준만 쓰면 지난주·이번 주 주보가 함께 NEW로 겹친다 */
const pickNewestId = (items: NewsItem[]): number | null => {
  let best: NewsItem | null = null
  let bestTime = -Infinity
  for (const news of items) {
    const time = toDate(news.published_at)?.getTime()
    if (time != null && time > bestTime) {
      best = news
      bestTime = time
    }
  }
  return best && isRecent(best.published_at) ? best.id : null
}

const DAY_MS = 24 * 60 * 60 * 1000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** 주보 글이면 게시일 당일 또는 그 뒤 첫 주일까지 남은 날(0 = 오늘 주일).
 *  주보가 아니거나 그 주일이 이미 지났으면 null */
const sundayLeft = (news: NewsItem): { sunday: Date; left: number } | null => {
  if (!news.category?.includes('주보')) return null
  const d = toDate(news.published_at)
  if (!d) return null
  const day = startOfDay(d)
  const sunday = new Date(day.getFullYear(), day.getMonth(), day.getDate() + ((7 - day.getDay()) % 7))
  const left = Math.round((sunday.getTime() - startOfDay(new Date()).getTime()) / DAY_MS)
  return left >= 0 ? { sunday, left } : null
}

const NewsSection = () => {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const admin = can('content:manage')

  const [category, setCategory] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  // 상세를 우리가 열었는지 — 딥링크로 바로 들어온 경우엔 뒤로가기가 앱 밖으로 나가므로
  // 그때만 URL을 replace로 되돌린다
  const pushedDetail = useRef(false)

  // 입력 중 매 글자 요청하지 않도록 300ms 디바운스
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const postParam = searchParams.get('post')
  const selectedId = useMemo(() => {
    const parsed = Number(postParam)
    return postParam && Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [postParam])

  const { items, total, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useNewsList({ category: category ?? undefined, search: search || undefined })
  const { data: categories = [] } = useNewsCategories()

  const weekdays = useMemo(() => t('newsWeekdays').split(','), [t])
  const featured = items[0]
  const rest = useMemo(() => items.slice(1), [items])
  const newestId = useMemo(() => pickNewestId(items), [items])
  // 남은 글은 게시 달로 묶는다 — 서버 정렬(고정 → 최신) 순서를 그대로 지킨다
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: NewsItem[] }[] = []
    for (const news of rest) {
      const d = toDate(news.published_at)
      const key = news.is_pinned ? 'pinned' : d ? `${d.getFullYear()}-${d.getMonth()}` : 'none'
      const last = out[out.length - 1]
      if (last && last.key === key) {
        last.items.push(news)
        continue
      }
      const label = news.is_pinned
        ? t('newsPinned')
        : d
          ? d.toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long' })
          : ''
      out.push({ key, label, items: [news] })
    }
    return out
  }, [rest, t, language])

  const openDetail = (news: NewsItem) => {
    pushedDetail.current = true
    // push — 브라우저/안드로이드 뒤로가기가 목록으로 돌아온다
    setSearchParams({ tab: 'news', post: String(news.id) })
  }

  const closeDetail = () => {
    if (pushedDetail.current) {
      pushedDetail.current = false
      navigate(-1)
    } else {
      setSearchParams({ tab: 'news' }, { replace: true })
    }
  }

  if (selectedId) {
    return <NewsDetailView newsId={selectedId} onBack={closeDetail} />
  }

  return (
    <div className="px-4 pt-3 pb-8 lg:px-6 lg:pt-4">
      {/* Hero — 배경 삽화는 news-hero.css(.nh-hero--news).
          그림은 오른쪽 끝에 높이맞춤으로 서고, 왼쪽·아래(검색창 자리)는 알파로 카드에 녹는다 */}
      <div className="nh-hero nh-hero--news relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] p-5 mb-4 lg:p-7 lg:mb-5">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center shadow-[0_6px_18px_-6px_var(--brand-glow)]">
              <MegaphoneIcon width={23} height={23} />
            </div>
            <div>
              <p className="text-brand text-[10.5px] lg:text-[12.5px] font-bold tracking-[0.12em] uppercase">
                CHURCH NEWS
              </p>
              <h2 className="text-ink-strong text-[17px] lg:text-[22px] font-bold tracking-[-0.015em]">
                {t('newsBoardTitle')}
              </h2>
            </div>
            {admin && (
              <button
                type="button"
                onClick={() => navigate('/admin/news')}
                className="relative z-[1] ml-auto inline-flex items-center gap-1 h-8 lg:h-9 px-3 lg:px-3.5 rounded-full bg-brand text-white text-[11.5px] lg:text-[13px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] hover:brightness-110 active:scale-[0.97] transition"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('newsBoardCreate')}
              </button>
            )}
          </div>

          {/* 글줄이 삽화 위로 넘어가지 않게 폭을 잡는다 — 삽화 위치가 바뀌면 이 값도 다시 볼 것 */}
          <p className="text-gray-500 dark:text-white/55 text-[12.5px] lg:text-[15.5px] lg:text-gray-600 leading-[1.6] mb-4 max-w-[60%] lg:max-w-[52%]">
            {t('newsBoardIntro')}
          </p>

          {/* 검색 — PC 에선 삽화(오른쪽 43%)를 덮지 않게 글 칼럼 폭에 맞춘다 */}
          <div className="relative lg:max-w-[52%]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('newsSearchPlaceholder')}
              className="w-full pl-10 pr-3 h-11 lg:h-[52px] lg:pl-11 lg:text-[16.5px] rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] backdrop-blur-sm text-[13.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 분류 칩 */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 no-scrollbar">
          <CategoryChip active={category === null} onClick={() => setCategory(null)}>
            {t('newsCategoryAll')}
          </CategoryChip>
          {categories.map((name) => (
            <CategoryChip
              key={name}
              active={category === name}
              onClick={() => setCategory(category === name ? null : name)}
            >
              {name}
            </CategoryChip>
          ))}
        </div>
      )}

      {/* 목록 */}
      {isLoading ? (
        <SkeletonRows />
      ) : error ? (
        <EmptyBox
          icon={<SignalIcon width={28} height={28} />}
          title={t('newsListErrorTitle')}
          desc={t('newsListErrorDesc')}
        />
      ) : items.length === 0 ? (
        <EmptyBox
          icon={<InboxIcon width={28} height={28} />}
          title={t(search || category ? 'newsEmptyFilteredTitle' : 'newsEmptyTitle')}
          desc={t(search || category ? 'newsEmptyFilteredDesc' : 'newsEmptyDesc')}
        />
      ) : (
        <>
          <p className="px-1 pb-2 text-[11.5px] lg:text-[15px] lg:pb-3 text-gray-500 dark:text-white/50">
            {t('newsCountPrefix')}
            <span className="font-bold text-ink-strong">{total}</span>
            {t('newsCountSuffix')}
          </p>
          {/* 맨 위 글 = 대표 카드, 나머지 = 달별 묶음 리스트.
              lg+: 남은 글이 있으면 대표 카드(왼쪽, 따라 붙음) | 리스트(오른쪽) 2단 */}
          <div
            className={
              rest.length > 0
                ? 'space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-5 lg:items-start'
                : ''
            }
          >
            <div className={rest.length > 0 ? 'lg:sticky lg:top-24' : 'lg:max-w-[760px]'}>
              {featured && (
                <FeaturedCard
                  news={featured}
                  fresh={featured.id === newestId}
                  weekdays={weekdays}
                  onClick={() => openDetail(featured)}
                />
              )}
            </div>
            {rest.length > 0 && (
              <div className="space-y-4">
                {groups.map((group) => (
                  <section key={group.key}>
                    <h3 className="px-1 pb-1.5 text-[12px] lg:text-[15px] font-bold text-gray-500 dark:text-white/50 tracking-[-0.01em]">
                      {group.label}
                    </h3>
                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.25)] divide-y divide-gray-100 dark:divide-white/[0.06]">
                      {group.items.map((news) => (
                        <NewsRow
                          key={news.id}
                          news={news}
                          weekdays={weekdays}
                          fresh={news.id === newestId}
                          onClick={() => openDetail(news)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-5">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 h-10 lg:h-12 lg:px-7 lg:text-[16px] rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? t('newsLoadingMore') : t('newsLoadMore')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── 카드 ──────────────────────────────────────────────
const BADGE = 'inline-flex items-center h-[19px] lg:h-6 px-1.5 lg:px-2 rounded-md text-[10px] lg:text-[12.5px] font-bold'

/** 고정·분류·NEW·비공개 뱃지 — 대표 카드와 리스트 행이 같이 쓴다 */
const NewsBadges = ({ news, fresh }: { news: NewsItem; fresh: boolean }) => {
  const { t } = useLanguage()
  if (!news.is_pinned && !news.category && !fresh && news.is_published) return null
  return (
    <>
      {news.is_pinned && <span className={`${BADGE} bg-brand text-white`}>{t('newsPinned')}</span>}
      {news.category && (
        <span className={`${BADGE} bg-[var(--brand-soft)] text-brand`}>{news.category}</span>
      )}
      {fresh && <FreshPill news={news} />}
      {!news.is_published && (
        <span className={`${BADGE} bg-gray-500/10 text-gray-600 dark:text-white/60`}>{t('newsPrivate')}</span>
      )}
    </>
  )
}

const BellIcon = ({ size = 13 }: { size?: number }) => (
  <svg className="nf-bell" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

/** 가장 최신 글 표시 — 왼쪽 진한 칸 = 종, 오른쪽 옅은 칸 = 주일 D-day(주보·주일 전까지만).
 *  주일이 지나면 오른쪽 칸만 빠져 자리가 흔들리지 않는다 */
const FreshPill = ({ news }: { news: NewsItem }) => {
  const { t } = useLanguage()
  const sun = sundayLeft(news)
  const isBulletin = !!news.category?.includes('주보')
  return (
    <span className="inline-flex items-stretch h-[19px] lg:h-6 rounded-full overflow-hidden text-[10px] lg:text-[12.5px] font-bold whitespace-nowrap">
      <span className="inline-flex items-center gap-1 pl-1.5 pr-2 lg:pl-2 lg:pr-2.5 bg-brand text-white">
        <BellIcon />
        {t(isBulletin ? 'newsFreshBulletin' : 'newsFreshNew')}
      </span>
      {sun && (
        <span className="inline-flex items-center px-2 lg:px-2.5 bg-[var(--brand-soft-strong)] text-brand tabular-nums">
          {sun.left === 0 ? t('newsSundayToday') : t('newsSundayDday').replace('{n}', String(sun.left))}
        </span>
      )}
    </span>
  )
}

/** 대표 카드 아래 한 주 징검다리 — 월~주일 일곱 칸, 오늘은 파랗게, 주일 칸엔 종 */
const WeekSteps = ({ news, weekdays }: { news: NewsItem; weekdays: string[] }) => {
  const { t } = useLanguage()
  const sun = sundayLeft(news)
  if (!sun) return null
  const today = startOfDay(new Date()).getTime()
  const label =
    sun.left === 0
      ? t('newsWeekToday')
      : sun.left === 1
        ? t('newsWeekTomorrow')
        : t('newsWeekLeft').replace('{n}', String(sun.left))
  return (
    <div className="mt-4 pt-3.5 lg:mt-5 lg:pt-4 border-t border-gray-100 dark:border-white/[0.06]">
      <p className="text-[12.5px] lg:text-[15px] font-bold text-ink-strong mb-2">{label}</p>
      <div className="grid grid-cols-7 gap-1 lg:gap-1.5" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => {
          const day = new Date(sun.sunday.getFullYear(), sun.sunday.getMonth(), sun.sunday.getDate() - 6 + i)
          const time = day.getTime()
          const isSunday = i === 6
          const isToday = time === today
          const passed = time < today
          return (
            <div
              key={i}
              className={[
                'flex flex-col items-center gap-1 text-[10.5px] lg:text-[12.5px] font-bold',
                isToday ? 'text-brand' : isSunday ? 'text-amber-700 dark:text-amber-300' : 'text-gray-400 dark:text-white/40',
              ].join(' ')}
            >
              <span className="h-4 flex items-center">{isSunday && <BellIcon size={14} />}</span>
              <span
                className={[
                  'w-full h-1.5 rounded-full',
                  isToday
                    ? isSunday
                      ? 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]'
                      : 'bg-brand shadow-[0_0_0_3px_var(--brand-soft-strong)]'
                    : isSunday
                      ? 'bg-amber-500/15 border-[1.5px] border-dashed border-amber-600 dark:border-amber-300'
                      : passed
                        ? 'bg-[var(--brand-soft-strong)]'
                        : 'bg-gray-200 dark:bg-white/[0.08]',
                ].join(' ')}
              />
              <span>{weekdays[day.getDay()] ?? ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 날짜 · 조회 · 첨부 */
const NewsMeta = ({ news, className = '' }: { news: NewsItem; className?: string }) => {
  const { t } = useLanguage()
  return (
    <div className={`flex items-center gap-1.5 text-gray-400 dark:text-white/40 ${className}`}>
      <span>{formatDate(news.published_at)}</span>
      <span className="text-gray-300 dark:text-white/20">·</span>
      <span>{t('newsViewCount').replace('{n}', String(news.views))}</span>
      {news.file_count > 0 && (
        <>
          <span className="text-gray-300 dark:text-white/20">·</span>
          <span className="inline-flex items-center gap-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.4 17.24a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            {news.file_count}
          </span>
        </>
      )}
    </div>
  )
}

const ChevronRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const HIGHLIGHT_PREVIEW = 4

/** 맨 위 글 — 번호 원고의 항목 제목을 목차처럼 (앞 4개 + 나머지 개수) */
const HighlightList = ({ items }: { items: string[] }) => {
  const { t } = useLanguage()
  const shown = items.slice(0, HIGHLIGHT_PREVIEW)
  const rest = items.length - shown.length
  return (
    <div className="mt-3 lg:mt-4">
      <p className="mb-1.5 text-[11px] lg:text-[13px] font-bold text-gray-400 dark:text-white/45">
        {t('newsHighlightsCount').replace('{n}', String(items.length))}
      </p>
      <ol className="space-y-1.5 lg:space-y-2">
        {shown.map((title, i) => (
          <li key={i} className="flex items-start gap-2 lg:gap-2.5">
            <span className="shrink-0 mt-[1px] w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] rounded-full bg-[var(--brand-soft)] text-brand text-[10.5px] lg:text-[12.5px] font-extrabold tabular-nums flex items-center justify-center">
              {i + 1}
            </span>
            <span className="min-w-0 text-[13.5px] lg:text-[16px] font-semibold text-gray-700 dark:text-white/75 leading-[1.45] line-clamp-1">
              {title}
            </span>
          </li>
        ))}
      </ol>
      {rest > 0 && (
        <p className="mt-1.5 lg:mt-2 pl-[26px] lg:pl-[32px] text-[12px] lg:text-[14px] font-bold text-gray-400 dark:text-white/45">
          {t('newsHighlightsMore').replace('{n}', String(rest))}
        </p>
      )}
    </div>
  )
}

/** 리스트 한 줄 — 첫 항목 제목 + 나머지 개수 */
const HighlightLine = ({ items }: { items: string[] }) => {
  const { t } = useLanguage()
  const rest = items.length - 1
  return (
    <p className="mt-0.5 flex items-center gap-1.5 min-w-0 text-[12px] lg:text-[14.5px] leading-[1.5]">
      <span className="min-w-0 truncate text-gray-600 dark:text-white/60 font-medium">
        <span className="text-brand font-bold tabular-nums mr-1">1.</span>
        {items[0]}
      </span>
      {rest > 0 && (
        <span className="shrink-0 px-1.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-[10.5px] lg:text-[12.5px] font-bold text-gray-500 dark:text-white/50">
          {t('newsHighlightsMore').replace('{n}', String(rest))}
        </span>
      )}
    </p>
  )
}

const toDate = (value: string | null): Date | null => {
  if (!value) return null
  const d = parseApiDate(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** 맨 위 글 — 사진이 있으면 위에 크게, 없으면 날짜를 표지 글자로 */
const FeaturedCard = ({
  news,
  fresh,
  weekdays,
  onClick,
}: {
  news: NewsItem
  fresh: boolean
  weekdays: string[]
  onClick: () => void
}) => {
  const { t } = useLanguage()
  const d = toDate(news.published_at)
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full text-left overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-[var(--card-border)] shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-18px_var(--brand-glow)] active:scale-[0.99] transition-all duration-200"
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
      {news.thumbnail_url ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--brand-soft)]">
          <img
            src={news.thumbnail_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
      ) : (
        // 사진이 없는 글 — 브랜드 색 은은한 면 위에 날짜를 크게
        <div className="relative px-5 pt-5 lg:px-7 lg:pt-7">
          <span className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-[var(--brand-soft-strong)] blur-2xl opacity-80 pointer-events-none" />
          {d && (
            <div className="relative flex items-end gap-2">
              <span className="text-brand text-[40px] lg:text-[52px] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                {d.getMonth() + 1}.{String(d.getDate()).padStart(2, '0')}
              </span>
              <span className="pb-1 text-[11px] lg:text-[13px] font-bold text-gray-400 dark:text-white/45 tracking-[0.08em]">
                {d.getFullYear()}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 p-5 lg:p-7 pt-3.5 lg:pt-4">
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <span className={`${BADGE} bg-gray-900 text-white dark:bg-white/90 dark:text-gray-900`}>
            {t('newsLatest')}
          </span>
          <NewsBadges news={news} fresh={fresh} />
        </div>
        <p className="text-[19px] lg:text-[24px] font-bold text-ink-strong leading-[1.3] tracking-[-0.02em] line-clamp-2 group-hover:text-brand transition-colors">
          {news.title}
        </p>
        {news.highlights?.length ? (
          <HighlightList items={news.highlights} />
        ) : (
          news.summary && (
            <p className="mt-2 text-[13px] lg:text-[16px] text-gray-500 dark:text-white/55 lg:text-gray-600 lg:dark:text-white/65 leading-[1.6] line-clamp-3">
              {news.summary}
            </p>
          )
        )}
        {fresh && <WeekSteps news={news} weekdays={weekdays} />}
        <div className="mt-4 lg:mt-5 flex items-center justify-between gap-3">
          <NewsMeta news={news} className="text-[11.5px] lg:text-[14.5px] min-w-0" />
          <span className="shrink-0 inline-flex items-center gap-0.5 h-8 lg:h-10 pl-3.5 pr-2.5 lg:pl-4 lg:pr-3 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] lg:text-[14.5px] font-bold group-hover:bg-brand group-hover:text-white transition-colors">
            {t('newsReadMore')}
            <ChevronRight size={15} />
          </span>
        </div>
      </div>
    </button>
  )
}

/** 리스트 한 줄 — 왼쪽 날짜 타일 + 제목·요약 + (사진) + 화살표 */
const NewsRow = ({
  news,
  weekdays,
  fresh,
  onClick,
}: {
  news: NewsItem
  weekdays: string[]
  fresh: boolean
  onClick: () => void
}) => {
  const d = toDate(news.published_at)
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left flex items-center gap-3 lg:gap-4 px-3.5 py-3.5 lg:px-5 lg:py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] active:bg-gray-100 dark:active:bg-white/[0.05] transition-colors"
    >
      <div
        className={[
          'shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex flex-col items-center justify-center leading-none',
          fresh
            ? 'bg-brand text-white shadow-[0_6px_14px_-8px_var(--brand-glow)]'
            : 'bg-gray-100 dark:bg-white/[0.06] text-ink-strong',
        ].join(' ')}
      >
        {d ? (
          <>
            <span className="text-[17px] lg:text-[20px] font-extrabold tracking-[-0.03em] tabular-nums">
              {d.getDate()}
            </span>
            <span className={`mt-1 text-[9.5px] lg:text-[11.5px] font-bold ${fresh ? 'text-white/80' : 'text-gray-400 dark:text-white/45'}`}>
              {weekdays[d.getDay()] ?? ''}
            </span>
          </>
        ) : (
          <MegaphoneIcon width={20} height={20} className="opacity-60" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 empty:hidden">
          <NewsBadges news={news} fresh={fresh} />
        </div>
        <p className="mt-0.5 text-[14.5px] lg:text-[17.5px] font-bold text-ink-strong leading-[1.4] tracking-[-0.01em] line-clamp-1 group-hover:text-brand transition-colors">
          {news.title}
        </p>
        {news.highlights?.length ? (
          <HighlightLine items={news.highlights} />
        ) : (
          news.summary && (
            <p className="mt-0.5 text-[12px] lg:text-[14.5px] text-gray-500 dark:text-white/50 leading-[1.5] line-clamp-1">
              {news.summary}
            </p>
          )
        )}
        <NewsMeta news={news} className="mt-1 text-[10.5px] lg:text-[13px]" />
      </div>

      {news.thumbnail_url && (
        <img
          src={news.thumbnail_url}
          alt=""
          loading="lazy"
          className="shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-xl object-cover border border-gray-200/70 dark:border-white/[0.08]"
        />
      )}
      <span className="shrink-0 text-gray-300 dark:text-white/25 group-hover:text-brand group-hover:translate-x-0.5 transition">
        <ChevronRight />
      </span>
    </button>
  )
}

// ── 작은 조각들 ────────────────────────────────────────
const CategoryChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'shrink-0 h-8 px-3.5 rounded-full text-[12px] lg:h-10 lg:px-[18px] lg:text-[15px] font-bold border transition-colors',
      active
        ? 'bg-brand text-white border-transparent shadow-[0_4px_14px_-6px_var(--brand-glow)]'
        : 'bg-white/70 dark:bg-white/[0.04] text-gray-600 dark:text-white/60 border-[var(--card-border)] hover:text-brand',
    ].join(' ')}
  >
    {children}
  </button>
)

const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="h-[102px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
      />
    ))}
  </div>
)

const EmptyBox = ({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) => (
  <div className="rounded-2xl border border-[var(--card-border)] bg-white/80 dark:bg-card-dark px-6 py-12 text-center">
    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-2.5">
      {icon}
    </span>
    <p className="text-[13.5px] font-bold text-ink-strong mb-1">{title}</p>
    <p className="text-[12px] text-gray-500 dark:text-white/55">{desc}</p>
  </div>
)

export default NewsSection
