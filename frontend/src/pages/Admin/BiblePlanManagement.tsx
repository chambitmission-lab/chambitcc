// 읽기 플랜 관리 (admin, /admin/bible-plans)
// 컴팩트 행 + accordion + 검색/필터 + 통계 chip + FAB → Composer (admin_list_pattern)
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { useAllBiblePlans, useDeletePlan } from '../../hooks/useBiblePlan'
import type { PlanSummary } from '../../types/biblePlan'
import { accentGradient } from '../Bible/Plans/planVisuals'
import BiblePlanComposer from './components/BiblePlanComposer'
import { FilterChip, FilterRow } from './components/FilterControls'

type PublishFilter = 'all' | 'published' | 'draft'

const BiblePlanManagement = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useAllBiblePlans()
  const deletePlan = useDeletePlan()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterPublish, setFilterPublish] = useState<PublishFilter>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanSummary | null>(null)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const plans = data?.items ?? []

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return plans.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.subtitle?.toLowerCase().includes(q) ?? false)
      const matchesPublish =
        filterPublish === 'all' ||
        (filterPublish === 'published' && p.is_published) ||
        (filterPublish === 'draft' && !p.is_published)
      return matchesSearch && matchesPublish
    })
  }, [plans, searchTerm, filterPublish])

  const publishedCount = plans.filter((p) => p.is_published).length
  const draftCount = plans.length - publishedCount

  const handleDelete = async (plan: PlanSummary) => {
    if (!confirm(`"${plan.title}" 플랜을 삭제할까요? 구독자 진행 기록도 함께 삭제됩니다.`)) return
    try {
      await deletePlan.mutateAsync(plan.id)
      showToast('삭제되었습니다', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  const handleEdit = (plan: PlanSummary) => {
    setEditingPlan(plan)
    setComposerOpen(true)
  }
  const handleCreate = () => {
    setEditingPlan(null)
    setComposerOpen(true)
  }
  const closeComposer = () => {
    setComposerOpen(false)
    setEditingPlan(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white">읽기 플랜 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 통계 칩 */}
        <div className="px-4 pt-4 pb-1 flex gap-2 flex-wrap">
          <StatChip label="전체" value={plans.length} />
          <StatChip label="공개" value={publishedCount} accent />
          {draftCount > 0 && <StatChip label="임시저장" value={draftCount} muted />}
        </div>

        {/* 검색 + 필터 */}
        <div className="px-4 py-3">
          <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4">
            <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
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
                  placeholder="제목 · slug 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
                />
              </div>
              <FilterRow label="상태">
                {(
                  [
                    ['all', '전체'],
                    ['published', '공개'],
                    ['draft', '임시저장'],
                  ] as const
                ).map(([v, l]) => (
                  <FilterChip key={v} active={filterPublish === v} onClick={() => setFilterPublish(v)}>
                    {l}
                  </FilterChip>
                ))}
              </FilterRow>
            </div>
          </div>
        </div>

        {/* 목록 */}
        <div className="px-4 pb-32 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[68px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">📚</span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">
                {searchTerm || filterPublish !== 'all' ? '조건에 맞는 플랜이 없습니다' : '아직 등록된 플랜이 없어요'}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                오른쪽 아래 + 버튼으로 새 플랜을 등록하세요
              </p>
            </div>
          ) : (
            filtered.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                expanded={expandedId === plan.id}
                onToggle={() => setExpandedId((prev) => (prev === plan.id ? null : plan.id))}
                onEdit={() => handleEdit(plan)}
                onDelete={() => handleDelete(plan)}
                onView={() => navigate(`/bible/plans/${plan.id}`)}
              />
            ))
          )}
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={handleCreate}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_rgba(168,85,247,0.65)] hover:shadow-[0_14px_36px_-4px_rgba(236,72,153,0.7)] hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>새 플랜</span>
        </button>

        {composerOpen && (
          <BiblePlanComposer editingPlan={editingPlan} onClose={closeComposer} onSuccess={closeComposer} />
        )}
      </div>
    </div>
  )
}

const PlanRow = ({
  plan,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onView,
}: {
  plan: PlanSummary
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}) => {
  const grad = accentGradient(plan.accent)
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        expanded ? 'border-purple-300/50 dark:border-purple-400/30' : 'border-gray-200/70 dark:border-white/[0.08]',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <button type="button" onClick={onToggle} className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left" aria-expanded={expanded}>
        <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-[18px] shadow-[0_4px_12px_-4px_rgba(168,85,247,0.5)]`}>
          {plan.emoji || '📖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
              {plan.title}
            </span>
            {!plan.is_published && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-white/[0.08] text-gray-600 dark:text-white/60 tracking-[0.05em] shrink-0">
                임시저장
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {plan.total_days}일{plan.category ? ` · ${plan.category}` : ''}{plan.level ? ` · ${plan.level}` : ''}
          </div>
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-2.5">
          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="slug" value={plan.slug} />
            <InfoRow label="일수" value={`${plan.total_days}일 (등록 ${plan.day_count}일)`} />
            <InfoRow label="카테고리" value={plan.category ?? '-'} />
            <InfoRow label="난이도" value={plan.level ?? '-'} />
            <InfoRow label="공개" value={plan.is_published ? '공개' : '임시저장'} />
          </div>
          {plan.description && (
            <p className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/75 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 line-clamp-3 whitespace-pre-wrap">
              {plan.description}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <RowAction onClick={onView} label="미리보기" />
            <RowAction onClick={onEdit} accent label="수정" />
            <RowAction onClick={onDelete} destructive label="삭제" />
          </div>
        </div>
      )}
    </div>
  )
}

const StatChip = ({ label, value, accent, muted }: { label: string; value: number; accent?: boolean; muted?: boolean }) => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold'
  let tone = 'bg-gray-100 dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-white/75'
  if (accent) tone = 'bg-purple-500/15 dark:bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300'
  else if (muted) tone = 'bg-gray-50 dark:bg-white/[0.03] border-gray-200/70 dark:border-white/[0.05] text-gray-500 dark:text-white/55'
  return (
    <span className={`${base} ${tone}`}>
      {label}
      <span className="font-bold">{value}</span>
    </span>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-gray-500 dark:text-white/50 shrink-0">{label}</span>
    <span className="text-gray-800 dark:text-white/85 font-medium truncate text-right min-w-0">{value}</span>
  </div>
)

const RowAction = ({ onClick, accent, destructive, label }: { onClick: () => void; accent?: boolean; destructive?: boolean; label: string }) => {
  let cls = 'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-all '
  if (accent) cls += 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-[0_0_16px_rgba(168,85,247,0.40)]'
  else if (destructive) cls += 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 dark:hover:bg-red-500/15'
  else cls += 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08]'
  return (
    <button type="button" onClick={onClick} className={cls}>
      {label}
    </button>
  )
}

export default BiblePlanManagement
