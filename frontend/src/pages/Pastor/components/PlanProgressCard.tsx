import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPlanProgress, type PlanMemberState, type PlanProgress, type PlanProgressMember, type PlanProgressRow } from '../../../api/pastor'
import { pastorKeys } from '../../../hooks/queryKeys'
import { EmptyHint, SectionCard } from '../../Admin/components/StatCards'
import { PlanGlyph } from '../../Bible/Plans/PlanIcons'
import { Avatar } from './ui'
import { agoLabel } from './pastorUtils'

// 읽기 플랜 참여·완주 현황 — 주차와 무관한 '지금' 기준이라 주간 리포트와 따로 받는다.
// 진도(완료 일수·마지막 완료일)만 보인다. 무엇을 적었는지는 어디에도 없다.

const STATE_LABEL: Record<PlanMemberState, string> = {
  stalled: '멈춤',
  not_started: '시작 전',
  reading: '읽는 중',
  completed: '완주',
}
// 막대 순서 — 왼쪽부터 완주 · 읽는 중 · 멈춤 · 시작 전
const BAR: Array<{ state: PlanMemberState; cls: string }> = [
  { state: 'completed', cls: 'bg-brand' },
  { state: 'reading', cls: 'bg-[var(--brand-glow)]' },
  { state: 'stalled', cls: 'bg-[var(--amber-icon)]' },
  { state: 'not_started', cls: 'bg-gray-300 dark:bg-white/[0.14]' },
]
const MEMBER_PREVIEW = 8

const PlanProgressCard = ({ enabled }: { enabled: boolean }) => {
  const { data, isPending } = useQuery<PlanProgress>({
    queryKey: pastorKeys.planProgress(),
    queryFn: fetchPlanProgress,
    enabled,
    staleTime: 5 * 60_000,
  })
  const [open, setOpen] = useState<number | null>(null)

  if (isPending || !data) return null
  const s = data.summary
  return (
    <SectionCard
      title="읽기 플랜 현황"
      action={
        s.participants > 0 ? (
          <span className="text-[12px] text-gray-500 dark:text-white/50">
            참여 {s.participants}명 · 읽는 중 {s.reading}명 · 멈춤 {s.stalled}명
          </span>
        ) : undefined
      }
    >
      <p className="text-[12px] text-gray-600 dark:text-white/60 leading-relaxed">
        교회 읽기 플랜에 참여한 성도의 진도입니다. 최근 {data.stall_days}일 안에 하루치를 마쳤으면 ‘읽는 중’,
        그보다 오래 쉬었으면 ‘멈춤’으로 봅니다. 진도만 보이고 적은 내용은 보이지 않습니다.
      </p>
      {data.plans.length === 0 ? (
        <EmptyHint text="아직 읽기 플랜에 참여한 성도가 없습니다" />
      ) : (
        <ul className="space-y-2">
          {data.plans.map(plan => (
            <PlanRow
              key={plan.id}
              plan={plan}
              expanded={open === plan.id}
              onToggle={() => setOpen(open === plan.id ? null : plan.id)}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

const PlanRow = ({ plan, expanded, onToggle }: { plan: PlanProgressRow; expanded: boolean; onToggle: () => void }) => {
  const [all, setAll] = useState(false)
  const shown = all ? plan.members : plan.members.slice(0, MEMBER_PREVIEW)
  const mode = plan.ended
    ? '일정 끝남'
    : plan.schedule_mode === 'calendar'
      ? plan.expected_day
        ? `오늘 ${plan.expected_day}일차`
        : '시작 전'
      : '각자 속도'
  return (
    <li className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02]">
      <button type="button" onClick={onToggle} className="w-full text-left px-3.5 py-3" aria-expanded={expanded}>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-brand"><PlanGlyph emoji={plan.emoji} size={18} /></span>
          <span className="min-w-0 text-[13.5px] font-bold text-ink-strong truncate">{plan.title}</span>
          <span className="shrink-0 text-[12px] text-gray-600 dark:text-white/60">{plan.participants}명</span>
          <span className="ml-auto shrink-0 text-[13px] font-bold text-brand">완주 {plan.completion_rate}%</span>
          <span className="material-icons-outlined text-[18px] text-gray-500">{expanded ? 'expand_less' : 'expand_more'}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-200/70 dark:bg-white/[0.06] overflow-hidden flex">
          {BAR.map(b =>
            plan.counts[b.state] > 0 ? (
              <div key={b.state} className={`h-full ${b.cls}`} style={{ width: `${(plan.counts[b.state] / plan.participants) * 100}%` }} />
            ) : null,
          )}
        </div>
        <p className="mt-1.5 text-[12px] text-gray-600 dark:text-white/60">
          {plan.total_days}일 · {mode} · 평균 {plan.avg_percent}%
          {BAR.map(b => (plan.counts[b.state] > 0 ? ` · ${STATE_LABEL[b.state]} ${plan.counts[b.state]}` : ''))}
        </p>
      </button>
      {expanded && (
        <div className="px-3.5 pb-3 border-t border-gray-100 dark:border-white/[0.06]">
          <ul className="pt-2 space-y-1.5">
            {shown.map(m => (
              <MemberRow key={m.user_id} m={m} plan={plan} />
            ))}
          </ul>
          {plan.members.length > MEMBER_PREVIEW && (
            <button
              type="button"
              onClick={() => setAll(v => !v)}
              className="mt-2 text-[12px] font-semibold text-brand"
            >
              {all ? '접기' : `외 ${plan.members.length - MEMBER_PREVIEW}명 더 보기`}
            </button>
          )}
        </div>
      )}
    </li>
  )
}

const MemberRow = ({ m, plan }: { m: PlanProgressMember; plan: PlanProgressRow }) => {
  const warn = m.state === 'stalled' && !plan.ended
  const detail =
    m.state === 'completed'
      ? '완주'
      : m.state === 'not_started'
        ? '아직 시작 전'
        : [
            `${m.completed_days}/${plan.total_days}일`,
            `마지막 ${agoLabel(m.days_since)}`,
            m.behind_days ? `${m.behind_days}일 밀림` : '',
          ].filter(Boolean).join(' · ')
  return (
    <li>
      <Link to={`/pastor/members/${m.user_id}`} className="flex items-center gap-2.5 group">
        <Avatar name={m.name} url={m.avatar_url} size="sm" />
        <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-ink-strong truncate group-hover:text-brand">
          {m.name}
        </span>
        <span className="shrink-0 text-[12px] text-gray-600 dark:text-white/60">{detail}</span>
        <span
          className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
            warn
              ? 'bg-[var(--amber-soft,rgba(245,158,11,0.14))] text-[var(--amber)]'
              : m.state === 'not_started'
                ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/60'
                : 'bg-[var(--brand-soft)] text-brand'
          }`}
        >
          {STATE_LABEL[m.state]}
        </span>
      </Link>
    </li>
  )
}

export default PlanProgressCard
