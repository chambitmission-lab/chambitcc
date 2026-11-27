// 공동 기도제목 관리 — 관리 데스크(2026-11-27, 교회소식·소그룹 데스크와 같은 문법)
//
// 예전 화면은 주차 카드 + 이모지 버튼 4개(🖥️👁️🔒) + 오른쪽 레일 안의 긴 폼이라, 무엇이
// 이번 주 것인지·성도에게 어떻게 보이는지 알 수 없었다. 관리자가 하는 일은 매주 하나 —
// "이번 주일 기도제목을 올렸나?" — 그래서
//   PC(lg+)  왼쪽 주차 목록(이번 주 상태 띠·세그먼트·달별 묶음) / 오른쪽 상세(공개 스위치·
//            스크린·수정 + 숫자 띠 + 성도 화면 미리보기) — 각자 스크롤, ↑↓ 이동
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 WeeklyPrayerComposer(2단 모달). 데이터·액션은 WeeklyPrayerManagement 가 쥔다.
import { useState, type ReactNode } from 'react'
import type { WeeklyPrayerListItem } from '../../../types/weeklyPrayer'
import { useWeeklyPrayerDetail } from '../../../hooks/useWeeklyPrayer'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { upcomingSunday, weekDateOf, weekPhase, type WpSeg } from './weeklyPrayerDeskUtils'
import { I, TextBtn, Switch } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, DESK_FRAME_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

const WD = ['주일', '월', '화', '수', '목', '금', '토']
const md = (weekDate: string) => {
  const d = weekDateOf(weekDate)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  screen: <><rect x="2.5" y="4" width="19" height="12.5" rx="2" /><path d="M8 20.5h8M12 16.5v4" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  hands: <path d="M12 21c-4-2.5-7-6-7-10.5V6l3 2V4.5L12 2l4 2.5V8l3-2v4.5c0 4.5-3 8-7 10.5z" />,
}

// ── 작은 조각 ────────────────────────────────────────────

