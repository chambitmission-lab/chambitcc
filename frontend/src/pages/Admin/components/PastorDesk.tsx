// 담임목사 관리 — PC(lg+) 작업대
//
// 모바일의 행 펼침(accordion)은 PC에서 인사말이 6줄로 잘리고 폭도 좁아 불편했다.
// 회원 관리(B안)와 같은 '목록 + 상세 고정 2단'으로 바꾼다:
//   왼쪽  목록(검색·상태 세그먼트·정렬) — 각자 스크롤, ↑↓ 이동, / 검색
//   오른쪽 상세 — 인사말 전문·프로필·약력을 실제 화면처럼 펼쳐 보고, 섹션별 '수정'이
//          컴포저의 해당 단계로 바로 연다. 상태 전환·공개 스위치는 상단에서 한 번에.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { pastorTermLabel, pastorText } from '../../../types/pastor'
import type { Pastor, PastorStatus, PastorTextField } from '../../../types/pastor'
import type { PastorComposerStep } from './PastorComposer'

type StatusFilter = 'all' | PastorStatus
type SortKey = 'term' | 'name'
type Lang = 'ko' | 'en'

const STATUS_LABEL: Record<PastorStatus, string> = {
  current: '현 담임목사',
  emeritus: '원로목사',
  former: '전임 담임목사',
}

