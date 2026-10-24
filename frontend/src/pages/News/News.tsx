import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import type { Language, Translation } from '../../locales'
import { useThemeArt } from '../../hooks/useThemeArt'
import { NEWS_HERO, OFFERING_HERO, type ThemePair } from '../../utils/themeAssets'
import { useQueryClient } from '@tanstack/react-query'
import { getBulletinDetail } from '../../api/bulletin'
import { useBulletins, bulletinKeys } from '../../hooks/useBulletins'
import { showToast } from '../../utils/toast'
import type { Bulletin } from '../../types/bulletin'
import InstagramBulletinViewer from './components/InstagramBulletinViewer'
import DigitalBulletin from './components/DigitalBulletin'
import BulletinShelf from './components/BulletinShelf'
import BulletinStory from './components/BulletinStory'
import { useDigitalBulletin } from '../../hooks/useDigitalBulletin'
import { can } from '../../utils/access'
import NewsSection from './components/NewsSection'
import NoticeArchiveSection from './components/NoticeArchiveSection'
import NewFamilySection from './components/NewFamilySection'
import EventAlbumSection from './components/EventAlbumSection'
import OfferingSection from './components/OfferingSection'
// 올해의 말씀 — 홈과 같은 쿼리(24h 캐시)라 /news에서 다시 불러오지 않는다
import AnnualThemeVerse from '../Home/components/AnnualThemeVerse'
import { formatLongDate } from '../../utils/dateUtils'
import {
  MegaphoneIcon,
  NoticeBoardIcon,
  BulletinIcon,
  SproutIcon,
  AlbumIcon,
  OfferingBoxIcon,
  ImagePageIcon,
  ScreenPageIcon,
  ArchiveIcon,
  SparkleIcon,
  SignalIcon,
} from './components/NewsIcons'

/** 최상위 그룹 — 소식 허브 */
type SectionKey = 'news' | 'notice' | 'bulletin' | 'new-family' | 'event-album' | 'offering'
/** 주보 하위 탭 */
type BulletinTabKey = 'image' | 'digital'

// 선택 마커 색 — 소식은 기본 브랜드, 나머지는 같은 블루 계열 안에서 한 톤씩만 옮긴다
// (주보: 남색 쪽 · 새가족: 맑은 하늘 쪽 · 행사: 보랏빛 쪽). 정보색 재도입이 아니라 미세 변주.
const SECTIONS: {
  key: SectionKey
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
  labelKey: keyof Translation
  seal?: { from: string; to: string }
}[] = [
  { key: 'news', Icon: MegaphoneIcon, labelKey: 'newsTabNews' },
  // 공지는 소식과 데이터 소스가 다르다(notifications) — 분류 칩이 아니라 이 줄에 둔다
  { key: 'notice', Icon: NoticeBoardIcon, labelKey: 'newsTabNotice', seal: { from: '#4a93f2', to: '#2a6fd6' } },
  { key: 'bulletin', Icon: BulletinIcon, labelKey: 'newsTabBulletin', seal: { from: '#5b8cf0', to: '#3562d9' } },
  { key: 'new-family', Icon: SproutIcon, labelKey: 'newsTabNewFamily', seal: { from: '#45a8f7', to: '#1f86e8' } },
  { key: 'event-album', Icon: AlbumIcon, labelKey: 'newsTabEventAlbum', seal: { from: '#6f86f4', to: '#4d5ee0' } },
  { key: 'offering', Icon: OfferingBoxIcon, labelKey: 'newsTabOffering', seal: { from: '#3ea7f0', to: '#1a6fd4' } },
]

// 탭별 히어로 삽화(CSS 배경, news-hero.css·offering.css) — 활성 탭의 쌍만 테마 토글 선요청에 등록한다
const SECTION_ART: Partial<Record<SectionKey, ThemePair>> = {
  news: NEWS_HERO.news,
  'new-family': NEWS_HERO['new-family'],
  'event-album': NEWS_HERO['event-album'],
  offering: OFFERING_HERO,
}

