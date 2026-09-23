import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  VISIT_KIND_ICON,
  VISIT_KIND_LABEL,
  fetchMyVisits,
  type FollowUp,
  type PastoralVisit,
} from '../../api/pastor'
import FollowUpList from './components/FollowUpList'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import VisitComposer from './components/VisitComposer'
import { Avatar } from './components/ui'
import { formatDay, usePastorGate } from './components/pastorUtils'

// 내 심방 기록 — 좌: 월별 타임라인 / 우: 남은 후속 할 일(체크하면 끝).
// 새 기록은 성도 상세에서 남긴다(누구를 만났는지가 먼저라서).

const PastorVisits = () => {
  const pastor = usePastorGate()
  const [editing, setEditing] = useState<PastoralVisit | null>(null)

  const { data, isPending } = useQuery({
    queryKey: ['pastor-visits'],
    queryFn: fetchMyVisits,
    enabled: pastor,
    refetchOnMount: 'always',
  })

  const months = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: PastoralVisit[] }> = []
    for (const v of data?.items ?? []) {
      const key = v.visit_date.slice(0, 7)
      let g = groups[groups.length - 1]
      if (!g || g.key !== key) {
        const [y, m] = key.split('-')
        g = { key, label: `${y}년 ${Number(m)}월`, items: [] }
        groups.push(g)
      }
      g.items.push(v)
    }
    return groups
  }, [data])

  return (
    <PastorShell>
      {isPending && !data ? (
        <StatSpinner label="심방 기록을 불러오는 중..." />
      ) : !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-500 dark:text-white/50">심방 기록을 불러오지 못했습니다</p>
      ) : (
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="contents lg:block lg:min-w-0 lg:col-start-2 lg:row-start-1">
            <FollowUpCard items={data.follow_ups} />
          </div>
          <div className="contents lg:block lg:min-w-0 lg:col-start-1 lg:row-start-1">
            <SectionCard
              title="내 심방 기록"
              action={
                <Link to="/pastor/members" className="text-[11.5px] font-semibold text-brand hover:underline">
                  성도를 골라 기록 남기기
                </Link>
              }
            >
              <p className="text-[11.5px] text-gray-500 dark:text-white/45">
                목사님이 쓴 기록만 모았습니다. 다른 교역자의 기록 내용은 보이지 않습니다.
              </p>
              {months.length === 0 ? (
                <EmptyHint text="아직 남긴 심방 기록이 없습니다" />
              ) : (
                months.map(g => (
                  <div key={g.key}>
                    <p className="text-[12px] font-bold text-gray-500 dark:text-white/55 mb-1.5">
                      {g.label} <span className="font-semibold text-gray-400">· {g.items.length}건</span>
                    </p>
                    <ul className="space-y-1.5">
                      {g.items.map(v => (
                        <li key={v.id}>
                          <button
                            type="button"
                            onClick={() => setEditing(v)}
                            className="w-full text-left flex gap-3 px-3.5 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] hover:border-brand transition-colors"
                          >
                            <Avatar name={v.member_name ?? ''} url={v.member_avatar_url} />
                            <span className="flex-1 min-w-0">
                              <span className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-bold text-ink-strong">{v.member_name}</span>
                                <span className="flex items-center gap-0.5 text-[11.5px] text-gray-500 dark:text-white/50">
                                  <span className="material-icons-outlined text-[14px]">{VISIT_KIND_ICON[v.kind]}</span>
                                  {VISIT_KIND_LABEL[v.kind]} · {formatDay(v.visit_date)}
                                </span>
                              </span>
                              {v.summary && (
                                <span className="block mt-1 text-[12.5px] text-[#4b5563] dark:text-white/65 line-clamp-2">
                                  {v.summary}
                                </span>
                              )}
                              {v.follow_up && (
                                <span
                                  className={`inline-block mt-1 text-[11.5px] font-semibold ${
                                    v.follow_up_done ? 'text-gray-400 line-through' : 'text-brand'
                                  }`}
                                >
                                  → {v.follow_up}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {editing && (
        <VisitComposer
          memberId={editing.member_user_id}
          memberName={editing.member_name ?? ''}
          visit={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </PastorShell>
  )
}

const FollowUpCard = ({ items }: { items: FollowUp[] }) => (
  <SectionCard title={`후속 할 일 ${items.length || ''}`.trim()}>
    <FollowUpList items={items} />
    <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
      심방 기록에 적은 후속 할 일입니다. 체크하면 마친 일로 넘어갑니다.
    </p>
  </SectionCard>
)

export default PastorVisits
