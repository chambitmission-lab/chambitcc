// 일정 관리 — 관리 데스크(2026-11-27, 교회소식·말씀·헌금·플랜·상황 데스크와 같은 문법)
//
// 예전 화면은 아코디언 카드 + 우측 필터 레일(분류·상태·정렬 칩 세 줄)이라, 지난 일정과 다가올 일정이
// 한 줄에 섞이고 무엇을 확인해야 하는지(주보 초안·임시저장)가 칩 속에 묻혔다. 그래서
//   PC(lg+)  왼쪽 목록(주보 초안 띠·다가올/지난/임시저장 세그먼트·분류 칩·검색, 달별 묶음) /
//            오른쪽 상세(공개 스위치·수정 + 숫자 띠·확인할 것 + /events 맨 위 엽서 그대로)
//            각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 기존 EventComposer. 데이터·액션은 EventManagement 가 쥔다.
// (상세 조회 API는 조회수를 올리므로 데스크는 목록 응답만 쓴다 — 참석자 명단은 '성도 화면'에서)
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Event, EventCategory } from '../../../types/event'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'
import { ALL_CATEGORIES, CATEGORY_VISUAL } from '../../Events/utils/categoryConfig'
import { formatDDay, formatEventDateLabel, formatEventStartTime, formatEventTime, isAllDayEvent } from '../../Events/utils/dateGrouping'
import { CategoryIcon } from '../../Events/components/CategoryIcons'
import EventHeroCard from '../../Events/components/EventHeroCard'
import { formatKstDateTime } from '../../../utils/kstTime'
import { KO_WEEKDAYS, toKstCalendarDate } from '../../../utils/date'
import { eventPhase, isBulletinDraft, monthKey, monthLabel, rsvpState, type EventTab } from './eventDeskUtils'

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches
const REPEAT_LABEL = { none: '', daily: '매일', weekly: '매주', monthly: '매월' } as const

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
  ext: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  eye: <><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
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

