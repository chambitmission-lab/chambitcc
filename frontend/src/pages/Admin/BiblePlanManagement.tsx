// 읽기 플랜 관리 (admin, /admin/bible-plans)
// Single Responsibility: 플랜 목록 조회·검색과 공개 전환/삭제 액션.
// 화면은 BiblePlanDesk(관리 데스크 — 목록 + 상세 + 성도 쿠폰 카드 미리보기, 2026-11-27),
// 작성·수정(일정 자동 생성·표 붙여넣기 포함)은 BiblePlanComposer 가 그린다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import { biblePlanKeys, useAllBiblePlans, useDeletePlan, useUpdatePlan } from '../../hooks/useBiblePlan'
import type { PlanListResponse, PlanSummary } from '../../types/biblePlan'
import BiblePlanComposer from './components/BiblePlanComposer'
import BiblePlanDesk from './components/BiblePlanDesk'
import { filterPlans, type PlanFilter } from './components/biblePlanDeskUtils'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'

const BiblePlanManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading } = useAllBiblePlans()
  const updatePlan = useUpdatePlan()
  const deletePlan = useDeletePlan()

  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<PlanFilter>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, PlanSummary = 수정
  const [composer, setComposer] = useState<'new' | PlanSummary | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [navigate])

  // 로딩 중엔 매 렌더 새 빈 배열이 되어 아래 useMemo 가 무력화된다 — 참조를 고정
  const plans = useMemo(() => data?.items ?? [], [data])
  const filtered = useMemo(() => filterPlans(plans, searchTerm, filter), [plans, searchTerm, filter])

  const handleTogglePublish = async (plan: PlanSummary) => {
    const next = !plan.is_published
    // 스위치가 바로 넘어가게(낙관적) — 실패하면 되돌린다. 성공 시 훅이 목록들을 다시 불러온다
    const key = biblePlanKeys.adminList()
    const prev = queryClient.getQueryData<PlanListResponse>(key)
    if (prev) {
      queryClient.setQueryData<PlanListResponse>(key, {
        ...prev,
        items: prev.items.map((p) => (p.id === plan.id ? { ...p, is_published: next } : p)),
      })
    }
    try {
      await updatePlan.mutateAsync({ planId: plan.id, payload: { is_published: next } })
      showToast(next ? '성도들에게 공개했어요' : '임시저장으로 내렸어요', 'success')
    } catch (e) {
      if (prev) queryClient.setQueryData(key, prev)
      showToast(e instanceof Error ? e.message : '공개 전환에 실패했습니다', 'error')
    }
  }

  const handleDelete = async (plan: PlanSummary) => {
    const people = plan.participant_count ?? 0
    if (
      !(await confirmDialog({
        title: '플랜 삭제',
        message: `"${plan.title}" 플랜을 지울까요?`,
        description:
          people > 0
            ? `지금 ${people}명이 읽고 있어요. 지우면 이분들의 진행 기록도 함께 사라져요. 목록에서만 감추려면 공개 스위치를 끄세요.`
            : '되돌릴 수 없어요. 목록에서만 감추려면 공개 스위치를 끄세요.',
        confirmText: '네, 지울게요',
        icon: 'delete_forever',
      }))
    )
      return
    try {
      await deletePlan.mutateAsync(plan.id)
      showToast('삭제했어요', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  return (
    <>
      <BiblePlanDesk
        plans={plans}
        filtered={filtered}
        loading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setComposer('new')}
        onBack={() => navigate(-1)}
        onEdit={(p) => setComposer(p)}
        onTogglePublish={(p) => void handleTogglePublish(p)}
        onDelete={(p) => void handleDelete(p)}
        onView={(p) => navigate(`/bible/plans/${p.id}`)}
      />

      {composer && (
        <BiblePlanComposer
          editingPlan={composer === 'new' ? null : composer}
          onClose={() => setComposer(null)}
          onSuccess={() => setComposer(null)}
        />
      )}
    </>
  )
}

export default BiblePlanManagement
