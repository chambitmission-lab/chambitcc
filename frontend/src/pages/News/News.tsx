import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getBulletinDetail } from '../../api/bulletin'
import { useBulletins, bulletinKeys } from '../../hooks/useBulletins'
import { showToast } from '../../utils/toast'
import type { Bulletin } from '../../types/bulletin'
import InstagramBulletinViewer from './components/InstagramBulletinViewer'
import DigitalBulletin from './components/DigitalBulletin'
import NewsSection from './components/NewsSection'
import NewFamilySection from './components/NewFamilySection'
import EventAlbumSection from './components/EventAlbumSection'
// 올해의 말씀 — 홈과 같은 쿼리(24h 캐시)라 /news에서 다시 불러오지 않는다
import AnnualThemeVerse from '../Home/components/AnnualThemeVerse'
import {
  MegaphoneIcon,
  BulletinIcon,
  SproutIcon,
  AlbumIcon,
  ImagePageIcon,
  ScreenPageIcon,
  ArchiveIcon,
  SparkleIcon,
  PagesIcon,
  EyeIcon,
  SignalIcon,
} from './components/NewsIcons'

/** 최상위 그룹 — 소식 허브 */
type SectionKey = 'news' | 'bulletin' | 'new-family' | 'event-album'
/** 주보 하위 탭 */
type BulletinTabKey = 'image' | 'digital'

// 선택 마커 색 — 소식은 기본 브랜드, 나머지는 같은 블루 계열 안에서 한 톤씩만 옮긴다
// (주보: 남색 쪽 · 새가족: 맑은 하늘 쪽 · 행사: 보랏빛 쪽). 정보색 재도입이 아니라 미세 변주.
const SECTIONS: {
  key: SectionKey
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
  label: string
  seal?: { from: string; to: string }
}[] = [
  { key: 'news', Icon: MegaphoneIcon, label: '소식' },
  { key: 'bulletin', Icon: BulletinIcon, label: '주보', seal: { from: '#5b8cf0', to: '#3562d9' } },
  { key: 'new-family', Icon: SproutIcon, label: '새가족', seal: { from: '#45a8f7', to: '#1f86e8' } },
  { key: 'event-album', Icon: AlbumIcon, label: '행사', seal: { from: '#6f86f4', to: '#4d5ee0' } },
]

const isSectionKey = (value: string | null): value is SectionKey =>
  value === 'news' ||
  value === 'bulletin' ||
  value === 'new-family' ||
  value === 'event-album'

