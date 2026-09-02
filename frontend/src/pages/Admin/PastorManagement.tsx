// 담임목사 관리 (admin, /admin/pastors)
//
// 목사가 바뀌어도 인사말·사진·약력을 덮어쓰지 않는다 — 새로 등록하고
// '현 담임목사로 지정' 한 번이면 기존 분은 전임으로 내려가고 기록이 남는다.
// 그 교체 동선이 이 화면의 존재 이유다.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import {
  useAllPastors,
  useDeletePastor,
  useSetCurrentPastor,
  useUpdatePastor,
} from '../../hooks/usePastors'
import { pastorTermLabel } from '../../types/pastor'
import type { Pastor, PastorStatus } from '../../types/pastor'
import PastorComposer from './components/PastorComposer'
import { FilterChip, FilterRow } from './components/FilterControls'

type StatusFilter = 'all' | PastorStatus
type SortKey = 'term' | 'name'

const STATUS_LABEL: Record<PastorStatus, string> = {
  current: '현 담임목사',
  emeritus: '원로목사',
  former: '전임 담임목사',
}

const PastorManagement = () => {
  const navigate = useNavigate()
  const admin = isAdmin()

  const { data: pastors = [], isPending, isError, refetch } = useAllPastors(admin)
  const setCurrentMutation = useSetCurrentPastor()
  const updateMutation = useUpdatePastor()
  const deleteMutation = useDeletePastor()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('term')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, Pastor = 수정
  const [composer, setComposer] = useState<'new' | Pastor | null>(null)

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  useEffect(() => {
    if (isError) showToast('목사님 목록을 불러오지 못했습니다', 'error')
  }, [isError])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const arr = pastors.filter((p) => {
      const matchesSearch =
        !q ||
        p.name_ko.toLowerCase().includes(q) ||
        (p.name_en?.toLowerCase().includes(q) ?? false) ||
        (p.greeting_title_ko?.toLowerCase().includes(q) ?? false)
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
    return [...arr].sort((a, b) => {
      if (sortKey === 'name') return a.name_ko.localeCompare(b.name_ko)
      // 현직을 항상 맨 위로, 그 다음은 부임 역순
      if (a.status === 'current' && b.status !== 'current') return -1
      if (b.status === 'current' && a.status !== 'current') return 1
      return (b.term_start ?? '').localeCompare(a.term_start ?? '')
    })
  }, [pastors, searchTerm, statusFilter, sortKey])

  const currentCount = pastors.filter((p) => p.status === 'current').length
  const hiddenCount = pastors.filter((p) => !p.is_published).length

  const handleSetCurrent = async (pastor: Pastor) => {
    if (pastor.status === 'current') return
    if (
      !(await confirmDialog({
        title: '현 담임목사로 지정',
        message: `${pastor.name_ko} 목사님을 현 담임목사로 지정할까요?`,
        description:
          '기존 현 담임목사는 전임 담임목사로 내려가고 이임일이 오늘로 채워집니다. 인사말과 약력은 그대로 보존됩니다.',
        confirmText: '지정',
        tone: 'brand',
        icon: 'swap_horiz',
      }))
    )
      return
    try {
      await setCurrentMutation.mutateAsync(pastor.id)
      showToast('현 담임목사로 지정했습니다', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '지정에 실패했습니다', 'error')
    }
  }

  const handleToggleVisibility = async (pastor: Pastor) => {
    try {
      await updateMutation.mutateAsync({
        id: pastor.id,
        data: { is_published: !pastor.is_published },
      })
      showToast(pastor.is_published ? '숨김으로 전환했어요' : '공개로 전환했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const handleChangeStatus = async (pastor: Pastor, next: PastorStatus) => {
    if (next === 'current') {
      await handleSetCurrent(pastor)
      return
    }
    try {
      await updateMutation.mutateAsync({ id: pastor.id, data: { status: next } })
      showToast(`${STATUS_LABEL[next]}(으)로 변경했습니다`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const handleDelete = async (pastor: Pastor) => {
    if (
      !(await confirmDialog({
        title: '담임목사 삭제',
        message: `${pastor.name_ko} 목사님 기록을 삭제하시겠습니까?`,
        description:
          '인사말·프로필·사진이 모두 사라지며 되돌릴 수 없습니다. 화면에서만 감추려면 삭제 대신 "숨김"을 사용하세요.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteMutation.mutateAsync(pastor.id)
      showToast('삭제되었습니다', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  return (
    // lg 에선 이 페이지만 스스로 스크롤하는 상자로 만든다 — #root 의 overflow-y 탓에
    // sticky 가 전역으로 죽어 있어, 이 상자가 있어야 우측 도구 레일 sticky 가 산다.
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-24 lg:max-w-[1100px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        {/* 헤더 */}
        <div className="sticky top-0 lg:static lg:rounded-t-3xl z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">담임목사 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* PC(lg+) 2단 — 좌: 목록 / 우: 도구(등록·통계·검색/필터)가 sticky */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-5 lg:pt-4">
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 lg:space-y-3">
            <button
              type="button"
              onClick={() => setComposer('new')}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>담임목사 등록</span>
            </button>

            {/* 통계 */}
            <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 flex gap-2 flex-wrap">
              <StatChip label="전체" value={pastors.length} />
              <StatChip label="현직" value={currentCount} accent />
              <StatChip label="숨김" value={hiddenCount} />
            </div>

            {/* 검색 + 필터 */}
            <div className="px-4 py-3 lg:px-0 lg:py-0">
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
                      placeholder="이름 · 인사말 제목 검색"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 p-1 rounded-full"
                        aria-label="검색어 지우기"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <FilterRow label="상태">
                    {(
                      [
                        ['all', '전체'],
                        ['current', '현직'],
                        ['emeritus', '원로'],
                        ['former', '전임'],
                      ] as const
                    ).map(([v, l]) => (
                      <FilterChip key={v} active={statusFilter === v} onClick={() => setStatusFilter(v)}>
                        {l}
                      </FilterChip>
                    ))}
                  </FilterRow>

                  <FilterRow label="정렬">
                    {(
                      [
                        ['term', '부임 최신순'],
                        ['name', '이름순'],
                      ] as const
                    ).map(([v, l]) => (
                      <FilterChip key={v} active={sortKey === v} onClick={() => setSortKey(v)}>
                        {l}
                      </FilterChip>
                    ))}
                  </FilterRow>
                </div>
              </div>
            </div>

            {/* 결과 카운트 + 안내 */}
            <div className="px-5 pb-2 lg:px-1 lg:pb-0 text-[12px] text-gray-500 dark:text-white/55 flex items-center gap-2">
              <span>
                검색 결과 <span className="font-bold text-ink-strong">{filtered.length}</span>건
              </span>
              {searchTerm && <span className="text-brand truncate">"{searchTerm}"</span>}
            </div>

            <div className="px-5 pb-2 lg:px-1">
              <button
                type="button"
                onClick={() => navigate('/greeting')}
                className="text-[12px] font-semibold text-brand hover:underline"
              >
                인사말 페이지에서 보기 →
              </button>
            </div>
          </div>

          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            {/* 현직이 없을 때의 경고 — 공개 페이지가 비어 보이는 원인이라 눈에 띄게 */}
            {!isPending && currentCount === 0 && pastors.length > 0 && (
              <div className="mx-4 lg:mx-0 mb-2 px-3.5 py-3 rounded-2xl bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-[12.5px] text-ink-strong leading-relaxed">
                현 담임목사로 지정된 분이 없어 인사말 페이지 본문이 비어 있습니다.
                아래 목록에서 한 분을 <span className="font-bold">현직 지정</span> 해주세요.
              </div>
            )}

            <div className="px-4 pb-32 lg:px-0 lg:pb-8 space-y-2">
              {isPending && pastors.length === 0 ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">✉️</span>
                  <p className="text-[13px] text-gray-500 dark:text-white/55">
                    {searchTerm || statusFilter !== 'all'
                      ? '조건에 맞는 기록이 없습니다'
                      : '아직 등록된 목사님이 없어요'}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                    {searchTerm || statusFilter !== 'all'
                      ? '필터를 바꾸거나 검색어를 지워보세요'
                      : '＋ 담임목사 버튼으로 등록해 보세요'}
                  </p>
                </div>
              ) : (
                filtered.map((pastor) => (
                  <PastorRow
                    key={pastor.id}
                    pastor={pastor}
                    expanded={expandedId === pastor.id}
                    onToggleExpand={() =>
                      setExpandedId((prev) => (prev === pastor.id ? null : pastor.id))
                    }
                    onEdit={() => setComposer(pastor)}
                    onSetCurrent={() => handleSetCurrent(pastor)}
                    onChangeStatus={(next) => handleChangeStatus(pastor, next)}
                    onToggleVisibility={() => handleToggleVisibility(pastor)}
                    onDelete={() => handleDelete(pastor)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setComposer('new')}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 lg:hidden inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>담임목사</span>
        </button>

        {composer && (
          <PastorComposer
            // key — 다른 목사를 연속으로 수정할 때 폼 상태가 남지 않도록 재마운트
            key={composer === 'new' ? 'new' : composer.id}
            pastor={composer === 'new' ? undefined : composer}
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

// ── Row ───────────────────────────────────────────────
interface PastorRowProps {
  pastor: Pastor
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onSetCurrent: () => void
  onChangeStatus: (next: PastorStatus) => void
  onToggleVisibility: () => void
  onDelete: () => void
}

const PastorRow = ({
  pastor,
  expanded,
  onToggleExpand,
  onEdit,
  onSetCurrent,
  onChangeStatus,
  onToggleVisibility,
  onDelete,
}: PastorRowProps) => {
  const isCurrent = pastor.status === 'current'
  const term = pastorTermLabel(pastor, 'ko')

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        expanded ? 'border-[var(--brand-glow)]' : 'border-gray-200/70 dark:border-white/[0.08]',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      {/* 현직만 브랜드 솔리드, 나머지는 중립 회색 */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          isCurrent ? 'bg-brand' : 'bg-gray-300 dark:bg-white/10'
        }`}
      />

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--brand-soft-strong)] border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
          {pastor.photo_url ? (
            <img
              src={pastor.photo_url}
              alt={pastor.name_ko}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="text-[22px]">✉️</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
              {pastor.name_ko}
            </span>
            {isCurrent && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.05em] shrink-0">
                현직
              </span>
            )}
            {!pastor.is_published && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 shrink-0">
                숨김
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {STATUS_LABEL[pastor.status]}
            {term && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
                {term}
              </>
            )}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-white/40 truncate mt-0.5">
            {pastor.greeting_title_ko || '인사말 제목 없음'}
          </div>
        </div>

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-2.5">
          {pastor.greeting_body_ko && (
            <p className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/75 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 whitespace-pre-wrap line-clamp-6">
              {pastor.greeting_body_ko}
            </p>
          )}

          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="직분" value={pastor.role_ko || '—'} />
            <InfoRow label="별칭" value={pastor.nickname_ko || '—'} />
            <InfoRow label="부임" value={pastor.term_start || '—'} />
            <InfoRow label="이임" value={pastor.term_end || (isCurrent ? '재직 중' : '—')} />
            <InfoRow label="영문 이름" value={pastor.name_en || '—'} />
          </div>

          {/* 상태 변경 — 교체 동선을 한 줄에 */}
          {!isCurrent && (
            <button
              type="button"
              onClick={onSetCurrent}
              className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-brand hover:bg-brand-dim text-white text-[12.5px] font-bold transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              현 담임목사로 지정
            </button>
          )}

          {!isCurrent && (
            <div className="flex gap-1.5">
              {(['emeritus', 'former'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChangeStatus(s)}
                  className={[
                    'flex-1 h-9 rounded-xl text-[12px] font-semibold border transition-colors',
                    pastor.status === s
                      ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
                      : 'bg-transparent border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60 hover:bg-[var(--brand-soft)]',
                  ].join(' ')}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <RowAction onClick={onEdit} accent icon="edit" label="수정" />
            <RowAction
              onClick={onToggleVisibility}
              icon={pastor.is_published ? 'hide' : 'eye'}
              label={pastor.is_published ? '숨김' : '공개'}
            />
            <RowAction onClick={onDelete} destructive icon="trash" label="삭제" />
          </div>

          <p className="text-[11px] text-gray-400 dark:text-white/40 leading-[1.5] pt-1">
            * 목사님이 바뀌어도 이 기록은 지우지 마세요. 새로 등록해 <span className="font-semibold">현직 지정</span>만
            하면 이전 분은 역대 담임목사로 남습니다.
          </p>
        </div>
      )}
    </div>
  )
}

// ── 작은 컴포넌트들 ──────────────────────────────────────
const StatChip = ({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) => (
  <span
    className={
      accent
        ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-[12px] font-semibold text-brand'
        : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-[12px] font-semibold text-gray-700 dark:text-white/75'
    }
  >
    {label}
    <span className="font-bold">{value}</span>
  </span>
)

const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-[86px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-gray-500 dark:text-white/50 shrink-0">{label}</span>
    <span className="text-gray-800 dark:text-white/85 font-medium truncate text-right min-w-0">
      {value}
    </span>
  </div>
)

const ACTION_ICONS: Record<string, ReactNode> = {
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  hide: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
}

const RowAction = ({
  onClick,
  accent,
  destructive,
  icon,
  label,
}: {
  onClick: () => void
  accent?: boolean
  destructive?: boolean
  icon: keyof typeof ACTION_ICONS
  label: string
}) => {
  let cls =
    'flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all '
  if (destructive) {
    cls +=
      'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 dark:hover:bg-red-500/15'
  } else if (accent) {
    cls +=
      'bg-[var(--brand-soft)] text-brand border border-[var(--brand-glow)] hover:bg-[var(--brand-soft-strong)]'
  } else {
    cls +=
      'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08]'
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {ACTION_ICONS[icon]}
      <span>{label}</span>
    </button>
  )
}

export default PastorManagement
