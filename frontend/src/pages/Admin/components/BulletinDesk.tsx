// 주보 관리 — 주보 데스크(2026-11-27 개편)
//
// 예전 화면은 카드 행 + 왼쪽 파란 막대 + 이모지 메타(📄👁️) + 펼침 안 버튼 5개 + 오른쪽 필터 상자라
// 촌스러웠다. 교회소식(NewsDesk)·행사 앨범(EventAlbumDesk)과 같은 '목록 + 상세' 2단으로 바꾼다.
//   PC(lg+)  왼쪽 주보 목록(월별 묶음, 표지 + 주일 날짜 + 쪽·조회 + 손볼 때만 AI 상태)
//            오른쪽 상세(수정·삭제·성도 화면 + 숫자 띠 + AI 읽기 세 줄 + 쪽 미리보기 → 누르면 성도 뷰어)
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 데이터·액션은 BulletinManagement 가 쥔다.
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Bulletin } from '../../../types/bulletin'
import { getBulletinDetail, type BulletinAiReaderStatus, type BulletinAiStatus } from '../../../api/bulletin'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import {
  adminBulletinDetailKey,
  bulletinDay,
  overallAi,
  upcomingSunday,
  type ReaderName,
} from './bulletinDeskUtils'
import { I, TextBtn } from './deskBits'
import { DESK_IC } from './deskIcons'
import { DESK_PAGE_CLS, useDeskHotkeys, stepIndex, isDesktop } from './deskUtils'

export type BulletinSeg = 'all' | 'year' | 'attention'
export type BulletinSort = 'recent' | 'oldest' | 'views'

const WD = ['일', '월', '화', '수', '목', '금', '토']
const dayLabel = (d: Date) => (d.getDay() === 0 ? '주일' : WD[d.getDay()])
const md = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** 제목이 날짜를 그대로 적은 기본값이면 굳이 한 번 더 보여 주지 않는다 */
const isDefaultTitle = (b: Bulletin) => {
  const d = bulletinDay(b.bulletin_date)
  return b.title.replace(/\s/g, '') === `${d.getFullYear()}년${d.getMonth() + 1}월${d.getDate()}일`
}

// ── AI 읽기 상태 ─────────────────────────────────────────

const READER_LABEL: Record<ReaderName, string> = {
  column: '목사님 칼럼',
  news: '소식 → 일정',
  digital: '디지털 주보',
}

const shortDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const readerText = (r: BulletinAiReaderStatus): string => {
  switch (r.state) {
    case 'done':
      return r.done_at ? `읽음 · ${shortDate(r.done_at)}` : '읽음'
    case 'queued':
      return '차례 기다리는 중'
    case 'running':
      return '지금 읽는 중'
    case 'gave_up':
      return `${r.attempts}번 시도해도 못 읽었어요`
    case 'idle':
      return '안 읽음 (2주 지난 주보)'
    default:
      return r.attempts > 0 ? `곧 다시 시도 (${r.attempts}/3)` : '곧 읽어요'
  }
}

// ── 아이콘 ───────────────────────────────────────────────

const IC = {
  ...DESK_IC,
  page: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
  alert: <><path d="M12 8v5" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" /><circle cx="12" cy="12" r="9" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 4v5h-5" /></>,
}

const Spinner = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="animate-spin" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
  </svg>
)

