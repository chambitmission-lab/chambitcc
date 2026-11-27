// 푸시 알림 — 관리 데스크(2026-11-27, 설문·일정·새가족 데스크와 같은 문법)
//
// 예전 화면은 작성 폼·템플릿·발송 이력이 한 긴 페이지에 쌓여, 지난 발송을 보려면 맨 아래까지 내려가 접힌 줄을
// 펼쳐야 했다. 그래서
//   PC(lg+)  왼쪽 = 맨 위 '새 알림 쓰기' + 보낸 기록(달별 묶음·검색·도달 결과) /
//            오른쪽 = 작성 패널(PushComposePanel) 또는 고른 기록의 상세(도달 숫자 띠·설정·기기 미리보기·다시 쓰기)
//   모바일   목록 → 작성/상세 한 화면(뒤로가기로 닫힘)
// 데이터·발송은 PushNotificationManagement 가 쥔다.
import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'
import type { PushSendLog } from '../../../api/push'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { DevicePreview } from './PushComposePanel'
import { AUDIENCE_MODE_LABEL, logMonthKey, logMonthLabel, logParts, reachOf, urlLabel } from './pushDeskUtils'
import { I } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

const IC = {
  ...DESK_IC,
  pen: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  replay: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
}

const REACH_DOT = { ok: 'bg-emerald-500', partial: 'bg-amber-500', fail: 'bg-red-500' } as const

export type PushSel = 'new' | number

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ log, active, onClick }: { log: PushSendLog; active: boolean; onClick: () => void }) => {
  const p = logParts(log.created_at)
  const reach = reachOf(log)
  return (
    <button
      id={`push-row-${log.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className="shrink-0 w-11 text-center">
        <span className="block text-[15px] font-extrabold tabular-nums text-ink-strong leading-none">{p ? p.date.getDate() : '–'}</span>
        <span className="block mt-1 text-[11.5px] font-semibold tabular-nums text-gray-400 dark:text-white/40">{p?.hm}</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-[15px] font-bold text-ink-strong">{log.title}</span>
        <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
          {log.audience_label || AUDIENCE_MODE_LABEL[log.audience_mode]} · {log.body}
        </span>
      </span>
      <span className="shrink-0 inline-flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${REACH_DOT[reach]}`} aria-hidden="true" />
        <span className="text-[14px] font-extrabold tabular-nums text-ink-strong">{log.sent}</span>
      </span>
    </button>
  )
}

const NewRow = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
      active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
    } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
  >
    <span className="shrink-0 w-11 h-11 rounded-2xl bg-brand text-white grid place-items-center">
      <I d={IC.pen} size={18} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[15px] font-bold text-ink-strong">새 알림 쓰기</span>
      <span className="block mt-0.5 text-[13px] text-gray-500 dark:text-white/55">템플릿·받는 사람·미리보기</span>
    </span>
  </button>
)

// ── 기록 상세 ────────────────────────────────────────────