export interface PastorDeskProps {
  pastors: Pastor[]
  filtered: Pastor[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (v: StatusFilter) => void
  sortKey: SortKey
  onSortKeyChange: (v: SortKey) => void
  onCreate: () => void
  onEdit: (pastor: Pastor, step: PastorComposerStep) => void
  onChangeStatus: (pastor: Pastor, next: PastorStatus) => void
  onToggleVisibility: (pastor: Pastor) => void
  onDelete: (pastor: Pastor) => void
  onViewPublic: () => void
}

const isTypingTarget = (el: Element | null) =>
  !!el &&
  (el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    (el as HTMLElement).isContentEditable)

const PastorDesk = ({
  pastors,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  onSortKeyChange,
  onCreate,
  onEdit,
  onChangeStatus,
  onToggleVisibility,
  onDelete,
  onViewPublic,
}: PastorDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // 고른 분이 필터에서 빠지면 첫 분을 자동으로 보여 준다
  const activeId = filtered.some((p) => p.id === selectedId)
    ? selectedId
    : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (pastors.find((p) => p.id === activeId) ?? null) : null

  const counts = useMemo(
    () => ({
      all: pastors.length,
      current: pastors.filter((p) => p.status === 'current').length,
      emeritus: pastors.filter((p) => p.status === 'emeritus').length,
      former: pastors.filter((p) => p.status === 'former').length,
      hidden: pastors.filter((p) => !p.is_published).length,
    }),
    [pastors],
  )

  // '/' 검색, ↑↓ 이동 (확인창이 떠 있거나 입력 중이면 무시)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return
      if (isTypingTarget(document.activeElement)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      if (filtered.length === 0) return
      e.preventDefault()
      const i = filtered.findIndex((p) => p.id === activeId)
      const next =
        e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      setSelectedId(id)
      document.getElementById(`pastor-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId])

  const SEGMENTS: [StatusFilter, string, number][] = [
    ['all', '전체', counts.all],
    ['current', '현직', counts.current],
    ['emeritus', '원로', counts.emeritus],
    ['former', '전임', counts.former],
  ]

  return (
    <div className="h-[calc(100dvh-56px)] p-4 overflow-hidden bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-[1320px] h-full mx-auto flex rounded-3xl overflow-hidden border border-gray-200/70 dark:border-white/[0.08] bg-background-light dark:bg-background-dark">
        {/* ── 왼쪽: 목록 ─────────────────────────────── */}
        <aside className="w-[340px] shrink-0 flex flex-col border-r border-gray-200/70 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.015]">
          <div className="px-5 pt-5 pb-3 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-[18px] font-bold tracking-[-0.02em] text-ink-strong">담임목사 관리</h1>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
                    ADMIN
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mt-0.5">
                  총 {counts.all}분 · 숨김 {counts.hidden}
                </p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 pl-3 pr-3.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <Icon name="plus" size={15} />
                등록
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <Icon name="search" size={16} />
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder="이름 · 인사말 제목 검색"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onSearchChange('')
                    e.currentTarget.blur()
                  }
                }}
                className="w-full pl-9 pr-10 h-10 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/80"
                  aria-label="검색어 지우기"
                >
                  <Icon name="x" size={14} />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-white/[0.1] text-gray-400 dark:text-white/40">
                  /
                </kbd>
              )}
            </div>

            {/* 상태 세그먼트 */}
            <div className="grid grid-cols-4 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04]">
              {SEGMENTS.map(([v, l, n]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onStatusFilterChange(v)}
                  className={[
                    'h-8 rounded-lg text-[12.5px] font-semibold transition-colors',
                    statusFilter === v
                      ? 'bg-white dark:bg-white/[0.1] text-ink-strong shadow-sm'
                      : 'text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/80',
                  ].join(' ')}
                >
                  {l} <span className={statusFilter === v ? 'text-brand' : ''}>{n}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-500 dark:text-white/50">
                {filtered.length}건{searchTerm && <span className="text-brand"> · "{searchTerm}"</span>}
              </span>
              <div className="flex items-center gap-0.5">
                {(
                  [
                    ['term', '부임 최신순'],
                    ['name', '이름순'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSortKeyChange(v)}
                    className={[
                      'px-2 py-1 rounded-md font-semibold transition-colors',
                      sortKey === v
                        ? 'text-brand bg-[var(--brand-soft)]'
                        : 'text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/80',
                    ].join(' ')}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {counts.current === 0 && counts.all > 0 && (
            <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-[12px] text-ink-strong leading-relaxed">
              현 담임목사가 지정되지 않아 인사말 페이지가 비어 있습니다. 한 분을 골라
              <span className="font-bold"> 현 담임목사</span>로 바꿔 주세요.
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1" role="listbox" aria-label="목사님 목록">
            {loading && pastors.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[68px] rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-14 text-[12.5px] text-gray-400 dark:text-white/40">
                {searchTerm || statusFilter !== 'all'
                  ? '조건에 맞는 기록이 없습니다'
                  : '아직 등록된 목사님이 없어요'}
              </div>
            ) : (
              filtered.map((p) => (
                <ListRow
                  key={p.id}
                  pastor={p}
                  active={p.id === activeId}
                  onClick={() => setSelectedId(p.id)}
                />
              ))
            )}
          </div>

          <div className="px-5 py-2.5 border-t border-gray-200/70 dark:border-white/[0.06] text-[11px] text-gray-400 dark:text-white/35 flex items-center gap-3">
            <span><Kbd>↑</Kbd><Kbd>↓</Kbd> 이동</span>
            <span><Kbd>/</Kbd> 검색</span>
          </div>
        </aside>

        {/* ── 오른쪽: 상세 ─────────────────────────────── */}
        <section aria-label="목사님 상세" className="flex-1 min-w-0 overflow-y-auto">
          {selected ? (
            <Detail
              key={selected.id}
              pastor={selected}
              onEdit={(step) => onEdit(selected, step)}
              onChangeStatus={(next) => onChangeStatus(selected, next)}
              onToggleVisibility={() => onToggleVisibility(selected)}
              onDelete={() => onDelete(selected)}
              onViewPublic={onViewPublic}
            />
          ) : (
            !loading && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-[13.5px] text-gray-400 dark:text-white/40">
                {pastors.length === 0 ? (
                  <>
                    <span>아직 등록된 목사님이 없어요</span>
                    <button
                      type="button"
                      onClick={onCreate}
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13px] font-bold"
                    >
                      <Icon name="plus" size={15} />
                      담임목사 등록
                    </button>
                  </>
                ) : (
                  '왼쪽에서 목사님을 골라 주세요'
                )}
              </div>
            )
          )}
        </section>
      </div>
    </div>
  )
}

// ── 목록 행 ─────────────────────────────────────────────
const ListRow = ({
  pastor,
  active,
  onClick,
}: {
  pastor: Pastor
  active: boolean
  onClick: () => void
}) => {
  const term = pastorTermLabel(pastor, 'ko')
  return (
    <button
      id={`pastor-row-${pastor.id}`}
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition-colors border',
        active
          ? 'bg-[var(--brand-soft)] border-[var(--brand-glow)]'
          : 'border-transparent hover:bg-gray-100/80 dark:hover:bg-white/[0.04]',
      ].join(' ')}
    >
      <Avatar pastor={pastor} className="w-11 h-11 rounded-lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[14px] font-bold truncate ${active ? 'text-brand' : 'text-ink-strong'}`}>
            {pastor.name_ko}
          </span>
          <StatusBadge status={pastor.status} small />
          {!pastor.is_published && <HiddenBadge small />}
        </div>
        <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
          {pastor.role_ko || STATUS_LABEL[pastor.status]}
          {term && <span className="text-gray-400 dark:text-white/35"> · {term}</span>}
        </div>
        <div className="text-[11px] text-gray-400 dark:text-white/40 truncate mt-0.5">
          {pastor.greeting_title_ko || '인사말 제목 없음'}
        </div>
      </div>
    </button>
  )
}

// ── 상세 ─────────────────────────────────────────────
type ReadyItem = { label: string; done: boolean; step: PastorComposerStep }

const filled = (v?: string | null) => !!v && v.trim().length > 0

const readiness = (p: Pastor): ReadyItem[] => [
  { label: '사진', done: filled(p.photo_url), step: 'basic' },
  { label: '부임일', done: filled(p.term_start), step: 'basic' },
  { label: '인사말 제목', done: filled(p.greeting_title_ko), step: 'greeting' },
  { label: '인사말 본문', done: filled(p.greeting_body_ko), step: 'greeting' },
  { label: '맺음말', done: filled(p.signature_ko), step: 'greeting' },
  { label: '한 줄 소개', done: filled(p.profile_headline_ko), step: 'profile' },
  { label: '약력', done: filled(p.education_ko) || filled(p.career_ko), step: 'profile' },
  { label: '영문 이름', done: filled(p.name_en), step: 'basic' },
  { label: '영문 인사말', done: filled(p.greeting_body_en), step: 'greeting' },
]

const Detail = ({
  pastor,
  onEdit,
  onChangeStatus,
  onToggleVisibility,
  onDelete,
  onViewPublic,
}: {
  pastor: Pastor
  onEdit: (step: PastorComposerStep) => void
  onChangeStatus: (next: PastorStatus) => void
  onToggleVisibility: () => void
  onDelete: () => void
  onViewPublic: () => void
}) => {
  const [lang, setLang] = useState<Lang>('ko')
  const t = (f: PastorTextField) => pastorText(pastor, f, lang)
  // 영문 보기에서 영문이 비어 한국어로 폴백된 칸을 표시한다
  const isFallback = (f: PastorTextField) =>
    lang === 'en' && !filled(pastor[`${f}_en` as keyof Pastor] as string | null) &&
    filled(pastor[`${f}_ko` as keyof Pastor] as string | null)

  const ready = readiness(pastor)
  const doneCount = ready.filter((r) => r.done).length
  const missing = ready.filter((r) => !r.done)
  const term = pastorTermLabel(pastor, 'ko')
  const isCurrent = pastor.status === 'current'

  const greetingParas = t('greeting_body')
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div>
      {/* 상단 작업줄 */}
      <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200/70 dark:border-white/[0.08] px-7 h-14 flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[15px] font-bold text-ink-strong truncate">{pastor.name_ko}</span>
          <StatusBadge status={pastor.status} />
          {!pastor.is_published && <HiddenBadge />}
        </div>

        <PublishSwitch on={pastor.is_published} onToggle={onToggleVisibility} />

        <div className="w-px h-6 bg-gray-200 dark:bg-white/[0.08]" />

        <button
          type="button"
          onClick={onViewPublic}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
        >
          <Icon name="external" size={14} />
          인사말 페이지
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 dark:text-white/40 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-500/10 transition-colors"
          aria-label="삭제"
          title="삭제"
        >
          <Icon name="trash" size={16} />
        </button>
        <button
          type="button"
          onClick={() => onEdit('basic')}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13px] font-bold transition-colors"
        >
          <Icon name="edit" size={14} />
          수정
        </button>
      </div>

