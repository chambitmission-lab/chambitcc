// 소그룹 관리 — 관리 데스크(2026-11-27, 교회소식·섬기는 사람들 데스크와 같은 문법)
//
// 예전 화면은 카드 행 + 펼침 + 오른쪽 칩 묶음이라 "무엇을 해야 하는지"가 안 보였다.
// 관리자가 이 화면에서 하는 일은 셋 — (1) 어떤 그룹이 살아 있는지 훑고, (2) 초대 코드·QR 을
// 꺼내 주고, (3) 방치된 그룹을 정리한다. 그래서
//   PC(lg+)  왼쪽 목록(요약 숫자·정리 후보 띠·검색·세그먼트·정렬) / 오른쪽 상세(초대 QR·코드,
//            숫자 띠, 정리 안내, 정보) — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 데이터·액션은 GroupManagement(실제) / dev/GroupAdminPreview(표본)가 쥔다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { renderSVG } from 'uqr'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { groupInviteUrl } from '../../../utils/inviteLink'
import { calendarDaysSince, formatDotDateWeekday } from '../../../utils/dateUtils'
import { GroupGlyph } from '../../Groups/GroupIcons'
import { isQuietGroup, type AdminGroup, type GroupSeg, type GroupSort } from './groupDeskUtils'

const ageLabel = (iso: string) => {
  const d = calendarDaysSince(iso)
  if (d <= 0) return '오늘'
  if (d < 30) return `${d}일 전`
  if (d < 365) return `${Math.floor(d / 30)}달 전`
  return `${Math.floor(d / 365)}년 전`
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
  back: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="9" cy="7.5" r="3.5" /><path d="M22 20v-1.5a4 4 0 0 0-3-3.85" /><path d="M16 4.15a3.5 3.5 0 0 1 0 6.7" /></>,
  heart: <path d="M12 20.5s-7.5-4.6-9.6-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.6 5.5c-2.1 4.4-9.6 9-9.6 9z" />,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2.2" /><path d="M5 15H4.2A2.2 2.2 0 0 1 2 12.8V4.2A2.2 2.2 0 0 1 4.2 2h8.6A2.2 2.2 0 0 1 15 4.2V5" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6l-1.4 14a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 6" /><path d="M9 6V4h6v2" /></>,
  ext: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />,
  arrow: <path d="M9 6l6 6-6 6" />,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1.2" /><rect x="14" y="3" width="7" height="7" rx="1.2" /><rect x="3" y="14" width="7" height="7" rx="1.2" /><path d="M14 14h3v3M21 14v.01M17 21h4v-4M14 18v3" /></>,
}

// ── 작은 조각 ────────────────────────────────────────────

const GroupTile = ({ group, size }: { group: AdminGroup; size: 'sm' | 'lg' }) => {
  const quiet = isQuietGroup(group)
  return (
    <span
      className={`shrink-0 flex items-center justify-center ${
        size === 'lg' ? 'w-16 h-16 rounded-[20px]' : 'w-11 h-11 rounded-[14px]'
      } ${quiet ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/40' : 'bg-[var(--brand-soft)] text-brand'}`}
    >
      <GroupGlyph emoji={group.icon} size={size === 'lg' ? 30 : 21} />
    </span>
  )
}

const QuietBadge = () => (
  <span className="inline-flex items-center gap-0.5 shrink-0 h-[22px] px-2 rounded-md text-[12px] font-bold bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65">
    <I d={IC.moon} size={11} />
    조용함
  </span>
)

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

// ── 정리 후보 띠 ─────────────────────────────────────────
// 조용한 그룹이 있을 때만 — 숫자 칩 하나로 묻혀 있던 '할 일'을 목록 위에 꺼내 둔다.

