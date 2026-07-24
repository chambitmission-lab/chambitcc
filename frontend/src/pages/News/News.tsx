import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getBulletins, getBulletinDetail } from '../../api/bulletin'
import { showToast } from '../../utils/toast'
import type { Bulletin } from '../../types/bulletin'
import InstagramBulletinViewer from './components/InstagramBulletinViewer'
import DigitalBulletin from './components/DigitalBulletin'
import NewFamilySection from './components/NewFamilySection'

/** 최상위 그룹 — 소식 허브 */
type SectionKey = 'bulletin' | 'new-family'
/** 주보 하위 탭 */
type BulletinTabKey = 'image' | 'digital'

const SECTIONS: { key: SectionKey; emoji: string; label: string }[] = [
  { key: 'bulletin', emoji: '📖', label: '주보' },
  { key: 'new-family', emoji: '🌱', label: '새가족' },
]

const isSectionKey = (value: string | null): value is SectionKey =>
  value === 'bulletin' || value === 'new-family'

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
  const section: SectionKey = isSectionKey(tabParam) ? tabParam : 'bulletin'

  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'view'>('list')
  const [tab, setTab] = useState<BulletinTabKey>('image')

  const handleSectionChange = (next: SectionKey) => {
    // replace — 탭 전환마다 히스토리가 쌓여 뒤로가기가 먹통이 되는 걸 막는다
    setSearchParams(next === 'bulletin' ? {} : { tab: next }, { replace: true })
  }

  useEffect(() => {
    loadBulletins()
  }, [])

  const loadBulletins = async () => {
    try {
      setLoading(true)
      const data = await getBulletins(0, 20)
      setBulletins(data)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '주보를 불러오는데 실패했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBulletinClick = async (bulletin: Bulletin) => {
    try {
      const detail = await getBulletinDetail(bulletin.id)
      setSelectedBulletin(detail)
      setViewMode('view')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '주보를 불러오는데 실패했습니다', 'error')
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
    <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen pb-20">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-2">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
            NEWS
          </p>
          <h1 className="text-gray-900 dark:text-white text-[26px] font-bold leading-none tracking-[-0.02em]">
            교회소식
          </h1>
          <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2">
            참빛교회의 매주 새 소식을 모았어요
          </p>
        </header>

        {/* 그룹 세그먼트 — 주보 / 새가족 */}
        <div className="px-4 pt-2 pb-1">
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.06]">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => handleSectionChange(s.key)}
                aria-pressed={section === s.key}
                className={[
                  'flex-1 h-10 rounded-xl text-[13px] font-bold transition-all',
                  section === s.key
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_4px_14px_-4px_rgba(168,85,247,0.65)]'
                    : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white',
                ].join(' ')}
              >
                <span className="mr-1">{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 새가족 앨범 */}
        {section === 'new-family' && <NewFamilySection />}

        {/* 주보 하위 탭 pill */}
        {section === 'bulletin' && (
          <div className="px-4 pt-3 pb-1">
            <div className="inline-flex p-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.06]">
              <TabPill active={tab === 'image'} onClick={() => setTab('image')}>
                <span className="mr-1">🖼️</span>
                이미지 주보
              </TabPill>
              <TabPill active={tab === 'digital'} onClick={() => setTab('digital')}>
                <span className="mr-1">📄</span>
                디지털 주보
              </TabPill>
            </div>
          </div>
        )}

        {/* 이미지 주보 */}
        {section === 'bulletin' && tab === 'image' && (
          <div className="px-4 pt-3 pb-8">
            {loading ? (
              <SkeletonCards />
            ) : bulletins.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {/* 최신 주보 hero */}
                {latest && (
                  <FeaturedCard bulletin={latest} onClick={() => handleBulletinClick(latest)} />
                )}

                {/* 나머지 — 컴팩트 카드 */}
                {bulletins.length > 1 && (
                  <div className="pt-1">
                    <p className="text-[12px] font-bold text-gray-500 dark:text-white/55 mb-2 px-1">
                      지난 주보
                    </p>
                    <div className="space-y-2">
                      {bulletins.slice(1).map(b => (
                        <CompactCard
                          key={b.id}
                          bulletin={b}
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
    </div>
  )
}

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
      'px-4 h-9 rounded-full text-[12.5px] font-bold transition-all',
      active
        ? 'bg-brand text-white shadow-[0_4px_14px_-4px_var(--brand-glow)]'
        : 'text-gray-600 dark:text-white/65 hover:text-gray-900 dark:hover:text-white',
    ].join(' ')}
  >
    {children}
  </button>
)

// ── Featured Card (최신 주보 hero) ─────────────────
const FeaturedCard = ({
  bulletin,
  onClick,
}: {
  bulletin: Bulletin
  onClick: () => void
}) => (
  <button type="button" onClick={onClick} className="block w-full text-left group">
    <article className="relative overflow-hidden rounded-3xl bg-card-dark border border-white/[0.06] shadow-[0_18px_44px_-18px_var(--brand-glow)] transition-transform duration-200 group-active:scale-[0.99]">
      {/* 썸네일 */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-500/15 to-sky-500/15">
        {bulletin.thumbnail_url ? (
          <img
            src={bulletin.thumbnail_url}
            alt={bulletin.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[48px]">📰</div>
        )}
        {/* 하단 그라데이션 */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
        {/* 상단 chip들 */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isThisMonth(bulletin.bulletin_date) && (
            <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-brand text-white text-[10.5px] font-bold tracking-wide shadow-[0_4px_12px_-2px_var(--brand-glow)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              최신
            </span>
          )}
          <span className="inline-flex items-center px-2 h-6 rounded-full bg-black/45 backdrop-blur-sm text-white text-[10.5px] font-semibold">
            📄 {bulletin.page_count}P
          </span>
        </div>
        {/* 하단 텍스트 */}
        <div className="absolute inset-x-0 bottom-0 p-4 z-10">
          <p className="text-white/80 text-[11.5px] font-semibold mb-1">
            {formatLongDate(bulletin.bulletin_date)}
          </p>
          <h2 className="text-white text-[18px] font-bold leading-[1.3] tracking-[-0.015em] line-clamp-2 mb-1.5">
            {bulletin.title}
          </h2>
          <div className="flex items-center gap-3 text-white/75 text-[11.5px]">
            <span>👁️ {bulletin.views}</span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-white font-bold">
              읽어보기
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* 설명 */}
      {bulletin.description && (
        <div className="px-4 py-3 border-t border-white/[0.06]">
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
}: {
  bulletin: Bulletin
  onClick: () => void
}) => (
  <button type="button" onClick={onClick} className="block w-full text-left group">
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
            <span className="text-[24px]">📰</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
            {bulletin.title}
          </p>
          <p className="text-[11.5px] text-gray-500 dark:text-white/55 truncate mt-0.5">
            {formatLongDate(bulletin.bulletin_date)}
          </p>
          <div className="flex items-center gap-2.5 text-[11px] text-gray-400 dark:text-white/45 mt-0.5">
            <span>📄 {bulletin.page_count}P</span>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <span>👁️ {bulletin.views}</span>
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

// ── Skeleton / Empty ─────────────────────────────
const SkeletonCards = () => (
  <div className="space-y-3">
    <div className="aspect-[4/3] rounded-3xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="h-[82px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
      />
    ))}
  </div>
)

const EmptyState = () => (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-12 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-3">
      <span className="text-[28px]">📰</span>
    </div>
    <p className="text-gray-900 dark:text-white text-[14.5px] font-bold mb-1">
      아직 등록된 주보가 없어요
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      곧 새로운 주간 소식이 올라올 거예요
    </p>
  </div>
)

export default News
