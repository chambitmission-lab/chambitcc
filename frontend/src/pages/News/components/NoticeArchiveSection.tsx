// 공지 아카이브 섹션 (/news 의 '공지' 탭 본문)
// Single Responsibility: 지난 공지 목록과 본문 펼쳐 읽기
//
// 홈 배너는 "지금 띄울 것"(is_popup + 기간 안 지남)만 보여주고, 알림함은 개인 알림과
// 섞여 있어 지난 안내를 되찾아 읽기 어려웠다. 여기가 공지의 보관함이다 —
// 읽음 상태 없이(알림함의 안 읽음 뱃지와 성격이 다르다) 최신순으로만 쌓는다.
import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoticeArchive } from '../../../hooks/useNotifications'
import NoticeContent from '../../../components/common/NoticeContent'
import '../news-hero.css'
import { noticePreviewText } from '../../../utils/noticeMarkup'
import { NoticeBoardIcon, SignalIcon, InboxIcon } from './NewsIcons'
import type { Notification } from '../../../types/notification'
import { can } from '../../../utils/access'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Translate } from '../../../locales'

// 포스터 확대 보기는 탭해야 열린다 — lazy 로 분리 (홈 공지와 같은 청크)
const ImageLightbox = lazy(() => import('../../../components/common/ImageLightbox'))

const formatDate = (iso: string, t: Translate) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const days = t('newsWeekdays').split(',')
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')} (${days[d.getDay()]})`
}

/** 오늘·어제는 날짜 대신 사람 말로 — 방금 올라온 공지라는 게 먼저 읽힌다 */
const formatRelative = (iso: string, t: Translate) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000)
  if (days <= 0) return t('newsNoticeToday')
  if (days === 1) return t('newsNoticeYesterday')
  return formatDate(iso, t)
}

/**
 * 공지 링크 → 실제 이동 대상.
 * /prayers/:id 는 전용 페이지가 아니라 홈의 기도 상세 모달이라 state로 넘겨야 한다
 * (HomeNotice·NotificationModal 의 resolveTarget 과 같은 규칙).
 */
const resolveTarget = (
  linkUrl: string,
): { path: string; state?: Record<string, unknown> } => {
  const prayer = linkUrl.match(/^\/prayers\/(\d+)$/)
  if (prayer) return { path: '/', state: { openPrayerId: Number(prayer[1]) } }
  return { path: linkUrl }
}

const NoticeArchiveSection = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const admin = can('content:manage')

  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useNoticeArchive()

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)

  const notices = useMemo(
    () => data?.pages.flatMap((page) => page.notifications) ?? [],
    [data],
  )
  const total = data?.pages[0]?.total ?? 0

  return (
    <div className="px-4 pt-3 pb-8 lg:px-6 lg:pt-4">
      {/* Hero — 배경 삽화는 news-hero.css(.nh-hero--notice). 소식 탭과 같은 골격이다.
          다크 상단 광택 span 은 두지 않는다 — 삽화 위에 얹히면 뿌옇게 뜬다(소식 세 장과 같은 이유).
          PC 에서만 카드를 키운다(lg:min-h) — 136px 높이로는 삽화가 손톱만 해서 장면이 안 읽힌다.
          news-hero.css 의 lg 배율(185.7%)과 짝이다. */}
      <div className="nh-hero nh-hero--notice relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] p-5 lg:px-7 lg:min-h-[184px] lg:flex lg:flex-col lg:justify-center mb-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center shadow-[0_6px_18px_-6px_var(--brand-glow)]">
              <NoticeBoardIcon width={23} height={23} />
            </div>
            <div>
              <p className="text-brand text-[10.5px] lg:text-[12.5px] font-bold tracking-[0.12em] uppercase">
                NOTICE
              </p>
              <h2 className="text-ink-strong text-[17px] lg:text-[22px] font-bold tracking-[-0.015em]">
                {t('newsNoticeTitle')}
              </h2>
            </div>
            {/* ★ ml-auto 로 오른쪽 끝에 붙이지 않는다 — 카드가 낮고 넓어서 배경 삽화가
                어느 배율에서든 우상단을 차지하고, 거기 두면 주인공 양 얼굴을 덮는다.
                제목 바로 옆(왼쪽 빈 영역)이 삽화와 안 겹치는 유일한 자리다. */}
            {admin && (
              <button
                type="button"
                onClick={() => navigate('/admin/notifications')}
                className="ml-2 inline-flex items-center gap-1 h-8 px-3 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-glow)] text-brand text-[11.5px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('newsNoticeCreate')}
              </button>
            )}
          </div>

          {/* max-w 는 삽화와 짝이다 — 풀폭으로 두면 글줄이 양 위로 올라탄다.
              삽화를 다시 뽑아 장면 위치가 바뀌면 이 값도 같이 다시 볼 것. */}
          <p className="max-w-[62%] lg:max-w-[60%] text-gray-500 dark:text-white/55 text-[12.5px] lg:text-[15.5px] lg:text-gray-600 leading-[1.6]">
            {t('newsNoticeIntro')}
          </p>
        </div>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <SkeletonRows />
      ) : error ? (
        <EmptyBox
          icon={<SignalIcon width={28} height={28} />}
          title={t('newsNoticeErrorTitle')}
          desc={t('newsNoticeErrorDesc')}
        />
      ) : notices.length === 0 ? (
        <EmptyBox
          icon={<InboxIcon width={28} height={28} />}
          title={t('newsNoticeEmptyTitle')}
          desc={t('newsNoticeEmptyDesc')}
        />
      ) : (
        <>
          <p className="px-1 pb-2 text-[11.5px] lg:text-[15px] lg:pb-3 text-gray-500 dark:text-white/50">
            {t('newsCountPrefix')}
            <span className="font-bold text-ink-strong">{total}</span>
            {t('newsCountSuffix')}
          </p>
          <div className="space-y-2 lg:space-y-3">
            {notices.map((notice) => (
              <NoticeRow
                key={notice.id}
                notice={notice}
                expanded={expandedId === notice.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === notice.id ? null : notice.id))
                }
                onZoom={setZoomSrc}
                onOpenLink={(linkUrl) => {
                  const target = resolveTarget(linkUrl)
                  navigate(target.path, target.state ? { state: target.state } : undefined)
                }}
              />
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
            className="px-5 h-10 lg:h-12 lg:px-7 lg:text-[16px] rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? t('newsLoadingMore') : t('newsNoticeLoadMore')}
          </button>
        </div>
      )}

      {zoomSrc && (
        <Suspense fallback={null}>
          <ImageLightbox src={zoomSrc} alt={t('newsNoticePosterAlt')} onClose={() => setZoomSrc(null)} />
        </Suspense>
      )}
    </div>
  )
}

