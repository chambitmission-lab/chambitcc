// 교육과 훈련 관리 (admin, /admin/education)
//
// 카테고리(주일학교·청년부…) 행을 펼치면 그 아래 프로그램(영유아부·1청년부…)이 나온다.
// 레거시가 이미지로 박아 두던 시간·담당·장소를 여기서 데이터로 고친다 — 담당자가
// 바뀌어도 포토샵이 필요 없다. 순서는 ↑↓ 로 이웃과 맞바꾼다.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import {
  useAdminEducationTree,
  useDeleteCategory,
  useDeleteProgram,
  useMoveCategory,
  useMoveProgram,
  useUpdateCategory,
  useUpdateProgram,
} from '../../hooks/useEducation'
import type { EducationCategory, EducationProgram } from '../../types/education'
import EducationComposer, { type ComposerTarget } from './components/EducationComposer'
import { EduGlyph, SproutIcon } from '../Education/EduIcons'
import { FilterChip, FilterRow } from './components/FilterControls'

type VisibilityFilter = 'all' | 'active' | 'hidden'

const EducationManagement = () => {
  const navigate = useNavigate()
  const admin = isAdmin()

  const { data, isPending, isError, refetch } = useAdminEducationTree(admin)
  const categories = useMemo(() => data?.categories ?? [], [data])
  const moveCategory = useMoveCategory()
  const moveProgram = useMoveProgram()
  const updateCategory = useUpdateCategory()
  const updateProgram = useUpdateProgram()
  const deleteCategory = useDeleteCategory()
  const deleteProgram = useDeleteProgram()

  const [searchTerm, setSearchTerm] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('all')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [composer, setComposer] = useState<ComposerTarget | null>(null)

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  useEffect(() => {
    if (isError) showToast('교육과 훈련 목록을 불러오지 못했습니다', 'error')
  }, [isError])

  // 검색어가 있으면 매칭 카테고리는 자동으로 펼친다
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return categories
      .map((c) => {
        const programs = c.programs.filter((p) => {
          const matchesSearch =
            !q ||
            p.name_ko.toLowerCase().includes(q) ||
            (p.leader_ko?.toLowerCase().includes(q) ?? false) ||
            (p.location_ko?.toLowerCase().includes(q) ?? false)
          const matchesVis =
            visibility === 'all' || (visibility === 'active' ? p.is_active : !p.is_active)
          return matchesSearch && matchesVis
        })
        const selfMatch = !q || c.name_ko.toLowerCase().includes(q)
        const selfVis =
          visibility === 'all' || (visibility === 'active' ? c.is_active : !c.is_active)
        const keep = (selfMatch && selfVis) || programs.length > 0
        return keep ? { ...c, programs: q ? programs : c.programs.filter((p) => visibility === 'all' || (visibility === 'active' ? p.is_active : !p.is_active)) } : null
      })
      .filter((c): c is EducationCategory => c !== null)
  }, [categories, searchTerm, visibility])

  const isOpen = (id: number) => expanded.has(id) || searchTerm.trim().length > 0
  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const programCount = categories.reduce((n, c) => n + c.programs.length, 0)
  const hiddenCount =
    categories.filter((c) => !c.is_active).length +
    categories.reduce((n, c) => n + c.programs.filter((p) => !p.is_active).length, 0)
  const pendingCount = categories.reduce(
    (n, c) => n + c.programs.filter((p) => !p.meeting_time_ko && !p.leader_ko && !p.location_ko).length,
    0,
  )

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn()
      if (ok) showToast(ok, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '실패했습니다', 'error')
    }
  }

  const handleDeleteCategory = async (c: EducationCategory) => {
    if (
      !(await confirmDialog({
        title: '카테고리 삭제',
        message: `"${c.name_ko}"를 삭제할까요?`,
        description: `아래 프로그램 ${c.programs.length}개도 함께 삭제되며 되돌릴 수 없습니다. 화면에서만 감추려면 "숨김"을 쓰세요.`,
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    await run(() => deleteCategory.mutateAsync(c.id), '삭제되었습니다')
  }

  const handleDeleteProgram = async (p: EducationProgram) => {
    if (
      !(await confirmDialog({
        title: '프로그램 삭제',
        message: `"${p.name_ko}"를 삭제할까요?`,
        description: '되돌릴 수 없습니다. 화면에서만 감추려면 "숨김"을 쓰세요.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    await run(() => deleteProgram.mutateAsync(p.id), '삭제되었습니다')
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-24 lg:max-w-[1100px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border">
        {/* 헤더 */}
        <div className="sticky top-0 lg:static lg:rounded-t-3xl z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">교육과 훈련 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-5 lg:pt-4">
          {/* 우측 도구 */}
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 lg:space-y-3">
            <button
              type="button"
              onClick={() => setComposer({ kind: 'category' })}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
            >
              <PlusIcon /> 카테고리 추가
            </button>

            <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 flex gap-2 flex-wrap">
              <StatChip label="카테고리" value={categories.length} />
              <StatChip label="프로그램" value={programCount} accent />
              <StatChip label="미확인" value={pendingCount} warn={pendingCount > 0} />
              <StatChip label="숨김" value={hiddenCount} />
            </div>

            <div className="px-4 py-3 lg:px-0 lg:py-0">
              <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
                <div className="relative z-10 space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="부서 · 담당 · 장소 검색"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <FilterRow label="상태" align="center">
                    {([['all', '전체'], ['active', '공개'], ['hidden', '숨김']] as const).map(([v, l]) => (
                      <FilterChip key={v} active={visibility === v} onClick={() => setVisibility(v)}>
                        {l}
                      </FilterChip>
                    ))}
                  </FilterRow>
                </div>
              </div>
            </div>

            <div className="px-5 pb-2 lg:px-1">
              <button type="button" onClick={() => navigate('/education')} className="text-[12px] font-semibold text-brand hover:underline">
                교육과 훈련 페이지에서 보기 →
              </button>
            </div>
          </div>

          {/* 목록 */}
          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            {pendingCount > 0 && !searchTerm && (
              <div className="mx-4 lg:mx-0 mb-2 px-3.5 py-3 rounded-2xl bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-[12.5px] text-ink-strong leading-relaxed">
                시간·담당·장소가 모두 비어 있는 프로그램이 <span className="font-bold">{pendingCount}개</span> 있어요.
                레거시 홈페이지 이미지를 참고해 채워주세요 — 비워두면 화면에서 "곧 채워집니다"로 보입니다.
              </div>
            )}

            <div className="px-4 pb-32 lg:px-0 lg:pb-8 space-y-2">
              {isPending && categories.length === 0 ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <SproutIcon width={36} height={36} className="mx-auto mb-3 text-gray-400 dark:text-white/40" />
                  <p className="text-[13px] text-gray-500 dark:text-white/55">
                    {searchTerm ? '조건에 맞는 항목이 없습니다' : '아직 카테고리가 없어요'}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                    {searchTerm ? '검색어를 지워보세요' : '＋ 카테고리 버튼으로 시작하세요 (마이그레이션 시드가 있으면 자동으로 채워집니다)'}
                  </p>
                </div>
              ) : (
                filtered.map((c, index) => (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    expanded={isOpen(c.id)}
                    isFirst={index === 0}
                    isLast={index === filtered.length - 1}
                    onToggle={() => toggle(c.id)}
                    onEdit={() => setComposer({ kind: 'category', category: c })}
                    onMove={(d) => run(() => moveCategory.mutateAsync({ id: c.id, direction: d }))}
                    onToggleVisibility={() =>
                      run(
                        () => updateCategory.mutateAsync({ id: c.id, data: { is_active: !c.is_active } }),
                        c.is_active ? '숨김으로 전환했어요' : '공개로 전환했어요',
                      )
                    }
                    onDelete={() => handleDeleteCategory(c)}
                    onAddProgram={() => setComposer({ kind: 'program', categoryId: c.id })}
                    onEditProgram={(p) => setComposer({ kind: 'program', categoryId: c.id, program: p })}
                    onMoveProgram={(p, d) => run(() => moveProgram.mutateAsync({ id: p.id, direction: d }))}
                    onToggleProgram={(p) =>
                      run(
                        () => updateProgram.mutateAsync({ id: p.id, data: { is_active: !p.is_active } }),
                        p.is_active ? '숨김으로 전환했어요' : '공개로 전환했어요',
                      )
                    }
                    onDeleteProgram={handleDeleteProgram}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setComposer({ kind: 'category' })}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 lg:hidden inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_var(--brand-glow)] transition-all"
        >
          <PlusIcon />
          <span>카테고리</span>
        </button>

        {composer && (
          <EducationComposer
            key={
              composer.kind === 'category'
                ? `c-${composer.category?.id ?? 'new'}`
                : `p-${composer.program?.id ?? `new-${composer.categoryId}`}`
            }
            target={composer}
            categories={categories}
            onClose={() => setComposer(null)}
            onSuccess={() => {
              setComposer(null)
              void refetch()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Category row ──────────────────────────────────────
const CategoryRow = ({
  category,
  expanded,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onMove,
  onToggleVisibility,
  onDelete,
  onAddProgram,
  onEditProgram,
  onMoveProgram,
  onToggleProgram,
  onDeleteProgram,
}: {
  category: EducationCategory
  expanded: boolean
  isFirst: boolean
  isLast: boolean
  onToggle: () => void
  onEdit: () => void
  onMove: (d: 'up' | 'down') => void
  onToggleVisibility: () => void
  onDelete: () => void
  onAddProgram: () => void
  onEditProgram: (p: EducationProgram) => void
  onMoveProgram: (p: EducationProgram, d: 'up' | 'down') => void
  onToggleProgram: (p: EducationProgram) => void
  onDeleteProgram: (p: EducationProgram) => void
}) => (
  <div
    className={[
      'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200 shadow-sm',
      expanded ? 'border-[var(--brand-glow)]' : 'border-gray-200/70 dark:border-white/[0.08]',
    ].join(' ')}
  >
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${category.is_active ? 'bg-brand' : 'bg-gray-300 dark:bg-white/10'}`} />

    <div className="relative z-10 flex items-center gap-2 pl-3.5 pr-2 py-2.5">
      <button type="button" onClick={onToggle} className="flex-1 min-w-0 flex items-center gap-3 text-left" aria-expanded={expanded}>
        <div className="shrink-0 w-11 h-11 rounded-xl bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] flex items-center justify-center text-[20px]">
          <EduGlyph emoji={category.emoji || '📘'} size={22} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14.5px] font-bold text-ink-strong truncate">{category.name_ko}</span>
            <span className="text-[10px] font-mono text-gray-400 dark:text-white/35">{category.key}</span>
            {!category.is_active && <Badge>숨김</Badge>}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            프로그램 {category.programs.length}개
            {category.tagline_ko && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
                {category.tagline_ko}
              </>
            )}
          </div>
        </div>
      </button>
      <OrderButtons onUp={() => onMove('up')} onDown={() => onMove('down')} disableUp={isFirst} disableDown={isLast} />
      <button type="button" onClick={onToggle} className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-white/40" aria-label="펼치기">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    {expanded && (
      <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-2">
        {category.programs.length === 0 ? (
          <p className="text-[12px] text-gray-400 dark:text-white/40 py-2 text-center">프로그램이 없습니다</p>
        ) : (
          category.programs.map((p, i) => (
            <ProgramRow
              key={p.id}
              program={p}
              isFirst={i === 0}
              isLast={i === category.programs.length - 1}
              onEdit={() => onEditProgram(p)}
              onMove={(d) => onMoveProgram(p, d)}
              onToggle={() => onToggleProgram(p)}
              onDelete={() => onDeleteProgram(p)}
            />
          ))
        )}

        <button
          type="button"
          onClick={onAddProgram}
          className="w-full h-10 rounded-xl border border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] text-brand text-[12.5px] font-bold transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <PlusIcon /> 프로그램 추가
        </button>

        <div className="flex gap-2 pt-1">
          <RowAction onClick={onEdit} accent label="카테고리 수정" />
          <RowAction onClick={onToggleVisibility} label={category.is_active ? '숨김' : '공개'} />
          <RowAction onClick={onDelete} destructive label="삭제" />
        </div>
      </div>
    )}
  </div>
)

// ── Program row ───────────────────────────────────────
const ProgramRow = ({
  program,
  isFirst,
  isLast,
  onEdit,
  onMove,
  onToggle,
  onDelete,
}: {
  program: EducationProgram
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onMove: (d: 'up' | 'down') => void
  onToggle: () => void
  onDelete: () => void
}) => {
  const pending = !program.meeting_time_ko && !program.leader_ko && !program.location_ko
  const meta = [program.meeting_time_ko, program.leader_ko, program.location_ko].filter(Boolean).join(' · ')
  return (
    <div className={`rounded-xl border border-gray-200/70 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.03] px-3 py-2.5 ${!program.is_active ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13.5px] font-bold text-ink-strong truncate">{program.name_ko}</span>
            {program.target_ko && <span className="text-[10.5px] text-gray-500 dark:text-white/50">{program.target_ko}</span>}
            {!program.is_active && <Badge>숨김</Badge>}
            {pending && <Badge warn>미확인</Badge>}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {meta || '시간 · 담당 · 장소를 채워주세요'}
          </div>
        </button>
        <OrderButtons onUp={() => onMove('up')} onDown={() => onMove('down')} disableUp={isFirst} disableDown={isLast} />
        <IconBtn onClick={onToggle} label={program.is_active ? '숨김' : '공개'}>
          {program.is_active ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </IconBtn>
        <IconBtn onClick={onDelete} label="삭제" destructive>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
          </svg>
        </IconBtn>
      </div>
    </div>
  )
}

// ── 작은 조각들 ───────────────────────────────────────
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const Badge = ({ children, warn }: { children: string; warn?: boolean }) => (
  <span
    className={
      warn
        ? 'text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-amber-700 dark:text-amber-300 shrink-0'
        : 'text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 shrink-0'
    }
  >
    {children}
  </span>
)

const OrderButtons = ({
  onUp,
  onDown,
  disableUp,
  disableDown,
}: {
  onUp: () => void
  onDown: () => void
  disableUp: boolean
  disableDown: boolean
}) => (
  <div className="flex flex-col shrink-0">
    <button type="button" onClick={onUp} disabled={disableUp} className="w-7 h-4 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-brand disabled:opacity-25" aria-label="위로">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
    </button>
    <button type="button" onClick={onDown} disabled={disableDown} className="w-7 h-4 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-brand disabled:opacity-25" aria-label="아래로">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
  </div>
)

const IconBtn = ({
  onClick,
  label,
  destructive,
  children,
}: {
  onClick: () => void
  label: string
  destructive?: boolean
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
      destructive
        ? 'text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-400 dark:text-white/40 hover:text-brand hover:bg-[var(--brand-soft)]'
    }`}
  >
    {children}
  </button>
)

const StatChip = ({ label, value, accent, warn }: { label: string; value: number; accent?: boolean; warn?: boolean }) => (
  <span
    className={
      accent
        ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-[12px] font-semibold text-brand'
        : warn
          ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-[12px] font-semibold text-amber-700 dark:text-amber-300'
          : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-[12px] font-semibold text-gray-700 dark:text-white/75'
    }
  >
    {label}
    <span className="font-bold">{value}</span>
  </span>
)

const RowAction = ({ onClick, accent, destructive, label }: { onClick: () => void; accent?: boolean; destructive?: boolean; label: string }) => {
  let cls = 'flex-1 inline-flex items-center justify-center px-2.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all border '
  if (destructive) cls += 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border-red-200 dark:border-red-400/30'
  else if (accent) cls += 'bg-[var(--brand-soft)] text-brand border-[var(--brand-glow)] hover:bg-[var(--brand-soft-strong)]'
  else cls += 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 border-gray-200 dark:border-white/[0.08]'
  return (
    <button type="button" onClick={onClick} className={cls}>
      {label}
    </button>
  )
}

const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-[68px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

export default EducationManagement