const LogDetail = ({ log, onReuse, onClose }: { log: PushSendLog; onReuse: (l: PushSendLog) => void; onClose?: () => void }) => {
  const p = logParts(log.created_at)
  const reach = reachOf(log)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <span className="text-[14px] font-semibold text-gray-500 dark:text-white/55">
          {p ? `${p.date.getFullYear()}. ${p.date.getMonth() + 1}. ${p.date.getDate()}. ${p.hm}` : ''} 보냄
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onReuse(log)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.replay} size={15} />
          이 내용으로 다시 쓰기
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[720px] space-y-5">
          <header>
            <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">{log.audience_label || AUDIENCE_MODE_LABEL[log.audience_mode]}에게</p>
            <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{log.title}</h2>
            <p className="mt-1.5 text-[15px] leading-[1.7] text-gray-600 dark:text-white/65 whitespace-pre-wrap break-words">{log.body}</p>
          </header>

          <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
            {(
              [
                ['닿음', log.sent, reach === 'fail'],
                ['실패', log.failed, log.failed > 0],
                ['구독자', log.users_notified, false],
              ] as const
            ).map(([k, v, warn]) => (
              <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
                <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
                <dd className={`mt-0.5 whitespace-nowrap ${warn ? 'text-red-600 dark:text-red-300' : 'text-ink-strong'}`}>
                  <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{v}</span>
                  <span className="ml-0.5 text-[13px] font-semibold text-gray-500 dark:text-white/55">명</span>
                </dd>
              </div>
            ))}
          </dl>

          {reach !== 'ok' && (
            <p className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
              {reach === 'fail' ? '아무에게도 닿지 않았어요. ' : `${log.failed}명에게는 닿지 않았어요. `}
              알림 구독이 끝났거나 안 켠 분이에요 — 프로필에서 알림을 다시 켜도록 안내해 주세요.
            </p>
          )}

          <section>
            <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">보낸 설정</h3>
            <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
              {(
                [
                  ['받는 사람', `${log.audience_label || AUDIENCE_MODE_LABEL[log.audience_mode]}${log.target_count ? ` · ${log.target_count}명` : ''}`],
                  ['누르면 갈 곳', urlLabel(log.url)],
                  ['알림함', log.recorded > 0 ? '함께 남김' : '남지 않음'],
                  ['태그', log.tag || '–'],
                  ['보낸 사람', log.sender_name || '–'],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                  <dd className="text-[14.5px] font-semibold text-ink-strong text-right truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">휴대폰에 이렇게 떴어요</h3>
            <div className="max-w-[420px]">
              <DevicePreview title={log.title} body={log.body} icon="" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const MobileSheet = ({ onClose, children }: { onClose: () => void; children: ReactNode }) => {
  useModalBackButton(onClose)
  return <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">{children}</div>
}

// ── 데스크 ───────────────────────────────────────────────

export interface PushDeskProps {
  logs: PushSendLog[]
  total: number
  loading: boolean
  error: boolean
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  /** 회원 수 띠 — useAudiencePicker 에서 */
  members: { all: number; active: number }
  onBack: () => void
  /** 지난 기록 내용을 작성 패널에 채운다 */
  onReuse: (log: PushSendLog) => void
  /** 오른쪽 작성 패널 — 모바일 시트에선 onClose 를 받아 뒤로 버튼을 단다 */
  renderCompose: (onClose?: () => void) => ReactNode
}

const PushDesk = ({ logs, total, loading, error, hasMore, loadingMore, onLoadMore, members, onBack, onReuse, renderCompose }: PushDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<PushSel>('new')
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? logs.filter((l) => l.title.toLowerCase().includes(s) || l.body.toLowerCase().includes(s)) : logs
  }, [logs, q])

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: PushSendLog[] }[] = []
    for (const l of filtered) {
      const key = logMonthKey(l.created_at)
      const last = out[out.length - 1]
      if (last?.key === key) last.items.push(l)
      else out.push({ key, label: logMonthLabel(l.created_at), items: [l] })
    }
    return out
  }, [filtered])

  const order = useMemo<PushSel[]>(() => ['new', ...filtered.map((l) => l.id)], [filtered])
  const activeSel: PushSel = order.includes(sel) ? sel : 'new'
  const selectedLog = activeSel === 'new' ? null : (logs.find((l) => l.id === activeSel) ?? null)

  const lastSent = logs[0] ? logParts(logs[0].created_at) : null

  useDeskHotkeys({
    searchRef,
    onMove: (dir) => {
      const i = order.indexOf(activeSel)
      const next = order[stepIndex(order.length, i, dir)]
      setSel(next)
      if (next !== 'new') document.getElementById(`push-row-${next}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (next: PushSel) => {
    setSel(next)
    if (!isDesktop()) setSheetOpen(true)
  }

  const reuse = (log: PushSendLog) => {
    onReuse(log)
    setSel('new') // 모바일 시트는 열린 채 작성 화면으로 바뀐다
  }

  const sheetLog = sel === 'new' ? null : (logs.find((l) => l.id === sel) ?? null)

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 새 알림 + 보낸 기록 ───────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">푸시 알림</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">휴대폰 알림으로 보내고, 알림함에도 함께 남겨요</p>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['회원', `${members.all}`, '명'],
                  ['활성 회원', `${members.active}`, '명'],
                  ['보낸 알림', loading ? '' : `${total}`, '건'],
                ] as const
              ).map(([k, v, u]) => (
                <div key={k} className="px-3 py-2.5 min-w-0 bg-gray-50 dark:bg-card-dark">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className="mt-0.5 whitespace-nowrap text-ink-strong">
                    <span className="text-[21px] font-extrabold tabular-nums tracking-tight">{v || '–'}</span>
                    <span className="ml-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
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
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="보낸 알림 제목·내용 찾기"
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] focus:bg-white dark:focus:bg-white/[0.08] transition"
              />
              {q ? (
                <button type="button" onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white/80" aria-label="검색어 지우기">
                  <I d={IC.close} size={14} />
                </button>
              ) : (
                <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 dark:text-white/35 border border-gray-300 dark:border-white/15 rounded px-1.5 leading-[18px]">/</kbd>
              )}
            </label>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            <NewRow active={activeSel === 'new'} onClick={() => select('new')} />

            {loading ? (
              <div className="mt-2 space-y-1 px-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[66px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <p className="px-3 py-8 text-center text-[14px] text-gray-500 dark:text-white/55 break-keep">보낸 기록을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>
            ) : logs.length === 0 ? (
              <p className="px-3 py-10 text-center text-[14px] text-gray-500 dark:text-white/55">아직 보낸 알림이 없어요. 보내면 여기에 도달 결과가 쌓여요.</p>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[15px] font-bold text-ink-strong">맞는 알림이 없어요</p>
                <button type="button" onClick={() => setQ('')} className="mt-2 text-[14px] font-semibold text-brand">
                  검색어 지우기
                </button>
                {hasMore && <p className="mt-1 text-[13px] text-gray-500 dark:text-white/50">불러온 {logs.length}건 안에서만 찾아요</p>}
              </div>
            ) : (
              <>
                {lastSent && !q && (
                  <p className="px-3 pt-3 text-[12.5px] text-gray-400 dark:text-white/40">
                    <span className="inline-flex items-center gap-1 mr-2"><span className="w-2 h-2 rounded-full bg-emerald-500" />모두 닿음</span>
                    <span className="inline-flex items-center gap-1 mr-2"><span className="w-2 h-2 rounded-full bg-amber-500" />일부 실패</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />못 닿음</span>
                  </p>
                )}
                {groups.map((g) => (
                  <Fragment key={g.key}>
                    <p className="px-3 pt-3 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40">{g.label}</p>
                    {g.items.map((l) => (
                      <Row key={l.id} log={l} active={activeSel === l.id} onClick={() => select(l.id)} />
                    ))}
                  </Fragment>
                ))}
                {hasMore && (
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="mt-2 w-full h-10 rounded-xl text-[13.5px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-50 transition"
                  >
                    {loadingMore ? '불러오는 중…' : `지난 알림 더 보기 (${logs.length}/${total})`}
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── 오른쪽: 작성 또는 기록 상세 (PC) ────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selectedLog ? <LogDetail key={selectedLog.id} log={selectedLog} onReuse={reuse} /> : renderCompose()}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 작성↔상세가 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && (
        <MobileSheet onClose={() => setSheetOpen(false)}>
          {sheetLog ? <LogDetail log={sheetLog} onReuse={reuse} onClose={() => setSheetOpen(false)} /> : renderCompose(() => setSheetOpen(false))}
        </MobileSheet>
      )}
    </div>
  )
}

export default PushDesk
