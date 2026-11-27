// 오늘의 말씀 관리 — 관리 데스크(2026-11-27, 교회소식·공지·교육 데스크와 같은 문법)
//
// 예전 화면은 날짜별 '오늘·예정·지난' 필터를 보여 줬지만, 서버엔 게시일이 없다 — 말씀은
// 한 번에 하나만 걸리고(새로 등록하면 바로 교체) 지난 말씀은 다시 걸 수 있을 뿐이다.
// 그래서 화면도 그 실제 구조대로:
//   PC(lg+)  왼쪽 '지금 걸린 말씀' 카드 + 보관함 목록(검색) / 오른쪽 상세(다시 걸기·수정·삭제 +
//            홈 명판 미리보기 AnnualThemeVerse 그대로) — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 작성·수정은 DailyVerseComposer(2단 모달). 데이터·액션은 DailyVerseManagement 가 쥔다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { DailyVerse } from '../../../types/dailyVerse'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { calendarDaysSince, formatDotDateTime } from '../../../utils/dateUtils'
import AnnualThemeVerse from '../../Home/components/AnnualThemeVerse'
import { isLiveVerse } from './dailyVerseDeskUtils'

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

const WD = ['일', '월', '화', '수', '목', '금', '토']
const ageLabel = (iso: string) => {
  const d = calendarDaysSince(iso)
  if (d <= 0) return '오늘'
  if (d < 30) return `${d}일 전`
  if (d < 365) return `${Math.floor(d / 30)}달 전`
  return `${Math.floor(d / 365)}년 전`
}

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
  ext: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  pin: <><path d="M12 17v5" /><path d="M9 2h6l-1 6 3.5 3.5V14h-11v-2.5L10 8 9 2z" /></>,
  repeat: <><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></>,
}

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

const LiveBadge = () => (
  <span className="inline-flex items-center gap-1 shrink-0 h-[22px] px-2 rounded-md text-[12px] font-bold bg-brand text-white">
    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
    지금 걸림
  </span>
)

// ── 지금 걸린 말씀 ───────────────────────────────────────

const LiveCard = ({ verse, active, onClick, onCreate }: { verse: DailyVerse | null; active: boolean; onClick: () => void; onCreate: () => void }) =>
  verse ? (
    <button
      id={`verse-row-${verse.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full text-left rounded-2xl px-4 py-3.5 transition ${
        active ? 'bg-[var(--brand-soft-strong)] ring-1 ring-[var(--brand-glow)]' : 'bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)]'
      }`}
    >
      <span className="flex items-center gap-2 text-[12.5px] font-bold text-brand">
        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
        지금 홈에 걸린 말씀
      </span>
      <span className="mt-1.5 block text-[16.5px] font-extrabold tracking-[-0.015em] text-ink-strong">{verse.verse_reference}</span>
      <span className="mt-0.5 block text-[14px] leading-[1.6] text-gray-700 dark:text-white/75 line-clamp-2 break-keep">{verse.verse_text}</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={onCreate}
      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left border border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition"
    >
      <span className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-brand text-white">
        <I d={IC.book} size={19} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-bold text-ink-strong">지금 홈에 걸린 말씀이 없어요</span>
        <span className="block text-[13px] text-gray-600 dark:text-white/60 truncate">홈 맨 위 명판이 비어 있어요 — 눌러서 걸어요</span>
      </span>
    </button>
  )

// ── 보관함 행 ────────────────────────────────────────────

