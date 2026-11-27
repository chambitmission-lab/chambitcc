// 누군가의 기도 관리 — 관리 데스크(2026-11-27, 설문·푸시·새가족 데스크와 같은 문법)
//
// 예전 화면은 운영 스위치·주기·숫자 8칸·신고 카드가 한 장에 섞여 있어, 신고가 들어와도 눈에 덜 띄었다. 그래서
//   PC(lg+)  왼쪽 = 맨 위 '운영 현황' 고정 줄 + 신고된 편지 목록 /
//            오른쪽 = 운영 현황(열기 스위치·지금 시작 + 숫자 두 줄·일정) 또는 고른 신고 편지(되돌리기·숨김 확정)
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 익명 원칙 — 누가 누구를 위해 기도하는지는 여기서도 숫자로만. 보낸 사람 이름은 신고된 편지에 한해서만 보인다.
// 데이터·확인창·액션은 IntercessionManagement 가 쥔다.
import { useMemo, useState, type ReactNode } from 'react'
import type { IntercessionAdminOverview, IntercessionLetterReport } from '../../../api/intercession'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { formatDotDateTime } from '../../../utils/date'
import { cycleMonthLabel, formatDay } from '../../Intercession/intercessionDates'
import { CYCLE_STATS, PEOPLE_STATS, overviewLine, type IntercessionSel } from './intercessionDeskUtils'
import { I } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  play: <path d="M7 4.5v15l12-7.5z" />,
  hands: <><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  undo: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-3.2 3.7M6.2 7.6A16 16 0 0 0 3 12s4 6 9 6a9 9 0 0 0 3.4-.7" /></>,
}

const TextBtn = ({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold whitespace-nowrap text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07] disabled:opacity-50 transition"
  >
    <I d={icon} size={16} />
    <span>{label}</span>
  </button>
)

