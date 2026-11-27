// 손글씨 필사대회 관리 — 관리 데스크(2026-11-27, 설문·푸시·새가족 데스크와 같은 문법)
//
// 예전 화면은 좁은 카드 줄(작품 보기·고치기·발표·삭제 버튼 묶음)이라, 발표를 기다리는 대회가 무엇인지,
// 출품작이 어떤지 보려면 대회 화면으로 넘어가야 했다. 그래서
//   PC(lg+)  왼쪽 목록(발표 기다림·진행 중·시작 전·발표 끝 묶음, 검색) / 오른쪽 상세(보이기 스위치·고치기 +
//            숫자 띠·발표 안내·설정 + 표 많은 순 출품작 — 그 자리에서 숨기기) — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 HandwritingContestComposer. 데이터·액션은 HandwritingContestManagement 가 쥔다.
import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ContestEntry, ContestSummary } from '../../../types/handwritingContest'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { Avatar, Medal, PaperThumb } from '../../HandwritingContest/contestShared'
import { daysUntil, formatDayTime, periodText } from '../../HandwritingContest/contestFormat'
import { groupContests } from './handwritingDeskUtils'
import { I, TextBtn } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  eyeOff: <><path d="M17.9 17.9A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.1-5.9" /><path d="M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2" /><path d="M1 1l22 22" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />,
}

// ── 작은 조각 ────────────────────────────────────────────

const Badge = ({ tone, children }: { tone: 'brand' | 'warn' | 'off' | 'ok'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold ${
      tone === 'brand'
        ? 'bg-[var(--brand-soft)] text-brand'
        : tone === 'warn'
          ? 'bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200'
          : tone === 'ok'
            ? 'bg-emerald-100 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-200'
            : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

const Switch = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`relative shrink-0 w-[46px] h-[28px] rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'}`}
  >
    <span className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
  </button>
)

/** 단계 한 줄 — 목록 행 아래 */
const phaseHint = (c: ContestSummary) => {
  switch (c.phase) {
    case 'upcoming':
      return `${formatDayTime(c.starts_at)} 시작`
    case 'open': {
      const d = daysUntil(c.ends_at)
      return d === 0 ? '오늘 마감' : `마감까지 ${d}일`
    }
    case 'closed':
      return '마감 · 발표 기다림'
    case 'announced':
      return c.results_published_at ? `${formatDayTime(c.results_published_at)} 발표` : '발표함'
  }
}

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ c, active, onClick }: { c: ContestSummary; active: boolean; onClick: () => void }) => (
  <button
    id={`contest-row-${c.id}`}
    type="button"
    onClick={onClick}
    aria-current={active}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
      active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
    } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
  >
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-1.5">
        <span className={`truncate text-[15.5px] font-bold ${c.is_active ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>{c.title}</span>
        {!c.is_active && <Badge tone="off">숨김</Badge>}
        {c.phase === 'closed' && <Badge tone="warn">발표 전</Badge>}
      </span>
      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
        {periodText(c)} · {phaseHint(c)}
      </span>
    </span>
    <span className="shrink-0 text-right">
      <span className={`block text-[17px] font-extrabold tabular-nums leading-none ${c.entry_count > 0 ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'}`}>{c.entry_count}</span>
      <span className="block mt-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40">출품</span>
    </span>
  </button>
)

// ── 출품작 (표 많은 순) ──────────────────────────────────

export interface ContestEntriesGridProps {
  contest: ContestSummary
  entries: ContestEntry[]
  total: number
  loading: boolean
  error?: boolean
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onToggleHidden: (e: ContestEntry) => void
  busyId: number | null
}

/** 관리자는 늘 표 수를 본다(서버 _counts_visible) — 숨긴 작품도 함께 내려온다 */
export const ContestEntriesGrid = ({ contest, entries, total, loading, error, hasMore, loadingMore, onLoadMore, onToggleHidden, busyId }: ContestEntriesGridProps) => (
  <section>
    <div className="mb-2.5 flex items-baseline justify-between gap-2">
      <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/55">출품작 · 표 많은 순</h3>
      {total > 0 && <span className="text-[13px] text-gray-400 dark:text-white/40">숨긴 작품 포함 {total}편</span>}
    </div>
    {loading ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-2xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    ) : error ? (
      <p className="py-8 text-center text-[14px] text-gray-500 dark:text-white/55">출품작을 불러오지 못했어요</p>
    ) : entries.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-5 py-10 text-center text-[14px] text-gray-500 dark:text-white/55 break-keep">
        {contest.phase === 'upcoming' ? '시작하면 성도들의 작품이 여기에 쌓여요.' : '아직 출품작이 없어요.'}
      </p>
    ) : (
      <>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {entries.map((e) => (
            <li key={e.id} className={`rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] overflow-hidden ${e.is_hidden ? 'opacity-55' : ''}`}>
              <div className="relative">
                <PaperThumb entry={e} ratio={1} />
                {e.rank != null && (
                  <span className="absolute top-2 left-2">
                    <Medal rank={e.rank} size={24} />
                  </span>
                )}
                {e.is_hidden && (
                  <span className="absolute top-2 right-2">
                    <Badge tone="off">숨김</Badge>
                  </span>
                )}
              </div>
              <div className="px-3 pt-2 pb-2.5">
                <p className="truncate text-[13.5px] font-bold text-ink-strong">{e.verse_ref}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-gray-500 dark:text-white/55">
                  <Avatar name={e.author.name} url={e.author.avatar_url} size={18} />
                  <span className="truncate flex-1">{e.author.name}</span>
                  <span className="shrink-0 inline-flex items-center gap-0.5 font-bold tabular-nums text-ink-strong">
                    <I d={IC.heart} size={12} className="text-rose-500" />
                    {e.vote_count ?? '–'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => onToggleHidden(e)}
                  disabled={busyId === e.id}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1 h-8 rounded-lg text-[12.5px] font-semibold text-gray-600 dark:text-white/70 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] disabled:opacity-50 transition"
                >
                  <I d={e.is_hidden ? IC.eye : IC.eyeOff} size={14} />
                  {e.is_hidden ? '다시 보이기' : '숨기기'}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="mt-3 w-full h-10 rounded-xl text-[13.5px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 transition"
          >
            {loadingMore ? '불러오는 중…' : `더 보기 (${entries.length}/${total})`}
          </button>
        )}
      </>
    )}
  </section>
)

