// 공지(홈 팝업·알림함) 관리 — 관리 데스크(2026-11-27, 교회소식·소그룹·공동 기도제목·교육 데스크와 같은 문법)
//
// 예전 화면은 📢 카드 행 + 펼침 + 오른쪽 칩 묶음이라 "지금 홈에 무엇이 떠 있는지"가 안 보였다.
// 관리자가 궁금한 건 하나 — 지금 성도가 홈을 열면 어떤 팝업이 뜨나. 그래서
//   PC(lg+)  왼쪽 목록(지금 뜨는 팝업 띠·검색·세그먼트, 행마다 팝업 상태) / 오른쪽 상세(공개 스위치·
//            팝업 상태 카드·성도 화면 미리보기 + 홈 팝업 그대로 열어 보기) — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 기존 NotificationComposer(2단 모달). 데이터·액션은 NotificationManagement 가 쥔다.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Notification } from '../../../types/notification'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import NoticeContent from '../../../components/common/NoticeContent'
import NoticeSheet from '../../../components/common/NoticeSheet'
import { formatDotDateTime } from '../../../utils/dateUtils'
import { noticePlain, popupDaysLeft, popupState, type NoticeSeg, type PopupState } from './notificationDeskUtils'

const WD = ['일', '월', '화', '수', '목', '금', '토']
const mdw = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${WD[d.getDay()]})`
}

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

// ── 아이콘 ───────────────────────────────────────────────

const I = ({ d, size = 16, className = '' }: { d: ReactNode; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
)
const IC = {
  search: <><circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.6-4.6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  back: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6l-1.4 14a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 6" /><path d="M9 6V4h6v2" /></>,
  eye: <><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>,
  news: <><path d="M4 5.5h13v13a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" /><path d="M17 9h3v9.5a2 2 0 0 1-2 2" /><path d="M7.5 9h6M7.5 12.5h6M7.5 16h4" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>,
  photo: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
}

// ── 작은 조각 ────────────────────────────────────────────

const Switch = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`relative shrink-0 w-11 h-[26px] rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'}`}
  >
    <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
  </button>
)

