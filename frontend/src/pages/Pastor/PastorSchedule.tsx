import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  VISIT_KIND_ICON,
  VISIT_KIND_LABEL,
  fetchAgenda,
  type AgendaData,
  type AgendaItem,
  type PastoralVisit,
  type RosterMember,
} from '../../api/pastor'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import MemberPicker from './components/MemberPicker'
import VisitComposer from './components/VisitComposer'
import { Avatar } from './components/ui'
import { formatDay, parseDay, todayIso, usePastorGate } from './components/pastorUtils'

// 목회 일정 — 좌: 어젠다(지난 일 · 오늘 · 내일 · 이번 주 · 다음 주 · 이후) / 우: 미니 달력 + 예약하기.
// 월 그리드 대신 어젠다가 주인공(교회 캘린더와 같은 결정). 달력은 '어느 날이 차 있나'를 점으로만.

type Plan = Extract<AgendaItem, { type: 'visit_plan' }>

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 항목 종류별 색 — 달력 점과 어젠다 아이콘이 같은 말을 한다
const TYPE_DOT: Record<AgendaItem['type'], string> = {
  visit_plan: 'bg-brand',
  follow_up: 'bg-[var(--amber-icon)]',
  event: 'bg-gray-400 dark:bg-white/40',
  birthday: 'bg-pink-400',
}

const TYPE_LEGEND: Array<[AgendaItem['type'], string]> = [
  ['visit_plan', '심방 예약'],
  ['follow_up', '후속 할 일'],
  ['event', '교회 일정'],
  ['birthday', '생일'],
]

/** 예약 항목 → 컴포저가 받는 모양 */
const planToVisit = (p: Plan): PastoralVisit => ({
  id: p.visit_id,
  member_user_id: p.member_user_id,
  visit_date: p.date,
  visit_time: p.time,
  status: 'planned',
  kind: p.kind,
  pastor_name: p.pastor_name,
  is_mine: p.is_mine,
  summary: p.memo,
  follow_up: null,
  follow_up_date: null,
  follow_up_done: false,
})

const groupLabel = (item: AgendaItem, today: string): string => {
  if (item.overdue) return '지난 일 · 정리가 필요해요'
  const d = parseDay(item.date)!
  const t = parseDay(today)!
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  const endOfWeek = 7 - (t.getDay() === 0 ? 7 : t.getDay()) // 이번 주 일요일까지 남은 날
  if (diff <= endOfWeek) return '이번 주'
  if (diff <= endOfWeek + 7) return '다음 주'
  return '이후'
}

