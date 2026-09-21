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

// 포스터 확대 보기는 탭해야 열린다 — lazy 로 분리 (홈 공지와 같은 청크)
const ImageLightbox = lazy(() => import('../../../components/common/ImageLightbox'))

const formatDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')} (${days[d.getDay()]})`
}

/** 오늘·어제는 날짜 대신 사람 말로 — 방금 올라온 공지라는 게 먼저 읽힌다 */
const formatRelative = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  return formatDate(iso)
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
    <div className="px-4 pt-3 pb-8">
      {/* Hero — 배경 삽화는 news-hero.css(.nh-hero--notice). 소식 탭과 같은 골격이다.
          다크 상단 광택 span 은 두지 않는다 — 삽화 위에 얹히면 뿌옇게 뜬다(소식 세 장과 같은 이유). */}
      <div className="nh-hero nh-hero--notice relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] p-5 mb-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center shadow-[0_6px_18px_-6px_var(--brand-glow)]">
              <NoticeBoardIcon width={23} height={23} />
            </div>
            <div>
              <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">
                NOTICE
              </p>
              <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
                공지사항
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
                공지 등록
              </button>
            )}
          </div>

          {/* max-w 는 삽화와 짝이다 — 풀폭으로 두면 글줄이 양 위로 올라탄다.
              삽화를 다시 뽑아 장면 위치가 바뀌면 이 값도 같이 다시 볼 것. */}
          <p className="max-w-[62%] lg:max-w-[54%] text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
            홈에서 지나간 안내도 여기에 그대로 남아 있어요. 제목을 탭하면 전문을 읽을 수 있습니다.
          </p>
        </div>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <SkeletonRows />
      ) : error ? (
        <EmptyBox
          icon={<SignalIcon width={28} height={28} />}
          title="공지를 불러오지 못했어요"
          desc="네트워크 상태를 확인하고 다시 시도해 주세요"
        />
      ) : notices.length === 0 ? (
        <EmptyBox
          icon={<InboxIcon width={28} height={28} />}
          title="아직 올라온 공지가 없어요"
          desc="교회에서 안내가 올라오면 이곳에 쌓입니다"
        />
      ) : (
        <>
          <p className="px-1 pb-2 text-[11.5px] text-gray-500 dark:text-white/50">
            전체 <span className="font-bold text-ink-strong">{total}</span>건
          </p>
          <div className="space-y-2">
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
            className="px-5 h-10 rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? '불러오는 중...' : '지난 공지 더 보기'}
          </button>
        </div>
      )}

      {zoomSrc && (
        <Suspense fallback={null}>
          <ImageLightbox src={zoomSrc} alt="공지 포스터" onClose={() => setZoomSrc(null)} />
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
        className="relative z-10 w-full flex items-start gap-3 p-3.5 text-left group"
      >
        <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
          <NoticeBoardIcon width={19} height={19} />
        </span>

        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-bold text-gray-400 dark:text-white/40">
              {formatRelative(notice.created_at)}
            </span>
            {notice.image_url && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] text-brand">
                포스터
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[14.5px] font-bold text-ink-strong leading-[1.35] group-hover:text-brand transition-colors">
            {notice.title}
          </span>
          {!expanded && preview && (
            <span className="mt-0.5 block text-[12px] text-gray-500 dark:text-white/50 leading-[1.5] line-clamp-2">
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
        <div className="relative z-10 px-3.5 pb-4 -mt-1">
          <div className="pl-[52px]">
            {notice.image_url && (
              <button
                type="button"
                onClick={() => onZoom(notice.image_url as string)}
                className="group/poster relative block w-full mb-3 rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--surface-inset)]"
                aria-label={`${notice.title} 포스터 크게 보기`}
              >
                {/* 세로로 긴 포스터가 PC에서 화면을 통째로 먹지 않게 높이를 묶는다 */}
                <img
                  src={notice.image_url}
                  alt=""
                  loading="lazy"
                  className="mx-auto block w-auto max-w-full max-h-[min(70vh,560px)] object-contain transition-transform duration-200 group-hover/poster:scale-[1.02]"
                />
                {/* 눌러야 읽힌다는 걸 알려주는 손잡이 — 없으면 그냥 작은 그림으로 끝난다 */}
                <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-[2px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.2-3.2M11 8.5v5M8.5 11h5" />
                  </svg>
                  크게 보기
                </span>
              </button>
            )}

            <NoticeContent source={notice.content} />

            <p className="mt-3 text-[11px] text-gray-400 dark:text-white/40">
              {formatDate(notice.created_at)}
            </p>

            {notice.link_url && (
              <button
                type="button"
                onClick={() => onOpenLink(notice.link_url as string)}
                className="mt-2.5 inline-flex items-center gap-1 h-9 px-4 rounded-full bg-brand text-white text-[12.5px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] hover:bg-brand-dim transition-colors"
              >
                자세히 보기
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