const Badge = ({ tone, children }: { tone: 'draft' | 'brand' | 'live'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center gap-1 shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${
      tone === 'brand' ? 'bg-[var(--brand-soft)] text-brand' : tone === 'live' ? 'bg-brand text-white' : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {tone === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
    {children}
  </span>
)

const TextBtn = ({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition ${
      danger ? 'text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07]'
    }`}
  >
    <I d={icon} size={16} />
    <span>{label}</span>
  </button>
)

const CatTile = ({ category, size = 44 }: { category: EventCategory; size?: number }) => (
  <span
    className={`shrink-0 rounded-[14px] bg-gradient-to-br ${CATEGORY_VISUAL[category].gradient} text-white flex items-center justify-center`}
    style={{ width: size, height: size }}
  >
    <CategoryIcon category={category} width={Math.round(size * 0.46)} height={Math.round(size * 0.46)} />
  </span>
)

const whenText = (ev: Event) => {
  const allDay = isAllDayEvent(ev)
  const sameDay = ev.start_datetime.slice(0, 10) === ev.end_datetime.slice(0, 10)
  const start = formatEventDateLabel(ev.start_datetime)
  if (allDay) return sameDay ? `${start} 하루 종일` : `${start} ~ ${formatEventDateLabel(ev.end_datetime)} 종일`
  if (sameDay) return `${start} ${formatEventTime(ev.start_datetime)} ~ ${formatEventTime(ev.end_datetime)}`
  return `${start} ${formatEventTime(ev.start_datetime)} ~ ${formatEventDateLabel(ev.end_datetime)} ${formatEventTime(ev.end_datetime)}`
}

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ ev, active, onClick }: { ev: Event; active: boolean; onClick: () => void }) => {
  const d = toKstCalendarDate(ev.start_datetime)
  const phase = eventPhase(ev)
  const dday = formatDDay(ev.start_datetime)
  return (
    <button
      id={`event-row-${ev.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className="shrink-0 w-[46px] text-center pt-0.5">
        <span className={`block text-[25px] leading-none font-extrabold tabular-nums tracking-tight ${phase === 'past' ? 'text-gray-400 dark:text-white/35' : d.getDay() === 0 ? 'text-red-500 dark:text-red-400' : 'text-ink-strong'}`}>
          {d.getDate()}
        </span>
        <span className="block mt-1 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{KO_WEEKDAYS[d.getDay()]}</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          {phase === 'ongoing' && <Badge tone="live">진행 중</Badge>}
          <span className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${phase === 'past' ? 'text-gray-500 dark:text-white/55' : 'text-ink-strong'}`}>{ev.title}</span>
          {!ev.is_published && <Badge tone="draft">{isBulletinDraft(ev) ? '주보 초안' : '임시저장'}</Badge>}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-white/55 min-w-0">
          <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${CATEGORY_VISUAL[ev.category].dot}`} />
          <span className="truncate">
            {formatEventStartTime(ev)}
            {ev.location && ` · ${ev.location}`}
            {ev.group && ` · ${ev.group.name}만`}
          </span>
        </span>
      </span>
      <span className="shrink-0 text-right pt-0.5">
        {phase === 'upcoming' && <span className="block text-[12.5px] font-bold text-brand whitespace-nowrap">{dday}</span>}
        <span className={`block text-[12.5px] font-semibold tabular-nums ${phase === 'upcoming' ? 'mt-1' : ''} ${ev.attendance_count > 0 ? 'text-gray-600 dark:text-white/65' : 'text-gray-300 dark:text-white/25'}`}>
          {ev.attendance_count}명
        </span>
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1 px-1">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="h-[66px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 상세 ─────────────────────────────────────────────────

export interface EventDeskActions {
  onEdit: (ev: Event) => void
  onTogglePublish: (ev: Event) => void
  onDelete: (ev: Event) => void
  onView: (ev: Event) => void
}

const Detail = ({ ev, onClose, ...a }: EventDeskActions & { ev: Event; onClose?: () => void }) => {
  const { language } = useLanguage()
  const t = translations[language]
  const phase = eventPhase(ev)
  const rsvp = rsvpState(ev)
  const bulletin = isBulletinDraft(ev)
  const v = CATEGORY_VISUAL[ev.category]

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <Switch on={ev.is_published} onClick={() => a.onTogglePublish(ev)} label="성도에게 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${ev.is_published ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>{ev.is_published ? '공개 중' : '비공개'}</span>
        </div>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onView(ev)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(ev)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(ev)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">
          <header className="flex items-start gap-3.5">
            <CatTile category={ev.category} size={52} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 dark:text-white/55">
                <span className={v.chipText}>{t.categories[ev.category]}</span>
                {phase === 'ongoing' && <Badge tone="live">진행 중</Badge>}
                {phase === 'upcoming' && <span className="text-brand">· {formatDDay(ev.start_datetime)}</span>}
                {phase === 'past' && <span>· 지난 일정</span>}
              </p>
              <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{ev.title}</h2>
              <p className="mt-1 text-[15px] font-semibold text-gray-700 dark:text-white/80">{whenText(ev)}</p>
            </div>
          </header>

          <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
            {(
              [
                ['참석 예정', `${ev.attendance_count}`, '명', false],
                ['조회', `${ev.views}`, '회', false],
                ['신청 마감', rsvp ? rsvp.label : '없음', '', !!rsvp?.closed],
              ] as const
            ).map(([k, val, u, muted]) => (
              <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
                <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                <dd className={`mt-0.5 whitespace-nowrap ${muted ? 'text-gray-400 dark:text-white/40' : 'text-ink-strong'}`}>
                  <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{val}</span>
                  {u && <span className="ml-0.5 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>}
                </dd>
              </div>
            ))}
          </dl>

          {bulletin && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                주보 소식을 AI가 읽어 만든 초안이에요. 날짜·시간·장소가 맞는지 확인하고 공개해 주세요.
                {isAllDayEvent(ev) && ' 시각을 못 읽어 "하루 종일"로 들어가 있어요.'}
              </p>
              <button
                type="button"
                onClick={() => a.onEdit(ev)}
                className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
              >
                확인하기
              </button>
            </div>
          )}
          {!ev.is_published && !bulletin && (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              비공개라 성도 일정표에 안 보여요. 위 스위치를 켜면 바로 올라가요.
            </p>
          )}

          <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
            {(
              [
                ['장소', ev.location || '–'],
                ['보이는 사람', ev.group ? `${ev.group.icon ?? ''} ${ev.group.name} 모임만`.trim() : '모든 성도'],
                ...(ev.repeat_type !== 'none'
                  ? ([['반복', `${REPEAT_LABEL[ev.repeat_type]}${ev.repeat_end_date ? ` · ${formatEventDateLabel(ev.repeat_end_date)}까지` : ''}`]] as const)
                  : []),
                ...(ev.rsvp_deadline ? ([['신청 마감', formatKstDateTime(ev.rsvp_deadline)]] as const) : []),
                ['등록', `${formatKstDateTime(ev.created_at)}${ev.source_bulletin_id != null ? ' · 주보에서' : ''}`],
              ] as const
            ).map(([k, val]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="shrink-0 text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                <dd className="min-w-0 truncate text-[14.5px] font-semibold text-ink-strong text-right">{val}</dd>
              </div>
            ))}
            {ev.attachment_url && (
              <a href={ev.attachment_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                <span className="text-[14px] text-gray-500 dark:text-white/55">첨부</span>
                <span className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-brand">
                  <I d={IC.doc} size={15} />
                  열어 보기
                </span>
              </a>
            )}
          </dl>

          {ev.description && (
            <section>
              <h3 className="mb-2 text-[13px] font-bold text-gray-500 dark:text-white/55">안내 글</h3>
              <p className="text-[15px] leading-[1.75] text-gray-800 dark:text-white/85 whitespace-pre-wrap break-keep">{ev.description}</p>
            </section>
          )}

          {phase !== 'past' && (
            <section>
              <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
                <I d={IC.eye} size={15} />
                가장 가까운 일정이 되면 /events 맨 위에 이렇게 실려요
              </div>
              <div className="max-w-[560px] rounded-3xl bg-[var(--app-canvas)] dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/[0.06] pt-4 [&>button]:!mb-4">
                <EventHeroCard event={ev} />
              </div>
            </section>
          )}

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDelete(ev)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ ev, onClose, ...a }: EventDeskActions & { ev: Event; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail ev={ev} onClose={onClose} {...a} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface EventDeskProps extends EventDeskActions {
  events: Event[]
  /** 탭·분류·검색 적용, 정렬된 결과 */
  filtered: Event[]
  counts: Record<EventTab, number>
  loading: boolean
  tab: EventTab
  onTabChange: (t: EventTab) => void
  category: EventCategory | 'all'
  onCategoryChange: (c: EventCategory | 'all') => void
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onPublishBulletin: () => void
  publishingBulletin: boolean
  onBack: () => void
}

const EventDesk = ({
  events,
  filtered,
  counts,
  loading,
  tab,
  onTabChange,
  category,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  selectedId,
  onSelect,
  onCreate,
  onPublishBulletin,
  publishingBulletin,
  onBack,
  ...actions
}: EventDeskProps) => {
  const { language } = useLanguage()
  const t = translations[language]
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeId = filtered.some((e) => e.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (events.find((e) => e.id === activeId) ?? null) : null
  const sheetEv = sheetOpen ? (events.find((e) => e.id === selectedId) ?? null) : null

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
      const i = filtered.findIndex((x) => x.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      onSelect(id)
      document.getElementById(`event-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId, onSelect])

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  // 달 머리 — 연속한 같은 달 묶음의 첫 행 위에만
  const withMonths = useMemo(() => filtered.map((ev, i) => ({ ev, head: i === 0 || monthKey(filtered[i - 1]) !== monthKey(ev) ? monthLabel(ev) : null })), [filtered])

  const segs: [EventTab, string][] = [
    ['upcoming', '다가올'],
    ['past', '지난'],
    ['draft', '비공개'],
  ]
  const filtersOn = !!searchTerm || category !== 'all'

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
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">일정</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">공개하면 교회 일정표(/events)에 올라가요</p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새 일정
              </button>
            </div>

            {/* 주보 초안 띠 — 남아 있을 때만 */}
            {counts.bulletin > 0 && (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-3.5 py-3">
                <p className="text-[14px] font-bold text-amber-900 dark:text-amber-100">주보에서 가져온 일정 초안 {counts.bulletin}건</p>
                <p className="mt-0.5 text-[13px] leading-[1.5] text-amber-900/80 dark:text-amber-100/75 break-keep">날짜·시간·장소를 확인하고 공개해 주세요</p>
                <div className="mt-2.5 flex gap-2">
                  {tab !== 'bulletin' ? (
                    <button
                      type="button"
                      onClick={() => onTabChange('bulletin')}
                      className="flex-1 h-9 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
                    >
                      초안만 보기
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onTabChange('upcoming')}
                      className="flex-1 h-9 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
                    >
                      전체로 돌아가기
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onPublishBulletin}
                    disabled={publishingBulletin}
                    className="flex-1 h-9 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold disabled:opacity-60 transition"
                  >
                    {publishingBulletin ? '공개하는 중…' : '모두 공개'}
                  </button>
                </div>
              </div>
            )}

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="제목·장소·안내 글 찾기"
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

            <div role="tablist" className="grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05]">
              {segs.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => onTabChange(k)}
                  className={`h-8 rounded-lg text-[13.5px] font-semibold transition ${
                    tab === k ? 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white/80'
                  }`}
                >
                  {label} <span className="tabular-nums opacity-70">{counts[k]}</span>
                </button>
              ))}
            </div>

            {/* 분류 — 가로로 넘기는 칩 */}
            <div className="-mx-4 px-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
              {(['all', ...ALL_CATEGORIES] as const).map((c) => {
                const on = category === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onCategoryChange(c)}
                    aria-pressed={on}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold transition ${
                      on ? 'bg-ink-strong text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    {c !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_VISUAL[c].dot}`} />}
                    {c === 'all' ? '모든 분류' : t.categories[c]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">
                  {filtersOn ? '맞는 일정이 없어요' : tab === 'upcoming' ? '다가올 일정이 없어요' : tab === 'past' ? '지난 일정이 없어요' : '비공개 일정이 없어요'}
                </p>
                {filtersOn ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange('')
                      onCategoryChange('all')
                    }}
                    className="mt-2 text-[14px] font-semibold text-brand"
                  >
                    조건 지우기
                  </button>
                ) : (
                  tab === 'upcoming' && (
                    <button type="button" onClick={onCreate} className="mt-2 text-[14px] font-semibold text-brand">
                      새 일정 만들기
                    </button>
                  )
                )}
              </div>
            ) : (
              withMonths.map(({ ev, head }) => (
                <Fragment key={ev.id}>
                  {head && <p className="px-3 pt-3 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40 first:pt-1">{head}</p>}
                  <Row ev={ev} active={ev.id === activeId} onClick={() => select(ev.id)} />
                </Fragment>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} ev={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 일정을 골라요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && sheetEv && <MobileDetailSheet ev={sheetEv} onClose={() => setSheetOpen(false)} {...actions} />}
    </div>
  )
}

export default EventDesk
