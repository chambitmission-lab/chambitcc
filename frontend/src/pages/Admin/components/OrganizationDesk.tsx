// 조직도 관리 — 관리 데스크(2026-11-27, 설문·푸시·새가족 데스크와 같은 문법)
//
// 예전 화면은 의결기구 카드 + 접는 위원회 카드 줄이라, 위원회 하나를 손보려면 펼치고 작은 아이콘 다섯 개 사이를
// 오가야 했다. 그래서
//   PC(lg+)  왼쪽 = 의결기구 묶음 + 위원회 목록(끌어서 순서 바꾸기·검색은 하위 부서 이름까지) /
//            오른쪽 = 고른 묶음의 상세(보임 스위치·수정 + 숫자 띠 + 하위 조직 편집 트리: 드래그·화살표·추가·수정·삭제)
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// ★ 계절 사진 배경은 폐기된 연출 — 다시 넣지 않는다. 데이터·서버 호출은 OrganizationManagement 가 쥔다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { OrgTree, OrgUnit, OrgUnitType } from '../../../types/organization'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useDragSort } from '../../../hooks/useDragSort'
import { DragHandle, SortableRows, type RowActions } from '../org/OrgTree'
import { countBelow, countHidden, deepMatch, type OrgSel } from './organizationDeskUtils'
import { I, TextBtn } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

const IC = {
  ...DESK_IC,
  gavel: <><path d="M14 13l-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10" /><path d="M16 16l6-6" /><path d="M8 8l6-6" /><path d="M9 7l8 8" /><path d="M21 11l-8-8" /></>,
}

const Switch = ({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onChange}
    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
  </button>
)

const Band = ({ cells }: { cells: [string, number, string, boolean?][] }) => (
  <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
    {cells.map(([k, v, u, warn]) => (
      <div key={k} className="px-3 lg:px-4 py-3 min-w-0 bg-gray-50 dark:bg-card-dark">
        <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
        <dd className={`mt-0.5 whitespace-nowrap ${warn ? 'text-amber-700 dark:text-amber-300' : 'text-ink-strong'}`}>
          <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{v}</span>
          <span className="ml-0.5 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
        </dd>
      </div>
    ))}
  </dl>
)

const TREE_TIP = '왼쪽 점 손잡이를 끌거나 화살표로 같은 묶음 안 순서를 바꿔요. 다른 묶음으로 옮기려면 수정에서 상위 조직을 고르세요.'

// ── 상세 ─────────────────────────────────────────────────

export interface OrganizationDeskActions extends RowActions {
  onCreate: (parent: OrgUnit | null, type: OrgUnitType) => void
  onToggleActive: (unit: OrgUnit) => void
  onViewPublic: () => void
}

const TopBar = ({ onClose, children }: { onClose?: () => void; children: ReactNode }) => (
  <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
    {onClose && (
      <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
        <I d={IC.back} size={20} />
      </button>
    )}
    {children}
  </div>
)

const TreeCard = ({ parentId, units, actions, empty }: { parentId: number | null; units: OrgUnit[]; actions: RowActions; empty: string }) =>
  units.length === 0 ? (
    <p className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-5 py-8 text-center text-[14px] text-gray-500 dark:text-white/55">{empty}</p>
  ) : (
    <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-3.5 py-1">
      <SortableRows parentId={parentId} units={units} depth={0} isLast actions={actions} />
    </div>
  )

const GovernanceDetail = ({ units, onClose, ...a }: OrganizationDeskActions & { units: OrgUnit[]; onClose?: () => void }) => {
  const below = units.reduce((n, u) => n + countBelow(u, () => true), 0)
  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar onClose={onClose}>
        <span className="text-[15px] font-bold text-ink-strong">의결기구</span>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={a.onViewPublic} />
        </span>
        <button
          type="button"
          onClick={() => a.onCreate(null, 'governance')}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.plus} size={15} />
          의결기구
        </button>
      </TopBar>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[760px] space-y-5">
          <header>
            <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">조직도 맨 위</p>
            <h2 className="mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] text-ink-strong">의결기구</h2>
            <p className="mt-1.5 text-[15px] leading-[1.7] text-gray-600 dark:text-white/65 break-keep">공동의회·당회·제직회처럼 교회의 결정을 맡는 모임이에요. 성도 조직도에선 맨 위에 가지 모양으로 그려져요.</p>
          </header>
          <Band cells={[['의결기구', units.length, '개'], ['그 아래', below, '개'], ['숨김', countHidden(units), '개', countHidden(units) > 0]]} />
          <section>
            <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">의결기구 목록</h3>
            <TreeCard parentId={null} units={units} actions={a} empty="아직 의결기구가 없어요" />
            <p className="mt-2 text-[13px] text-gray-500 dark:text-white/50 break-keep">{TREE_TIP}</p>
          </section>
        </div>
      </div>
    </div>
  )
}