const Badge = ({ tone, children }: { tone: 'this' | 'future' | 'hidden'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center shrink-0 h-[22px] px-2 rounded-md text-[12px] font-bold ${
      tone === 'this'
        ? 'bg-brand text-white'
        : tone === 'future'
          ? 'bg-[var(--brand-soft-strong)] text-brand'
          : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
    }`}
  >
    {children}
  </span>
)

// ── 이번 주일 상태 ───────────────────────────────────────
// 이 화면의 '할 일'은 사실상 하나 — 올라왔으면 확인, 아직이면 지난 주 복사로 바로 시작.

const ThisWeekStatus = ({
  list,
  onSelect,
  onStart,
}: {
  list: WeeklyPrayerListItem[]
  onSelect: (id: number) => void
  onStart: () => void
}) => {
  const sunday = upcomingSunday()
  const post = list.find((p) => p.week_date === sunday)
  const d = weekDateOf(sunday)
  return (
    <button
      type="button"
      onClick={() => (post ? onSelect(post.id) : onStart())}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${
        post
          ? 'bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07]'
          : 'border border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)]'
      }`}
    >
      <span className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center leading-none ${post ? 'bg-white dark:bg-white/[0.08] text-ink-strong' : 'bg-brand text-white'}`}>
        <span className="text-[19px] font-extrabold tabular-nums">{d.getDate()}</span>
        <span className="text-[10.5px] font-bold mt-0.5 opacity-80">주일</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-bold text-ink-strong">
          {md(sunday)} 기도제목 {post ? '올라왔어요' : '아직이에요'}
        </span>
        <span className="block text-[13px] text-gray-600 dark:text-white/60 truncate">
          {post
            ? post.is_published
              ? `공개 중 · ${post.item_count}개 항목 · 아멘 ${post.amen_total ?? 0}`
              : '비공개로 있어요 — 눌러서 확인'
            : list.length > 0
              ? '눌러서 지난 주 내용을 복사해 시작해요'
              : '눌러서 첫 기도제목을 써요'}
        </span>
      </span>
      <span className="shrink-0 text-brand">
        <I d={post ? IC.check : IC.copy} size={19} />
      </span>
    </button>
  )
}

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ prayer, active, onClick }: { prayer: WeeklyPrayerListItem; active: boolean; onClick: () => void }) => {
  const d = weekDateOf(prayer.week_date)
  const phase = weekPhase(prayer.week_date)
  return (
    <button
      id={`wp-row-${prayer.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className={`shrink-0 w-[52px] text-center pt-0.5 ${prayer.is_published ? '' : 'opacity-50'}`}>
        <span className={`block text-[26px] leading-none font-extrabold tabular-nums tracking-tight ${active ? 'lg:text-brand text-ink-strong' : 'text-ink-strong'}`}>
          {d.getDate()}
        </span>
        <span className="block mt-1 whitespace-nowrap text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
          {WD[d.getDay()]}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          {phase === 'this' && <Badge tone="this">이번 주</Badge>}
          {phase === 'future' && <Badge tone="future">예정</Badge>}
          <span className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${prayer.is_published ? 'text-ink-strong' : 'text-gray-500 dark:text-white/50'}`}>
            {prayer.preview || prayer.title}
          </span>
        </span>
        <span className="mt-1.5 flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-white/55 tabular-nums">
          {!prayer.is_published && <Badge tone="hidden">비공개</Badge>}
          <span>{prayer.item_count}개 항목</span>
          <span className="inline-flex items-center gap-1"><I d={IC.hands} size={13} />아멘 {prayer.amen_total ?? 0}</span>
        </span>
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1 px-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-[76px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 성도 화면 미리보기 ───────────────────────────────────

const PublicPreview = ({ prayer }: { prayer: WeeklyPrayerListItem }) => {
  const { data: detail, isLoading, isError } = useWeeklyPrayerDetail(prayer.id)
  return (
    <article className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
        <p className="text-[13px] font-bold text-brand">{md(prayer.week_date)} 주일</p>
        <h2 className="mt-1 text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong leading-snug break-keep">{prayer.title}</h2>
      </div>
      {isLoading ? (
        <div className="px-5 py-5 space-y-3">
          {[85, 70, 90, 60].map((w, i) => (
            <div key={i} className="h-4 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : isError || !detail ? (
        <p className="px-5 py-6 text-[14px] text-gray-500 dark:text-white/55">내용을 불러오지 못했어요.</p>
      ) : (
        <ol className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {detail.items.map((item, i) => (
            <li key={item.id ?? i} className="px-5 py-4 flex gap-3.5">
              <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-extrabold flex items-center justify-center tabular-nums">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                {item.title && <p className="text-[15.5px] font-bold text-ink-strong leading-snug break-keep">{item.title}</p>}
                {item.body && (
                  <p className={`${item.title ? 'mt-1.5' : ''} text-[14.5px] leading-[1.75] text-gray-700 dark:text-white/75 whitespace-pre-wrap break-keep`}>
                    {item.body}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[12.5px]">
                  {item.scripture && (
                    <span className="px-2 h-[22px] inline-flex items-center rounded-md bg-gray-100 dark:bg-white/[0.06] font-semibold text-gray-600 dark:text-white/65">
                      {item.scripture}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-gray-500 dark:text-white/50 tabular-nums">
                    <I d={IC.hands} size={13} />
                    아멘 {item.amen_count ?? 0}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}

// ── 상세 ─────────────────────────────────────────────────

interface DetailActions {
  onEdit: (p: WeeklyPrayerListItem) => void
  onTogglePublished: (p: WeeklyPrayerListItem) => void
  onDelete: (p: WeeklyPrayerListItem) => void
  onCopyToNew: (p: WeeklyPrayerListItem) => void
  onOpenScreen: (p?: WeeklyPrayerListItem) => void
}

const Detail = ({ prayer, onClose, ...a }: DetailActions & { prayer: WeeklyPrayerListItem; onClose?: () => void }) => {
  const { data: detail } = useWeeklyPrayerDetail(prayer.id)
  const phase = weekPhase(prayer.week_date)
  const d = weekDateOf(prayer.week_date)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <div className="flex items-center gap-2.5 mr-1">
          <Switch on={prayer.is_published} onClick={() => a.onTogglePublished(prayer)} label="성도에게 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${prayer.is_published ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>
            {prayer.is_published ? '공개 중' : '비공개'}
          </span>
        </div>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.copy} label="복사해 새 주일" onClick={() => a.onCopyToNew(prayer)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.screen} label="예배 스크린" onClick={() => a.onOpenScreen(prayer)} />
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(prayer)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(prayer)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <dl className="grid grid-cols-4 mx-4 lg:mx-5 mt-5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
          {(
            [
              ['주일', `${d.getMonth() + 1}.${d.getDate()}`, phase === 'this' ? '이번 주' : phase === 'future' ? '예정' : ''],
              ['항목', `${prayer.item_count}`, '개'],
              ['아멘', `${prayer.amen_total ?? 0}`, '번'],
              ['함께 기도', detail ? `${detail.prayed_user_count ?? 0}` : '–', '명'],
            ] as const
          ).map(([k, v, u]) => (
            <div key={k} className="px-3 lg:px-4 py-3 min-w-0">
              <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55 truncate">{k}</dt>
              <dd className="mt-0.5 text-ink-strong whitespace-nowrap">
                <span className="text-[22px] lg:text-[24px] font-extrabold tabular-nums tracking-tight">{v}</span>
                {u && <span className="ml-1 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>}
              </dd>
            </div>
          ))}
        </dl>

        {!prayer.is_published && (
          <p className="mx-4 lg:mx-5 mt-3 rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 text-[14px] font-medium px-4 py-2.5 break-keep">
            아직 성도들에게 안 보여요. 위 스위치를 켜면 바로 홈과 공동 기도제목 화면에 올라가요.
          </p>
        )}

        <div className="px-4 lg:px-5 pt-5 pb-8">
          <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
            <I d={IC.eye} size={15} />
            성도에게 이렇게 보여요
          </div>
          <div className="max-w-[640px]">
            <PublicPreview prayer={prayer} />
          </div>
          <div className="sm:hidden mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => a.onOpenScreen(prayer)} className="h-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-semibold text-gray-700 dark:text-white/80">
              예배 스크린
            </button>
            <button type="button" onClick={() => a.onCopyToNew(prayer)} className="h-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-semibold text-gray-700 dark:text-white/80">
              복사해 새 주일
            </button>
            <button type="button" onClick={() => a.onDelete(prayer)} className="col-span-2 h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ prayer, onClose, ...a }: DetailActions & { prayer: WeeklyPrayerListItem; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail prayer={prayer} onClose={onClose} {...a} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

const SEGS: [WpSeg, string][] = [
  ['all', '전체'],
  ['published', '공개'],
  ['hidden', '비공개'],
]

export interface WeeklyPrayerDeskProps extends DetailActions {
  list: WeeklyPrayerListItem[]
  filtered: WeeklyPrayerListItem[]
  loading: boolean
  seg: WpSeg
  onSegChange: (v: WpSeg) => void
  onCreate: () => void
  /** 이번 주일 기도제목이 없을 때 상태 띠 — 지난 주 복사(없으면 새로 쓰기) */
  onStartThisWeek: () => void
  onBack: () => void
  onViewPublic: () => void
  /** 고른 주 — 저장 직후 그 주를 바로 보여 주려고 부모가 쥔다 */
  selectedId: number | null
  onSelect: (id: number) => void
}

const WeeklyPrayerDesk = ({
  list,
  filtered,
  loading,
  seg,
  onSegChange,
  onCreate,
  onStartThisWeek,
  onBack,
  onViewPublic,
  selectedId,
  onSelect: setSelectedId,
  ...actions
}: WeeklyPrayerDeskProps) => {
  const [sheetOpen, setSheetOpen] = useState(false)

  // 처음엔 이번 주 것을, 고른 주가 필터에서 빠지면 맨 위 주를 보여 준다
  const thisWeekId = filtered.find((p) => p.week_date === upcomingSunday())?.id
  const activeId = filtered.some((p) => p.id === selectedId) ? selectedId : (thisWeekId ?? filtered[0]?.id ?? null)
  const selected = activeId != null ? (list.find((p) => p.id === activeId) ?? null) : null
  const sheetPrayer = sheetOpen ? (list.find((p) => p.id === selectedId) ?? null) : null

  const counts: Record<WpSeg, number> = {
    all: list.length,
    published: list.filter((p) => p.is_published).length,
    hidden: list.filter((p) => !p.is_published).length,
  }

  // ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useDeskHotkeys({
    canMove: filtered.length > 0,
    onMove: (dir) => {
      const i = filtered.findIndex((p) => p.id === activeId)
      const next = stepIndex(filtered.length, i, dir)
      const id = filtered[next].id
      setSelectedId(id)
      document.getElementById(`wp-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (id: number) => {
    setSelectedId(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  // 달별 묶음 — 주차가 쌓여도 "언제 것인지" 바로 찾게
  const groups: { key: string; label: string; items: WeeklyPrayerListItem[] }[] = []
  for (const p of filtered) {
    const d = weekDateOf(p.week_date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(p)
    else groups.push({ key, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`, items: [p] })
  }

  return (
    <div className={DESK_PAGE_CLS}>
      <div className={DESK_FRAME_CLS}>
        {/* ── 왼쪽: 주차 목록 ─────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">공동 기도제목</h1>
                <div className="mt-0.5 flex items-center gap-3 text-[13px] text-gray-500 dark:text-white/55">
                  <button type="button" onClick={onViewPublic} className="inline-flex items-center gap-1 hover:text-brand transition-colors">
                    <I d={IC.ext} size={13} />
                    성도 화면
                  </button>
                  <button type="button" onClick={() => actions.onOpenScreen()} className="inline-flex items-center gap-1 hover:text-brand transition-colors">
                    <I d={IC.screen} size={13} />
                    예배 스크린
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새로 쓰기
              </button>
            </div>

            {!loading && <ThisWeekStatus list={list} onSelect={select} onStart={onStartThisWeek} />}

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
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] font-bold text-ink-strong">
                  {seg !== 'all' ? '조건에 맞는 주일이 없어요' : '아직 올린 기도제목이 없어요'}
                </p>
                {seg !== 'all' ? (
                  <button type="button" onClick={() => onSegChange('all')} className="mt-2 text-[14px] font-semibold text-brand">
                    전체 보기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">위 '새로 쓰기'로 첫 주일 기도제목을 올려 보세요</p>
                )}
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.key}>
                  <p className="px-3 pt-3 pb-1 text-[12.5px] font-bold text-gray-400 dark:text-white/40">{g.label}</p>
                  {g.items.map((p) => (
                    <Row key={p.id} prayer={p} active={p.id === activeId} onClick={() => select(p.id)} />
                  ))}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} prayer={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">
              {loading ? '' : '왼쪽에서 주일을 골라 주세요'}
            </div>
          )}
        </section>
      </div>

      {/* 지운 주면 sheetPrayer 가 없어 저절로 닫힌다 */}
      {sheetOpen && sheetPrayer && (
        <MobileDetailSheet key={sheetPrayer.id} prayer={sheetPrayer} onClose={() => setSheetOpen(false)} {...actions} />
      )}
    </div>
  )
}

export default WeeklyPrayerDesk
