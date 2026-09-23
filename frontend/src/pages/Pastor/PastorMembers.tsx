import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchRoster, type RosterData, type RosterMember } from '../../api/pastor'
import { SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import { Avatar } from './components/ui'
import { agoLabel, daysSince, formatDay, usePastorGate } from './components/pastorUtils'

// 성도 명부 — 관리자 리스트 패턴(검색·필터·정렬 한 카드 + 통계 chip + 컴팩트 행).
// 인원이 수백 명 수준이라 필터·정렬은 전부 클라이언트에서 한다.

type Sort = 'name' | 'visit' | 'quiet'
type Quick = 'all' | 'no_profile' | 'no_visit' | 'birthday'

const SORTS: Array<{ key: Sort; label: string }> = [
  { key: 'name', label: '이름순' },
  { key: 'visit', label: '심방 오래된 순' },
  { key: 'quiet', label: '활동 뜸한 순' },
]

const QUICKS: Array<{ key: Quick; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'no_profile', label: '명부 미작성' },
  { key: 'no_visit', label: '심방 90일+' },
  { key: 'birthday', label: '이번 달 생일' },
]

const chip = (active: boolean) =>
  `shrink-0 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-colors ${
    active
      ? 'bg-brand border-brand text-white'
      : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
  }`

const PastorMembers = () => {
  const pastor = usePastorGate()
  const [q, setQ] = useState('')
  const [district, setDistrict] = useState<string | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [quick, setQuick] = useState<Quick>('all')
  const [sort, setSort] = useState<Sort>('name')

  const { data, isPending } = useQuery<RosterData>({
    queryKey: ['pastor-roster'],
    queryFn: fetchRoster,
    enabled: pastor,
    refetchOnMount: 'always',
  })

  const rows = useMemo(() => {
    if (!data) return []
    const month = new Date().getMonth() + 1
    const needle = q.trim().toLowerCase()
    const list = data.items.filter(m => {
      if (district && m.district !== district) return false
      if (title && m.church_title !== title) return false
      if (quick === 'no_profile' && m.has_profile) return false
      if (quick === 'no_visit') {
        const d = daysSince(m.last_visit)
        if (d != null && d < 90) return false
      }
      if (quick === 'birthday' && (!m.birthday || Number(m.birthday.slice(5, 7)) !== month)) return false
      if (needle) {
        const hay = [m.name, m.phone, m.district, m.church_title].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    const byName = (a: RosterMember, b: RosterMember) => a.name.localeCompare(b.name, 'ko')
    if (sort === 'name') list.sort(byName)
    if (sort === 'visit') {
      // 한 번도 안 간 분이 맨 위, 그다음 오래된 순
      list.sort((a, b) => (a.last_visit ?? '').localeCompare(b.last_visit ?? '') || byName(a, b))
    }
    if (sort === 'quiet') {
      list.sort((a, b) => (b.days_since ?? 99999) - (a.days_since ?? 99999) || byName(a, b))
    }
    return list
  }, [data, q, district, title, quick, sort])

  return (
    <PastorShell>
      {isPending && !data ? (
        <StatSpinner label="성도 명부를 불러오는 중..." />
      ) : !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-600 dark:text-white/60">
          성도 명부를 불러오지 못했습니다
        </p>
      ) : (
        <>
          <SectionCard
            title="성도 명부"
            action={
              <span className="flex gap-1.5">
                <StatChip label="성도" value={data.total} />
                <StatChip label="명부 작성" value={data.with_profile} />
              </span>
            }
          >
            <div className="relative">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-500">
                search
              </span>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="이름 · 연락처 · 구역으로 찾기"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-500 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {QUICKS.map(x => (
                <button key={x.key} type="button" className={chip(quick === x.key)} onClick={() => setQuick(x.key)}>
                  {x.label}
                </button>
              ))}
            </div>

            {data.districts.length > 0 && (
              <FacetRow
                label="구역"
                values={data.districts}
                selected={district}
                onSelect={setDistrict}
              />
            )}
            {data.titles.length > 0 && (
              <FacetRow label="직분" values={data.titles} selected={title} onSelect={setTitle} />
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[12px] font-semibold text-gray-600 dark:text-white/60">{rows.length}명</span>
              <div className="flex gap-1">
                {SORTS.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSort(s.key)}
                    className={`px-2 py-1 rounded-md text-[12px] font-semibold ${
                      sort === s.key ? 'text-brand bg-[var(--brand-soft)]' : 'text-gray-600 dark:text-white/60'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="px-4 pt-3">
            {/* PC 열 머리 */}
            <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.4fr)_110px_120px_120px_130px_150px] gap-3 px-4 pb-2 text-[12px] font-semibold text-gray-500 dark:text-white/55">
              <span>이름</span>
              <span>구역</span>
              <span>생일</span>
              <span>연락처</span>
              <span>마지막 활동</span>
              <span>마지막 심방</span>
            </div>
            {rows.length === 0 ? (
              <p className="py-12 text-center text-[13px] text-gray-500 dark:text-white/55">조건에 맞는 성도가 없습니다</p>
            ) : (
              <ul className="space-y-1.5">
                {rows.map(m => (
                  <MemberRow key={m.user_id} m={m} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PastorShell>
  )
}

const MemberRow = ({ m }: { m: RosterMember }) => {
  const visitDays = daysSince(m.last_visit)
  return (
    <li>
      <Link
        to={`/pastor/members/${m.user_id}`}
        className="flex items-center gap-3 lg:grid lg:grid-cols-[minmax(0,1.4fr)_110px_120px_120px_130px_150px] px-4 py-2.5 rounded-xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] hover:border-brand transition-colors"
      >
        <span className="flex items-center gap-2.5 min-w-0 flex-1">
          <Avatar name={m.name} url={m.avatar_url} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="text-[13.5px] font-bold text-ink-strong truncate">{m.name}</span>
              {m.church_title && (
                <span className="shrink-0 text-[12px] font-semibold text-brand">{m.church_title}</span>
              )}
              {!m.has_profile && (
                <span className="shrink-0 text-[12px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500">
                  미작성
                </span>
              )}
            </span>
            {/* 모바일 한 줄 요약 */}
            <span className="lg:hidden block text-[12px] text-gray-600 dark:text-white/60 truncate">
              {[m.district, `활동 ${agoLabel(m.days_since)}`, m.last_visit ? `심방 ${agoLabel(visitDays)}` : '심방 없음']
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        </span>
        <Cell>{m.district ?? '—'}</Cell>
        <Cell>{m.birthday ? formatDay(m.birthday, false).replace(/^\d+년 /, '') : '—'}</Cell>
        <Cell>{m.phone ?? '—'}</Cell>
        <Cell tone={m.days_since != null && m.days_since >= 21 ? 'warn' : undefined}>{agoLabel(m.days_since)}</Cell>
        <Cell tone={visitDays == null || visitDays >= 90 ? 'muted' : undefined}>
          {m.last_visit ? `${agoLabel(visitDays)} · ${m.last_visit_by ?? ''}` : '아직 없음'}
        </Cell>
        <span className="lg:hidden material-icons-outlined text-[18px] text-gray-300 dark:text-white/40">chevron_right</span>
      </Link>
    </li>
  )
}

const Cell = ({ children, tone }: { children: ReactNode; tone?: 'warn' | 'muted' }) => (
  <span
    className={`hidden lg:block text-[12.5px] truncate ${
      tone === 'warn'
        ? 'text-[var(--amber)] font-semibold'
        : tone === 'muted'
          ? 'text-gray-500 dark:text-white/50'
          : 'text-gray-600 dark:text-white/70'
    }`}
  >
    {children}
  </span>
)

const StatChip = ({ label, value }: { label: string; value: number }) => (
  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand">
    {label} {value.toLocaleString()}
  </span>
)

const FacetRow = ({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string
  values: Array<{ value: string; count: number }>
  selected: string | null
  onSelect: (v: string | null) => void
}) => (
  <div className="flex items-center gap-2">
    <span className="shrink-0 w-8 text-[12px] font-semibold text-gray-500 dark:text-white/55">{label}</span>
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
      <button type="button" className={chip(selected === null)} onClick={() => onSelect(null)}>
        전체
      </button>
      {values.map(v => (
        <button
          key={v.value}
          type="button"
          className={chip(selected === v.value)}
          onClick={() => onSelect(selected === v.value ? null : v.value)}
        >
          {v.value} <span className="opacity-60">{v.count}</span>
        </button>
      ))}
    </div>
  </div>
)

export default PastorMembers
