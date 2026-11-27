// /dev/bible-plans-admin — 읽기 플랜 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 BiblePlanDesk 를 표본으로 띄운다. 공개 전환·삭제는 이 화면 안에서만
// 바뀌고(서버 호출 없음), 수정·등록은 토스트로만 알린다. 일정 빈 플랜·임시저장·달력 고정 표본 포함.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BiblePlanDesk from '../Admin/components/BiblePlanDesk'
import { filterPlans, type PlanFilter } from '../Admin/components/biblePlanDeskUtils'
import type { PlanSummary } from '../../types/biblePlan'
import { showToast } from '../../utils/toast'

const plan = (id: number, p: Partial<PlanSummary> & Pick<PlanSummary, 'title' | 'total_days'>): PlanSummary => ({
  id,
  slug: `plan-${id}`,
  day_count: p.total_days,
  is_published: true,
  sort_order: id,
  participant_count: 0,
  completed_count: 0,
  schedule_mode: 'self_paced',
  ...p,
})

const anchor = new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10)

const PLANS: PlanSummary[] = [
  plan(1, { title: '365일 성경 일독', subtitle: '하루 서너 장, 1년에 한 번 통독', category: '통독', level: '중급', emoji: '📖', accent: 'purple', total_days: 365, participant_count: 128, completed_count: 9, schedule_mode: 'calendar', anchor_date: anchor, description: '창세기부터 요한계시록까지 교회가 함께 같은 날 같은 본문을 읽어요.' }),
  plan(2, { title: '30일 복음서 산책', subtitle: '예수님의 걸음을 따라', category: '복음서', level: '입문', emoji: '🕊️', accent: 'pink', total_days: 30, participant_count: 46, completed_count: 21 }),
  plan(3, { title: '시편 150일', category: '습관', level: '초급', emoji: '🌅', accent: 'fuchsia', total_days: 150, day_count: 112, participant_count: 12, completed_count: 0 }),
  plan(4, { title: '사도행전 28일', category: '개관', level: '초급', emoji: '🔥', accent: 'rose', total_days: 28, is_published: false }),
  plan(5, { title: '고난주간 7일 묵상', category: '주제', level: '입문', emoji: '✝️', accent: 'purple', total_days: 7, day_count: 3, is_published: false }),
]

const BiblePlanAdminPreview = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<PlanSummary[]>(PLANS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<PlanFilter>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const filtered = useMemo(() => filterPlans(plans, searchTerm, filter), [plans, searchTerm, filter])

  return (
    <BiblePlanDesk
      plans={plans}
      filtered={filtered}
      loading={false}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filter={filter}
      onFilterChange={setFilter}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={() => showToast('미리보기 — 등록 폼은 실제 화면에서', 'info')}
      onBack={() => navigate(-1)}
      onEdit={(p) => showToast(`미리보기 — ${p.title} 수정`, 'info')}
      onTogglePublish={(p) => setPlans((l) => l.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)))}
      onDelete={(p) => setPlans((l) => l.filter((x) => x.id !== p.id))}
      onView={() => showToast('미리보기 — 성도 화면은 실제 플랜에서', 'info')}
    />
  )
}

export default BiblePlanAdminPreview