// ── 상세 ─────────────────────────────────────────────────

export interface HandwritingDeskActions {
  onEdit: (c: ContestSummary) => void
  onToggleActive: (c: ContestSummary) => void
  onPublish: (c: ContestSummary) => void
  onUnpublish: (c: ContestSummary) => void
  onDelete: (c: ContestSummary) => void
  onView: (c: ContestSummary) => void
}

interface DetailCtx {
  renderEntries: (c: ContestSummary) => ReactNode
  publishing: boolean
  onClose?: () => void
}

const Detail = ({ c, renderEntries, publishing, onClose, ...a }: HandwritingDeskActions & DetailCtx & { c: ContestSummary }) => (
  <div className="flex flex-col h-full min-h-0">
    <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
      {onClose && (
        <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
          <I d={IC.back} size={20} />
        </button>
      )}
      <Switch on={c.is_active} onClick={() => a.onToggleActive(c)} label="성도에게 보이기" />
      <span className={`text-[14px] font-bold whitespace-nowrap ${c.is_active ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>{c.is_active ? '성도에게 보여요' : '관리자만 봐요'}</span>
      <div className="flex-1" />
      <span className="hidden xl:contents">
        <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onView(c)} />
      </span>
      <span className="hidden sm:contents">
        <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(c)} />
      </span>
      <button
        type="button"
        onClick={() => a.onEdit(c)}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
      >
        <I d={IC.edit} size={15} />
        고치기
      </button>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[760px] space-y-5">
        <header>
          <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">
            {periodText(c)} · {phaseHint(c)}
          </p>
          <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{c.title}</h2>
          {c.description && <p className="mt-1.5 text-[15px] leading-[1.7] text-gray-600 dark:text-white/65 whitespace-pre-wrap break-keep">{c.description}</p>}
        </header>

        <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
          {(
            [
              ['출품', c.entry_count, '편'],
              ['투표한 사람', c.voter_count, '명'],
              ['한 사람 표', c.votes_per_user, '표'],
            ] as const
          ).map(([k, v, u]) => (
            <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
              <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
              <dd className="mt-0.5 whitespace-nowrap text-ink-strong">
                <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{v}</span>
                <span className="ml-0.5 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
              </dd>
            </div>
          ))}
        </dl>

        {c.phase === 'closed' && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
            <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
              마감됐어요. 발표하면 표를 받은 작품 중 1~3등이 정해지고, 입상자와 참가자에게 알림이 가요.
            </p>
            <button
              type="button"
              onClick={() => a.onPublish(c)}
              disabled={publishing}
              className="shrink-0 h-9 px-3 rounded-xl bg-brand text-white text-[13.5px] font-bold disabled:opacity-50 transition"
            >
              결과 발표
            </button>
          </div>
        )}
        {c.phase === 'announced' && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3.5 flex items-start gap-3">
            <p className="flex-1 text-[14px] leading-[1.6] font-medium text-emerald-900 dark:text-emerald-100 break-keep">
              {c.results_published_at ? `${formatDayTime(c.results_published_at)}에 ` : ''}결과를 발표했어요. 입상작은 아래 메달로 보여요.
            </p>
            <button
              type="button"
              onClick={() => a.onUnpublish(c)}
              disabled={publishing}
              className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-emerald-900 dark:text-emerald-100 hover:bg-white dark:hover:bg-white/15 disabled:opacity-50 transition"
            >
              발표 취소
            </button>
          </div>
        )}
        {c.phase === 'upcoming' && (
          <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
            {formatDayTime(c.starts_at)}에 시작해요. 그 전까지는 출품·투표를 받지 않아요.
          </p>
        )}
        {!c.is_active && (
          <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
            숨긴 대회라 성도 목록에 안 보여요. 위 스위치를 켜면 바로 보여요.
          </p>
        )}

        <section>
          <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">설정</h3>
          <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
            {(
              [
                ['시작', formatDayTime(c.starts_at)],
                ['마감', formatDayTime(c.ends_at)],
                ['표 수·순위', c.show_ranking ? '진행 중에도 공개' : '발표 때까지 숨김(갤러리는 섞어 보여요)'],
                ['한 사람이 줄 수 있는 표', `${c.votes_per_user}표 · 같은 작품엔 1표`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="shrink-0 text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                <dd className="text-[14.5px] font-semibold text-ink-strong text-right break-keep">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {renderEntries(c)}

        <div className="sm:hidden">
          <button type="button" onClick={() => a.onDelete(c)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
            삭제
          </button>
        </div>
      </div>
    </div>
  </div>
)

const MobileDetailSheet = ({ c, onClose, ...rest }: HandwritingDeskActions & DetailCtx & { c: ContestSummary; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail c={c} onClose={onClose} {...rest} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface HandwritingDeskProps extends HandwritingDeskActions {
  contests: ContestSummary[]
  /** 검색 적용 결과 */
  filtered: ContestSummary[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onBack: () => void
  publishing: boolean
  renderEntries: (c: ContestSummary) => ReactNode
}

const HandwritingDesk = ({ contests, filtered, loading, searchTerm, onSearchChange, selectedId, onSelect, onCreate, onBack, publishing, renderEntries, ...actions }: HandwritingDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { groups, order } = useMemo(() => groupContests(filtered), [filtered])
  const activeId = order.some((c) => c.id === selectedId) ? selectedId : (order[0]?.id ?? null)
  const selected = activeId != null ? (contests.find((c) => c.id === activeId) ?? null) : null
  const sheetContest = sheetOpen ? (contests.find((c) => c.id === selectedId) ?? null) : null

  const stats = useMemo(() => {
    const open = contests.filter((c) => c.phase === 'open')
    return {
      open: open.length,
      entries: open.reduce((n, c) => n + c.entry_count, 0),
      waiting: contests.filter((c) => c.phase === 'closed').length,
    }
  }, [contests])

  useDeskHotkeys({
    searchRef,
    canMove: order.length > 0,
    onMove: (dir) => {
      const i = order.findIndex((x) => x.id === activeId)
      const next = stepIndex(order.length, i, dir)
      const id = order[next].id
      onSelect(id)
      document.getElementById(`contest-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const ctx: DetailCtx = { renderEntries, publishing }

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 목록 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">손글씨 필사대회</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">대회를 열고, 마감 뒤 성도들이 뽑은 1~3등을 발표해요</p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새 대회
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['진행 중', stats.open, '개'],
                  ['진행 중 출품', stats.entries, '편'],
                  ['발표 기다림', stats.waiting, '개'],
                ] as const
              ).map(([k, v, u]) => (
                <div key={k} className="px-3 py-2.5 min-w-0 bg-gray-50 dark:bg-card-dark">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className={`mt-0.5 whitespace-nowrap ${k === '발표 기다림' && v > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
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

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="대회 이름·소개 찾기"
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
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <div className="space-y-1 px-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[66px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : order.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{contests.length === 0 ? '아직 연 대회가 없어요' : '맞는 대회가 없어요'}</p>
                {contests.length === 0 ? (
                  <button type="button" onClick={onCreate} className="mt-2 text-[14px] font-semibold text-brand">
                    첫 대회 열기
                  </button>
                ) : (
                  <button type="button" onClick={() => onSearchChange('')} className="mt-2 text-[14px] font-semibold text-brand">
                    검색어 지우기
                  </button>
                )}
              </div>
            ) : (
              groups.map((g) => (
                <Fragment key={g.phase}>
                  <p className="px-3 pt-3 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40 first:pt-1">
                    {g.label} · {g.items.length}
                  </p>
                  {g.items.map((c) => (
                    <Row key={c.id} c={c} active={c.id === activeId} onClick={() => select(c.id)} />
                  ))}
                </Fragment>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} c={selected} {...ctx} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 대회를 골라요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && sheetContest && <MobileDetailSheet c={sheetContest} onClose={() => setSheetOpen(false)} {...ctx} {...actions} />}
    </div>
  )
}

export default HandwritingDesk
