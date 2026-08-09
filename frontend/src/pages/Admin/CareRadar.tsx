import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  fetchCareRadar,
  type CareRadarData,
  type NewcomerMember,
  type QuietMember,
} from '../../api/admin'
import { FilterChip, FilterRow } from './components/FilterControls'
import { AdminPageHeader, EmptyHint, SectionCard, StatSpinner } from './components/StatCards'

type Tab = 'quiet' | 'newcomers'

const QUIET_PERIODS = [
  { days: 21, label: '3주 이상' },
  { days: 42, label: '6주 이상' },
  { days: 90, label: '3개월 이상' },
]

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'quiet', label: '조용해진 성도' },
  { key: 'newcomers', label: '새가족 정착' },
]

const CareRadar = () => {
  const navigate = useNavigate()
  const admin = isAdmin()
  const [quietDays, setQuietDays] = useState(21)
  const [tab, setTab] = useState<Tab>('quiet')

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  const { data, isPending, isError } = useQuery<CareRadarData>({
    queryKey: ['admin-care-radar', quietDays],
    queryFn: () => fetchCareRadar(quietDays),
    enabled: admin,
    // 기준 기간을 바꿀 때 스피너 대신 이전 목록을 유지해 깜빡임 방지
    placeholderData: keepPreviousData,
  })
  const loading = isPending && !data

  useEffect(() => {
    if (isError) showToast('돌봄 레이더를 불러오는데 실패했습니다', 'error')
  }, [isError])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-10">
        <AdminPageHeader title="돌봄 레이더" />

        <p className="px-4 pt-3 text-[11.5px] text-gray-500 dark:text-white/45 leading-relaxed">
          안부를 물을 분을 찾기 위한 화면입니다. 마지막으로 <b>활동한 시점</b>까지만 보여주며,
          기도 제목이나 묵상 노트 같은 <b>기록 내용은 표시되지 않습니다</b>.
        </p>

        <div className="px-4 pt-3">
          <FilterRow label="탭" align="center">
            {TABS.map(t => (
              <FilterChip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </FilterChip>
            ))}
          </FilterRow>
        </div>

        {tab === 'quiet' && (
          <div className="px-4 pt-2">
            <FilterRow label="기준" align="center">
              {QUIET_PERIODS.map(p => (
                <FilterChip
                  key={p.days}
                  active={quietDays === p.days}
                  onClick={() => setQuietDays(p.days)}
                >
                  {p.label}
                </FilterChip>
              ))}
            </FilterRow>
          </div>
        )}

        {loading ? (
          <StatSpinner label="성도들의 발자취를 살피는 중..." />
        ) : !data ? (
          <p className="px-4 py-16 text-center text-[13px] text-gray-500 dark:text-white/50">
            불러오지 못했습니다
          </p>
        ) : tab === 'quiet' ? (
          <QuietTab data={data} />
        ) : (
          <NewcomerTab data={data} />
        )}
      </div>
    </div>
  )
}