const isSectionKey = (value: string | null): value is SectionKey =>
  value === 'news' ||
  value === 'notice' ||
  value === 'bulletin' ||
  value === 'new-family' ||
  value === 'event-album' ||
  value === 'offering'

const localeOf = (lang: Language) => (lang === 'en' ? 'en-US' : 'ko-KR')

const formatBulletinDate = (date: string, lang: Language) => formatLongDate(date, localeOf(lang))


const News = () => {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const section: SectionKey = isSectionKey(tabParam) ? tabParam : 'news'
  const activeSection = SECTIONS.find(s => s.key === section)
  useThemeArt(SECTION_ART[section] ?? NEWS_HERO.news, section in SECTION_ART)

  // 목록은 React Query 캐시 우선 — 재방문 시 캐시로 즉시 그리고 뒤에서 조용히 갱신
  const { data: bulletins = [], isLoading: loading, error: listError } = useBulletins()
  const qc = useQueryClient()
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null)
  // 상세를 여는 중인 주보 id — 카드에 busy 표시 + 중복 탭 방지
  const [openingId, setOpeningId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'view'>('list')
  // 히어로 쪽 띠에서 고른 쪽 — 뷰어를 그 쪽부터 연다
  const [startPage, setStartPage] = useState(0)
  const [tab, setTab] = useState<BulletinTabKey>('image')

  const handleSectionChange = (next: SectionKey) => {
    // replace — 탭 전환마다 히스토리가 쌓여 뒤로가기가 먹통이 되는 걸 막는다
    setSearchParams(next === 'news' ? {} : { tab: next }, { replace: true })
  }

  const handleBulletinClick = async (bulletin: Bulletin, page = 0) => {
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
      setStartPage(page)
      setViewMode('view')
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('newsBulletinOpenFailed'), 'error')
    } finally {
      setOpeningId(null)
    }
  }

  const handleBack = () => {
    setSelectedBulletin(null)
    setViewMode('list')
  }

  // 공유 링크(#/news?tab=bulletin&b=28)로 들어오면 그 주보를 바로 연다 — 한 번만 열리게 파라미터는 지운다
  const deepLinkId = Number(searchParams.get('b')) || null
  useEffect(() => {
    if (!deepLinkId || loading) return
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete('b')
        return next
      },
      { replace: true },
    )
    // 목록(최근 20개) 밖의 주보도 상세 조회는 id 만 있으면 된다
    void handleBulletinClick(bulletins.find(b => b.id === deepLinkId) ?? ({ id: deepLinkId } as Bulletin))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId, loading])

  if (viewMode === 'view' && selectedBulletin) {
    // 마무리 카드의 '지난 주 주보' — 목록은 최신순이라 바로 다음 칸
    const idx = bulletins.findIndex(b => b.id === selectedBulletin.id)
    const older = idx >= 0 ? bulletins[idx + 1] : undefined
    return (
      <InstagramBulletinViewer
        key={selectedBulletin.id}
        bulletin={selectedBulletin}
        initialPage={startPage}
        onClose={handleBack}
        olderBulletin={older}
        onOpenBulletin={b => handleBulletinClick(b)}
        opening={openingId !== null}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 폰 프레임을 풀고 본문(넓은 카드) + 우측 위젯 레일 2컬럼으로.
          좌측 레일 오프셋은 전역 main(App.tsx)이 이미 잡아주므로 여기선
          레일 바로 옆까지 붙는 여백(px-5)만 두어 본문에 시선이 모이게 한다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-[var(--app-canvas)] min-h-screen pb-20 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-2 lg:px-6 lg:pt-7 lg:pb-3">
          <p className="text-brand text-[11.5px] lg:text-[13px] font-bold tracking-[0.12em] uppercase mb-1.5">
            NEWS
          </p>
          <h1 className="text-ink-strong text-[26px] lg:text-[34px] font-bold leading-none tracking-[-0.02em]">
            {t('newsPageTitle')}
          </h1>
          <p className="text-gray-500 dark:text-white/55 text-[13px] lg:text-[16px] lg:text-gray-600 lg:mt-3 mt-2">
            {t('newsPageSubtitle')}
          </p>
        </header>

        {/* 그룹 세그먼트 — 주보 / 새가족 */}
        <div className="px-4 pt-2 pb-1 lg:px-6">
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
                  // 탭이 6개라 한 칸이 320px 폭에서 ~47px 밖에 안 된다. 가장 긴 '새가족'(3글자)이
                  // 기준 — 360px 미만에선 아이콘을 접고 글자만 남겨 줄이 깨지지 않게 한다.
                  'relative z-10 flex-1 h-10 rounded-xl text-[11.5px] min-[380px]:text-[12px] lg:h-12 lg:text-[15.5px] font-bold transition-colors duration-200',
                  'inline-flex items-center justify-center gap-0.5 min-[400px]:gap-1 lg:gap-1.5 whitespace-nowrap',
                  section === s.key
                    ? 'text-white'
                    : 'text-gray-600 dark:text-white/60 hover:text-brand hover:bg-[var(--brand-soft)] dark:hover:text-white dark:hover:bg-white/[0.06] active:scale-[0.97]',
                ].join(' ')}
              >
                <s.Icon width={14} height={14} className="hidden min-[360px]:block shrink-0 lg:w-[18px] lg:h-[18px]" />
                {t(s.labelKey)}
              </button>
            ))}
          </SegmentTrack>
        </div>

        {/* 교회소식 게시판 */}
        {section === 'news' && <NewsSection />}

        {/* 공지 아카이브 — 홈 배너에서 내려간 지난 공지 */}
        {section === 'notice' && <NoticeArchiveSection />}

        {/* 새가족 앨범 */}
        {section === 'new-family' && <NewFamilySection />}

        {/* 행사 앨범 */}
        {section === 'event-album' && <EventAlbumSection />}

        {/* 온라인 헌금 안내 */}
        {section === 'offering' && <OfferingSection />}

        {/* 주보 하위 탭 pill */}
        {section === 'bulletin' && (
          <div className="px-4 pt-3 pb-1 lg:px-6 lg:pt-4">
            <SegmentTrack
              count={2}
              index={tab === 'image' ? 0 : 1}
              className="inline-flex p-1 rounded-full bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm"
              markerClassName="seal-marker rounded-full"
            >
              <TabPill active={tab === 'image'} onClick={() => setTab('image')}>
                <ImagePageIcon width={15} height={15} className="shrink-0 lg:w-[18px] lg:h-[18px]" />
                {t('newsBulletinTabImage')}
              </TabPill>
              <TabPill active={tab === 'digital'} onClick={() => setTab('digital')}>
                <ScreenPageIcon width={15} height={15} className="shrink-0 lg:w-[18px] lg:h-[18px]" />
                {t('newsBulletinTabDigital')}
              </TabPill>
            </SegmentTrack>
          </div>
        )}

        {/* 이미지 주보 */}
        {section === 'bulletin' && tab === 'image' && (
          <div className="px-4 pt-3 pb-8 lg:px-6 lg:pt-4">
            {loading ? (
              <SkeletonCards />
            ) : bulletins.length === 0 ? (
              // 캐시도 없이 실패한 경우와 진짜 빈 목록을 구분한다
              listError ? <ErrorState /> : <EmptyState />
            ) : (
              <BulletinShelf bulletins={bulletins} openingId={openingId} onOpen={handleBulletinClick} />
            )}
          </div>
        )}

        {/* 디지털 주보 */}
        {section === 'bulletin' && tab === 'digital' && (
          <div className="pt-3 pb-8">
            <DigitalBulletinTab />
          </div>
        )}
      </div>

      {/* 우측 위젯 레일 — 홈과 같은 문법(sticky). 본문이 어느 섹션이든
          "이번 주 주보"로 한 번에 되돌아올 수 있는 길을 열어둔다 */}
      {/* sticky top 은 본문 열의 실제 top(고정 헤더 56px + 컨테이너 lg:pt-3 12px = 68px)과
          같아야 한다. 72px(4.5rem)로 두면 sticky 가 정적 위치보다 아래로 밀어내서
          우측 열만 4px 내려앉는다 */}
      {/* 넘겨보는 주보는 자체 목차를 가지니 PC 폭을 무대에 다 준다 */}
      {!(section === 'bulletin' && tab === 'digital') && (
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.25rem] lg:max-h-[calc((100vh-5.25rem)/var(--az,1))] lg:overflow-y-auto scrollbar-hide lg:[&>*]:shrink-0">
        <NewsSidebar
          bulletins={bulletins}
          section={section}
          openingId={openingId}
          onSectionChange={handleSectionChange}
          onBulletinClick={handleBulletinClick}
        />
      </aside>
      )}
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
      'relative z-10 flex-1 px-4 h-9 rounded-full text-[12.5px] lg:h-11 lg:px-6 lg:text-[15.5px] font-bold whitespace-nowrap transition-colors duration-200',
      'inline-flex items-center justify-center gap-1.5',
      active ? 'text-white' : 'text-gray-600 dark:text-white/65 hover:text-gray-900 dark:hover:text-white',
    ].join(' ')}
  >
    {children}
  </button>
)

