import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import { isPastor } from '../../utils/access'
import { sessionStore } from '../../utils/tokenStore'
import { lazyModal } from '../../utils/lazyModal'
import { fetchPastorHome, type PastorHomeData, type PastoralPrayerItem } from '../../api/pastor'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'

// 목회자 홈 — 월요일 아침에 여는 '이번 주 목양 브리핑'.
// 개인정보 경계: 기도 본문은 성도가 '목사님과 함께'로 스스로 맡긴 것만,
// 돌봄 명단은 이름·마지막 활동 시점까지만(서버가 내용 자체를 내려보내지 않는다).

// 상세 모달은 성도 홈과 같은 컴포넌트 — 여기서 바로 답글·기도하기까지 끝낸다
const PrayerDetail = lazyModal(() => import('../Home/components/PrayerDetail'))

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const EVENT_CATEGORY: Record<string, string> = {
  worship: '예배',
  meeting: '모임',
  service: '봉사',
  special: '행사',
  education: '교육',
  other: '기타',
}

// 오래 기다린 기도일수록 눈에 띄게 — 사흘 넘으면 앰버, 일주일 넘으면 진하게
const waitTone = (days: number | null): string => {
  if (days == null || days < 3) return 'bg-[var(--brand-soft)] text-brand'
  if (days < 7) return 'bg-[var(--amber-soft)] text-[var(--amber)]'
  return 'bg-[var(--amber-soft-strong)] text-[var(--amber)]'
}

const waitLabel = (days: number | null): string => {
  if (days == null) return '—'
  if (days === 0) return '오늘'
  return `${days}일째`
}

