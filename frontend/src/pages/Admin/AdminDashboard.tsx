import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { fetchAdminDashboard, type AdminDashboardData, type DashboardAction } from '../../api/admin'
import { AdminPageHeader, SectionCard, StatSpinner } from './components/StatCards'

// 액션 카드 톤 — 빨강 대신 앰버/브랜드 틴트로, 앱 전체 팔레트를 벗어나지 않게.
const TONE_STYLE: Record<DashboardAction['tone'], string> = {
  urgent: 'bg-[var(--amber-soft)] border-[var(--amber-soft-strong)]',
  warn: 'bg-[var(--brand-soft)] border-[var(--brand-soft-strong)]',
  info: 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06]',
}

const TONE_COUNT: Record<DashboardAction['tone'], string> = {
  urgent: 'text-[var(--amber)]',
  warn: 'text-brand',
  info: 'text-gray-500 dark:text-white/50',
}

const SHORTCUTS = [
  { path: '/admin/care', icon: 'volunteer_activism', label: '돌봄 레이더', desc: '조용해진 성도 · 새가족 정착' },
  { path: '/admin/bible-engagement', icon: 'menu_book', label: '말씀 반응 통계', desc: '어느 말씀에 머물렀나' },
  { path: '/admin/users', icon: 'group', label: '회원 관리', desc: '승인 · 권한 · 비밀번호' },
  { path: '/admin/push', icon: 'campaign', label: '푸시 알림', desc: '전체 · 대상별 발송' },
]

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const AdminDashboard = () => {
  const navigate = useNavigate()
  const admin = isAdmin()

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  const { data, isPending, isError } = useQuery<AdminDashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    enabled: admin,
  })

  useEffect(() => {
    if (isError) showToast('현황을 불러오는데 실패했습니다', 'error')
  }, [isError])

  const maxTrend = data ? Math.max(1, ...data.trend.map(d => d.active)) : 1

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-10">
        <AdminPageHeader title="관리자 홈" />

        {isPending && !data ? (
          <StatSpinner label="교회 현황을 모으는 중..." />
        ) : !data ? (
          <p className="px-4 py-16 text-center text-[13px] text-gray-500 dark:text-white/50">
            현황을 불러오지 못했습니다
          </p>
        ) : (
          <>
            <p className="px-4 pt-3 text-[11.5px] text-gray-500 dark:text-white/45 leading-relaxed">
              성도 {data.members.toLocaleString()}명 · {formatStamp(data.generated_at)} 기준 집계입니다.
              누가 무엇을 썼는지는 표시되지 않습니다.
            </p>

            {/* 지금 처리할 일 — 숫자가 아니라 '할 일'로 */}
            <SectionCard title="지금 처리할 일">
              {data.actions.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[22px]">☕</p>
                  <p className="mt-1 text-[12.5px] text-gray-500 dark:text-white/50">
                    처리를 기다리는 일이 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.actions.map(action => (
                    <Link
                      key={action.key}
                      to={action.link}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-colors hover:border-brand ${TONE_STYLE[action.tone]}`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-ink-strong tracking-[-0.01em]">
                          {action.label}
                        </span>
                        <span className="block text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
                          {action.detail}
                        </span>
                      </span>
                      <span className={`shrink-0 text-[17px] font-bold ${TONE_COUNT[action.tone]}`}>
                        {action.count}
                      </span>
                      <span className="material-icons-outlined text-[18px] text-gray-400 dark:text-white/35">
                        chevron_right
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* 최근 7일 지표 */}
            <SectionCard
              title="최근 7일"
              action={
                <span className="text-[11px] text-gray-400 dark:text-white/35">직전 7일 대비</span>
              }
            >
              <div className="grid grid-cols-2 gap-2">
                {data.weekly.map(metric => (
                  <div
                    key={metric.key}
                    className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-3"
                  >
                    <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/55">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-[20px] font-bold text-ink-strong tracking-[-0.02em] leading-none">
                      {metric.value.toLocaleString()}
                      <span className="text-[12px] font-semibold text-gray-400 dark:text-white/40 ml-0.5">
                        {metric.unit}
                      </span>
                    </p>
                    <Delta delta={metric.delta} />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* 일별 활동 성도 */}
            <SectionCard title="최근 14일 활동 성도">
              <div className="flex items-end gap-[3px] h-20">
                {data.trend.map(day => {
                  const d = new Date(day.date)
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className={`w-full rounded-[3px] transition-all duration-500 ${
                            d.getDay() === 0 ? 'bg-[var(--amber-icon)]' : 'bg-brand'
                          }`}
                          style={{
                            height: `${Math.max(4, (day.active / maxTrend) * 100)}%`,
                            opacity: day.active === 0 ? 0.18 : 1,
                          }}
                          title={`${day.date} · ${day.active}명`}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 dark:text-white/30 leading-none">
                        {WEEKDAYS[d.getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
                기도·감사·묵상·말씀 읽기 등 기록을 남긴 성도 수입니다. 주황 막대가 주일입니다.
              </p>
            </SectionCard>

            {/* 푸시 도달률 */}
            <SectionCard title="푸시 알림 도달 가능 인원">
              <div className="flex items-end justify-between gap-2">
                <p className="text-[24px] font-bold text-ink-strong tracking-[-0.02em] leading-none">
                  {data.reach.rate}
                  <span className="text-[13px] font-semibold text-gray-400 dark:text-white/40">%</span>
                </p>
                <p className="text-[12px] font-semibold text-gray-500 dark:text-white/50">
                  {data.reach.subscribed.toLocaleString()} / {data.reach.members.toLocaleString()}명
                </p>
              </div>
              <div className="h-[10px] rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${Math.min(100, data.reach.rate)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
                푸시 알림을 켜 둔 성도의 비율입니다. 이 비율이 낮으면 공지를 보내도 나머지는
                앱에 직접 들어와야 볼 수 있습니다.
              </p>
            </SectionCard>

            {/* 바로가기 */}
            <SectionCard title="바로가기">
              <div className="grid grid-cols-2 gap-2">
                {SHORTCUTS.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex flex-col gap-1 px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] hover:border-brand transition-colors"
                  >
                    <span className="material-icons-outlined text-[19px] text-brand">{item.icon}</span>
                    <span className="text-[12.5px] font-bold text-ink-strong tracking-[-0.01em]">
                      {item.label}
                    </span>
                    <span className="text-[10.5px] text-gray-500 dark:text-white/45 leading-snug">
                      {item.desc}
                    </span>
                  </Link>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  )
}

const Delta = ({ delta }: { delta: number }) => {
  if (delta === 0) {
    return (
      <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-white/35">지난주와 같음</p>
    )
  }
  const up = delta > 0
  return (
    <p
      className={`mt-1 text-[11px] font-bold ${up ? 'text-brand' : 'text-[var(--amber)]'}`}
    >
      {up ? '▲' : '▼'} {Math.abs(delta).toLocaleString()}
    </p>
  )
}

/** '2026-08-09T16:20:46' → '8월 9일 16:20' */
const formatStamp = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`
}

export default AdminDashboard