/** 목록 행의 AI 상태 — 다 읽었으면 아무것도 안 그린다(조용한 기본값) */
const AiBadge = ({ status }: { status?: BulletinAiStatus }) => {
  const o = overallAi(status)
  if (o === 'attention')
    return (
      <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-md text-[12px] font-bold bg-rose-50 dark:bg-rose-500/12 text-rose-600 dark:text-rose-300">
        <I d={IC.alert} size={13} />
        확인 필요
      </span>
    )
  if (o === 'reading')
    return (
      <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md text-[12px] font-bold bg-[var(--brand-soft)] text-brand">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        AI 읽는 중
      </span>
    )
  return null
}

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({
  b,
  active,
  isUpcoming,
  ai,
  onClick,
}: {
  b: Bulletin
  active: boolean
  isUpcoming: boolean
  ai?: BulletinAiStatus
  onClick: () => void
}) => {
  const d = bulletinDay(b.bulletin_date)
  const customTitle = !isDefaultTitle(b)
  return (
    <button
      id={`bulletin-row-${b.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      {/* 종이 주보 표지 — 세로 비율로, 종이처럼 얇은 그림자 */}
      <span className="relative shrink-0 w-[54px] h-[72px] rounded-lg overflow-hidden bg-gray-100 dark:bg-white/[0.06] ring-1 ring-black/[0.06] dark:ring-white/10 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.18)]">
        {b.thumbnail_url ? (
          <img src={b.thumbnail_url} alt="" loading="lazy" className="w-full h-full object-cover object-top" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-gray-400 dark:text-white/35">
            <I d={IC.page} size={20} />
          </span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-[16px] font-bold tracking-[-0.01em] text-ink-strong tabular-nums">
            {md(d)} <span className="font-semibold text-gray-500 dark:text-white/55">{dayLabel(d)}</span>
          </span>
          {isUpcoming && (
            <span className="shrink-0 h-[22px] px-2 inline-flex items-center rounded-md text-[12px] font-bold bg-brand text-white">이번 주일</span>
          )}
        </span>
        {customTitle && <span className="block mt-0.5 truncate text-[13.5px] text-gray-600 dark:text-white/65">{b.title}</span>}
        <span className="mt-1 flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-white/55">
          <span className="inline-flex items-center gap-1 tabular-nums"><I d={IC.page} size={14} />{b.page_count ?? 0}쪽</span>
          <span className="inline-flex items-center gap-1 tabular-nums"><I d={IC.eye} size={14} />{b.views ?? 0}</span>
          <AiBadge status={ai} />
        </span>
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1.5 px-1">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="h-[92px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 상세 ─────────────────────────────────────────────────

interface DetailActions {
  onEdit: (b: Bulletin) => void
  onDelete: (b: Bulletin) => void
  onViewPublic: (b: Bulletin) => void
  onOpenViewer: (b: Bulletin, page: number) => void
  onImportNews: (b: Bulletin) => void
  onImportDigital: (b: Bulletin) => void
  /** 지금 읽히고 있는 주보 id(없으면 null) — 한 번에 하나만 */
  importingId: number | null
  aiStatus: Record<string, BulletinAiStatus>
}

const ReaderLine = ({
  name,
  status,
  action,
}: {
  name: ReaderName
  status?: BulletinAiReaderStatus
  action?: ReactNode
}) => {
  const st = status?.state
  const tone =
    st === 'done'
      ? 'text-emerald-600 dark:text-emerald-300'
      : st === 'gave_up'
        ? 'text-rose-600 dark:text-rose-300'
        : st === 'idle' || !st
          ? 'text-gray-400 dark:text-white/40'
          : 'text-brand'
  return (
    <li className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
      <span className={`shrink-0 grid place-items-center w-7 h-7 rounded-full ${st === 'done' ? 'bg-emerald-50 dark:bg-emerald-400/10' : st === 'gave_up' ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-gray-100 dark:bg-white/[0.06]'} ${tone}`}>
        {st === 'done' ? (
          <I d={IC.check} size={15} />
        ) : st === 'gave_up' ? (
          <I d={IC.alert} size={15} />
        ) : st === 'idle' || !st ? (
          <span className="w-2 h-2 rounded-full border-[1.5px] border-current" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-bold text-ink-strong">{READER_LABEL[name]}</span>
        <span className={`block text-[13px] font-medium ${st === 'done' ? 'text-gray-500 dark:text-white/55' : tone}`}>
          {status ? readerText(status) : '상태를 불러오는 중'}
        </span>
      </span>
      {action}
    </li>
  )
}

const RereadBtn = ({ label, busy, locked, onClick }: { label: string; busy: boolean; locked: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={locked}
    aria-busy={busy || undefined}
    title={locked && !busy ? '다른 주보를 읽는 중이에요' : undefined}
    className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-semibold border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-white/80 hover:border-brand hover:text-brand transition disabled:opacity-50 ${busy ? 'cursor-wait' : 'disabled:cursor-not-allowed'}`}
  >
    {busy ? <Spinner /> : <I d={IC.refresh} size={14} />}
    {busy ? '읽는 중… (1~2분)' : label}
  </button>
)

const PagesPreview = ({ b, onOpen }: { b: Bulletin; onOpen: (page: number) => void }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: adminBulletinDetailKey(b.id),
    queryFn: () => getBulletinDetail(b.id, false),
    staleTime: 60_000,
  })
  const pages = [...(data?.pages ?? [])].sort((x, y) => x.page_number - y.page_number)
  if (isLoading)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: Math.min(8, b.page_count || 4) }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
        ))}
      </div>
    )
  if (isError) return <p className="text-[14px] text-gray-500 dark:text-white/55">쪽 이미지를 불러오지 못했어요.</p>
  if (pages.length === 0)
    return (
      <p className="rounded-xl border border-dashed border-gray-300 dark:border-white/15 px-4 py-6 text-center text-[14px] text-gray-500 dark:text-white/55">
        올린 쪽이 없어요. '수정'에서 주보 이미지를 올려 주세요.
      </p>
    )
  return (
    <ol className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {pages.map((p, i) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => onOpen(i)}
            className="group block w-full text-left"
            aria-label={`${i + 1}쪽 크게 보기`}
          >
            <span className="block aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.05] ring-1 ring-black/[0.06] dark:ring-white/10 shadow-[0_4px_14px_-8px_rgba(0,0,0,0.35)] group-hover:ring-2 group-hover:ring-[var(--brand-glow)] transition">
              <img src={p.thumb_url || p.display_url || p.image_url} alt="" loading="lazy" className="w-full h-full object-cover object-top" />
            </span>
            <span className="mt-1.5 block text-center text-[13px] font-semibold text-gray-500 dark:text-white/55 tabular-nums">{i + 1}쪽</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

const Detail = ({ b, onClose, ...a }: DetailActions & { b: Bulletin; onClose?: () => void }) => {
  const d = bulletinDay(b.bulletin_date)
  const created = new Date(b.created_at)
  const ai = a.aiStatus[String(b.id)]
  const overall = overallAi(ai)
  const busy = a.importingId === b.id
  const locked = a.importingId !== null
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <h2 className="min-w-0 truncate text-[17px] font-extrabold tracking-[-0.015em] text-ink-strong tabular-nums">
          {md(d)} {dayLabel(d)} 주보
        </h2>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onViewPublic(b)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(b)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(b)}
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isDefaultTitle(b) && (
          <p className="mx-4 lg:mx-5 mt-5 -mb-1 text-[15px] font-semibold text-gray-700 dark:text-white/80 break-keep">{b.title}</p>
        )}
        <dl className="grid grid-cols-4 mx-4 lg:mx-5 mt-5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
          {(
            [
              ['쪽', `${b.page_count ?? 0}`, '장'],
              ['조회', `${b.views ?? 0}`, '회'],
              ['주보일', `${d.getMonth() + 1}.${d.getDate()}`, dayLabel(d)],
              ['올린 날', `${created.getMonth() + 1}.${created.getDate()}`, WD[created.getDay()]],
            ] as const
          ).map(([k, v, u]) => (
            <div key={k} className="px-3 lg:px-4 py-3 min-w-0">
              <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
              <dd className="mt-0.5 text-ink-strong whitespace-nowrap">
                <span className="text-[22px] lg:text-[24px] font-extrabold tabular-nums tracking-tight">{v}</span>
                <span className="ml-1 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
              </dd>
            </div>
          ))}
        </dl>

        {b.description && (
          <p className="mx-4 lg:mx-5 mt-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.65] text-gray-700 dark:text-white/75 whitespace-pre-wrap break-keep">
            {b.description}
          </p>
        )}

        {/* AI 읽기 — 등록되면 서버가 알아서 읽는다. 손은 실패했거나 다시 읽힐 때만 */}
        <section className="mx-4 lg:mx-5 mt-6">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-[15px] font-extrabold text-ink-strong">AI 읽기</h3>
            {overall === 'done' && <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-300">모두 끝났어요</span>}
            {overall === 'reading' && <span className="text-[13px] font-semibold text-brand">서버가 읽는 중 — 기다리면 돼요</span>}
            {overall === 'attention' && <span className="text-[13px] font-semibold text-rose-600 dark:text-rose-300">손봐 주세요</span>}
          </div>
          <ul className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] divide-y divide-gray-200/70 dark:divide-white/[0.06]">
            <ReaderLine name="column" status={ai?.column} />
            <ReaderLine
              name="news"
              status={ai?.news}
              action={<RereadBtn label="다시 만들기" busy={busy} locked={locked} onClick={() => a.onImportNews(b)} />}
            />
            <ReaderLine
              name="digital"
              status={ai?.digital}
              action={<RereadBtn label="다시 읽기" busy={busy} locked={locked} onClick={() => a.onImportDigital(b)} />}
            />
          </ul>
          <p className="mt-2 px-1 text-[13px] leading-[1.55] text-gray-500 dark:text-white/55 break-keep">
            {overall === 'attention'
              ? '3번 실패한 읽기가 있어요. 옆 버튼으로 직접 다시 읽혀 주세요.'
              : overall === 'idle'
                ? '2주 넘게 지난 주보는 자동으로 읽지 않아요. 지난 주보를 디지털로 읽히면 공개본은 그대로 두고 초안으로만 남아요.'
                : '등록하면 서버가 칼럼·일정·디지털 주보를 알아서 읽어 바로 공개해요. 다시 읽기는 손으로 고친 디지털 주보를 덮어써요.'}
          </p>
        </section>

        <section className="px-4 lg:px-5 pt-6 pb-8">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
            <I d={IC.eye} size={15} />
            성도에게 이렇게 보여요 <span className="font-medium">— 쪽을 누르면 성도 화면 그대로 넘겨 봐요</span>
          </div>
          <PagesPreview b={b} onOpen={(i) => a.onOpenViewer(b, i)} />
          <div className="sm:hidden mt-5 flex gap-2">
            <button type="button" onClick={() => a.onViewPublic(b)} className="flex-1 h-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-semibold text-gray-700 dark:text-white/80">
              성도 화면에서 보기
            </button>
            <button type="button" onClick={() => a.onDelete(b)} className="h-11 px-5 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = (props: DetailActions & { b: Bulletin; onClose: () => void }) => {
  useModalBackButton(props.onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail {...props} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

const SORTS: [BulletinSort, string][] = [
  ['recent', '최신순'],
  ['oldest', '오래된순'],
  ['views', '조회 많은순'],
]

export interface BulletinDeskProps extends DetailActions {
  bulletins: Bulletin[]
  filtered: Bulletin[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  seg: BulletinSeg
  onSegChange: (v: BulletinSeg) => void
  sort: BulletinSort
  onSortChange: (v: BulletinSort) => void
  onCreate: () => void
  onBack: () => void
  onClearFilters: () => void
  /** 등록 창·뷰어 등 데스크 위에 띄울 것 */
  children?: ReactNode
}

const BulletinDesk = ({
  bulletins,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  seg,
  onSegChange,
  sort,
  onSortChange,
  onCreate,
  onBack,
  onClearFilters,
  children,
  ...actions
}: BulletinDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 고른 주보가 필터에서 빠지면 첫 주보를 보여 준다
  const activeId = filtered.some((b) => b.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (bulletins.find((b) => b.id === activeId) ?? null) : null
  const sheetBulletin = sheetOpen ? (bulletins.find((b) => b.id === selectedId) ?? null) : null

  const sunday = upcomingSunday()
  const upcoming = bulletins.find((b) => sameDay(bulletinDay(b.bulletin_date), sunday))
  const thisYear = new Date().getFullYear()
  const counts: Record<BulletinSeg, number> = {
    all: bulletins.length,
    year: bulletins.filter((b) => bulletinDay(b.bulletin_date).getFullYear() === thisYear).length,
    attention: bulletins.filter((b) => overallAi(actions.aiStatus[String(b.id)]) === 'attention').length,
  }
  const segs: [BulletinSeg, string][] = [
    ['all', '전체'],
    ['year', '올해'],
    ['attention', '확인 필요'],
  ]

  // 날짜순일 때만 달로 묶는다(조회순은 한 줄로)
  const groups = useMemo(() => {
    if (sort === 'views') return [{ key: 'all', label: '', items: filtered }]
    const out: { key: string; label: string; items: Bulletin[] }[] = []
    filtered.forEach((b) => {
      const d = bulletinDay(b.bulletin_date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const last = out[out.length - 1]
      if (last && last.key === key) last.items.push(b)
      else out.push({ key, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`, items: [b] })
    })
    return out
  }, [filtered, sort])

  useDeskHotkeys({
    searchRef,
    canMove: filtered.length > 0,
    onMove: (dir) => {
      const i = filtered.findIndex((b) => b.id === activeId)
      const next = stepIndex(filtered.length, i, dir)
      const id = filtered[next].id
      setSelectedId(id)
      document.getElementById(`bulletin-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    },
  })

  const select = (id: number) => {
    setSelectedId(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const filtering = !!searchTerm || seg !== 'all'

  return (
    <div className={DESK_PAGE_CLS}>
      <div className="max-w-[1320px] mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:min-h-0 lg:h-full lg:grid lg:grid-cols-[420px_minmax(0,1fr)] lg:rounded-3xl lg:overflow-hidden lg:border lg:border-gray-200/70 dark:lg:border-white/[0.08] lg:shadow-2xl">
        {/* ── 왼쪽: 주보 목록 ─────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">주보</h1>
                <p className="mt-0.5 text-[13.5px] text-gray-500 dark:text-white/55">
                  {loading ? ' ' : (
                    <>
                      올해 <span className="font-bold text-brand tabular-nums">{counts.year}</span>호 · 모두{' '}
                      <span className="font-bold text-ink-strong tabular-nums">{bulletins.length}</span>호
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                주보 올리기
              </button>
            </div>

            {/* 이번 주일 주보 — 올라왔는지 한눈에. 아직이면 바로 올리기 */}
            {!loading && (
              upcoming ? (
                <button
                  type="button"
                  onClick={() => select(upcoming.id)}
                  className="w-full flex items-center gap-3 rounded-2xl bg-[var(--brand-soft)] ring-1 ring-[var(--brand-glow)] px-4 py-3 text-left transition hover:ring-brand"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-brand text-white shrink-0">
                    <I d={IC.check} size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-bold text-ink-strong">{md(sunday)} 주일 주보 올라왔어요</span>
                    <span className="block text-[13px] text-gray-600 dark:text-white/65">
                      {overallAi(actions.aiStatus[String(upcoming.id)]) === 'attention'
                        ? 'AI 읽기가 실패했어요 — 눌러서 확인'
                        : overallAi(actions.aiStatus[String(upcoming.id)]) === 'reading'
                          ? 'AI가 소식·디지털 주보를 읽는 중이에요'
                          : `${upcoming.page_count ?? 0}쪽 · 조회 ${upcoming.views ?? 0}`}
                    </span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCreate}
                  className="w-full flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-gray-300 dark:border-white/15 px-4 py-3 text-left transition hover:border-brand group"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 shrink-0 group-hover:text-brand">
                    <I d={IC.plus} size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-bold text-ink-strong">{md(sunday)} 주일 주보가 아직이에요</span>
                    <span className="block text-[13px] text-gray-500 dark:text-white/55">올리면 AI가 소식·디지털 주보까지 알아서 만들어요</span>
                  </span>
                </button>
              )
            )}

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="제목·설명 검색"
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

            <div className="flex items-center gap-2">
              <div className="flex-1 flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                {segs.map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onSegChange(k)}
                    className={`flex-1 whitespace-nowrap px-2 h-8 rounded-lg text-[13px] font-semibold transition ${
                      seg === k ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-ink-strong'
                    }`}
                  >
                    {l}{' '}
                    <span className={`tabular-nums ${k === 'attention' && counts.attention > 0 ? 'text-rose-600 dark:text-rose-300' : seg === k ? 'text-brand' : ''}`}>
                      {counts[k]}
                    </span>
                  </button>
                ))}
              </div>
              <label className="relative shrink-0">
                <span className="sr-only">정렬</span>
                <select
                  value={sort}
                  onChange={(e) => onSortChange(e.target.value as BulletinSort)}
                  className="appearance-none h-10 pl-3 pr-7 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[13px] font-semibold text-gray-700 dark:text-white/75 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] cursor-pointer"
                >
                  {SORTS.map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </label>
            </div>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] font-bold text-ink-strong">
                  {seg === 'attention' && !searchTerm ? '손볼 주보가 없어요' : filtering ? '조건에 맞는 주보가 없어요' : '아직 올린 주보가 없어요'}
                </p>
                {filtering ? (
                  <button type="button" onClick={onClearFilters} className="mt-2 text-[14px] font-semibold text-brand">
                    검색·필터 지우기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">위 '주보 올리기'로 첫 주보를 올려 보세요</p>
                )}
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.key} className="mb-2">
                  {g.label && (
                    <div className="sticky top-14 lg:top-0 z-[5] -mx-2 px-4 pt-2 pb-1.5 flex items-baseline gap-1.5 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
                      <span className="text-[14px] font-extrabold text-ink-strong tabular-nums">{g.label}</span>
                      <span className="text-[13px] font-semibold text-gray-500 dark:text-white/50 tabular-nums">{g.items.length}</span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {g.items.map((b) => (
                      <Row
                        key={b.id}
                        b={b}
                        active={b.id === activeId}
                        isUpcoming={b.id === upcoming?.id}
                        ai={actions.aiStatus[String(b.id)]}
                        onClick={() => select(b.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} b={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 주보를 골라 주세요'}</div>
          )}
        </section>
      </div>

      {/* 지운 주보면 sheetBulletin 이 없어 저절로 닫힌다 */}
      {sheetOpen && sheetBulletin && <MobileDetailSheet key={sheetBulletin.id} b={sheetBulletin} onClose={() => setSheetOpen(false)} {...actions} />}
      {children}
    </div>
  )
}

export default BulletinDesk