const formatLongDate = (date: string) =>
  new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const isThisMonth = (date: string): boolean => {
  const d = new Date(date)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const News = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const section: SectionKey = isSectionKey(tabParam) ? tabParam : 'news'
  const activeSection = SECTIONS.find(s => s.key === section)

  // 목록은 React Query 캐시 우선 — 재방문 시 캐시로 즉시 그리고 뒤에서 조용히 갱신
  const { data: bulletins = [], isLoading: loading, error: listError } = useBulletins()
  const qc = useQueryClient()
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null)
  // 상세를 여는 중인 주보 id — 카드에 busy 표시 + 중복 탭 방지
  const [openingId, setOpeningId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'view'>('list')
  const [tab, setTab] = useState<BulletinTabKey>('image')

  const handleSectionChange = (next: SectionKey) => {
    // replace — 탭 전환마다 히스토리가 쌓여 뒤로가기가 먹통이 되는 걸 막는다
    setSearchParams(next === 'news' ? {} : { tab: next }, { replace: true })
  }

  const handleBulletinClick = async (bulletin: Bulletin) => {
    if (openingId !== null) return
    setOpeningId(bulletin.id)
    try {
      // fetchQuery 는 staleTime 내 캐시가 있으면 네트워크 없이 즉시 반환 —
      // 한 번 본 주보는 재열람이 바로 열린다
      const detail = await qc.fetchQuery({
        queryKey: bulletinKeys.detail(bulletin.id),
        queryFn: () => getBulletinDetail(bulletin.id),
      })
      setSelectedBulletin(detail)
      setViewMode('view')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '주보를 불러오는데 실패했습니다', 'error')
    } finally {
      setOpeningId(null)
    }
  }

  const handleBack = () => {
    setSelectedBulletin(null)
    setViewMode('list')
  }

  if (viewMode === 'view' && selectedBulletin) {
    return <InstagramBulletinViewer bulletin={selectedBulletin} onClose={handleBack} />
  }

  const latest = bulletins[0]

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 폰 프레임을 풀고 본문(넓은 카드) + 우측 위젯 레일 2컬럼으로.
          좌측 레일 오프셋은 전역 main(App.tsx)이 이미 잡아주므로 여기선
          레일 바로 옆까지 붙는 여백(px-5)만 두어 본문에 시선이 모이게 한다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-[var(--app-canvas)] min-h-screen pb-20 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-2">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
            NEWS
          </p>
          <h1 className="text-ink-strong text-[26px] font-bold leading-none tracking-[-0.02em]">
            교회소식
          </h1>
          <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2">
            참빛교회의 매주 새 소식을 모았어요
          </p>
        </header>

        {/* 그룹 세그먼트 — 주보 / 새가족 */}
        <div className="px-4 pt-2 pb-1">
          <SegmentTrack
            count={SECTIONS.length}
            index={SECTIONS.findIndex(s => s.key === section)}
            className="flex p-1 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm"
            markerClassName="seal-marker rounded-xl [--seal-radius:0.75rem] transition-[transform,background] duration-300"
            markerStyle={
              activeSection?.seal
                ? ({ '--seal-from': activeSection.seal.from, '--seal-to': activeSection.seal.to } as React.CSSProperties)
                : undefined
            }
          >
            {SECTIONS.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => handleSectionChange(s.key)}
                aria-pressed={section === s.key}
                className={[
                  'relative z-10 flex-1 h-10 rounded-xl text-[13px] font-bold transition-colors duration-200',
                  'inline-flex items-center justify-center gap-1.5',
                  section === s.key
                    ? 'text-white'
                    : 'text-gray-600 dark:text-white/60 hover:text-brand hover:bg-[var(--brand-soft)] dark:hover:text-white dark:hover:bg-white/[0.06] active:scale-[0.97]',
                ].join(' ')}
              >
                <s.Icon width={16} height={16} className="shrink-0" />
                {s.label}
              </button>
            ))}
          </SegmentTrack>
        </div>

        {/* 교회소식 게시판 */}
        {section === 'news' && <NewsSection />}

        {/* 새가족 앨범 */}
        {section === 'new-family' && <NewFamilySection />}

        {/* 행사 앨범 */}
        {section === 'event-album' && <EventAlbumSection />}

        {/* 주보 하위 탭 pill */}
        {section === 'bulletin' && (
          <div className="px-4 pt-3 pb-1">
            <SegmentTrack
              count={2}
              index={tab === 'image' ? 0 : 1}
              className="inline-flex p-1 rounded-full bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm"
              markerClassName="seal-marker rounded-full"
            >
              <TabPill active={tab === 'image'} onClick={() => setTab('image')}>
                <ImagePageIcon width={15} height={15} className="shrink-0" />
                이미지 주보
              </TabPill>
              <TabPill active={tab === 'digital'} onClick={() => setTab('digital')}>
                <ScreenPageIcon width={15} height={15} className="shrink-0" />
                디지털 주보
              </TabPill>
            </SegmentTrack>
          </div>
        )}

        {/* 이미지 주보 */}
        {section === 'bulletin' && tab === 'image' && (
          <div className="px-4 pt-3 pb-8">
            {loading ? (
              <SkeletonCards />
            ) : bulletins.length === 0 ? (
              // 캐시도 없이 실패한 경우와 진짜 빈 목록을 구분한다
              listError ? <ErrorState /> : <EmptyState />
            ) : (
              <div className="space-y-3">
                {/* 최신 주보 hero */}
                {latest && (
                  <FeaturedCard
                    bulletin={latest}
                    busy={openingId === latest.id}
                    onClick={() => handleBulletinClick(latest)}
                  />
                )}

                {/* 나머지 — 컴팩트 카드 */}
                {bulletins.length > 1 && (
                  <div className="pt-1">
                    <p className="text-[12px] font-bold text-gray-500 dark:text-white/55 mb-2 px-1">
                      지난 주보
                    </p>
                    {/* lg+: 넓어진 본문을 세로로만 쓰지 않도록 2열 그리드 */}
                    <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
                      {bulletins.slice(1).map(b => (
                        <CompactCard
                          key={b.id}
                          bulletin={b}
                          busy={openingId === b.id}
                          onClick={() => handleBulletinClick(b)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 디지털 주보 */}
        {section === 'bulletin' && tab === 'digital' && (
          <div className="pt-3 pb-8">
            <DigitalBulletin />
          </div>
        )}
      </div>

      {/* 우측 위젯 레일 — 홈과 같은 문법(sticky). 본문이 어느 섹션이든
          "이번 주 주보"로 한 번에 되돌아올 수 있는 길을 열어둔다 */}
      {/* sticky top 은 본문 열의 실제 top(고정 헤더 56px + 컨테이너 lg:pt-3 12px = 68px)과
          같아야 한다. 72px(4.5rem)로 두면 sticky 가 정적 위치보다 아래로 밀어내서
          우측 열만 4px 내려앉는다 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.25rem]">
        <NewsSidebar
          bulletins={bulletins}
          section={section}
          openingId={openingId}
          onSectionChange={handleSectionChange}
          onBulletinClick={handleBulletinClick}
        />
      </aside>
      </div>
    </div>
  )
}

// ── Segment Track ────────────────────────────────
// 선택 표시를 배경 페이드가 아니라 트랙 위를 미끄러지는 마커로 준다(/bible 구약·신약 세그먼트와 같은 감각).
// 자식 버튼들은 flex-1 로 폭이 균등해야 마커 위치가 맞는다. 트랙 좌우 패딩은 0.25rem(p-1) 기준.
const SegmentTrack = ({
  count,
  index,
  className,
  markerClassName,
  markerStyle,
  children,
}: {
  count: number
  index: number
  className: string
  markerClassName: string
  /** 마커 색 변주용 CSS 변수(--seal-from/--seal-to) 등 */
  markerStyle?: React.CSSProperties
  children: React.ReactNode
}) => (
  <div className={`relative isolate ${className}`}>
    <span
      aria-hidden="true"
      className={`absolute z-0 top-1 bottom-1 left-1 transition-transform duration-300 ease-[cubic-bezier(0.34,1.3,0.5,1)] will-change-transform motion-reduce:transition-none ${markerClassName}`}
      style={{
        ...markerStyle,
        width: `calc((100% - 0.5rem) / ${count})`,
        transform: `translateX(${Math.max(index, 0) * 100}%)`,
      }}
    />
    {children}
  </div>
)

// ── Tab Pill ─────────────────────────────────────
const TabPill = ({
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
      'relative z-10 flex-1 px-4 h-9 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-colors duration-200',
      'inline-flex items-center justify-center gap-1.5',
      active ? 'text-white' : 'text-gray-600 dark:text-white/65 hover:text-gray-900 dark:hover:text-white',
    ].join(' ')}
  >
    {children}
  </button>
)

// ── Featured Card (최신 주보 hero) ─────────────────
const FeaturedCard = ({
  bulletin,
  onClick,
  busy,
}: {
  bulletin: Bulletin
  onClick: () => void
  busy?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={`block w-full text-left group transition-opacity duration-150 ${busy ? 'opacity-60' : ''}`}
  >
    {/* lg+: 폭이 넓어지면 4:3 히어로가 화면 한 판을 다 먹는다 —
        좌(썸네일)·우(정보) 가로 분할로 바꿔 높이를 잡고 여백을 채운다 */}
    <article className="relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/[0.06] shadow-[0_18px_44px_-18px_var(--brand-glow)] transition-transform duration-200 group-active:scale-[0.99] lg:flex lg:items-stretch">
      {/* 썸네일 */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-500/15 to-sky-500/15 lg:w-[44%] lg:shrink-0">
        {bulletin.thumbnail_url ? (
          <img
            src={bulletin.thumbnail_url}
            alt={bulletin.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-brand opacity-40">
            <BulletinIcon width={46} height={46} />
          </div>
        )}
        {/* 하단 그라데이션 — lg에선 글자가 사진 위에 얹히지 않으므로 불필요 */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none lg:hidden" />
        {/* 상단 chip들 */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isThisMonth(bulletin.bulletin_date) && (
            <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-brand text-white text-[10.5px] font-bold tracking-wide shadow-[0_4px_12px_-2px_var(--brand-glow)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              최신
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-black/45 backdrop-blur-sm text-white text-[10.5px] font-semibold">
            <PagesIcon width={11.5} height={11.5} />
            {bulletin.page_count}P
          </span>
        </div>
        {/* 하단 텍스트 (모바일 — 사진 위 오버레이) */}
        <div className="absolute inset-x-0 bottom-0 p-4 z-10 lg:hidden">
          <p className="text-white/80 text-[11.5px] font-semibold mb-1">
            {formatLongDate(bulletin.bulletin_date)}
          </p>
          <h2 className="text-white text-[18px] font-bold leading-[1.3] tracking-[-0.015em] line-clamp-2 mb-1.5">
            {bulletin.title}
          </h2>
          <div className="flex items-center gap-3 text-white/75 text-[11.5px]">
            <span className="inline-flex items-center gap-1">
              <EyeIcon width={13} height={13} />
              {bulletin.views}
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-white font-bold">
              읽어보기
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* 정보 패널 (lg — 썸네일 오른쪽) */}
      <div className="hidden lg:flex lg:flex-1 lg:min-w-0 lg:flex-col lg:justify-center lg:gap-2 lg:p-7">
        <p className="text-gray-500 dark:text-white/70 text-[12.5px] font-semibold">
          {formatLongDate(bulletin.bulletin_date)}
        </p>
        <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-[1.32] tracking-[-0.02em] line-clamp-2">
          {bulletin.title}
        </h2>
        {bulletin.description && (
          <p className="text-gray-600 dark:text-white/70 text-[13px] leading-[1.65] line-clamp-3">
            {bulletin.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-gray-500 dark:text-white/60 text-[12px] pt-1">
          <span className="inline-flex items-center gap-1">
            <PagesIcon width={13.5} height={13.5} />
            {bulletin.page_count}P
          </span>
          <span className="text-gray-300 dark:text-white/25">·</span>
          <span className="inline-flex items-center gap-1">
            <EyeIcon width={13.5} height={13.5} />
            {bulletin.views}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 h-9 px-4 rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] transition-transform duration-200 group-hover:translate-x-0.5">
            읽어보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      </div>

      {/* 설명 (모바일) */}
      {bulletin.description && (
        <div className="px-4 py-3 border-t border-white/[0.06] lg:hidden">
          <p className="text-white/75 text-[12.5px] leading-[1.55] line-clamp-2">
            {bulletin.description}
          </p>
        </div>
      )}
    </article>
  </button>
)

// ── Compact Card (지난 주보) ─────────────────────
const CompactCard = ({
  bulletin,
  onClick,
  busy,
}: {
  bulletin: Bulletin
  onClick: () => void
  busy?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={`block w-full text-left group transition-opacity duration-150 ${busy ? 'opacity-60' : ''}`}
  >
    <article
      className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-200 group-hover:border-[var(--brand-soft-strong)] group-active:scale-[0.995]"
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400/60 to-blue-500/40" />

      <div className="relative z-10 flex items-center gap-3 pl-3.5 pr-3 py-3">
        {/* 썸네일 */}
        <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/15 to-sky-500/15 border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
          {bulletin.thumbnail_url ? (
            <img
              src={bulletin.thumbnail_url}
              alt={bulletin.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BulletinIcon width={24} height={24} className="text-brand opacity-45" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
            {bulletin.title}
          </p>
          <p className="text-[11.5px] text-gray-500 dark:text-white/55 truncate mt-0.5">
            {formatLongDate(bulletin.bulletin_date)}
          </p>
          <div className="flex items-center gap-2.5 text-[11px] text-gray-400 dark:text-white/45 mt-0.5">
            <span className="inline-flex items-center gap-1">
              <PagesIcon width={12.5} height={12.5} />
              {bulletin.page_count}P
            </span>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <span className="inline-flex items-center gap-1">
              <EyeIcon width={12.5} height={12.5} />
              {bulletin.views}
            </span>
          </div>
        </div>

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </article>
  </button>
)

// ── Desktop Sidebar (lg+) ────────────────────────
// 넓어진 화면의 우측을 채우는 보조 위젯 열.
// 새 API 없이 이미 받아둔 목록(useBulletins)과 캐시된 말씀만 재사용한다.
const NewsSidebar = ({
  bulletins,
  section,
  openingId,
  onSectionChange,
  onBulletinClick,
}: {
  bulletins: Bulletin[]
  section: SectionKey
  openingId: number | null
  onSectionChange: (next: SectionKey) => void
  onBulletinClick: (bulletin: Bulletin) => void
}) => {
  const latest = bulletins[0]
  const recent = bulletins.slice(1, 6)

  return (
    <>
      {/* 이번 주 주보 — 어느 섹션에 있든 최신 주보로 바로 들어가는 문 */}
      {latest && (
        <SidebarCard title="이번 주 주보" Icon={BulletinIcon}>
          <button
            type="button"
            onClick={() => onBulletinClick(latest)}
            disabled={openingId === latest.id}
            className={`group w-full text-left ${openingId === latest.id ? 'opacity-60' : ''}`}
          >
            <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/50">
              {formatLongDate(latest.bulletin_date)}
            </p>
            <p className="mt-1 text-[14px] font-bold text-ink-strong leading-[1.4] line-clamp-2">
              {latest.title}
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1 h-9 px-4 rounded-full bg-brand text-white text-[12.5px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] transition-transform duration-200 group-hover:translate-x-0.5">
              읽어보기
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
        </SidebarCard>
      )}

      {/* 주보 바로가기 — 날짜만 훑고 바로 여는 얇은 목록 */}
      {recent.length > 0 && (
        <SidebarCard title="주보 바로가기" Icon={ArchiveIcon}>
          <ul className="-mx-1">
            {recent.map(b => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onBulletinClick(b)}
                  disabled={openingId === b.id}
                  className={`w-full flex items-center gap-2 px-1 py-2 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors ${
                    openingId === b.id ? 'opacity-60' : ''
                  }`}
                >
                  <span className="shrink-0 text-[11px] font-bold tabular-nums text-gray-400 dark:text-white/40">
                    {new Date(b.bulletin_date).toLocaleDateString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-[12.5px] font-semibold text-ink-strong">
                    {b.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}

      {/* 다른 소식 — 세그먼트를 위로 올라가 누르지 않아도 되게 */}
      <SidebarCard title="다른 소식" Icon={SparkleIcon}>
        <div className="flex flex-col gap-1.5">
          {SECTIONS.filter(sec => sec.key !== section).map(sec => (
            <button
              key={sec.key}
              type="button"
              onClick={() => onSectionChange(sec.key)}
              className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--card-border)] text-[13px] font-bold text-ink-strong hover:text-brand hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] transition-colors"
            >
              <sec.Icon width={16} height={16} className="shrink-0 text-brand" />
              {sec.label}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto text-gray-400 dark:text-white/35"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </SidebarCard>

      {/* 올해의 말씀 — 소식을 다 읽고 내려온 시선이 머무는 자리 */}
      <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden">
        <AnnualThemeVerse />
      </div>
    </>
  )
}

const SidebarCard = ({
  title,
  Icon,
  children,
}: {
  title: string
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
  children: React.ReactNode
}) => (
  <section className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
    <p className="flex items-center gap-1.5 mb-2.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
      <Icon width={14} height={14} className="shrink-0 text-brand" />
      {title}
    </p>
    {children}
  </section>
)

// ── Skeleton / Empty ─────────────────────────────
const SkeletonCards = () => (
  <div className="space-y-3">
    {/* lg에선 히어로가 가로 분할이라 세로로 덜 길다 */}
    <div className="aspect-[4/3] lg:aspect-[16/6] rounded-3xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
    <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[82px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
        />
      ))}
    </div>
  </div>
)

const ErrorState = () => (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3">
      <SignalIcon width={28} height={28} />
    </div>
    <p className="text-ink-strong text-[14.5px] font-bold mb-1">
      주보를 불러오지 못했어요
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      네트워크 상태를 확인한 뒤 다시 열어 주세요
    </p>
  </div>
)

const EmptyState = () => (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3">
      <BulletinIcon width={28} height={28} />
    </div>
    <p className="text-ink-strong text-[14.5px] font-bold mb-1">
      아직 등록된 주보가 없어요
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      곧 새로운 주간 소식이 올라올 거예요
    </p>
  </div>
)

export default News