// ── 조용해진 성도 ─────────────────────────────────────────
const QuietTab = ({ data }: { data: CareRadarData }) => {
  const { summary, quiet_members: members, quiet_truncated: truncated } = data
  const ratio = summary.members ? Math.round((summary.quiet / summary.members) * 100) : 0

  return (
    <>
      <SectionCard title="한눈에">
        <p className="text-[13px] text-gray-700 dark:text-white/70 leading-relaxed">
          성도 <b className="text-ink-strong">{summary.members.toLocaleString()}명</b> 중{' '}
          <b className="text-brand">{summary.quiet.toLocaleString()}명</b>이{' '}
          {data.quiet_days}일 넘게 앱에 흔적을 남기지 않았습니다{summary.members ? ` (${ratio}%)` : ''}.
        </p>
        {summary.bands.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {summary.bands.map(band => (
              <span
                key={band.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-white/70"
              >
                {band.label}
                <span className="text-[11px] font-bold text-brand">{band.count}</span>
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="안부를 물을 분"
        action={
          <span className="text-[11px] text-gray-400 dark:text-white/35">활발했던 순</span>
        }
      >
        {members.length === 0 ? (
          <EmptyHint text="이 기준으로는 조용한 성도가 없습니다" />
        ) : (
          <>
            <ul className="space-y-1.5">
              {members.map(member => (
                <QuietRow key={member.user_id} member={member} />
              ))}
            </ul>
            {truncated > 0 && (
              <p className="text-[11px] text-gray-400 dark:text-white/35 text-center">
                외 {truncated.toLocaleString()}명 (기준 기간을 늘려 좁혀보세요)
              </p>
            )}
          </>
        )}
      </SectionCard>
    </>
  )
}

const QuietRow = ({ member }: { member: QuietMember }) => (
  <li className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
    <Avatar name={member.name} url={member.avatar_url} />
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-ink-strong tracking-[-0.01em] truncate">
        {member.name}
      </p>
      <p className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
        {member.days_since === null
          ? '최근 1년 내 활동 기록 없음'
          : `마지막 활동 ${member.days_since}일 전 · ${formatDay(member.last_seen)}`}
      </p>
    </div>
    <span className="shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] text-brand">
      {member.band}
    </span>
  </li>
)

// ── 새가족 정착 ───────────────────────────────────────────
const NewcomerTab = ({ data }: { data: CareRadarData }) => {
  const { newcomers } = data

  if (newcomers.total === 0) {
    return (
      <SectionCard title={`최근 ${newcomers.cohort_days}일 새가족`}>
        <EmptyHint text="이 기간에 새로 가입한 성도가 없습니다" />
      </SectionCard>
    )
  }

  const stepLabels = new Map(newcomers.steps.map(s => [s.key, s.label]))

  return (
    <>
      <SectionCard
        title={`최근 ${newcomers.cohort_days}일 새가족 ${newcomers.total}명`}
        action={<span className="text-[11px] text-gray-400 dark:text-white/35">단계별 도달</span>}
      >
        <div className="space-y-2.5">
          {newcomers.steps.map(step => (
            <div key={step.key} className="flex items-center gap-2.5">
              <span className="w-[76px] shrink-0 text-[12px] font-semibold text-gray-700 dark:text-white/70 truncate">
                {step.label}
              </span>
              <div className="flex-1 h-[10px] rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${Math.max(2, step.rate)}%` }}
                />
              </div>
              <span className="w-[52px] shrink-0 text-right text-[11.5px] font-bold text-gray-500 dark:text-white/50">
                {step.count}명 {step.rate}%
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
          가입 후 한 번이라도 해본 적 있으면 도달로 봅니다. 낮은 단계가 새가족이 막힌 지점입니다.
        </p>
      </SectionCard>

      <SectionCard
        title="아직 자리 잡지 못한 새가족"
        action={<span className="text-[11px] text-gray-400 dark:text-white/35">덜 밟은 순</span>}
      >
        <ul className="space-y-1.5">
          {newcomers.members.map(member => (
            <NewcomerRow key={member.user_id} member={member} stepLabels={stepLabels} steps={newcomers.steps.map(s => s.key)} />
          ))}
        </ul>
      </SectionCard>
    </>
  )
}

const NewcomerRow = ({
  member,
  steps,
  stepLabels,
}: {
  member: NewcomerMember
  steps: string[]
  stepLabels: Map<string, string>
}) => (
  <li className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
    <Avatar name={member.name} url={member.avatar_url} />
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-ink-strong tracking-[-0.01em] truncate">
        {member.name}
      </p>
      <p className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
        {member.days_since_join === null
          ? '가입일 미상'
          : member.days_since_join === 0
            ? '오늘 가입'
            : `가입 ${member.days_since_join}일째`}
        {' · '}
        {member.done.length}/{steps.length}단계
      </p>
    </div>
    <span className="shrink-0 flex gap-1">
      {steps.map(key => (
        <span
          key={key}
          title={stepLabels.get(key)}
          className={`w-2 h-2 rounded-full ${
            member.done.includes(key) ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'
          }`}
        />
      ))}
    </span>
  </li>
)

// ── 공통 ─────────────────────────────────────────────────
const Avatar = ({ name, url }: { name: string; url: string | null }) =>
  url ? (
    <img
      src={url}
      alt=""
      className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-white/10"
    />
  ) : (
    <span className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold bg-[var(--brand-soft-strong)] text-brand">
      {name.slice(0, 1)}
    </span>
  )

/** '2026-07-16' → '7월 16일' */
const formatDay = (iso: string | null): string => {
  if (!iso) return '기록 없음'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default CareRadar