const Switch = ({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label="누군가의 기도 운영"
    disabled={disabled}
    onClick={onClick}
    className={`relative shrink-0 w-[46px] h-[28px] rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/[0.14]'}`}
  >
    <span className={`absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all ${on ? 'left-[21px]' : 'left-[3px]'}`} />
  </button>
)

const StatBand = ({ title, items }: { title: string; items: readonly (readonly [string, number])[] }) => (
  <section>
    <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">{title}</h3>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
      {items.map(([k, v]) => (
        <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
          <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
          <dd className="mt-0.5 text-[22px] font-extrabold tabular-nums tracking-tight text-ink-strong">{(v ?? 0).toLocaleString()}</dd>
        </div>
      ))}
    </dl>
  </section>
)

// ── 목록 행 ──────────────────────────────────────────────

const rowCls = (active: boolean) =>
  `w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
    active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
  } hover:bg-gray-50 dark:hover:bg-white/[0.04]`

const OverviewRow = ({ data, active, onClick }: { data?: IntercessionAdminOverview; active: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} aria-current={active} className={rowCls(active)}>
    <span className={`shrink-0 w-11 h-11 rounded-2xl grid place-items-center ${data?.open ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/55'}`}>
      <I d={IC.hands} size={19} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="flex items-center gap-1.5">
        <span className="text-[15px] font-bold text-ink-strong">운영 현황</span>
        {data && (
          <span className={`h-[20px] px-1.5 rounded-md text-[11.5px] font-bold inline-flex items-center ${data.open ? 'bg-[var(--brand-soft)] text-brand' : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'}`}>
            {data.open ? '열림' : '닫힘'}
          </span>
        )}
      </span>
      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">{overviewLine(data)}</span>
    </span>
  </button>
)

const ReportRow = ({ r, active, onClick }: { r: IntercessionLetterReport; active: boolean; onClick: () => void }) => (
  <button id={`intercession-report-${r.id}`} type="button" onClick={onClick} aria-current={active} className={rowCls(active)}>
    <span className="shrink-0 w-11 h-11 rounded-2xl grid place-items-center bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-200">
      <I d={IC.flag} size={18} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block truncate text-[15px] font-bold text-ink-strong">{r.body.replace(/\s+/g, ' ')}</span>
      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
        {cycleMonthLabel(r.month_start)} 편지 · {r.report_reason || '사유 없음'}
      </span>
    </span>
  </button>
)

// ── 상세: 운영 현황 ──────────────────────────────────────

export interface IntercessionDeskActions {
  onToggleOpen: () => void
  onStartNow: () => void
  onResolve: (r: IntercessionLetterReport, restore: boolean) => void
  onViewPublic: () => void
}

interface Busy {
  toggling: boolean
  starting: boolean
  resolving: boolean
}

const Overview = ({ data, busy, reports, onPickReport, onClose, ...a }: IntercessionDeskActions & {
  data: IntercessionAdminOverview
  busy: Busy
  reports: IntercessionLetterReport[]
  onPickReport: (id: number) => void
  onClose?: () => void
}) => {
  const c = data.cycle
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2.5 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <Switch on={data.open} disabled={busy.toggling} onClick={a.onToggleOpen} />
        <span className={`text-[14px] font-bold whitespace-nowrap ${data.open ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>{data.open ? '열려 있어요' : '닫혀 있어요'}</span>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={a.onViewPublic} />
        </span>
        {!c && (
          <button
            type="button"
            onClick={a.onStartNow}
            disabled={!data.open || busy.starting}
            title={data.open ? undefined : '먼저 운영을 열어야 시작할 수 있어요'}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap disabled:opacity-40 transition"
          >
            <I d={IC.play} size={14} />
            {busy.starting ? '시작하는 중…' : '지금 시작'}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[760px] space-y-5">
          <header>
            <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">{c ? `이번 주기 · ${c.current_week + 1}/${c.week_count}주차` : '다음 주기'}</p>
            <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">
              {c ? `${cycleMonthLabel(c.start_date)}의 기도` : data.next_start_date ? `${formatDay(data.next_start_date)} 아침 7시에 짝이 정해져요` : '예정된 주기가 없어요'}
            </h2>
            {c && (
              <p className="mt-1 text-[15px] text-gray-600 dark:text-white/65">
                {formatDay(c.start_date)} ~ {formatDay(c.end_date)} 전날까지
              </p>
            )}
            {c && (
              <div className="mt-3 flex gap-1" aria-hidden="true">
                {Array.from({ length: c.week_count }).map((_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= c.current_week ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'}`} />
                ))}
              </div>
            )}
          </header>

          {!data.open && (
            <p className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
              닫혀 있어서 메뉴·홈 카드·신청이 숨겨져 있고, 새 주기 배정과 저녁 알림도 멈춰 있어요. 참여 기록과 짝은 그대로 남아 다시 열면 이어져요.
            </p>
          )}
          {reports.length > 0 && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-center gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                신고된 편지 {reports.length}건이 처리를 기다려요.
              </p>
              <button
                type="button"
                onClick={() => onPickReport(reports[0].id)}
                className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
              >
                살펴보기
              </button>
            </div>
          )}

          <StatBand title="사람" items={PEOPLE_STATS(data)} />
          <StatBand title={c ? '이번 주기' : '기도'} items={CYCLE_STATS(data)} />

          <section>
            <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">일정</h3>
            <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              {(
                [
                  ['짝 배정', '매월 첫 주일 아침 7시 자동'],
                  ['첫 짝 배정', formatDay(data.first_cycle_date)],
                  ['다음 주기', data.next_start_date ? formatDay(data.next_start_date) : '–'],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                  <dd className="text-[14.5px] font-semibold text-ink-strong text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
            누가 누구를 위해 기도하는지는 관리자에게도 보이지 않아요. 짝은 세 분 이상 모여야 정해져요.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── 상세: 신고된 편지 ────────────────────────────────────

const ReportDetail = ({ r, busy, onResolve, onClose }: { r: IntercessionLetterReport; busy: Busy; onResolve: IntercessionDeskActions['onResolve']; onClose?: () => void }) => (
  <div className="flex flex-col h-full min-h-0">
    <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
      {onClose && (
        <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
          <I d={IC.back} size={20} />
        </button>
      )}
      <span className="text-[14px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">신고된 편지</span>
      <div className="flex-1" />
      <TextBtn icon={IC.undo} label="문제없음 · 되돌리기" disabled={busy.resolving} onClick={() => onResolve(r, true)} />
      <button
        type="button"
        onClick={() => onResolve(r, false)}
        disabled={busy.resolving}
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap disabled:opacity-50 transition"
      >
        <I d={IC.eyeOff} size={15} />
        숨김 확정
      </button>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">
        <header>
          <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">{cycleMonthLabel(r.month_start)}의 기도 · 익명 편지</p>
          <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">
            {r.report_reason ? `“${r.report_reason}”` : '사유 없이 신고됐어요'}
          </h2>
        </header>

        <blockquote className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-5 py-4 text-[15.5px] leading-[1.8] text-ink-strong whitespace-pre-line break-keep">
          {r.body}
        </blockquote>

        <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
          {(
            [
              ['보낸 사람', r.sender_name],
              ['받은 사람', r.receiver_name],
              ['신고 시각', formatDotDateTime(r.reported_at) || '–'],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
              <dd className="text-[14.5px] font-semibold text-ink-strong text-right">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
          신고된 편지는 받은 분 편지함에서 이미 숨겨져 있어요. 보낸 분께는 신고 사실이 알려지지 않아요. 보낸 사람 이름은 신고된 편지에 한해서만 보여요.
          <br />
          <b className="font-semibold text-ink-strong">되돌리기</b>는 받은 편지함에 다시 보이게 하고, <b className="font-semibold text-ink-strong">숨김 확정</b>은 그대로 숨겨 둬요.
        </p>
      </div>
    </div>
  </div>
)

const MobileSheet = ({ onClose, children }: { onClose: () => void; children: ReactNode }) => {
  useModalBackButton(onClose)
  return <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">{children}</div>
}

// ── 데스크 ───────────────────────────────────────────────

export interface IntercessionDeskProps extends IntercessionDeskActions {
  data: IntercessionAdminOverview | undefined
  loading: boolean
  reports: IntercessionLetterReport[]
  busy: Busy
  onBack: () => void
}

const IntercessionDesk = ({ data, loading, reports, busy, onBack, ...actions }: IntercessionDeskProps) => {
  const [sel, setSel] = useState<IntercessionSel>('overview')
  const [sheetOpen, setSheetOpen] = useState(false)

  const order = useMemo<IntercessionSel[]>(() => ['overview', ...reports.map((r) => r.id)], [reports])
  // 처리해서 목록에서 빠진 신고를 고르고 있었으면 운영 현황으로 돌아간다
  const activeSel: IntercessionSel = order.includes(sel) ? sel : 'overview'
  const selectedReport = activeSel === 'overview' ? null : (reports.find((r) => r.id === activeSel) ?? null)

  useDeskHotkeys({
    onMove: (dir) => {
      const i = order.indexOf(activeSel)
      const next = order[stepIndex(order.length, i, dir)]
      setSel(next)
      if (next !== 'overview') document.getElementById(`intercession-report-${next}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (next: IntercessionSel) => {
    setSel(next)
    if (!isDesktop()) setSheetOpen(true)
  }

  const renderDetail = (onClose?: () => void) => {
    if (selectedReport) return <ReportDetail r={selectedReport} busy={busy} onResolve={actions.onResolve} onClose={onClose} />
    if (data) return <Overview data={data} busy={busy} reports={reports} onPickReport={(id) => setSel(id)} onClose={onClose} {...actions} />
    return (
      <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '현황을 모으는 중…' : '현황을 불러오지 못했어요'}</div>
    )
  }

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 운영 현황 + 신고된 편지 ───────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">누군가의 기도</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55 break-keep">교회 전체 익명 중보 짝 — 여기서도 숫자로만 봐요</p>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['함께하는 성도', data?.active_participants, '명', false],
                  ['이번 주기 기도', data?.cycle_prayers, '번', false],
                  ['신고 대기', reports.length, '건', reports.length > 0],
                ] as const
              ).map(([k, v, u, warn]) => (
                <div key={k} className="px-3 py-2.5 min-w-0 bg-gray-50 dark:bg-card-dark">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className={`mt-0.5 whitespace-nowrap ${warn ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
                    {loading && !data ? (
                      <span className="inline-block w-8 h-6 rounded bg-gray-200/70 dark:bg-white/[0.08] animate-pulse align-middle" />
                    ) : (
                      <>
                        <span className="text-[21px] font-extrabold tabular-nums tracking-tight">{(v ?? 0).toLocaleString()}</span>
                        <span className="ml-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            <OverviewRow data={data} active={activeSel === 'overview'} onClick={() => select('overview')} />
            <p className="px-3 pt-4 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40">신고된 편지 · {reports.length}</p>
            {reports.length === 0 ? (
              <p className="px-3 py-6 text-[14px] text-gray-500 dark:text-white/55">처리를 기다리는 신고가 없어요.</p>
            ) : (
              reports.map((r) => <ReportRow key={r.id} r={r} active={activeSel === r.id} onClick={() => select(r.id)} />)
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">{renderDetail()}</section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && <MobileSheet onClose={() => setSheetOpen(false)}>{renderDetail(() => setSheetOpen(false))}</MobileSheet>}
    </div>
  )
}

export default IntercessionDesk
