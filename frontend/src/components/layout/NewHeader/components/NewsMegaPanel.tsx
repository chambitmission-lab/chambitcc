import { useState, type ReactNode } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'
import { useNewsList } from '../../../../hooks/useNews'
import { useNoticeArchive } from '../../../../hooks/useNotifications'
import { useBulletins } from '../../../../hooks/useBulletins'
import { useNewFamilyPosts } from '../../../../hooks/useNewFamily'
import { useEventAlbumPosts } from '../../../../hooks/useEventAlbum'
import { useOffering } from '../../../../hooks/useOffering'
import { accountText } from '../../../../types/offering'
import { tokenStore } from '../../../../utils/tokenStore'
import { formatDotDate, relativeDayLabel } from '../../../../utils/dateUtils'
import { preloadRoute } from '../../../../utils/routePreload'
import {
  AlbumIcon,
  BulletinIcon,
  MegaphoneIcon,
  NoticeBoardIcon,
  OfferingBoxIcon,
  PinIcon,
  SproutIcon,
} from '../../../../pages/News/components/NewsIcons'

// 헤더 "소식" 메가 패널 — 왼쪽은 /news 의 6개 탭, 오른쪽은 호버한 탭의 실제 최신 글 미리보기.
// 소식이 단독 링크였을 땐 공지·주보·새가족·행사·헌금 탭이 있다는 걸 눌러봐야 알았다.
// 미리보기는 활성 탭 하나만 마운트한다 — 백엔드가 직렬 처리라 6개를 한꺼번에 부르면 손해고,
// 훅·쿼리 키를 /news 섹션과 그대로 공유해 여기서 본 글은 소식 화면에서 다시 받지 않는다.

type TabKey = 'news' | 'notice' | 'bulletin' | 'new-family' | 'event-album' | 'offering'

const TABS: {
  key: TabKey
  path: string
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
  labelKey: keyof Translation
  descKey: keyof Translation
}[] = [
  { key: 'news', path: '/news', Icon: MegaphoneIcon, labelKey: 'newsTabNews', descKey: 'navNewsMenuDescNews' },
  { key: 'notice', path: '/news?tab=notice', Icon: NoticeBoardIcon, labelKey: 'newsTabNotice', descKey: 'navNewsMenuDescNotice' },
  { key: 'bulletin', path: '/news?tab=bulletin', Icon: BulletinIcon, labelKey: 'newsTabBulletin', descKey: 'navNewsMenuDescBulletin' },
  { key: 'new-family', path: '/news?tab=new-family', Icon: SproutIcon, labelKey: 'newsTabNewFamily', descKey: 'navNewsMenuDescNewFamily' },
  { key: 'event-album', path: '/news?tab=event-album', Icon: AlbumIcon, labelKey: 'newsTabEventAlbum', descKey: 'navNewsMenuDescEventAlbum' },
  { key: 'offering', path: '/news?tab=offering', Icon: OfferingBoxIcon, labelKey: 'newsTabOffering', descKey: 'navNewsMenuDescOffering' },
]

/** 소식 화면이면 그 탭을 처음 펼친다 — 밖에선 매주 새로 올라오는 주보부터(소식 게시판은 비어 있을 때가 많다) */
const tabFromLocation = (pathname: string, search: string): TabKey => {
  if (pathname !== '/news') return 'bulletin'
  const tab = new URLSearchParams(search).get('tab')
  return TABS.find((x) => x.key === tab)?.key ?? 'news'
}

interface Props {
  pathname: string
  search: string
  go: (to: string) => void
}