const CommitteeDetail = ({ c, onClose, ...a }: OrganizationDeskActions & { c: OrgUnit; onClose?: () => void }) => {
  const bureaus = countBelow(c, (u) => u.unit_type === 'bureau')
  const depts = countBelow(c, (u) => u.unit_type === 'department')
  const hidden = countBelow(c, (u) => !u.is_active)
  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar onClose={onClose}>
        <Switch on={c.is_active} onChange={() => a.onToggleActive(c)} label="성도 조직도에 보이기" />
        <span className={`text-[14px] font-bold whitespace-nowrap ${c.is_active ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>{c.is_active ? '보이는 중' : '숨김'}</span>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={a.onViewPublic} />
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
          수정
        </button>
      </TopBar>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[760px] space-y-5">
          <header>
            <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">위원회</p>
            <h2 className={`mt-0.5 text-[23px] font-extrabold tracking-[-0.02em] leading-tight break-keep ${c.is_active ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>{c.name}</h2>
            {c.note && <p className="mt-1.5 text-[15px] leading-[1.7] text-gray-600 dark:text-white/65 break-keep">{c.note}</p>}
          </header>

          <Band cells={[['국', bureaus, '개'], ['부서', depts, '개'], ['숨김', hidden, '개', hidden > 0]]} />

          {!c.is_active && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 px-4 py-3.5 flex items-start gap-3">
              <p className="flex-1 text-[14px] leading-[1.6] font-medium text-amber-900 dark:text-amber-100 break-keep">
                숨겨 둔 위원회라 성도 조직도에 안 보여요. 아래 국·부서도 함께 가려져요.
              </p>
              <button
                type="button"
                onClick={() => a.onToggleActive(c)}
                className="shrink-0 h-9 px-3 rounded-xl bg-white/80 dark:bg-white/10 text-[13.5px] font-bold text-amber-900 dark:text-amber-100 hover:bg-white dark:hover:bg-white/15 transition"
              >
                다시 보이기
              </button>
            </div>
          )}

          <section>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/55">국·부서</h3>
              <span className="flex items-center gap-1">
                <button type="button" onClick={() => a.onCreate(c, 'bureau')} className="h-8 px-2.5 rounded-lg text-[13.5px] font-semibold text-brand hover:bg-[var(--brand-soft)] transition">
                  + 국
                </button>
                <button type="button" onClick={() => a.onCreate(c, 'department')} className="h-8 px-2.5 rounded-lg text-[13.5px] font-semibold text-brand hover:bg-[var(--brand-soft)] transition">
                  + 부서
                </button>
              </span>
            </div>
            <TreeCard parentId={c.id} units={c.children} actions={a} empty="아직 국·부서가 없어요. 위에서 추가해 주세요." />
            <p className="mt-2 text-[13px] text-gray-500 dark:text-white/50 break-keep">
              국은 부서를 묶는 머리말이에요 — 생략하고 위원회 아래 부서를 바로 둬도 돼요. {TREE_TIP}
            </p>
          </section>

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDelete(c)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              위원회 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const MobileSheet = ({ onClose, children }: { onClose: () => void; children: ReactNode }) => {
  useModalBackButton(onClose)
  return <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">{children}</div>
}

// ── 목록 행 ──────────────────────────────────────────────

const CommitteeRow = ({ c, active, onClick, hint, handle }: { c: OrgUnit; active: boolean; onClick: () => void; hint: string | null; handle: ReactNode }) => {
  const depts = countBelow(c, (u) => u.unit_type === 'department')
  const bureaus = countBelow(c, (u) => u.unit_type === 'bureau')
  return (
    <div
      className={`flex items-center gap-1 pl-1 pr-3 rounded-2xl transition ${active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''} hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      {handle}
      <button id={`org-row-${c.id}`} type="button" onClick={onClick} aria-current={active} className="flex-1 min-w-0 flex items-center gap-3 py-3 text-left">
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className={`truncate text-[15.5px] font-bold ${c.is_active ? 'text-ink-strong' : 'text-gray-500 dark:text-white/55'}`}>{c.name}</span>
            {!c.is_active && <span className="inline-flex items-center shrink-0 h-[20px] px-1.5 rounded-md text-[11.5px] font-bold bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65">숨김</span>}
          </span>
          <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">
            {hint ? <>‘<b className="font-semibold text-brand">{hint}</b>’ 포함</> : bureaus > 0 ? `국 ${bureaus} · 부서 ${depts}` : depts > 0 ? `부서 ${depts}` : '아직 부서 없음'}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className={`block text-[17px] font-extrabold tabular-nums leading-none ${depts > 0 ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'}`}>{depts}</span>
          <span className="block mt-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40">부서</span>
        </span>
      </button>
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface OrganizationDeskProps extends OrganizationDeskActions {
  tree: OrgTree | undefined
  loading: boolean
  seeding: boolean
  onSeed: (force: boolean) => void
  onBack: () => void
  /** 위원회 줄 끌어서 놓기 — 실패하면 onError 로 되돌린다 */
  onReorderCommittees: (orderedIds: number[], onError: () => void) => void
  /** 작성 창이 떠 있으면 ↑↓·/ 단축키를 쉰다 */
  keyboardPaused?: boolean
}

const OrganizationDesk = ({ tree, loading, seeding, onSeed, onBack, onReorderCommittees, keyboardPaused, ...actions }: OrganizationDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<OrgSel>('gov')
  const [sheetOpen, setSheetOpen] = useState(false)

  const governance = useMemo(() => tree?.governance ?? [], [tree])
  const committees = useMemo(() => tree?.committees ?? [], [tree])
  const empty = !loading && !!tree && governance.length === 0 && committees.length === 0

  // 실패 시 되돌리기 — 훅 결과를 콜백 안에서 바로 부르지 않고 ref 로 건넨다
  const resetRef = useRef<() => void>(() => {})
  const sort = useDragSort(
    committees.map((c) => c.id),
    (ordered) => onReorderCommittees(ordered, () => resetRef.current()),
  )
  useEffect(() => {
    resetRef.current = sort.resetOrder
  })
  const byId = useMemo(() => new Map(committees.map((c) => [c.id, c])), [committees])

  const searching = q.trim().length > 0
  const visible = useMemo(
    () =>
      sort.orderedIds
        .map((id) => byId.get(id))
        .filter((c): c is OrgUnit => !!c)
        .map((c) => ({ c, m: deepMatch(c, q) }))
        .filter((x) => x.m),
    [sort.orderedIds, byId, q],
  )
  const govVisible = !searching || governance.some((g) => deepMatch(g, q))

  const order = useMemo<OrgSel[]>(() => [...(govVisible ? (['gov'] as OrgSel[]) : []), ...visible.map((x) => x.c.id)], [govVisible, visible])
  const activeSel: OrgSel | null = order.includes(sel) ? sel : (order[0] ?? null)
  const selCommittee = typeof activeSel === 'number' ? (byId.get(activeSel) ?? null) : null

  const stats = useMemo(() => ({ hidden: countHidden([...governance, ...committees]) }), [governance, committees])

  useDeskHotkeys({
    searchRef,
    paused: keyboardPaused,
    canMove: order.length > 0 && activeSel != null,
    onMove: (dir) => {
      const i = order.indexOf(activeSel)
      const next = order[stepIndex(order.length, i, dir)]
      setSel(next)
      document.getElementById(next === 'gov' ? 'org-row-gov' : `org-row-${next}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (next: OrgSel) => {
    setSel(next)
    if (!isDesktop()) setSheetOpen(true)
  }

  const sheetCommittee = typeof sel === 'number' ? (byId.get(sel) ?? null) : null
  const renderDetail = (s: OrgSel | null, c: OrgUnit | null, onClose?: () => void) =>
    s === 'gov' ? <GovernanceDetail units={governance} onClose={onClose} {...actions} /> : c ? <CommitteeDetail key={c.id} c={c} onClose={onClose} {...actions} /> : null

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 의결기구 + 위원회 ─────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">조직도</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">위원회 → 국 → 부서 순서로 묶여 성도 조직도에 그려져요</p>
              </div>
              <button
                type="button"
                onClick={() => actions.onCreate(null, 'committee')}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                위원회
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-gray-200/70 dark:bg-white/[0.06]">
              {(
                [
                  ['위원회', tree?.committee_count ?? 0],
                  ['부서', tree?.department_count ?? 0],
                  ['숨김', stats.hidden],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="px-3 py-2.5 min-w-0 bg-gray-50 dark:bg-card-dark">
                  <dt className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
                  <dd className="mt-0.5 whitespace-nowrap text-ink-strong">
                    {loading ? (
                      <span className="inline-block w-8 h-6 rounded bg-gray-200/70 dark:bg-white/[0.08] animate-pulse align-middle" />
                    ) : (
                      <>
                        <span className="text-[21px] font-extrabold tabular-nums tracking-tight">{v}</span>
                        <span className="ml-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55">개</span>
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
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="위원회·부서 이름 찾기"
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
            {loading ? (
              <div className="space-y-1 px-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[66px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : empty ? (
              <div className="py-14 px-4 text-center">
                <p className="text-[15px] font-bold text-ink-strong">아직 조직도가 없어요</p>
                <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">기본 조직도를 넣고 고쳐 쓰거나, 위원회부터 하나씩 만들어요</p>
                <button
                  type="button"
                  onClick={() => onSeed(false)}
                  disabled={seeding}
                  className="mt-4 h-10 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold disabled:opacity-50 transition"
                >
                  기본 조직도 넣기
                </button>
              </div>
            ) : order.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">맞는 조직이 없어요</p>
                <button type="button" onClick={() => setQ('')} className="mt-2 text-[14px] font-semibold text-brand">
                  검색어 지우기
                </button>
              </div>
            ) : (
              <>
                {govVisible && (
                  <button
                    id="org-row-gov"
                    type="button"
                    onClick={() => select('gov')}
                    aria-current={activeSel === 'gov'}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${
                      activeSel === 'gov' ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
                    } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
                  >
                    <span className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--brand-soft)] text-brand grid place-items-center">
                      <I d={IC.gavel} size={18} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15.5px] font-bold text-ink-strong">의결기구</span>
                      <span className="block mt-0.5 truncate text-[13px] text-gray-500 dark:text-white/55">{governance.length ? governance.map((g) => g.name).join(' · ') : '아직 없음'}</span>
                    </span>
                  </button>
                )}

                {visible.length > 0 && (
                  <p className="px-3 pt-3 pb-1 text-[13px] font-extrabold text-gray-400 dark:text-white/40">
                    위원회 · {visible.length}
                    {!searching && visible.length > 1 && <span className="ml-1.5 font-semibold">끌어서 순서 바꾸기</span>}
                  </p>
                )}
                {visible.map(({ c, m }) => (
                  <div key={c.id} ref={sort.setItemRef(c.id)} style={sort.itemStyle(c.id)} className={sort.draggingId === c.id ? 'relative z-10 rounded-2xl bg-white dark:bg-card-dark shadow-xl' : undefined}>
                    <CommitteeRow
                      c={c}
                      active={activeSel === c.id}
                      onClick={() => select(c.id)}
                      hint={m && !m.self ? m.child : null}
                      // 검색 중엔 일부만 보이므로 끌기를 막는다(가려진 위원회 자리를 건드리지 않게)
                      handle={!searching && committees.length > 1 ? <DragHandle {...sort.handleProps(c.id)} /> : <span className="w-6 shrink-0" />}
                    />
                  </div>
                ))}

                {!searching && (
                  <div className="mt-6 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSeed(true)}
                      disabled={seeding}
                      className="h-9 px-3 rounded-xl text-[13px] font-semibold text-gray-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition"
                    >
                      기본 조직도로 되돌리기
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {renderDetail(activeSel, selCommittee) ?? (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading || empty ? '' : '왼쪽에서 묶음을 골라요'}</div>
          )}
        </section>
      </div>

      {/* key 없이 — 시트 안에서 항목이 바뀌어도 다시 마운트(뒤로가기 기록 중복)되지 않게 */}
      {sheetOpen && (sel === 'gov' || sheetCommittee) && <MobileSheet onClose={() => setSheetOpen(false)}>{renderDetail(sel, sheetCommittee, () => setSheetOpen(false))}</MobileSheet>}
    </div>
  )
}

export default OrganizationDesk