const PastorSchedule = () => {
  const pastor = usePastorGate()
  const [selected, setSelected] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [composer, setComposer] = useState<
    | { memberId: number; memberName: string; visit?: PastoralVisit; completing?: boolean }
    | null
  >(null)

  const { data, isPending } = useQuery<AgendaData>({
    queryKey: ['pastor-agenda'],
    queryFn: fetchAgenda,
    enabled: pastor,
    refetchOnMount: 'always',
  })

  const groups = useMemo(() => {
    if (!data) return []
    const list = selected ? data.items.filter(i => i.date === selected) : data.items
    const out: Array<{ label: string; items: AgendaItem[] }> = []
    for (const item of list) {
      const label = groupLabel(item, data.today)
      const last = out[out.length - 1]
      if (last && last.label === label) last.items.push(item)
      else out.push({ label, items: [item] })
    }
    return out
  }, [data, selected])

  const pick = (m: RosterMember) => {
    setPicking(false)
    setComposer({ memberId: m.user_id, memberName: m.name })
  }

  return (
    <PastorShell>
      {isPending && !data ? (
        <StatSpinner label="목회 일정을 모으는 중..." />
      ) : !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-600">목회 일정을 불러오지 못했습니다</p>
      ) : (
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* 우측 — 모바일에선 위로 */}
          <div className="contents lg:block lg:col-start-2 lg:row-start-1">
            <MiniCalendar data={data} selected={selected} onSelect={setSelected} onPlan={() => setPicking(true)} />
          </div>
          <div className="contents lg:block lg:min-w-0 lg:col-start-1 lg:row-start-1">
            <SectionCard
              title={selected ? `${formatDay(selected)} 일정` : '목회 일정'}
              action={
                selected ? (
                  <button type="button" onClick={() => setSelected(null)} className="text-[12px] font-semibold text-brand hover:underline">
                    전체 보기
                  </button>
                ) : (
                  <span className="text-[12px] text-gray-500 dark:text-white/50">앞으로 60일</span>
                )
              }
            >
              {groups.length === 0 ? (
                <EmptyHint text={selected ? '이날은 일정이 없습니다' : '앞으로 잡힌 일정이 없습니다'} />
              ) : (
                groups.map(g => (
                  <div key={g.label}>
                    <p className={`text-[12px] font-bold mb-1.5 ${g.label.startsWith('지난') ? 'text-[var(--amber)]' : 'text-gray-600 dark:text-white/65'}`}>
                      {g.label}
                    </p>
                    <ul className="space-y-1.5">
                      {g.items.map(item => (
                        <AgendaRow
                          key={item.id}
                          item={item}
                          showDate={!['오늘', '내일'].includes(g.label)}
                          onEditPlan={p => setComposer({ memberId: p.member_user_id, memberName: p.member_name, visit: planToVisit(p) })}
                          onCompletePlan={p =>
                            setComposer({ memberId: p.member_user_id, memberName: p.member_name, visit: planToVisit(p), completing: true })
                          }
                        />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {picking && <MemberPicker onPick={pick} onClose={() => setPicking(false)} />}
      {composer && (
        <VisitComposer
          memberId={composer.memberId}
          memberName={composer.memberName}
          visit={composer.visit}
          completing={composer.completing}
          initialStatus="planned"
          onClose={() => setComposer(null)}
        />
      )}
    </PastorShell>
  )
}

// ── 어젠다 한 줄 ───────────────────────────────────────
const AgendaRow = ({
  item,
  showDate,
  onEditPlan,
  onCompletePlan,
}: {
  item: AgendaItem
  showDate: boolean
  onEditPlan: (p: Plan) => void
  onCompletePlan: (p: Plan) => void
}) => {
  const when = [showDate ? formatDay(item.date) : '', item.time ?? ''].filter(Boolean).join(' ')
  const base = `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${
    item.overdue
      ? 'border-[var(--amber-soft-strong)] bg-[var(--amber-soft)]'
      : 'border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02]'
  }`

  if (item.type === 'visit_plan') {
    const due = item.date <= todayIso()
    return (
      <li className={base}>
        <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${item.is_mine ? 'bg-brand text-white' : 'bg-[var(--brand-soft)] text-brand'}`}>
          <span className="material-icons-outlined text-[17px]">{VISIT_KIND_ICON[item.kind]}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/pastor/members/${item.member_user_id}`} className="text-[13px] font-bold text-ink-strong hover:text-brand">
              {item.member_name}
            </Link>
            <span className="text-[12px] text-gray-600 dark:text-white/60">
              {VISIT_KIND_LABEL[item.kind]} 예약 · {item.is_mine ? '나' : item.pastor_name}
            </span>
          </span>
          <span className="block text-[12px] text-gray-600 dark:text-white/60 truncate">
            {[when || '시간 미정', item.memo].filter(Boolean).join(' · ')}
          </span>
        </span>
        {item.is_mine && (
          <span className="shrink-0 flex gap-1">
            {due && (
              <button
                type="button"
                onClick={() => onCompletePlan(item)}
                className="px-2.5 py-1.5 rounded-full bg-brand text-white text-[12px] font-bold"
              >
                다녀왔어요
              </button>
            )}
            <button
              type="button"
              onClick={() => onEditPlan(item)}
              className="px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-white/[0.1] text-[12px] font-semibold text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand"
            >
              고치기
            </button>
          </span>
        )}
      </li>
    )
  }

  if (item.type === 'follow_up') {
    return (
      <li>
        <Link to={`/pastor/members/${item.member_user_id}`} className={`${base} hover:border-brand`}>
          <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--amber-soft)] text-[var(--amber)]">
            <span className="material-icons-outlined text-[17px]">flag</span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-ink-strong truncate">{item.title}</span>
            <span className="block text-[12px] text-gray-600 dark:text-white/60">
              {item.member_name} · 후속 할 일{when ? ` · ${when}` : ''}
            </span>
          </span>
        </Link>
      </li>
    )
  }

  if (item.type === 'birthday') {
    return (
      <li>
        <Link to={`/pastor/members/${item.member_user_id}`} className={`${base} hover:border-brand`}>
          <Avatar name={item.member_name} url={item.member_avatar_url} size="sm" />
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-ink-strong truncate">{item.title}</span>
            <span className="block text-[12px] text-gray-600 dark:text-white/60">
              {when || '오늘'}
              {item.lunar ? ' · 음력' : ''}
            </span>
          </span>
          <span className="material-icons-outlined text-[18px] text-pink-400">cake</span>
        </Link>
      </li>
    )
  }

  return (
    <li>
      <Link to="/events" className={`${base} hover:border-brand`}>
        <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-white/60">
          <span className="material-icons-outlined text-[17px]">event</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold text-ink-strong truncate">{item.title}</span>
          <span className="block text-[12px] text-gray-600 dark:text-white/60 truncate">
            {['교회 일정', when, item.location].filter(Boolean).join(' · ')}
          </span>
        </span>
      </Link>
    </li>
  )
}

// ── 미니 달력 (점으로만) ───────────────────────────────
const MiniCalendar = ({
  data,
  selected,
  onSelect,
  onPlan,
}: {
  data: AgendaData
  selected: string | null
  onSelect: (d: string | null) => void
  onPlan: () => void
}) => {
  const today = parseDay(data.today)!
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const byDay = useMemo(() => {
    const map = new Map<string, Set<AgendaItem['type']>>()
    for (const i of data.items) {
      if (i.overdue) continue
      if (!map.has(i.date)) map.set(i.date, new Set())
      map.get(i.date)!.add(i.type)
    }
    return map
  }, [data])

  const cells = useMemo(() => {
    const first = month.getDay()
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const out: Array<string | null> = Array(first).fill(null)
    for (let d = 1; d <= days; d++) {
      out.push(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return out
  }, [month])

  const thisMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()
  const lastMonth = parseDay(data.until)!
  const canNext = month < new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)

  return (
    <SectionCard
      title={`${month.getFullYear()}년 ${month.getMonth() + 1}월`}
      action={
        <span className="flex gap-1">
          <button
            type="button"
            disabled={thisMonth}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:text-brand disabled:opacity-30"
            aria-label="이전 달"
          >
            <span className="material-icons-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:text-brand disabled:opacity-30"
            aria-label="다음 달"
          >
            <span className="material-icons-outlined text-[18px]">chevron_right</span>
          </button>
        </span>
      }
    >
      <div className="grid grid-cols-7 text-center gap-y-1">
        {WEEKDAYS.map((w, i) => (
          <span key={w} className={`text-[12px] font-semibold ${i === 0 ? 'text-[var(--amber)]' : 'text-gray-500 dark:text-white/55'}`}>
            {w}
          </span>
        ))}
        {cells.map((iso, idx) => {
          if (!iso) return <span key={`b${idx}`} />
          const types = byDay.get(iso)
          const isToday = iso === data.today
          const isSel = iso === selected
          const past = iso < data.today
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(isSel ? null : iso)}
              className={`mx-auto w-9 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isSel ? 'bg-brand text-white' : isToday ? 'bg-[var(--brand-soft)] text-brand' : 'hover:bg-gray-100 dark:hover:bg-white/[0.06]'
              } ${past && !isSel ? 'opacity-40' : ''}`}
            >
              <span className="text-[12.5px] font-semibold leading-none">{Number(iso.slice(8))}</span>
              <span className="flex gap-[2px] h-1.5">
                {types &&
                  TYPE_LEGEND.filter(([t]) => types.has(t)).map(([t]) => (
                    <span key={t} className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : TYPE_DOT[t]}`} />
                  ))}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {TYPE_LEGEND.map(([t, label]) => (
          <span key={t} className="inline-flex items-center gap-1 text-[12px] text-gray-600 dark:text-white/60">
            <span className={`w-2 h-2 rounded-full ${TYPE_DOT[t]}`} />
            {label}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onPlan}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-brand text-white text-[14px] font-bold"
      >
        <span className="material-icons-outlined text-[18px]">event_available</span>
        심방 예약하기
      </button>
      <p className="text-[12px] text-gray-500 dark:text-white/50 leading-relaxed">
        다른 교역자의 예약도 누가·언제·누구·방식까지 보여 같은 가정을 겹쳐 찾아가지 않게 합니다. 메모는 쓴 분만 봅니다.
      </p>
    </SectionCard>
  )
}

export default PastorSchedule