const Row = ({ verse, active, onClick }: { verse: DailyVerse; active: boolean; onClick: () => void }) => {
  const d = new Date(verse.created_at)
  return (
    <button
      id={`verse-row-${verse.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className="shrink-0 w-[52px] text-center pt-0.5">
        <span className={`block text-[26px] leading-none font-extrabold tabular-nums tracking-tight ${active ? 'lg:text-brand text-ink-strong' : 'text-ink-strong'}`}>
          {d.getDate()}
        </span>
        <span className="block mt-1 whitespace-nowrap text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
          {d.getMonth() + 1}월 · {WD[d.getDay()]}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          {isLiveVerse(verse) && <LiveBadge />}
          <span className="truncate text-[15.5px] font-bold tracking-[-0.01em] text-ink-strong">{verse.verse_reference}</span>
        </span>
        <span className="block mt-1 text-[13.5px] leading-[1.55] text-gray-600 dark:text-white/60 line-clamp-2 break-keep">{verse.verse_text}</span>
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

// ── 상세 ─────────────────────────────────────────────────

export interface VerseDeskActions {
  onEdit: (v: DailyVerse) => void
  onActivate: (v: DailyVerse) => void
  onDelete: (v: DailyVerse) => void
  onViewHome: () => void
}

const Detail = ({ verse, onClose, ...a }: VerseDeskActions & { verse: DailyVerse; onClose?: () => void }) => {
  const live = isLiveVerse(verse)
  const edited = verse.updated_at && verse.updated_at !== verse.created_at
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        {live ? (
          <span className="inline-flex items-center gap-2 text-[14px] font-bold text-brand whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            지금 홈에 걸려 있어요
          </span>
        ) : (
          <button
            type="button"
            onClick={() => a.onActivate(verse)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[var(--brand-glow)] bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold whitespace-nowrap hover:bg-[var(--brand-soft-strong)] transition"
          >
            <I d={IC.repeat} size={15} />
            이 말씀 다시 걸기
          </button>
        )}
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="홈에서 보기" onClick={a.onViewHome} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(verse)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(verse)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-6 pb-10 max-w-[680px] space-y-5">
          <header>
            <p className="text-[13px] font-bold text-gray-500 dark:text-white/55">{live ? '지금 걸린 말씀' : '보관함'}</p>
            <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-ink-strong leading-tight break-keep">{verse.verse_reference}</h2>
            <p className="mt-2 text-[16px] leading-[1.8] text-gray-800 dark:text-white/85 whitespace-pre-wrap break-keep">{verse.verse_text}</p>
          </header>

          {!live && (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3 text-[14px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              지금은 홈에 안 보여요. 위 <b className="font-bold text-brand">다시 걸기</b>를 누르면 지금 걸린 말씀과 바로 바뀌어요.
            </p>
          )}

          <section>
            <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
              <I d={IC.eye} size={15} />
              {live ? '성도 홈에 지금 이렇게 보여요' : '다시 걸면 홈에 이렇게 보여요'}
            </div>
            <div className="max-w-[560px]">
              <AnnualThemeVerse preview={{ verse_reference: verse.verse_reference, verse_text: verse.verse_text }} />
            </div>
            <p className="mt-2 text-[12.5px] text-gray-400 dark:text-white/40 break-keep">
              홈 맨 위 명판 · 참비 첫 화면 · 집중 기도 · 말씀 사진 카드 추천에 같은 말씀이 쓰여요.
            </p>
          </section>

          <dl className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
            {(
              [
                ['등록', `${formatDotDateTime(verse.created_at)} · ${ageLabel(verse.created_at)}`],
                ...(edited ? ([['마지막 수정', formatDotDateTime(verse.updated_at)]] as const) : []),
                ['글자 수', `${verse.verse_text.length}자`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[14px] text-gray-500 dark:text-white/55">{k}</dt>
                <dd className="text-[14.5px] font-semibold text-ink-strong tabular-nums text-right">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="sm:hidden">
            <button type="button" onClick={() => a.onDelete(verse)} className="w-full h-11 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ verse, onClose, ...a }: VerseDeskActions & { verse: DailyVerse; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail verse={verse} onClose={onClose} {...a} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

export interface DailyVerseDeskProps extends VerseDeskActions {
  verses: DailyVerse[]
  /** 보관함(지금 걸린 말씀 제외) — 검색 적용, 최근 등록 순 */
  archive: DailyVerse[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onBack: () => void
}

const DailyVerseDesk = ({
  verses,
  archive,
  loading,
  searchTerm,
  onSearchChange,
  selectedId,
  onSelect,
  onCreate,
  onBack,
  ...actions
}: DailyVerseDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const live = verses.find(isLiveVerse) ?? null
  // 위→아래 보이는 순서: 지금 걸린 말씀 → 보관함
  const order = useMemo(() => [...(live ? [live] : []), ...archive], [live, archive])
  const activeId = order.some((v) => v.id === selectedId) ? selectedId : (order[0]?.id ?? null)
  const selected = activeId != null ? (verses.find((v) => v.id === activeId) ?? null) : null
  const sheetVerse = sheetOpen ? (verses.find((v) => v.id === selectedId) ?? null) : null

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
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || order.length === 0) return
      e.preventDefault()
      const i = order.findIndex((v) => v.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(order.length - 1, i + 1) : Math.max(0, i - 1)
      const id = order[next].id
      onSelect(id)
      document.getElementById(`verse-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [order, activeId, onSelect])

  const select = (id: number) => {
    onSelect(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const archiveTotal = verses.filter((v) => !isLiveVerse(v)).length

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:min-h-0 lg:h-[calc(100dvh-56px)] lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1320px] mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:min-h-0 lg:h-full lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:rounded-3xl lg:overflow-hidden lg:border lg:border-gray-200/70 dark:lg:border-white/[0.08] lg:shadow-2xl">
        {/* ── 왼쪽: 지금 걸린 말씀 + 보관함 ─────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">오늘의 말씀</h1>
                <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/55">홈 맨 위 명판에 한 번에 하나만 걸려요</p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                새 말씀
              </button>
            </div>

            {loading ? (
              <div className="h-[104px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            ) : (
              <LiveCard verse={live} active={!!live && live.id === activeId} onClick={() => live && select(live.id)} onCreate={onCreate} />
            )}

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="보관함에서 구절·말씀 찾기"
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

            <p className="px-1 text-[13px] font-bold text-gray-500 dark:text-white/55">
              보관함 <span className="text-ink-strong tabular-nums">{searchTerm ? `${archive.length}/${archiveTotal}` : archiveTotal}</span>
              <span className="ml-1.5 font-medium text-gray-400 dark:text-white/40">— 골라서 다시 걸 수 있어요</span>
            </p>
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : archive.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{searchTerm ? '맞는 말씀이 없어요' : '보관함이 비어 있어요'}</p>
                {searchTerm ? (
                  <button type="button" onClick={() => onSearchChange('')} className="mt-2 text-[14px] font-semibold text-brand">
                    검색어 지우기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55 break-keep">새 말씀을 걸면 지금 말씀이 여기로 내려와요</p>
                )}
              </div>
            ) : (
              archive.map((v) => <Row key={v.id} verse={v} active={v.id === activeId} onClick={() => select(v.id)} />)
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} verse={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '새 말씀을 걸어 시작해요'}</div>
          )}
        </section>
      </div>

      {sheetOpen && sheetVerse && <MobileDetailSheet key={sheetVerse.id} verse={sheetVerse} onClose={() => setSheetOpen(false)} {...actions} />}
    </div>
  )
}

export default DailyVerseDesk
