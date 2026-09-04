// 교회소식 게시판 섹션 (/news 의 '소식' 탭 본문)
// Single Responsibility: 소식 목록(분류·검색·더보기)과 상세 열람 전환
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import NewsDetailView from './NewsDetailView'
import { MegaphoneIcon, SignalIcon, InboxIcon } from './NewsIcons'
import { useNewsCategories, useNewsList } from '../../../hooks/useNews'
import { isAdmin } from '../../../utils/auth'
import type { NewsItem } from '../../../types/news'
import '../news-hero.css'

const formatDate = (value: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** 최근 7일 안에 올라온 글 — 목록에서 NEW로 표시 */
const isFresh = (value: string | null): boolean => {
  if (!value) return false
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return false
  return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000
}

const NewsSection = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const admin = isAdmin()

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
    <div className="px-4 pt-3 pb-8">
      {/* Hero — 배경 삽화는 news-hero.css(.nh-hero--news).
          그림은 오른쪽 끝에 높이맞춤으로 서고, 왼쪽·아래(검색창 자리)는 알파로 카드에 녹는다 */}
      <div className="nh-hero nh-hero--news relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] p-5 mb-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center shadow-[0_6px_18px_-6px_var(--brand-glow)]">
              <MegaphoneIcon width={23} height={23} />
            </div>
            <div>
              <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">
                CHURCH NEWS
              </p>
              <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
                교회소식
              </h2>
            </div>
            {admin && (
              <button
                type="button"
                onClick={() => navigate('/admin/news')}
                className="ml-auto inline-flex items-center gap-1 h-8 px-3 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-glow)] text-brand text-[11.5px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                소식 등록
              </button>
            )}
          </div>

          {/* 글줄이 삽화 위로 넘어가지 않게 폭을 잡는다 — 삽화 위치가 바뀌면 이 값도 다시 볼 것 */}
          <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6] mb-4 max-w-[60%] lg:max-w-[52%]">
            교회의 안내와 공지, 행사 소식을 한곳에서 확인하세요.
          </p>

          {/* 검색 */}
          <div className="relative">
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
              placeholder="제목 · 내용 검색"
              className="w-full pl-10 pr-3 h-11 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 분류 칩 */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 no-scrollbar">
          <CategoryChip active={category === null} onClick={() => setCategory(null)}>
            전체
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
          title="소식을 불러오지 못했어요"
          desc="네트워크 상태를 확인하고 다시 시도해 주세요"
        />
      ) : items.length === 0 ? (
        <EmptyBox
          icon={<InboxIcon width={28} height={28} />}
          title={search || category ? '조건에 맞는 소식이 없어요' : '아직 등록된 소식이 없어요'}
          desc={
            search || category
              ? '검색어를 지우거나 다른 분류를 눌러보세요'
              : '새로운 소식이 올라오면 이곳에 표시됩니다'
          }
        />
      ) : (
        <>
          <p className="px-1 pb-2 text-[11.5px] text-gray-500 dark:text-white/50">
            전체 <span className="font-bold text-ink-strong">{total}</span>건
          </p>
          {/* lg+: 넓어진 본문을 세로로만 쓰지 않도록 2열 */}
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
            {items.map((news) => (
              <NewsCard key={news.id} news={news} onClick={() => openDetail(news)} />
            ))}
          </div>
        </>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-5">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 h-10 rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? '불러오는 중...' : '지난 소식 더 보기'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── 카드 ──────────────────────────────────────────────
const NewsCard = ({ news, onClick }: { news: NewsItem; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative w-full text-left overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-3.5 hover:border-[var(--brand-soft-strong)] transition-colors"
  >
    <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
    <div className="relative z-10 flex gap-3">
      <div className="shrink-0 w-[74px] h-[74px] rounded-xl overflow-hidden bg-[var(--brand-soft)] border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
        {news.thumbnail_url ? (
          <img
            src={news.thumbnail_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <MegaphoneIcon width={26} height={26} className="text-brand opacity-60" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 mb-1">
          {news.is_pinned && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-brand text-white">
              고정
            </span>
          )}
          {news.category && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand">
              {news.category}
            </span>
          )}
          {isFresh(news.published_at) && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-400/30 text-red-500 dark:text-red-300">
              NEW
            </span>
          )}
          {!news.is_published && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60">
              비공개
            </span>
          )}
        </div>

        <p className="text-[14.5px] font-bold text-ink-strong leading-[1.35] line-clamp-2 group-hover:text-brand transition-colors">
          {news.title}
        </p>
        {news.summary && (
          <p className="mt-1 text-[12px] text-gray-500 dark:text-white/50 leading-[1.5] line-clamp-2">
            {news.summary}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-white/40">
          <span>{formatDate(news.published_at)}</span>
          <span className="text-gray-300 dark:text-white/20">·</span>
          <span>조회 {news.views}</span>
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
      </div>
    </div>
  </button>
)

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
      'shrink-0 h-8 px-3.5 rounded-full text-[12px] font-bold border transition-colors',
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