// ── Desktop Sidebar (lg+) ────────────────────────
// 넓어진 화면의 우측을 채우는 보조 위젯 열. PC 전용이라 글씨는 어르신 기준(본문 15px+)으로 잡는다.
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
  const { t, language } = useLanguage()
  const latest = bulletins[0]
  const recent = bulletins.slice(1, 6)

  return (
    <>
      {/* 이번 주 주보 — 어느 섹션에 있든 최신 주보로 바로 들어가는 문 */}
      {latest && (
        <SidebarCard title={t('newsSidebarThisWeek')} Icon={BulletinIcon}>
          <button
            type="button"
            onClick={() => onBulletinClick(latest)}
            disabled={openingId === latest.id}
            className={`group w-full text-left ${openingId === latest.id ? 'opacity-60' : ''}`}
          >
            <p className="text-[14.5px] font-semibold text-gray-500 dark:text-white/55">
              {formatBulletinDate(latest.bulletin_date, language)}
            </p>
            <p className="mt-1 text-[17.5px] font-bold text-ink-strong leading-[1.4] line-clamp-2">
              {latest.title}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 h-11 px-5 rounded-full bg-brand text-white text-[15.5px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] transition-transform duration-200 group-hover:translate-x-0.5">
              {t('newsBulletinRead')}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
        </SidebarCard>
      )}

      {/* 주보 바로가기 — 날짜만 훑고 바로 여는 얇은 목록 */}
      {recent.length > 0 && (
        <SidebarCard title={t('newsSidebarShortcuts')} Icon={ArchiveIcon}>
          <ul className="-mx-1">
            {recent.map(b => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onBulletinClick(b)}
                  disabled={openingId === b.id}
                  className={`w-full flex items-center gap-2.5 px-1.5 py-2.5 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors ${
                    openingId === b.id ? 'opacity-60' : ''
                  }`}
                >
                  <span className="shrink-0 text-[14px] font-bold tabular-nums text-gray-500 dark:text-white/50">
                    {new Date(b.bulletin_date).toLocaleDateString(localeOf(language), {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-[15.5px] font-semibold text-ink-strong">
                    {b.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}

      {/* 다른 소식 — 세그먼트를 위로 올라가 누르지 않아도 되게 */}
      <SidebarCard title={t('newsSidebarOther')} Icon={SparkleIcon}>
        <div className="flex flex-col gap-1.5">
          {SECTIONS.filter(sec => sec.key !== section).map(sec => (
            <button
              key={sec.key}
              type="button"
              onClick={() => onSectionChange(sec.key)}
              className="flex items-center gap-2.5 h-12 px-3.5 rounded-xl border border-[var(--card-border)] text-[15.5px] font-bold text-ink-strong hover:text-brand hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] transition-colors"
            >
              <sec.Icon width={19} height={19} className="shrink-0 text-brand" />
              {t(sec.labelKey)}
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
  <section className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-5">
    <p className="flex items-center gap-1.5 mb-3 text-[14px] font-bold tracking-[0.02em] text-gray-600 dark:text-white/60">
      <Icon width={17} height={17} className="shrink-0 text-brand" />
      {title}
    </p>
    {children}
  </section>
)

// ── Skeleton / Empty ─────────────────────────────
/** 디지털 주보 — 모두에게 넘겨보기, 관리자는 편집 화면(인라인 편집·PC 편집기)으로 바꿔 볼 수 있다 */
const DigitalBulletinTab = () => {
  const { t } = useLanguage()
  const { data, isLoading } = useDigitalBulletin()
  const isAdmin = can('content:manage')
  const [mode, setMode] = useState<'read' | 'edit'>('read')

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="h-[520px] rounded-3xl bg-gray-200/70 dark:bg-white/[0.06] animate-pulse" />
      </div>
    )
  }
  return (
    <>
      {isAdmin && (
        <div className="px-4 lg:px-6 mb-3 flex justify-end">
          <div className="inline-flex p-1 rounded-full bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07]">
            {(['read', 'edit'] as const).map(m => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={[
                  'px-3.5 h-8 lg:h-9 rounded-full text-[12.5px] lg:text-[14px] font-bold transition-colors',
                  mode === m ? 'bg-brand text-white' : 'text-gray-600 dark:text-white/60 hover:text-brand',
                ].join(' ')}
              >
                {t(m === 'read' ? 'newsStoryReadView' : 'newsStoryEditView')}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === 'edit' && isAdmin ? <DigitalBulletin /> : <BulletinStory data={data} />}
    </>
  )
}

// BulletinShelf 와 같은 뼈대 — 히어로(lg 가로 분할) + 커버플로우 세 장
const SkeletonCards = () => (
  <div>
    <div className="h-[520px] lg:h-[404px] rounded-[1.625rem] bg-gray-200/70 dark:bg-white/[0.06] animate-pulse" />
    <div className="mt-7 lg:mt-9 h-6 w-24 rounded-lg bg-gray-200/70 dark:bg-white/[0.06] animate-pulse" />
    <div className="flex justify-center items-center gap-3 pt-6 pb-12">
      <div className="w-[100px] h-[150px] lg:w-[128px] lg:h-[190px] rounded-[10px] bg-gray-200/50 dark:bg-white/[0.04] animate-pulse" />
      <div className="w-[132px] h-[196px] lg:w-[168px] lg:h-[250px] rounded-[10px] bg-gray-200/70 dark:bg-white/[0.06] animate-pulse" />
      <div className="w-[100px] h-[150px] lg:w-[128px] lg:h-[190px] rounded-[10px] bg-gray-200/50 dark:bg-white/[0.04] animate-pulse" />
    </div>
  </div>
)

const ErrorState = () => {
  const { t } = useLanguage()
  return (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3">
      <SignalIcon width={28} height={28} />
    </div>
    <p className="text-ink-strong text-[14.5px] font-bold mb-1">
      {t('newsBulletinErrorTitle')}
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      {t('newsBulletinErrorDesc')}
    </p>
  </div>
  )
}

const EmptyState = () => {
  const { t } = useLanguage()
  return (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3">
      <BulletinIcon width={28} height={28} />
    </div>
    <p className="text-ink-strong text-[14.5px] font-bold mb-1">
      {t('newsBulletinEmptyTitle')}
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      {t('newsBulletinEmptyDesc')}
    </p>
  </div>
  )
}

export default News