// ── 공지 한 줄 (탭하면 본문 펼침) ────────────────────────
const NoticeRow = ({
  notice,
  expanded,
  onToggle,
  onZoom,
  onOpenLink,
}: {
  notice: Notification
  expanded: boolean
  onToggle: () => void
  onZoom: (src: string) => void
  onOpenLink: (linkUrl: string) => void
}) => {
  const { t } = useLanguage()
  const preview = noticePreviewText(notice.content)

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border shadow-sm',
        'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] transition-colors',
        expanded ? 'border-[var(--brand-soft-strong)]' : 'border-[var(--card-border)]',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="relative z-10 w-full flex items-start gap-3 p-3.5 lg:gap-4 lg:p-5 text-left group"
      >
        <span className="shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
          <NoticeBoardIcon width={19} height={19} />
        </span>

        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-[10.5px] lg:text-[14px] font-bold text-gray-400 dark:text-white/40 lg:text-gray-500 lg:dark:text-white/55">
              {formatRelative(notice.created_at, t)}
            </span>
            {notice.image_url && (
              <span className="text-[9.5px] lg:text-[12.5px] lg:px-2 font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] text-brand">
                {t('newsNoticePoster')}
              </span>
            )}
          </span>
          <span className="mt-0.5 lg:mt-1 block text-[14.5px] lg:text-[19px] font-bold text-ink-strong leading-[1.35] group-hover:text-brand transition-colors">
            {notice.title}
          </span>
          {!expanded && preview && (
            <span className="mt-0.5 lg:mt-1.5 block text-[12px] lg:text-[15.5px] text-gray-500 dark:text-white/50 lg:text-gray-600 lg:dark:text-white/65 leading-[1.5] line-clamp-2">
              {preview}
            </span>
          )}
        </span>

        <span className="shrink-0 mt-1 text-gray-400 dark:text-white/35">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="relative z-10 px-3.5 pb-4 -mt-1 lg:px-5 lg:pb-6">
          <div className="pl-[52px] lg:pl-16">
            {notice.image_url && (
              <button
                type="button"
                onClick={() => onZoom(notice.image_url as string)}
                className="group/poster relative block w-full mb-3 rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--surface-inset)]"
                aria-label={t('newsNoticePosterZoom').replace('{title}', notice.title)}
              >
                {/* 세로로 긴 포스터가 PC에서 화면을 통째로 먹지 않게 높이를 묶는다 */}
                <img
                  src={notice.image_url}
                  alt=""
                  loading="lazy"
                  className="mx-auto block w-auto max-w-full max-h-[min(calc(70vh/var(--az,1)),560px)] lg:max-h-[min(calc(80vh/var(--az,1)),760px)] object-contain transition-transform duration-200 group-hover/poster:scale-[1.02]"
                />
                {/* 눌러야 읽힌다는 걸 알려주는 손잡이 — 없으면 그냥 작은 그림으로 끝난다 */}
                <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] lg:text-[14px] lg:px-3.5 lg:py-1.5 font-semibold text-white backdrop-blur-[2px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.2-3.2M11 8.5v5M8.5 11h5" />
                  </svg>
                  {t('newsNoticeZoom')}
                </span>
              </button>
            )}

            {/* PC 는 읽기 칼럼 크기(18px·줄 폭 제한) — news-hero.css .news-notice-body */}
            <NoticeContent source={notice.content} className="news-notice-body" />

            <p className="mt-3 text-[11px] lg:text-[14px] lg:mt-4 text-gray-400 dark:text-white/40">
              {formatDate(notice.created_at, t)}
            </p>

            {notice.link_url && (
              <button
                type="button"
                onClick={() => onOpenLink(notice.link_url as string)}
                className="mt-2.5 inline-flex items-center gap-1 h-9 px-4 lg:h-12 lg:px-6 lg:text-[16px] lg:mt-3.5 rounded-full bg-brand text-white text-[12.5px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] hover:bg-brand-dim transition-colors"
              >
                {t('newsNoticeDetail')}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 작은 조각들 ────────────────────────────────────────
const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="h-[88px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
      />
    ))}
  </div>
)

const EmptyBox = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) => (
  <div className="rounded-2xl border border-[var(--card-border)] bg-white/80 dark:bg-card-dark px-6 py-12 text-center">
    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-2.5">
      {icon}
    </span>
    <p className="text-[13.5px] font-bold text-ink-strong mb-1">{title}</p>
    <p className="text-[12px] text-gray-500 dark:text-white/55">{desc}</p>
  </div>
)

export default NoticeArchiveSection