const Badge = ({ tone, children }: { tone: 'live' | 'muted' | 'soft'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center gap-1 shrink-0 h-[22px] px-2 rounded-md text-[12px] font-bold ${
      tone === 'live'
        ? 'bg-brand text-white'
        : tone === 'soft'
          ? 'bg-[var(--brand-soft-strong)] text-brand'
          : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

const PopupBadge = ({ state }: { state: PopupState }) =>
  state === 'live' ? (
    <Badge tone="live">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      팝업 중
    </Badge>
  ) : state === 'ended' ? (
    <Badge tone="muted">팝업 끝남</Badge>
  ) : null

const TextBtn = ({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition ${
      danger
        ? 'text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07]'
    }`}
  >
    <I d={icon} size={16} />
    <span>{label}</span>
  </button>
)

// ── 지금 홈에 뜨는 팝업 ─────────────────────────────────

const LivePopupStrip = ({ live, active, onClick }: { live: Notification[]; active: boolean; onClick: () => void }) => {
  const has = live.length > 0
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!has}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${
        !has
          ? 'bg-gray-50 dark:bg-white/[0.04] cursor-default'
          : active
            ? 'bg-[var(--brand-soft-strong)] ring-1 ring-[var(--brand-glow)]'
            : 'bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)]'
      }`}
    >
      <span className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${has ? 'bg-brand text-white' : 'bg-white dark:bg-white/[0.08] text-gray-400 dark:text-white/40'}`}>
        <I d={IC.phone} size={19} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-bold text-ink-strong">
          {has ? `지금 홈에 팝업 ${live.length}개가 떠요` : '지금 홈에 뜨는 팝업이 없어요'}
        </span>
        <span className="block text-[13px] text-gray-600 dark:text-white/60 truncate">
          {has
            ? active
              ? '팝업만 보는 중 — 다시 누르면 전체'
              : live.map((n) => n.title).join(' · ')
            : '공지를 쓸 때 "홈 팝업으로 띄우기"를 켜면 여기 나타나요'}
        </span>
      </span>
      {has && (
        <span className="shrink-0 text-brand">
          <I d={active ? IC.close : IC.chevron} size={18} />
        </span>
      )}
    </button>
  )
}

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ notice, active, onClick }: { notice: Notification; active: boolean; onClick: () => void }) => {
  const d = new Date(notice.created_at)
  const state = popupState(notice)
  const linkedNews = notice.link_url?.startsWith('/news')
  return (
    <button
      id={`notice-row-${notice.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className={`shrink-0 w-[52px] text-center pt-0.5 ${notice.is_active ? '' : 'opacity-50'}`}>
        <span className={`block text-[26px] leading-none font-extrabold tabular-nums tracking-tight ${active ? 'lg:text-brand text-ink-strong' : 'text-ink-strong'}`}>
          {d.getDate()}
        </span>
        <span className="block mt-1 whitespace-nowrap text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
          {d.getMonth() + 1}월 · {WD[d.getDay()]}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <PopupBadge state={state} />
          <span className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${notice.is_active ? 'text-ink-strong' : 'text-gray-500 dark:text-white/50'}`}>
            {notice.title}
          </span>
        </span>
        <span className="block mt-1 truncate text-[13.5px] text-gray-600 dark:text-white/60">{noticePlain(notice.content)}</span>
        {(!notice.is_active || linkedNews || notice.image_url) && (
          <span className="mt-1.5 flex items-center gap-2 text-[13px] text-gray-500 dark:text-white/55">
            {!notice.is_active && <Badge tone="muted">비공개</Badge>}
            {linkedNews && <Badge tone="soft">소식 연결</Badge>}
            {notice.image_url && (
              <span className="inline-flex items-center gap-1">
                <I d={IC.photo} size={14} />
                포스터
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1 px-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-[84px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 팝업 상태 카드 ───────────────────────────────────────

const PopupCard = ({ notice, onEdit }: { notice: Notification; onEdit: () => void }) => {
  const state = popupState(notice)
  const left = popupDaysLeft(notice)
  const until = notice.popup_until ? mdw(notice.popup_until) : null

  const [title, sub] =
    state === 'live'
      ? [
          '지금 홈을 열면 전면 팝업으로 떠요',
          until ? `${until}까지 · ${left === 0 ? '오늘 끝나요' : `${left}일 남음`}` : '종료일 없이 계속 떠요 — 행사가 끝나면 꺼 주세요',
        ]
      : state === 'ended'
        ? ['팝업 기간이 끝났어요', `${until}에 끝났어요 · 알림함에는 그대로 있어요`]
        : state === 'off'
          ? ['팝업으로 설정했지만 비공개라 안 떠요', '위 스위치를 켜면 바로 홈에 떠요']
          : ['알림함에만 있어요', '홈 전면 팝업으로 띄우려면 수정에서 켜요']

  return (
    <div
      className={`rounded-2xl px-4 py-3.5 flex items-center gap-3 ${
        state === 'live' ? 'bg-[var(--brand-soft)]' : state === 'off' ? 'bg-amber-50 dark:bg-amber-400/10' : 'bg-gray-50 dark:bg-white/[0.04]'
      }`}
    >
      <span
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          state === 'live' ? 'bg-brand text-white' : 'bg-white dark:bg-white/[0.08] text-gray-500 dark:text-white/55'
        }`}
      >
        <I d={state === 'none' ? IC.bell : IC.phone} size={18} />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-[14.5px] font-bold ${state === 'off' ? 'text-amber-900 dark:text-amber-100' : 'text-ink-strong'}`}>{title}</span>
        <span className="block text-[13px] text-gray-600 dark:text-white/60 break-keep">{sub}</span>
      </span>
      {(state === 'none' || state === 'ended') && (
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 h-9 px-3 rounded-xl bg-white dark:bg-white/10 text-[13.5px] font-bold text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/15 transition"
        >
          {state === 'ended' ? '기간 늘리기' : '팝업 켜기'}
        </button>
      )}
    </div>
  )
}

// ── 상세 ─────────────────────────────────────────────────

export interface NoticeDeskActions {
  onEdit: (n: Notification) => void
  onTogglePublished: (n: Notification) => void
  onDelete: (n: Notification) => void
  onOpenLink: (n: Notification) => void
}

const Detail = ({
  notice,
  onClose,
  onPreviewPopup,
  ...a
}: NoticeDeskActions & { notice: Notification; onClose?: () => void; onPreviewPopup: () => void }) => {
  const edited = notice.updated_at && notice.updated_at !== notice.created_at
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <div className="flex items-center gap-2.5 mr-1">
          <Switch on={notice.is_active} onClick={() => a.onTogglePublished(notice)} label="성도에게 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${notice.is_active ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>
            {notice.is_active ? '공개 중' : '비공개'}
          </span>
        </div>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.phone} label="홈 팝업으로 보기" onClick={onPreviewPopup} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(notice)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(notice)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-5 pt-5 pb-8 space-y-4">
          <PopupCard notice={notice} onEdit={() => a.onEdit(notice)} />

          {!notice.is_active && notice.is_popup !== true && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 text-[14px] font-medium px-4 py-2.5 break-keep">
              아직 성도들에게 안 보여요. 위 스위치를 켜면 알림함과 /news 공지 탭에 올라가요.
            </p>
          )}

          <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06] max-w-[640px]">
            {(
              [
                ['등록', formatDotDateTime(notice.created_at)],
                ...(edited ? ([['수정', formatDotDateTime(notice.updated_at as string)]] as const) : []),
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                <dd className="text-[14.5px] font-semibold text-ink-strong tabular-nums">{v}</dd>
              </div>
            ))}
            {notice.link_url && (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[14px] text-gray-500 dark:text-white/55">누르면 이동</dt>
                <dd className="min-w-0">
                  <button type="button" onClick={() => a.onOpenLink(notice)} className="inline-flex items-center gap-1.5 max-w-full text-[14.5px] font-semibold text-brand hover:underline underline-offset-2">
                    <I d={notice.link_url.startsWith('/news') ? IC.news : IC.link} size={15} className="shrink-0" />
                    <span className="truncate">{notice.link_url.startsWith('/news') ? '교회소식 게시판 원문' : notice.link_url}</span>
                  </button>
                </dd>
              </div>
            )}
          </dl>

          <div>
            <div className="mb-2.5 flex items-center justify-between gap-2 max-w-[640px]">
              <span className="flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
                <I d={IC.eye} size={15} />
                성도에게 이렇게 보여요
              </span>
              <button type="button" onClick={onPreviewPopup} className="xl:hidden inline-flex items-center gap-1 text-[13px] font-bold text-brand">
                <I d={IC.phone} size={14} />
                홈 팝업으로 보기
              </button>
            </div>
            <article className="max-w-[640px] rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] overflow-hidden">
              {notice.image_url && (
                <img src={notice.image_url} alt="" loading="lazy" className="w-full max-h-[420px] object-cover bg-gray-100 dark:bg-white/[0.04]" />
              )}
              <div className="px-5 pt-5 pb-6">
                <p className="text-[13px] font-bold text-brand">공지 · {mdw(notice.created_at)}</p>
                <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.02em] text-ink-strong leading-snug break-keep">{notice.title}</h2>
                <div className="mt-4">
                  <NoticeContent source={notice.content} />
                </div>
              </div>
            </article>
          </div>

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDelete(notice)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({
  notice,
  onClose,
  ...rest
}: NoticeDeskActions & { notice: Notification; onClose: () => void; onPreviewPopup: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail notice={notice} onClose={onClose} {...rest} />
    </div>
  )
}

/** 홈 팝업 그대로 — HomeNotice 와 같은 NoticeSheet, 버튼은 닫기만 */
const PopupPreview = ({ notice, onClose }: { notice: Notification; onClose: () => void }) => {
  useModalBackButton(onClose)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <NoticeSheet
      notice={notice}
      kicker="공지 · 미리보기"
      onClose={onClose}
      onZoom={(src) => window.open(src, '_blank', 'noopener')}
      primaryLabel="확인"
      onPrimary={onClose}
      footNote={<span className="text-[12px] opacity-70">관리자 미리보기 — 성도 화면과 같은 모습이에요</span>}
    />
  )
}

// ── 데스크 ───────────────────────────────────────────────

const SEGS: [NoticeSeg, string][] = [
  ['all', '전체'],
  ['active', '공개'],
  ['popup', '팝업 중'],
  ['hidden', '비공개'],
]

export interface NotificationDeskProps extends NoticeDeskActions {
  notices: Notification[]
  filtered: Notification[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  seg: NoticeSeg
  onSegChange: (v: NoticeSeg) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onBack: () => void
  onClearFilters: () => void
  onGoNews: () => void
}

const NotificationDesk = ({
  notices,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  seg,
  onSegChange,
  selectedId,
  onSelect,
  onCreate,
  onBack,
  onClearFilters,
  onGoNews,
  ...actions
}: NotificationDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [previewId, setPreviewId] = useState<number | null>(null)

  // 고른 공지가 필터에서 빠지면 첫 공지를 보여 준다
  const activeId = filtered.some((n) => n.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (notices.find((n) => n.id === activeId) ?? null) : null
  // 지운 공지면 저절로 닫힌다 — 다른 공지로 바뀌어 보이지 않게 고른 id 로만 찾는다
  const sheetNotice = sheetOpen ? (notices.find((n) => n.id === selectedId) ?? null) : null
  const previewNotice = previewId != null ? (notices.find((n) => n.id === previewId) ?? null) : null

  const live = notices.filter((n) => popupState(n) === 'live')
  const counts: Record<NoticeSeg, number> = {
    all: notices.length,
    active: notices.filter((n) => n.is_active).length,
    popup: live.length,
    hidden: notices.filter((n) => !n.is_active).length,
  }

  // '/' 검색, ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!isDesktop()) return
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return
      if (isTypingTarget(document.activeElement)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || filtered.length === 0) return
      e.preventDefault()
      const i = filtered.findIndex((n) => n.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      onSelect(id)
      document.getElementById(`notice-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId, onSelect])

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const filtering = !!searchTerm || seg !== 'all'

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:min-h-0 lg:h-[calc(100dvh-56px)] lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1320px] mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:min-h-0 lg:h-full lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:rounded-3xl lg:overflow-hidden lg:border lg:border-gray-200/70 dark:lg:border-white/[0.08] lg:shadow-2xl">
        {/* ── 왼쪽: 목록 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">공지 · 홈 팝업</h1>
                <button
                  type="button"
                  onClick={onGoNews}
                  className="mt-0.5 inline-flex items-center gap-1.5 text-left text-[13px] text-gray-500 dark:text-white/55 hover:text-brand transition-colors"
                >
                  <I d={IC.news} size={14} className="shrink-0" />
                  <span>
                    첨부·두고 읽을 글은 <span className="font-bold underline underline-offset-2">교회소식 게시판</span>으로
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새 공지
              </button>
            </div>

            {!loading && <LivePopupStrip live={live} active={seg === 'popup'} onClick={() => onSegChange(seg === 'popup' ? 'all' : 'popup')} />}

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="제목·내용 검색"
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] focus:bg-white dark:focus:bg-white/[0.08] transition"
              />
              {searchTerm ? (
                <button type="button" onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white/80" aria-label="검색어 지우기">
                  <I d={IC.close} size={14} />
                </button>
              ) : (
                <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 dark:text-white/35 border border-gray-300 dark:border-white/15 rounded px-1.5 leading-[18px]">/</kbd>
              )}
            </label>

            <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06]">
              {SEGS.map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onSegChange(k)}
                  className={`flex-1 whitespace-nowrap px-1.5 h-8 rounded-lg text-[13px] font-semibold transition ${
                    seg === k ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-ink-strong'
                  }`}
                >
                  {l} <span className={seg === k ? 'text-brand' : ''}>{counts[k]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{filtering ? '조건에 맞는 공지가 없어요' : '아직 올린 공지가 없어요'}</p>
                {filtering ? (
                  <button type="button" onClick={onClearFilters} className="mt-2 text-[14px] font-semibold text-brand">
                    검색·필터 지우기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">위 '새 공지'로 첫 공지를 올려 보세요</p>
                )}
              </div>
            ) : (
              filtered.map((n) => <Row key={n.id} notice={n} active={n.id === activeId} onClick={() => select(n.id)} />)
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} notice={selected} onPreviewPopup={() => setPreviewId(selected.id)} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 공지를 골라 주세요'}</div>
          )}
        </section>
      </div>

      {sheetOpen && sheetNotice && (
        <MobileDetailSheet
          key={sheetNotice.id}
          notice={sheetNotice}
          onClose={() => setSheetOpen(false)}
          onPreviewPopup={() => setPreviewId(sheetNotice.id)}
          {...actions}
        />
      )}

      {previewNotice && <PopupPreview notice={previewNotice} onClose={() => setPreviewId(null)} />}
    </div>
  )
}

export default NotificationDesk