const PastorHome = () => {
  const navigate = useNavigate()
  const pastor = isPastor()
  const [openPrayerId, setOpenPrayerId] = useState<number | null>(null)

  useEffect(() => {
    if (!pastor) {
      showToast('목회자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [pastor, navigate])

  const { data, isPending, isError, refetch } = useQuery<PastorHomeData>({
    queryKey: ['pastor-home'],
    queryFn: fetchPastorHome,
    enabled: pastor,
    // 답글을 달고 돌아오면 대기 목록이 바로 줄어야 한다 — 전역 캐시 우선 설정을 덮어쓴다
    refetchOnMount: 'always',
  })

  useEffect(() => {
    if (isError) showToast('목회자 홈을 불러오는데 실패했습니다', 'error')
  }, [isError])

  const closeDetail = () => {
    setOpenPrayerId(null)
    void refetch()
  }

  return (
    <PastorShell>
      {isPending && !data ? (
        <StatSpinner label="이번 주 목양 브리핑을 준비하는 중..." />
      ) : !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-500 dark:text-white/50">
          목회자 홈을 불러오지 못했습니다
        </p>
      ) : (
        <>
          <Greeting data={data} />

          {/* PC(lg+) 2단 — 좌: 맡겨진 기도·응답의 은혜 / 우: 돌봄·이번 주·교회 흐름.
              래퍼는 lg 미만에서 display:contents 라 모바일은 한 줄 흐름 그대로. */}
          <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="contents lg:block lg:min-w-0">
              <PastoralInbox data={data} onOpen={setOpenPrayerId} />
              <GraceCard data={data} />
            </div>
            <div className="contents lg:block">
              <CareCard data={data} />
              <WeekCard data={data} />
              <PulseCard data={data} />
            </div>
          </div>
        </>
      )}

      {openPrayerId && (
        <PrayerDetail prayerId={openPrayerId} onClose={closeDetail} onDelete={closeDetail} />
      )}
    </PastorShell>
  )
}

// ── 인사 · 이번 주 요약 ───────────────────────────────
const Greeting = ({ data }: { data: PastorHomeData }) => {
  const name = sessionStore.get('fullName') || sessionStore.get('username') || ''
  const now = new Date()
  const stats = [
    { label: '맡겨진 기도', value: data.pastoral.waiting_count, unit: '건' },
    { label: '돌봄이 필요한 성도', value: data.care.quiet_count, unit: '명' },
    { label: '정착 중인 새가족', value: data.care.newcomer_count, unit: '명' },
    { label: '이번 주 일정', value: data.week.events.length, unit: '건' },
  ]
  return (
    <div className="px-4 pt-4">
      <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-5 lg:p-6">
        <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
        <div className="relative z-10 lg:flex lg:items-end lg:justify-between lg:gap-6">
          <div>
            <p className="text-[12px] font-semibold text-brand">
              {now.getMonth() + 1}월 {now.getDate()}일 {WEEKDAYS[now.getDay()]}요일 · 이번 주 목양 브리핑
            </p>
            <h2 className="mt-1.5 text-[20px] lg:text-[22px] font-bold text-ink-strong tracking-[-0.02em]">
              {name ? `${name} 목사님, 평안하세요` : '목사님, 평안하세요'}
            </h2>
            <p className="mt-1 text-[12.5px] text-gray-500 dark:text-white/50 leading-relaxed">
              성도님들이 목사님께 맡긴 기도와 안부가 필요한 분들을 모았습니다.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:mt-0 lg:grid-cols-4 lg:shrink-0">
            {stats.map(s => (
              <div
                key={s.label}
                className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-2.5 lg:min-w-[118px]"
              >
                <p className="text-[11px] font-semibold text-gray-500 dark:text-white/55 whitespace-nowrap">{s.label}</p>
                <p className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] leading-tight">
                  <span className="brand-text-gradient">{s.value.toLocaleString()}</span>
                  <span className="text-[12px] font-semibold text-gray-400 dark:text-white/40 ml-0.5">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 목사님께 맡겨진 기도 ───────────────────────────────
const PastoralInbox = ({ data, onOpen }: { data: PastorHomeData; onOpen: (id: number) => void }) => {
  const { pastoral } = data
  return (
    <SectionCard
      title={`목사님께 맡겨진 기도 ${pastoral.waiting_count > 0 ? pastoral.waiting_count : ''}`.trim()}
      action={
        <span className="text-[11px] text-gray-400 dark:text-white/35">
          최근 {pastoral.replied_window_days}일 답한 기도 {pastoral.replied_recent}건
        </span>
      }
    >
      {pastoral.items.length === 0 ? (
        <div className="py-8 text-center">
          <span className="material-icons-outlined text-[28px] text-brand">task_alt</span>
          <p className="mt-1 text-[13px] font-semibold text-ink-strong">모든 기도에 답하셨습니다</p>
          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/50">
            성도님이 '목사님과 함께'로 나눈 기도가 오면 여기에 모입니다
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {pastoral.items.map(item => (
              <PastoralRow key={item.id} item={item} onOpen={onOpen} />
            ))}
          </ul>
          <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
            오래 기다린 기도가 위에 옵니다. 목회자 중 한 분이 답글을 남기면 목록에서 빠집니다.
          </p>
        </>
      )}
    </SectionCard>
  )
}

const PastoralRow = ({ item, onOpen }: { item: PastoralPrayerItem; onOpen: (id: number) => void }) => (
  <li>
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="w-full text-left flex gap-3 px-3.5 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] hover:border-brand transition-colors"
    >
      <Avatar name={item.display_name} url={item.avatar_url} />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-ink-strong truncate">{item.display_name}</span>
          <span className={`shrink-0 text-[10.5px] font-bold px-1.5 py-0.5 rounded-md ${waitTone(item.days_waiting)}`}>
            {waitLabel(item.days_waiting)}
          </span>
          {item.prayed_by_me && (
            <span className="shrink-0 text-[10.5px] font-semibold text-gray-400 dark:text-white/40">기도함</span>
          )}
        </span>
        {item.title && (
          <span className="block mt-1 text-[13px] font-semibold text-ink-strong truncate">{item.title}</span>
        )}
        <span className="block mt-0.5 text-[12.5px] text-[#4b5563] dark:text-white/60 leading-relaxed line-clamp-2">
          {item.excerpt}
        </span>
      </span>
      <span className="self-center shrink-0 flex items-center gap-0.5 text-[12px] font-semibold text-brand">
        답하기
        <span className="material-icons-outlined text-[16px]">chevron_right</span>
      </span>
    </button>
  </li>
)

// ── 돌봄이 필요한 성도 ────────────────────────────────
const CareCard = ({ data }: { data: PastorHomeData }) => {
  const { care } = data
  return (
    <SectionCard
      title="돌봄이 필요한 성도"
      action={
        <Link to="/pastor/care" className="text-[11.5px] font-semibold text-brand hover:underline">
          전체 보기
        </Link>
      }
    >
      <div>
        <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/55">
          {care.quiet_days}일 넘게 소식이 없는 분 · {care.quiet_count}명
        </p>
        {care.quiet_preview.length === 0 ? (
          <EmptyHint text="모두 최근에 활동하셨습니다" />
        ) : (
          <ul className="mt-2 space-y-1.5">
            {care.quiet_preview.map(m => (
              <li key={m.user_id} className="flex items-center gap-2.5">
                <Avatar name={m.name} url={m.avatar_url} size="sm" />
                <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-ink-strong truncate">{m.name}</span>
                <span className="shrink-0 text-[11px] text-gray-500 dark:text-white/45">
                  {m.days_since == null ? '기록 없음' : `${m.days_since}일 전`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/55">
          최근 {care.newcomer_days ?? 30}일 새가족 · {care.newcomer_count}명
        </p>
        {care.newcomer_preview.length === 0 ? (
          <EmptyHint text="최근 가입한 새가족이 없습니다" />
        ) : (
          <ul className="mt-2 space-y-1.5">
            {care.newcomer_preview.map(m => (
              <li key={m.user_id} className="flex items-center gap-2.5">
                <Avatar name={m.name} url={m.avatar_url} size="sm" />
                <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-ink-strong truncate">{m.name}</span>
                <span className="shrink-0 flex gap-[3px]" title={`정착 ${m.done}/${m.steps}단계`}>
                  {Array.from({ length: m.steps }, (_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < m.done ? 'bg-brand' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
        마지막 활동 시점까지만 보여주며, 기도·묵상 내용은 표시되지 않습니다.
      </p>
    </SectionCard>
  )
}

// ── 이번 주 교회 ──────────────────────────────────────
const WeekCard = ({ data }: { data: PastorHomeData }) => {
  const { events, latest_sermon: sermon } = data.week
  return (
    <SectionCard
      title="이번 주 교회"
      action={
        <Link to="/events" className="text-[11.5px] font-semibold text-brand hover:underline">
          전체 일정
        </Link>
      }
    >
      {events.length === 0 ? (
        <EmptyHint text="앞으로 7일 동안 등록된 교회 일정이 없습니다" />
      ) : (
        <ul className="space-y-1.5">
          {events.map(e => {
            const d = e.start ? new Date(e.start) : null
            return (
              <li key={e.id} className="flex items-center gap-3">
                <span className="shrink-0 w-11 text-center rounded-lg bg-[var(--brand-soft)] py-1">
                  <span className="block text-[10px] font-semibold text-brand leading-tight">
                    {d ? `${WEEKDAYS[d.getDay()]}요일` : ''}
                  </span>
                  <span className="block text-[14px] font-bold text-brand leading-tight">{d ? d.getDate() : '—'}</span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-semibold text-ink-strong truncate">{e.title}</span>
                  <span className="block text-[11px] text-gray-500 dark:text-white/45 truncate">
                    {[EVENT_CATEGORY[e.category] ?? '', d ? formatTime(d) : '', e.location ?? '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {sermon && (
        <Link
          to="/sermon"
          className="block pt-3 border-t border-gray-100 dark:border-white/[0.06] group"
        >
          <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/55">최근 설교</p>
          <p className="mt-1 text-[13px] font-bold text-ink-strong group-hover:text-brand transition-colors truncate">
            {sermon.title}
          </p>
          <p className="text-[11.5px] text-gray-500 dark:text-white/45 truncate">
            {[sermon.bible_verse, sermon.pastor, sermon.sermon_date?.replace(/-/g, '.')].filter(Boolean).join(' · ')}
          </p>
        </Link>
      )}
    </SectionCard>
  )
}

// ── 응답의 은혜 ───────────────────────────────────────
const GraceCard = ({ data }: { data: PastorHomeData }) => {
  const { grace } = data
  return (
    <SectionCard
      title="응답의 은혜"
      action={
        <Link to="/answered-prayers" className="text-[11.5px] font-semibold text-brand hover:underline">
          응답의 전당
        </Link>
      }
    >
      <p className="text-[11.5px] text-gray-500 dark:text-white/50">
        최근 {grace.days}일 동안 응답된 기도 {grace.count}건 — 설교와 광고에서 함께 나눌 이야기입니다.
      </p>
      {grace.items.length === 0 ? (
        <EmptyHint text="최근 응답을 나눈 기도가 없습니다" />
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {grace.items.map(g => (
            <li
              key={g.id}
              className="rounded-xl border border-[var(--amber-soft-strong)] bg-[var(--amber-soft)] px-3.5 py-3"
            >
              <p className="text-[11px] font-semibold text-[var(--amber)]">
                {g.display_name}
                {g.answered_at ? ` · ${formatDay(g.answered_at)}` : ''}
              </p>
              <p className="mt-1 text-[12.5px] font-semibold text-ink-strong line-clamp-2">{g.title || g.excerpt}</p>
              {g.testimony && (
                <p className="mt-1 text-[12px] text-[#4b5563] dark:text-white/60 leading-relaxed line-clamp-3">
                  “{g.testimony}”
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

// ── 교회 흐름 (익명 집계) ──────────────────────────────
const PulseCard = ({ data }: { data: PastorHomeData }) => {
  const { pulse } = data
  const maxTrend = Math.max(1, ...pulse.trend.map(d => d.active))
  const picks = pulse.weekly.filter(m => ['active_users', 'readers', 'prayers', 'thanks'].includes(m.key))
  return (
    <SectionCard
      title="지난 7일 교회 흐름"
      action={<span className="text-[11px] text-gray-400 dark:text-white/35">성도 {pulse.members.toLocaleString()}명</span>}
    >
      <div className="grid grid-cols-2 gap-2">
        {picks.map(m => (
          <div
            key={m.key}
            className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3 py-2.5"
          >
            <p className="text-[11px] font-semibold text-gray-500 dark:text-white/55">{m.label}</p>
            <p className="mt-0.5 text-[18px] font-bold text-ink-strong tracking-[-0.02em] leading-tight">
              {m.value.toLocaleString()}
              <span className="text-[11px] font-semibold text-gray-400 dark:text-white/40 ml-0.5">{m.unit}</span>
              {m.delta !== 0 && (
                <span className={`ml-1.5 text-[10.5px] font-bold ${m.delta > 0 ? 'text-brand' : 'text-[var(--amber)]'}`}>
                  {m.delta > 0 ? '▲' : '▼'}{Math.abs(m.delta)}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-[3px] h-14">
        {pulse.trend.map(day => {
          const d = new Date(day.date)
          return (
            <div key={day.date} className="flex-1 h-full flex items-end" title={`${day.date} · ${day.active}명`}>
              <div
                className={`w-full rounded-[3px] ${d.getDay() === 0 ? 'bg-[var(--amber-icon)]' : 'bg-brand'}`}
                style={{
                  height: `${Math.max(4, (day.active / maxTrend) * 100)}%`,
                  opacity: day.active === 0 ? 0.18 : 1,
                }}
              />
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
        최근 14일 동안 기록을 남긴 성도 수입니다. 주황 막대가 주일입니다. 개인은 드러나지 않습니다.
      </p>
    </SectionCard>
  )
}

// ── 공용 ─────────────────────────────────────────────
const Avatar = ({ name, url, size = 'md' }: { name: string; url: string | null; size?: 'sm' | 'md' }) => {
  const cls = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-[13px]'
  return url ? (
    <img src={url} alt="" loading="lazy" className={`${cls} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${cls} shrink-0 rounded-full bg-brand text-white font-bold flex items-center justify-center`}>
      {name.slice(0, 1)}
    </span>
  )
}

const formatTime = (d: Date): string => {
  const h = d.getHours()
  const m = d.getMinutes()
  if (h === 0 && m === 0) return ''
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : '시'}`
}

/** '2026-09-20T…' → '9월 20일' */
const formatDay = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default PastorHome