const NewsMegaPanel = ({ pathname, search, go }: Props) => {
  const { t } = useLanguage()
  const [active, setActive] = useState<TabKey>(() => tabFromLocation(pathname, search))
  const here = pathname === '/news' ? (TABS.find((x) => x.key === new URLSearchParams(search).get('tab'))?.key ?? 'news') : null
  const current = TABS.find((x) => x.key === active) ?? TABS[0]

  return (
    <div className="w-[calc(800px*var(--hd,1))] grid grid-cols-[calc(240px*var(--hd,1))_1fr] gap-1.5 rounded-2xl p-2 bg-white dark:bg-[#1c1c1e] ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.35)]">
      <div>
        {TABS.map((tab) => {
          const on = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              role="menuitem"
              onClick={() => go(tab.path)}
              onMouseEnter={() => {
                setActive(tab.key)
                void preloadRoute('/news')
              }}
              onFocus={() => setActive(tab.key)}
              className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-120 ${
                on ? 'bg-[var(--brand-soft)]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              }`}
            >
              <span className={`w-[calc(38px*var(--hd,1))] h-[calc(38px*var(--hd,1))] rounded-xl flex items-center justify-center shrink-0 ${
                on ? 'bg-[var(--brand-soft-strong)] text-brand' : 'bg-black/[0.04] dark:bg-white/[0.07] text-ink'
              }`}>
                <tab.Icon className="w-[20px] h-[20px]" />
              </span>
              <span className="min-w-0">
                <span className={`block text-[length:calc(15.5px*var(--hd,1))] leading-tight ${on || here === tab.key ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>
                  {t(tab.labelKey)}
                </span>
                <span className="block mt-1 text-[length:calc(13px*var(--hd,1))] leading-snug text-ink-muted truncate">
                  {t(tab.descKey)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="min-w-0 rounded-xl bg-black/[0.025] dark:bg-white/[0.04] px-5 py-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[length:calc(13.5px*var(--hd,1))] font-semibold text-ink-muted">{t(current.labelKey)}</span>
          <button
            type="button"
            onClick={() => go(current.path)}
            className="text-[length:calc(13.5px*var(--hd,1))] font-semibold text-brand hover:underline underline-offset-2"
          >
            {t('navNewsMenuSeeAll')} →
          </button>
        </div>
        {/* key 로 탭마다 새로 마운트 — 활성 탭의 쿼리만 돈다 */}
        <Preview key={active} tab={active} go={go} />
      </div>
    </div>
  )
}

const Preview = ({ tab, go }: { tab: TabKey; go: (to: string) => void }) => {
  switch (tab) {
    case 'news':
      return <NewsPreview go={go} />
    case 'notice':
      return <NoticePreview go={go} />
    case 'bulletin':
      return <BulletinPreview go={go} />
    case 'new-family':
      return <NewFamilyPreview go={go} />
    case 'event-album':
      return <EventAlbumPreview go={go} />
    case 'offering':
      return <OfferingPreview go={go} />
  }
}

// ── 공통 조각 ─────────────────────────────────────────

const useDayLabel = () => {
  const { t } = useLanguage()
  return (iso: string | null | undefined) =>
    iso ? relativeDayLabel(iso, { today: t('newsNoticeToday'), yesterday: t('newsNoticeYesterday') }, formatDotDate) : ''
}

const Row = ({ onClick, children, date }: { onClick: () => void; children: ReactNode; date?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-2.5 py-2.5 text-left border-b border-black/[0.05] dark:border-white/[0.06] last:border-0 group"
  >
    <span className="min-w-0 flex-1 flex items-center gap-2 text-[length:calc(15px*var(--hd,1))] text-ink-strong font-medium group-hover:text-brand transition-colors">
      {children}
    </span>
    {date && <span className="shrink-0 text-[length:calc(12.5px*var(--hd,1))] text-ink-muted tabular-nums">{date}</span>}
  </button>
)

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="shrink-0 text-[length:calc(11.5px*var(--hd,1))] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-white/[0.08] text-ink ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
    {children}
  </span>
)

const Skeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="flex flex-col gap-3 pt-2" aria-hidden>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="h-5 rounded-md bg-black/[0.05] dark:bg-white/[0.06] animate-pulse" style={{ width: `${88 - i * 14}%` }} />
    ))}
  </div>
)

const Empty = ({ children }: { children: ReactNode }) => (
  <div className="flex-1 flex items-center justify-center py-8 text-[length:calc(14px*var(--hd,1))] text-ink-muted">{children}</div>
)

/** 사진 썸네일 3칸 — 새가족·행사 앨범 공용 */
const ThumbGrid = ({ items }: { items: { id: number; src: string | null; title: string; sub: string; onClick: () => void }[] }) => (
  <div className="grid grid-cols-3 gap-2.5 pt-1">
    {items.map((it) => (
      <button key={it.id} type="button" onClick={it.onClick} className="min-w-0 text-left group">
        <span className="block aspect-square rounded-xl overflow-hidden bg-black/[0.05] dark:bg-white/[0.06]">
          {it.src && (
            <img src={it.src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
          )}
        </span>
        <span className="block mt-1.5 text-[length:calc(14px*var(--hd,1))] font-semibold text-ink-strong truncate group-hover:text-brand transition-colors">{it.title}</span>
        <span className="block text-[length:calc(12.5px*var(--hd,1))] text-ink-muted truncate">{it.sub}</span>
      </button>
    ))}
  </div>
)

const LoginGate = ({ go }: { go: (to: string) => void }) => {
  const { t } = useLanguage()
  return (
    <Empty>
      <button type="button" onClick={() => go('/login')} className="font-semibold text-brand hover:underline underline-offset-2">
        {t('navNewsMenuLoginHint')}
      </button>
    </Empty>
  )
}

// ── 탭별 미리보기 ─────────────────────────────────────

const NewsPreview = ({ go }: { go: (to: string) => void }) => {
  const { t } = useLanguage()
  const day = useDayLabel()
  const { items, isLoading, isError } = useNewsList()
  if (isLoading) return <Skeleton rows={4} />
  if (isError) return <Empty>{t('navNewsMenuError')}</Empty>
  if (!items.length) return <Empty>{t('navNewsMenuEmpty')}</Empty>
  return (
    <div>
      {items.slice(0, 4).map((n) => (
        <Row key={n.id} onClick={() => go(`/news?post=${n.id}`)} date={day(n.published_at ?? n.created_at)}>
          {n.is_pinned && <PinIcon className="w-4 h-4 shrink-0 text-brand" />}
          {n.category && <Chip>{n.category}</Chip>}
          <span className="truncate">{n.title}</span>
        </Row>
      ))}
    </div>
  )
}

const NoticePreview = ({ go }: { go: (to: string) => void }) => {
  const { t } = useLanguage()
  const day = useDayLabel()
  const { data, isLoading, isError } = useNoticeArchive()
  const notices = data?.pages.flatMap((p) => p.notifications) ?? []
  if (isLoading) return <Skeleton rows={4} />
  if (isError) return <Empty>{t('navNewsMenuError')}</Empty>
  if (!notices.length) return <Empty>{t('navNewsMenuEmpty')}</Empty>
  return (
    <div>
      {notices.slice(0, 4).map((n) => (
        <Row key={n.id} onClick={() => go('/news?tab=notice')} date={day(n.created_at)}>
          <span className="truncate">{n.title}</span>
        </Row>
      ))}
    </div>
  )
}

const BulletinPreview = ({ go }: { go: (to: string) => void }) => {
  const { t } = useLanguage()
  const { data: list = [], isLoading, isError } = useBulletins()
  if (isLoading) return <Skeleton />
  if (isError) return <Empty>{t('navNewsMenuError')}</Empty>
  const [latest, ...rest] = list
  if (!latest) return <Empty>{t('navNewsMenuEmpty')}</Empty>
  const open = (id: number) => go(`/news?tab=bulletin&b=${id}`)
  return (
    <div className="flex gap-4 pt-1">
      <button type="button" onClick={() => open(latest.id)} className="shrink-0 group">
        <span className="block w-[calc(112px*var(--hd,1))] aspect-[3/4] rounded-lg overflow-hidden bg-black/[0.05] dark:bg-white/[0.06] ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-[0_8px_20px_-12px_rgba(0,0,0,0.4)]">
          {latest.thumbnail_url && (
            <img src={latest.thumbnail_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
          )}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => open(latest.id)} className="block text-left group">
          <span className="block text-[length:calc(12.5px*var(--hd,1))] font-semibold text-brand">{formatDotDate(latest.bulletin_date)}</span>
          <span className="block mt-0.5 text-[length:calc(16px*var(--hd,1))] font-bold text-ink-strong group-hover:text-brand transition-colors line-clamp-2">{latest.title}</span>
          {latest.page_count ? (
            <span className="block mt-1 text-[length:calc(12.5px*var(--hd,1))] text-ink-muted">
              {t('navNewsMenuPages').replace('{n}', String(latest.page_count))}
            </span>
          ) : null}
        </button>
        {rest.length > 0 && (
          <div className="mt-2">
            {rest.slice(0, 2).map((b) => (
              // 주보 제목이 대개 날짜라 오른쪽 날짜는 생략한다
              <Row key={b.id} onClick={() => open(b.id)}>
                <span className="truncate">{b.title}</span>
              </Row>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const NewFamilyPreview = ({ go }: { go: (to: string) => void }) => {
  const { t } = useLanguage()
  const isLoggedIn = !!tokenStore.getAccess()
  const { posts, isLoading, isError } = useNewFamilyPosts(10, isLoggedIn)
  if (!isLoggedIn) return <LoginGate go={go} />
  if (isLoading) return <Skeleton />
  if (isError) return <Empty>{t('navNewsMenuError')}</Empty>
  if (!posts.length) return <Empty>{t('navNewsMenuEmpty')}</Empty>
  return (
    <ThumbGrid
      items={posts.slice(0, 3).map((p) => ({
        id: p.id,
        src: p.cover_url,
        title: p.member_name,
        sub: [p.group_name, formatDotDate(p.registered_at)].filter(Boolean).join(' · '),
        onClick: () => go('/news?tab=new-family'),
      }))}
    />
  )
}

const EventAlbumPreview = ({ go }: { go: (to: string) => void }) => {
  const { t } = useLanguage()
  const isLoggedIn = !!tokenStore.getAccess()
  // 필터 없는 목록 — EventAlbumSection 기본 상태와 같은 쿼리 키
  const { posts, isLoading, isError } = useEventAlbumPosts({}, 10, isLoggedIn)
  if (!isLoggedIn) return <LoginGate go={go} />
  if (isLoading) return <Skeleton />
  if (isError) return <Empty>{t('navNewsMenuError')}</Empty>
  if (!posts.length) return <Empty>{t('navNewsMenuEmpty')}</Empty>
  return (
    <ThumbGrid
      items={posts.slice(0, 3).map((p) => ({
        id: p.id,
        src: p.cover_url,
        title: p.title,
        sub: `${formatDotDate(p.event_date)} · ${t('navNewsMenuPhotos').replace('{n}', String(p.photo_count))}`,
        onClick: () => go(`/news?tab=event-album&post=${p.id}`),
      }))}
    />
  )
}

const OfferingPreview = ({ go }: { go: (to: string) => void }) => {
  const { t, language } = useLanguage()
  const { accounts, isLoading, isError } = useOffering()
  if (isLoading) return <Skeleton />
  if (isError) return <Empty>{t('navNewsMenuError')}</Empty>
  if (!accounts.length) return <Empty>{t('navNewsMenuEmpty')}</Empty>
  return (
    <div>
      {accounts.slice(0, 4).map((a) => (
        <Row key={a.id} onClick={() => go('/news?tab=offering')}>
          <Chip>{accountText(a, 'label', language)}</Chip>
          <span className="truncate">
            {accountText(a, 'bank', language)} <span className="tabular-nums">{a.account_number}</span>
          </span>
        </Row>
      ))}
    </div>
  )
}

export default NewsMegaPanel