const QuietStrip = ({ count, active, onClick }: { count: number; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${
      active
        ? 'bg-gray-100 dark:bg-white/[0.07] ring-1 ring-gray-300 dark:ring-white/15'
        : 'border border-dashed border-gray-300 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
    }`}
  >
    <span className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white dark:bg-white/[0.08] text-gray-500 dark:text-white/60 shadow-sm">
      <I d={IC.moon} size={19} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[14.5px] font-bold text-ink-strong">조용한 그룹 {count}곳</span>
      <span className="block text-[13px] text-gray-600 dark:text-white/60 truncate">
        {active ? '정리 후보만 보는 중 — 다시 누르면 전체' : '혼자 있고 기도제목이 없어요 · 정리 후보'}
      </span>
    </span>
    <span className="shrink-0 text-gray-400 dark:text-white/40">
      <I d={active ? IC.close : IC.arrow} size={18} />
    </span>
  </button>
)

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ group, active, onClick }: { group: AdminGroup; active: boolean; onClick: () => void }) => {
  const quiet = isQuietGroup(group)
  return (
    <button
      id={`group-row-${group.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <GroupTile group={group} size="sm" />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${quiet ? 'text-gray-600 dark:text-white/60' : 'text-ink-strong'}`}>
            {group.name}
          </span>
          {quiet && <QuietBadge />}
        </span>
        {group.description && (
          <span className="block mt-0.5 truncate text-[13.5px] text-gray-600 dark:text-white/60">{group.description}</span>
        )}
        <span className="mt-1 flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-white/55 tabular-nums">
          <span className="inline-flex items-center gap-1"><I d={IC.users} size={14} />{group.member_count}</span>
          <span className="inline-flex items-center gap-1"><I d={IC.heart} size={14} />{group.prayer_count}</span>
          <span className="truncate">{group.creator_name} · {ageLabel(group.created_at)}</span>
        </span>
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1 px-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-[78px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 초대 카드 ────────────────────────────────────────────
// 관리자가 이 화면에서 가장 자주 꺼내 쓰는 값 — 읽어 주기 쉬운 큰 글자 + 바로 찍을 QR.

const InviteCard = ({ group, onCopyCode, onCopyLink }: { group: AdminGroup; onCopyCode: () => void; onCopyLink: () => void }) => {
  const code = group.invite_code
  const qr = useMemo(() => (code ? renderSVG(groupInviteUrl(code), { ecc: 'M', border: 1 }) : null), [code])
  if (!code || !qr) {
    return (
      <p className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-4 text-[14px] text-gray-500 dark:text-white/55">
        초대 코드가 없는 그룹이에요.
      </p>
    )
  }
  return (
    <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center">
      <div
        className="shrink-0 self-center w-[148px] h-[148px] p-2 rounded-2xl bg-white border border-gray-200 [&>svg]:w-full [&>svg]:h-full"
        role="img"
        aria-label={`${group.name} 초대 QR`}
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">초대 코드</p>
        <div className="mt-1.5 flex flex-wrap gap-1" aria-label={code}>
          {code.split('').map((ch, i) => (
            <span
              key={i}
              className="w-9 h-11 rounded-lg bg-gray-50 dark:bg-white/[0.06] flex items-center justify-center text-[21px] font-extrabold text-ink-strong tabular-nums"
            >
              {ch}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-gray-500 dark:text-white/55 break-keep">
          모임 자리에서 QR 을 보여 주거나, 코드를 불러 주면 바로 들어와요.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold transition-colors"
          >
            <I d={IC.link} size={16} />
            초대 링크 복사
          </button>
          <button
            type="button"
            onClick={onCopyCode}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gray-100 dark:bg-white/[0.07] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-800 dark:text-white/85 text-[14px] font-semibold transition-colors"
          >
            <I d={IC.copy} size={16} />
            코드 복사
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 상세 ─────────────────────────────────────────────────

interface DetailActions {
  onCopyCode: (group: AdminGroup) => void
  onCopyLink: (group: AdminGroup) => void
  onDelete: (group: AdminGroup) => void
  onViewInvite: (group: AdminGroup) => void
}

const Detail = ({ group, onClose, ...a }: DetailActions & { group: AdminGroup; onClose?: () => void }) => {
  const quiet = isQuietGroup(group)
  const days = calendarDaysSince(group.created_at)
  const edited = group.updated_at && group.updated_at !== group.created_at

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <span className="min-w-0 truncate text-[15px] font-bold text-ink-strong">{group.name}</span>
        <div className="flex-1" />
        {group.invite_code && (
          <span className="hidden sm:contents">
            <TextBtn icon={IC.ext} label="초대장 보기" onClick={() => a.onViewInvite(group)} />
          </span>
        )}
        <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(group)} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">
          {/* 머리 — 그룹이 어떤 곳인지 */}
          <header className="flex items-start gap-4">
            <GroupTile group={group} size="lg" />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{group.name}</h2>
                {quiet && <QuietBadge />}
              </div>
              {group.description ? (
                <p className="mt-1.5 text-[15px] leading-[1.6] text-gray-700 dark:text-white/75 break-keep">{group.description}</p>
              ) : (
                <p className="mt-1.5 text-[14px] text-gray-400 dark:text-white/40">소개 글이 없어요</p>
              )}
            </div>
          </header>

          {/* 숫자 띠 — 규모·활동·나이 */}
          <dl className="grid grid-cols-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
            {(
              [
                ['멤버', `${group.member_count}`, '명'],
                ['기도제목', `${group.prayer_count}`, '개'],
                ['만든 지', days <= 0 ? '오늘' : `${days}`, days <= 0 ? '' : '일'],
              ] as const
            ).map(([k, v, u]) => (
              <div key={k} className="px-3 lg:px-4 py-3 min-w-0">
                <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
                <dd className="mt-0.5 text-ink-strong whitespace-nowrap">
                  <span className="text-[22px] lg:text-[24px] font-extrabold tabular-nums tracking-tight">{v}</span>
                  {u && <span className="ml-1 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>}
                </dd>
              </div>
            ))}
          </dl>

          {quiet && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                {group.member_count === 0 ? '멤버가 없고' : '만든 분 혼자 있고'} 기도제목도 아직 없어요.
                {days >= 30
                  ? ` 만든 지 ${days}일 지났어요 — ${group.creator_name} 님께 근황을 여쭙고 정리해도 괜찮아요.`
                  : ' 막 만든 방일 수 있으니 조금 더 지켜봐도 좋아요.'}
              </p>
              {days >= 30 && (
                <button
                  type="button"
                  onClick={() => a.onDelete(group)}
                  className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
                >
                  정리하기
                </button>
              )}
            </div>
          )}

          <section>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-gray-500 dark:text-white/55">
              <I d={IC.qr} size={15} />
              초대하기
            </h3>
            <InviteCard group={group} onCopyCode={() => a.onCopyCode(group)} onCopyLink={() => a.onCopyLink(group)} />
          </section>

          <section>
            <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">정보</h3>
            <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              {(
                [
                  ['만든 사람', group.creator_name],
                  ['만든 날', `${formatDotDateWeekday(group.created_at)} · ${ageLabel(group.created_at)}`],
                  ...(edited ? ([['마지막 수정', formatDotDateWeekday(group.updated_at)]] as const) : []),
                  ['그룹 번호', `#${group.id}`],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                  <dd className="text-[14.5px] font-semibold text-ink-strong tabular-nums text-right truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="text-[13px] text-gray-500 dark:text-white/50 break-keep">
            기도제목·멤버 내용은 성도들의 사적인 나눔이라 관리 화면에선 숫자만 보여요.
          </p>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ group, onClose, ...a }: DetailActions & { group: AdminGroup; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail group={group} onClose={onClose} {...a} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

const SEGS: [GroupSeg, string][] = [
  ['all', '전체'],
  ['active', '활동 중'],
  ['quiet', '조용함'],
]

const SORTS: [GroupSort, string][] = [
  ['recent', '최근 만든 순'],
  ['members', '멤버 많은 순'],
  ['prayers', '기도 많은 순'],
  ['name', '이름 순'],
]

export interface GroupDeskProps extends DetailActions {
  groups: AdminGroup[]
  filtered: AdminGroup[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  seg: GroupSeg
  onSegChange: (v: GroupSeg) => void
  sort: GroupSort
  onSortChange: (v: GroupSort) => void
  onBack: () => void
  onClearFilters: () => void
  onViewPublic: () => void
}

const GroupDesk = ({
  groups,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  seg,
  onSegChange,
  sort,
  onSortChange,
  onBack,
  onClearFilters,
  onViewPublic,
  ...actions
}: GroupDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 고른 그룹이 필터에서 빠지면 첫 그룹을 보여 준다
  const activeId = filtered.some((g) => g.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (groups.find((g) => g.id === activeId) ?? null) : null
  // 지운 그룹이면 없어서 저절로 닫힌다 — 다른 그룹으로 바뀌어 보이지 않게 고른 id 로만 찾는다
  const sheetGroup = sheetOpen ? (groups.find((g) => g.id === selectedId) ?? null) : null

  const quietCount = groups.filter(isQuietGroup).length
  const counts: Record<GroupSeg, number> = {
    all: groups.length,
    active: groups.length - quietCount,
    quiet: quietCount,
  }
  const totalMembers = groups.reduce((s, g) => s + g.member_count, 0)
  const totalPrayers = groups.reduce((s, g) => s + g.prayer_count, 0)

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
      const i = filtered.findIndex((g) => g.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      setSelectedId(id)
      document.getElementById(`group-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId])

  const select = (id: number) => {
    setSelectedId(id)
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
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">소그룹 관리</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">성도들이 홈에서 만든 기도방·모임이에요</p>
              </div>
              <button
                type="button"
                onClick={onViewPublic}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-gray-100 dark:bg-white/[0.07] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-800 dark:text-white/85 text-[13.5px] font-semibold transition-colors"
              >
                <I d={IC.ext} size={15} />
                성도 화면
              </button>
            </div>

            {/* 한눈에 보는 규모 — 그룹 수만으로는 실제 활동을 알 수 없다 */}
            <dl className="grid grid-cols-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
              {(
                [
                  ['그룹', groups.length, '곳'],
                  ['함께하는 성도', totalMembers, '명'],
                  ['기도제목', totalPrayers, '개'],
                ] as const
              ).map(([k, v, u]) => (
                <div key={k} className="px-3 py-2.5 min-w-0">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className="mt-0.5 text-ink-strong whitespace-nowrap">
                    {loading ? (
                      <span className="inline-block w-8 h-6 rounded bg-gray-200/70 dark:bg-white/[0.08] animate-pulse align-middle" />
                    ) : (
                      <>
                        <span className="text-[21px] font-extrabold tabular-nums tracking-tight">{v}</span>
                        <span className="ml-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {!loading && quietCount > 0 && (
              <QuietStrip count={quietCount} active={seg === 'quiet'} onClick={() => onSegChange(seg === 'quiet' ? 'all' : 'quiet')} />
            )}

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="그룹명·소개·만든 사람·초대 코드"
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
                  className={`flex-1 whitespace-nowrap px-2 h-8 rounded-lg text-[13px] font-semibold transition ${
                    seg === k ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-ink-strong'
                  }`}
                >
                  {l} <span className={seg === k ? 'text-brand' : ''}>{counts[k]}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
              {SORTS.map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onSortChange(k)}
                  aria-pressed={sort === k}
                  className={`shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold transition ${
                    sort === k
                      ? 'bg-ink-strong text-white dark:bg-white dark:text-black'
                      : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65 hover:text-ink-strong'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] font-bold text-ink-strong">
                  {filtering ? '조건에 맞는 그룹이 없어요' : '아직 만들어진 그룹이 없어요'}
                </p>
                {filtering ? (
                  <button type="button" onClick={onClearFilters} className="mt-2 text-[14px] font-semibold text-brand">
                    검색·필터 지우기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">성도들이 홈에서 소그룹을 만들면 여기에 나타나요</p>
                )}
              </div>
            ) : (
              filtered.map((g) => <Row key={g.id} group={g} active={g.id === activeId} onClick={() => select(g.id)} />)
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} group={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">
              {loading ? '' : '왼쪽에서 그룹을 골라 주세요'}
            </div>
          )}
        </section>
      </div>

      {sheetOpen && sheetGroup && (
        <MobileDetailSheet key={sheetGroup.id} group={sheetGroup} onClose={() => setSheetOpen(false)} {...actions} />
      )}
    </div>
  )
}

export default GroupDesk