      <div className="px-7 py-6 space-y-5 max-w-[1040px]">
        {/* 히어로: 사진 + 기본 정보 + 상태 전환 */}
        <div className="flex gap-6 p-5 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
          <button
            type="button"
            onClick={() => onEdit('basic')}
            className="group relative shrink-0 w-[132px] h-[168px] rounded-2xl overflow-hidden border border-gray-200/70 dark:border-white/[0.08] bg-[var(--brand-soft)]"
            title="사진 바꾸기"
          >
            {pastor.photo_url ? (
              <img src={pastor.photo_url} alt={pastor.name_ko} className="w-full h-full object-cover object-top" />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[12px] font-semibold text-brand">
                <Icon name="camera" size={22} />
                사진 등록
              </span>
            )}
            {pastor.photo_url && (
              <span className="absolute inset-x-0 bottom-0 py-1.5 text-[11px] font-semibold text-white bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
                사진 바꾸기
              </span>
            )}
          </button>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2 className="text-[26px] font-bold tracking-[-0.025em] text-ink-strong">{pastor.name_ko}</h2>
              {pastor.name_en && (
                <span className="text-[14px] text-gray-400 dark:text-white/40">{pastor.name_en}</span>
              )}
            </div>
            <p className="text-[14px] text-gray-600 dark:text-white/70 mt-0.5">
              {pastor.role_ko || '담임목사'}
              {pastor.nickname_ko && (
                <span className="text-gray-400 dark:text-white/40"> · “{pastor.nickname_ko}”</span>
              )}
            </p>

