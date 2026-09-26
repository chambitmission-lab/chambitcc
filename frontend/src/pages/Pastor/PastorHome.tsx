import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import { sessionStore } from '../../utils/tokenStore'
import { lazyModal } from '../../utils/lazyModal'
import { fetchPastorHome, type PastorHomeData, type PastoralPrayerItem } from '../../api/pastor'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import FollowUpList from './components/FollowUpList'
import SuggestionList from './components/SuggestionList'
import { Avatar } from './components/ui'
import { formatDay as formatIsoDay, usePastorGate } from './components/pastorUtils'

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
  const pastor = usePastorGate()
  const [openPrayerId, setOpenPrayerId] = useState<number | null>(null)

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

  // 예전 형태로 저장돼 있던 응답(목회 비서·챙길 일 추가 전)은 '아직 로딩'으로 본다 — 새 응답이 곧 온다
  const ready = !!data && !!data.assistant && !!data.shepherd

  const closeDetail = () => {
    setOpenPrayerId(null)
    void refetch()
  }

  return (
    <PastorShell>
      {!ready && (isPending || !!data) ? (
        <StatSpinner label="이번 주 목양 브리핑을 준비하는 중..." />
      ) : !ready || !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-600 dark:text-white/60">
          목회자 홈을 불러오지 못했습니다
        </p>
      ) : (
        <>
          <Greeting data={data} />

          {/* PC(lg+) 2단 — 좌: 맡겨진 기도·응답의 은혜 / 우: 돌봄·이번 주·교회 흐름.
              래퍼는 lg 미만에서 display:contents 라 모바일은 한 줄 흐름 그대로. */}
          <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="contents lg:block lg:min-w-0">
              <AssistantCard data={data} />
              <PastoralInbox data={data} onOpen={setOpenPrayerId} />
              <GraceCard data={data} />
            </div>
            <div className="contents lg:block">
              <ShepherdCard data={data} />
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
  // 지표는 곧 입구 — 맡겨진 기도는 이 화면 아래 카드로, 나머지는 해당 섹션으로 보낸다
  const stats: Array<{ label: string; value: number; unit: string; to?: string; anchor?: string }> = [
    { label: '맡겨진 기도', value: data.pastoral.waiting_count, unit: '건', anchor: INBOX_ID },
    { label: '돌봄이 필요한 성도', value: data.care.quiet_count, unit: '명', to: '/pastor/care' },
    { label: '정착 중인 새가족', value: data.care.newcomer_count, unit: '명', to: '/pastor/care?tab=newcomers' },
    { label: '이번 주 일정', value: data.week.events.length, unit: '건', to: '/pastor/schedule' },
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
            <p className="mt-1 text-[13.5px] text-gray-600 dark:text-white/60 leading-relaxed">
              성도님들이 목사님께 맡긴 기도와 안부가 필요한 분들을 모았습니다.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:mt-0 lg:grid-cols-4 lg:shrink-0">
            {stats.map(s => {
              const body = (
                <>
                  <p className="text-[13px] font-semibold text-gray-600 dark:text-white/65 whitespace-nowrap">{s.label}</p>
                  <p className="mt-0.5 text-[22px] lg:text-[26px] font-bold tracking-[-0.02em] leading-tight">
                    <span className="brand-text-gradient">{s.value.toLocaleString()}</span>
                    <span className="text-[12px] font-semibold text-gray-500 dark:text-white/55 ml-0.5">{s.unit}</span>
                  </p>
                </>
              )
              const cls =
                'block text-left rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-2.5 lg:min-w-[118px] transition-colors hover:border-brand active:bg-[var(--brand-soft)]'
              return s.to ? (
                <Link key={s.label} to={s.to} className={cls}>
                  {body}
                </Link>
              ) : (
                <button key={s.label} type="button" onClick={() => scrollToAnchor(s.anchor)} className={cls}>
                  {body}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 목회 비서 — 오늘 연락하면 좋은 분 ─────────────────────
const AssistantCard = ({ data }: { data: PastorHomeData }) => (
  <SectionCard
    title="오늘 연락하면 좋은 분"
    action={
      <Link to="/pastor/assistant" className="text-[13px] font-semibold text-brand hover:underline">
        {data.assistant.total > data.assistant.items.length ? `전체 ${data.assistant.total}명 보기` : '목회 비서'}
      </Link>
    }
  >
    <SuggestionList items={data.assistant.items} compact />
  </SectionCard>
)

// ── 목사님께 맡겨진 기도 ───────────────────────────────
const PastoralInbox = ({ data, onOpen }: { data: PastorHomeData; onOpen: (id: number) => void }) => {
  const { pastoral } = data
  return (
    <SectionCard
      id={INBOX_ID}
      title={`목사님께 맡겨진 기도 ${pastoral.waiting_count > 0 ? pastoral.waiting_count : ''}`.trim()}
      action={
        <span className="text-[12px] text-gray-500 dark:text-white/50">
          최근 {pastoral.replied_window_days}일 답한 기도 {pastoral.replied_recent}건
        </span>
      }
    >
      {pastoral.items.length === 0 ? (
        <div className="py-8 text-center">
          <span className="material-icons-outlined text-[28px] text-brand">task_alt</span>
          <p className="mt-1 text-[13px] font-semibold text-ink-strong">모든 기도에 답하셨습니다</p>
          <p className="mt-0.5 text-[12px] text-gray-600 dark:text-white/60">
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
          <p className="text-[12px] text-gray-500 dark:text-white/50 leading-relaxed">
            오래 기다린 순서 · 목회자 한 분이 답하면 목록에서 빠집니다
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
          <span className="text-[15px] font-bold text-ink-strong truncate">{item.display_name}</span>
          <span className={`shrink-0 text-[12.5px] font-bold px-2 py-0.5 rounded-md ${waitTone(item.days_waiting)}`}>
            {waitLabel(item.days_waiting)}
          </span>
          {item.prayed_by_me && (
            <span className="shrink-0 text-[12px] font-semibold text-gray-500 dark:text-white/55">기도함</span>
          )}
        </span>
        {item.title && (
          <span className="block mt-1 text-[14px] font-semibold text-ink-strong truncate">{item.title}</span>
        )}
        <span className="block mt-0.5 text-[13.5px] text-[#4b5563] dark:text-white/65 leading-relaxed line-clamp-2">
          {item.excerpt}
        </span>
      </span>
      <span className="self-center shrink-0 flex items-center gap-0.5 text-[13px] font-semibold text-brand">
        답하기
        <span className="material-icons-outlined text-[16px]">chevron_right</span>
      </span>
    </button>
  </li>
)

// ── 이번 주 생일 · 내 후속 할 일 (성도 명부·심방 기록에서) ─────
const ShepherdCard = ({ data }: { data: PastorHomeData }) => {
  const { birthdays, follow_ups: followUps, plans } = data.shepherd
  return (
    <SectionCard
      title="이번 주 챙길 일"
      action={
        <Link to="/pastor/schedule" className="text-[13px] font-semibold text-brand hover:underline">
          목회 일정
        </Link>
      }
    >
      {plans.length > 0 && (
        <div className="pb-3 border-b border-gray-100 dark:border-white/[0.06]">
          <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">내 심방 예약 · {plans.length}건</p>
          <ul className="mt-2 space-y-1.5">
            {plans.map(v => (
              <li key={v.id}>
                <Link to={`/pastor/members/${v.member_user_id}`} className="flex items-center gap-2.5 group">
                  <Avatar name={v.member_name ?? ''} url={v.member_avatar_url} size="sm" />
                  <span className="flex-1 min-w-0 text-[14px] font-semibold text-ink-strong truncate group-hover:text-brand">
                    {v.member_name}
                  </span>
                  <span className={`shrink-0 text-[13px] font-semibold ${v.overdue ? 'text-[var(--amber)]' : 'text-gray-600 dark:text-white/60'}`}>
                    {v.overdue ? '지난 예약 · ' : ''}
                    {formatIsoDay(v.visit_date)}
                    {v.visit_time ? ` ${v.visit_time}` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">내 후속 할 일 · {followUps.length}건</p>
        <div className="mt-2">
          <FollowUpList items={followUps} compact />
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">7일 안 생일 · {birthdays.length}명</p>
        {birthdays.length === 0 ? (
          <EmptyHint text="명부에 생일이 적힌 분 중 이번 주 생일은 없습니다" />
        ) : (
          <ul className="mt-2 space-y-1.5">
            {birthdays.map(b => (
              <li key={b.user_id}>
                <Link to={`/pastor/members/${b.user_id}`} className="flex items-center gap-2.5 group">
                  <Avatar name={b.name} url={b.avatar_url} size="sm" />
                  <span className="flex-1 min-w-0 text-[14px] font-semibold text-ink-strong truncate group-hover:text-brand">
                    {b.name}
                    {b.church_title && <span className="ml-1 text-[12px] font-semibold text-brand">{b.church_title}</span>}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-gray-600 dark:text-white/60">
                    {b.days_until === 0 ? '오늘' : formatIsoDay(b.date)}
                    {b.lunar && ' · 음력'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  )
}

// ── 돌봄이 필요한 성도 ────────────────────────────────
const CareCard = ({ data }: { data: PastorHomeData }) => {
  const { care } = data
  return (
    <SectionCard
      title="돌봄이 필요한 성도"
      action={
        <Link to="/pastor/care" className="text-[13px] font-semibold text-brand hover:underline">
          전체 보기
        </Link>
      }
    >
      <div>
        <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">
          {care.quiet_days}일 넘게 소식이 없는 분 · {care.quiet_count}명
        </p>
        {care.quiet_preview.length === 0 ? (
          <EmptyHint text="모두 최근에 활동하셨습니다" />
        ) : (
          <ul className="mt-2 space-y-1.5">
            {care.quiet_preview.map(m => (
              <li key={m.user_id} className="flex items-center gap-2.5">
                <Avatar name={m.name} url={m.avatar_url} size="sm" />
                <Link to={`/pastor/members/${m.user_id}`} className="flex-1 min-w-0 text-[14px] font-semibold text-ink-strong truncate hover:text-brand">{m.name}</Link>
                <span className="shrink-0 text-[13px] text-gray-600 dark:text-white/60">
                  {m.days_since == null ? '기록 없음' : `${m.days_since}일 전`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">
          최근 {care.newcomer_days ?? 30}일 새가족 · {care.newcomer_count}명
        </p>
        {care.newcomer_preview.length === 0 ? (
          <EmptyHint text="최근 가입한 새가족이 없습니다" />
        ) : (
          <ul className="mt-2 space-y-1.5">
            {care.newcomer_preview.map(m => (
              <li key={m.user_id} className="flex items-center gap-2.5">
                <Avatar name={m.name} url={m.avatar_url} size="sm" />
                <Link to={`/pastor/members/${m.user_id}`} className="flex-1 min-w-0 text-[14px] font-semibold text-ink-strong truncate hover:text-brand">{m.name}</Link>
                <span className="shrink-0 flex gap-[3px]" title={`정착 ${m.done}/${m.steps}단계`}>
                  {Array.from({ length: m.steps }, (_, i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${i < m.done ? 'bg-brand' : 'bg-gray-200 dark:bg-white/[0.1]'}`}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[12px] text-gray-500 dark:text-white/50 leading-relaxed">
        활동 시점만 보이며 기도·묵상 내용은 표시되지 않습니다
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
        <Link to="/events" className="text-[13px] font-semibold text-brand hover:underline">
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
                <span className="shrink-0 w-12 text-center rounded-lg bg-[var(--brand-soft)] py-1">
                  <span className="block text-[12px] font-semibold text-brand leading-tight">
                    {d ? `${WEEKDAYS[d.getDay()]}요일` : ''}
                  </span>
                  <span className="block text-[16px] font-bold text-brand leading-tight">{d ? d.getDate() : '—'}</span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-semibold text-ink-strong truncate">{e.title}</span>
                  <span className="block text-[12px] text-gray-600 dark:text-white/60 truncate">
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
          <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">최근 설교</p>
          <p className="mt-1 text-[14px] font-bold text-ink-strong group-hover:text-brand transition-colors truncate">
            {sermon.title}
          </p>
          <p className="text-[12px] text-gray-600 dark:text-white/60 truncate">
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
        <Link to="/answered-prayers" className="text-[13px] font-semibold text-brand hover:underline">
          응답의 전당
        </Link>
      }
    >
      <p className="text-[12px] text-gray-600 dark:text-white/60">
        최근 {grace.days}일 응답된 기도 {grace.count}건 — 설교·광고에서 나눌 이야기
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
              <p className="text-[12px] font-semibold text-[var(--amber)]">
                {g.display_name}
                {g.answered_at ? ` · ${formatDay(g.answered_at)}` : ''}
              </p>
              <p className="mt-1 text-[14px] font-semibold text-ink-strong line-clamp-2">{g.title || g.excerpt}</p>
              {g.testimony && (
                <p className="mt-1 text-[13px] text-[#4b5563] dark:text-white/65 leading-relaxed line-clamp-3">
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
      action={<span className="text-[12px] text-gray-500 dark:text-white/50">성도 {pulse.members.toLocaleString()}명</span>}
    >
      <div className="grid grid-cols-2 gap-2">
        {picks.map(m => (
          <div
            key={m.key}
            className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3 py-2.5"
          >
            <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">{m.label}</p>
            <p className="mt-0.5 text-[20px] font-bold text-ink-strong tracking-[-0.02em] leading-tight">
              {m.value.toLocaleString()}
              <span className="text-[12px] font-semibold text-gray-500 dark:text-white/55 ml-0.5">{m.unit}</span>
              {m.delta !== 0 && (
                <span className={`ml-1.5 text-[12px] font-bold ${m.delta > 0 ? 'text-brand' : 'text-[var(--amber)]'}`}>
                  {m.delta > 0 ? '▲' : '▼'}{Math.abs(m.delta)}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-[3px] h-16">
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
      <p className="text-[12px] text-gray-500 dark:text-white/50 leading-relaxed">
        최근 14일 기록한 성도 수(익명) · 주황 막대가 주일
      </p>
    </SectionCard>
  )
}

// ── 공용 ─────────────────────────────────────────────
const INBOX_ID = 'pastor-inbox'

// 인사 카드 지표 → 같은 화면의 카드로 (헤더 56px + 섹션 내비 아래에 카드 머리가 오도록 여유를 둔다)
const scrollToAnchor = (id?: string) => {
  if (!id) return
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 72
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
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