            <dl className="grid grid-cols-3 gap-3 mt-4 text-[12.5px]">
              <Fact label="부임" value={pastor.term_start || '—'} />
              <Fact label="이임" value={pastor.term_end || (isCurrent ? '재직 중' : '—')} />
              <Fact label="재임 기간" value={term || '—'} />
            </dl>

            <div className="mt-auto pt-4">
              <div className="text-[11.5px] font-semibold text-gray-500 dark:text-white/50 mb-1.5">
                인사말 페이지에서의 자리
              </div>
              <div className="inline-grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04]">
                {(['current', 'emeritus', 'former'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => pastor.status !== s && onChangeStatus(s)}
                    className={[
                      'h-8 px-4 rounded-lg text-[12.5px] font-semibold transition-colors whitespace-nowrap',
                      pastor.status === s
                        ? s === 'current'
                          ? 'bg-brand text-white shadow-sm'
                          : 'bg-white dark:bg-white/[0.1] text-ink-strong shadow-sm'
                        : 'text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/80',
                    ].join(' ')}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              {!isCurrent && (
                <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1.5">
                  현 담임목사로 바꾸면 기존 현직은 전임으로 내려가고 기록은 그대로 남습니다.
                </p>
              )}
            </div>
          </div>

          {/* 준비 상태 */}
          <div className="w-[220px] shrink-0 pl-5 border-l border-gray-200/70 dark:border-white/[0.06]">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold text-gray-500 dark:text-white/50">준비 상태</span>
              <span className="text-[13px] font-bold text-ink-strong">
                <span className="text-brand text-[18px]">{doneCount}</span>/{ready.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-[width]"
                style={{ width: `${(doneCount / ready.length) * 100}%` }}
              />
            </div>
            {missing.length === 0 ? (
              <p className="text-[12px] text-gray-500 dark:text-white/55 mt-3">모든 항목이 채워졌어요.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {missing.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => onEdit(m.step)}
                    className="text-[11.5px] font-semibold px-2 py-1 rounded-lg bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-ink-strong hover:brightness-95 transition"
                    title={`${m.label} 채우기`}
                  >
                    + {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 언어 전환 */}
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/50">화면 미리보기</h3>
          <div className="inline-grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04]">
            {(
              [
                ['ko', '한국어'],
                ['en', 'English'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setLang(v)}
                className={[
                  'h-7 px-3.5 rounded-lg text-[12px] font-semibold transition-colors',
                  lang === v
                    ? 'bg-white dark:bg-white/[0.1] text-ink-strong shadow-sm'
                    : 'text-gray-500 dark:text-white/50',
                ].join(' ')}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
          {/* 인사말 전문 */}
          <Panel title="인사말" onEdit={() => onEdit('greeting')} fallback={isFallback('greeting_body')}>
            {filled(t('greeting_title')) || greetingParas.length > 0 ? (
              <article className="px-1">
                {filled(t('greeting_title')) && (
                  <h4 className="text-[21px] font-bold tracking-[-0.02em] text-ink-strong leading-snug mb-4">
                    {t('greeting_title')}
                  </h4>
                )}
                <div className="space-y-3.5 text-[14.5px] leading-[1.85] text-gray-700 dark:text-white/80">
                  {greetingParas.map((para, i) => (
                    <p key={i} className="whitespace-pre-wrap">{para}</p>
                  ))}
                </div>
                {filled(t('signature')) && (
                  <p className="mt-6 text-right text-[14px] font-semibold text-ink-strong">{t('signature')}</p>
                )}
              </article>
            ) : (
              <EmptyHint label="인사말을 아직 쓰지 않았어요" onClick={() => onEdit('greeting')} />
            )}
          </Panel>

          <div className="space-y-5">
            {/* 프로필 */}
            <Panel title="프로필" onEdit={() => onEdit('profile')} fallback={isFallback('profile_intro')}>
              {filled(t('profile_headline')) || filled(t('profile_intro')) ? (
                <div className="space-y-2.5">
                  {filled(t('profile_headline')) && (
                    <p className="text-[14px] font-bold text-ink-strong leading-snug">{t('profile_headline')}</p>
                  )}
                  {filled(t('profile_intro')) && (
                    <p className="text-[13px] leading-[1.75] text-gray-600 dark:text-white/70 whitespace-pre-wrap">
                      {t('profile_intro')}
                    </p>
                  )}
                </div>
              ) : (
                <EmptyHint label="소개 글이 비어 있어요" onClick={() => onEdit('profile')} />
              )}
            </Panel>

            {/* 약력 */}
            <Panel title="약력" onEdit={() => onEdit('profile')} fallback={isFallback('career')}>
              {filled(t('education')) || filled(t('career')) || filled(t('awards')) ? (
                <div className="space-y-4">
                  <LineList label="학력" text={t('education')} />
                  <LineList label="주요 경력" text={t('career')} />
                  <LineList label="수상 내역" text={t('awards')} />
                </div>
              ) : (
                <EmptyHint label="학력·경력이 비어 있어요" onClick={() => onEdit('profile')} />
              )}
            </Panel>
          </div>
        </div>

        <p className="text-[11.5px] text-gray-400 dark:text-white/40 leading-[1.6]">
          * 목사님이 바뀌어도 이 기록은 지우지 마세요. 새로 등록해 <span className="font-semibold">현 담임목사</span>로
          지정하면 이전 분은 역대 담임목사로 남습니다. 화면에서만 감추려면 삭제 대신 공개 스위치를 끄세요.
        </p>
      </div>
    </div>
  )
}

// ── 작은 조각 ─────────────────────────────────────────────
const Panel = ({
  title,
  onEdit,
  fallback,
  children,
}: {
  title: string
  onEdit: () => void
  fallback?: boolean
  children: ReactNode
}) => (
  <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
    <div className="flex items-center justify-between gap-2 px-5 h-12 border-b border-gray-200/60 dark:border-white/[0.05]">
      <div className="flex items-center gap-2">
        <span className="text-[13.5px] font-bold text-ink-strong">{title}</span>
        {fallback && (
          <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--amber-soft)] text-ink-strong">
            영문 없음 · 한국어 표시
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[12px] font-semibold text-brand hover:bg-[var(--brand-soft)] transition-colors"
      >
        <Icon name="edit" size={13} />
        수정
      </button>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

const LineList = ({ label, text }: { label: string; text: string }) => {
  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  return (
    <div>
      <div className="text-[11.5px] font-bold text-gray-400 dark:text-white/40 mb-1.5">{label}</div>
      <ul className="space-y-1">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-[1.6] text-gray-700 dark:text-white/75">
            <span className="mt-[9px] w-1 h-1 rounded-full bg-gray-300 dark:bg-white/25 shrink-0" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const EmptyHint = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full py-8 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.1] text-[12.5px] text-gray-400 dark:text-white/40 hover:border-[var(--brand-glow)] hover:text-brand transition-colors"
  >
    {label} · <span className="font-semibold">지금 쓰기</span>
  </button>
)

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <dt className="text-[11px] text-gray-400 dark:text-white/40">{label}</dt>
    <dd className="font-semibold text-ink-strong truncate mt-0.5">{value}</dd>
  </div>
)

const PublishSwitch = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onToggle}
    className="inline-flex items-center gap-2 h-9 px-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
    title={on ? '인사말 페이지에 표시 중' : '숨김 (관리자만 확인)'}
  >
    <span className={`text-[12.5px] font-semibold ${on ? 'text-ink-strong' : 'text-gray-500 dark:text-white/50'}`}>
      {on ? '공개' : '숨김'}
    </span>
    <span className={`relative w-9 h-5 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'}`}>
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </span>
  </button>
)

const StatusBadge = ({ status, small }: { status: PastorStatus; small?: boolean }) => {
  const label = status === 'current' ? '현직' : status === 'emeritus' ? '원로' : '전임'
  const cls =
    status === 'current'
      ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
      : 'bg-gray-100 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60'
  return (
    <span
      className={`shrink-0 font-bold rounded-full border ${cls} ${
        small ? 'text-[9.5px] px-1.5 py-px' : 'text-[11px] px-2 py-0.5'
      }`}
    >
      {label}
    </span>
  )
}

const HiddenBadge = ({ small }: { small?: boolean }) => (
  <span
    className={`shrink-0 font-bold rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 ${
      small ? 'text-[9.5px] px-1.5 py-px' : 'text-[11px] px-2 py-0.5'
    }`}
  >
    숨김
  </span>
)

const Avatar = ({ pastor, className }: { pastor: Pastor; className: string }) => (
  <div
    className={`shrink-0 overflow-hidden bg-[var(--brand-soft-strong)] border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center ${className}`}
  >
    {pastor.photo_url ? (
      <img src={pastor.photo_url} alt="" className="w-full h-full object-cover object-top" />
    ) : (
      <span className="text-[15px] font-bold text-brand">{pastor.name_ko.slice(0, 1)}</span>
    )}
  </div>
)

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-block min-w-[18px] text-center text-[10px] font-semibold px-1 py-px mr-0.5 rounded border border-gray-200 dark:border-white/[0.1]">
    {children}
  </kbd>
)

const ICON_PATHS: Record<string, ReactNode> = {
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  external: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
}

const Icon = ({ name, size = 16 }: { name: keyof typeof ICON_PATHS; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {ICON_PATHS[name]}
  </svg>
)

export default PastorDesk
