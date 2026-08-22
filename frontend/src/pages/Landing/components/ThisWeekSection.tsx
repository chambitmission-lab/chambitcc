import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSundayServices } from '../../../api/worship'
import type { Event } from '../../../types/event'
import { DAY_CHARS, parseServiceTimes, serviceDays, soonestService } from '../../../utils/worshipSchedule'
import { ChevronRightIcon, ClockIcon } from '../../About/icons'
import { Reveal, SectionHeader } from './shared'
import { seoulNow } from './landingUtils'

// "이번 주 참빛" — 다음 예배까지 살아있는 카운트다운 + 다가오는 일정.
// 예배 시간 파싱은 /worship·/visit 과 같은 utils/worshipSchedule 을 쓴다.

const pad = (n: number) => `${n}`.padStart(2, '0')

const ThisWeekSection = ({ ko, events }: { ko: boolean; events: Event[] }) => {
  const navigate = useNavigate()
  const { data: services } = useQuery({
    queryKey: ['worship', 'sunday'],
    queryFn: getSundayServices,
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
  const [now, setNow] = useState(() => seoulNow())
  useEffect(() => {
    const id = window.setInterval(() => setNow(seoulNow()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const next = useMemo(() => (services ? soonestService(services, now) : null), [services, now])
  // 지금 진행 중인 예배(시작 후 60분 이내) — nextOccurrence 는 이미 시작한 회차를 건너뛰므로 따로 본다
  const ongoingService = useMemo(() => {
    if (!services) return null
    const nowMin = now.getHours() * 60 + now.getMinutes()
    for (const s of services) {
      if (!s.is_active) continue
      const days = serviceDays(s)
      if (!days || !days.includes(now.getDay())) continue
      if (parseServiceTimes(s.time).some((t) => nowMin >= t && nowMin < t + 60)) return s
    }
    return null
  }, [services, now])
  const ongoing = ongoingService !== null
  const remainMin = next?.occ.minutes ?? 0
  const days = Math.floor(remainMin / 1440)
  const hours = Math.floor((remainMin % 1440) / 60)
  const mins = remainMin % 60
  const startLabel = next
    ? `${pad(Math.floor(next.occ.startMin / 60))}:${pad(next.occ.startMin % 60)}`
    : ''
  const dayLabel = next
    ? next.occ.dayOffset === 0
      ? ko ? '오늘' : 'Today'
      : next.occ.dayOffset === 1
        ? ko ? '내일' : 'Tomorrow'
        : ko ? `${DAY_CHARS[(now.getDay() + next.occ.dayOffset) % 7]}요일` : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(now.getDay() + next.occ.dayOffset) % 7]
    : ''
  const serviceName = next ? (ko ? next.service.name : next.service.name_en || next.service.name) : ''

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return ko ? `${d.getMonth() + 1}월 ${d.getDate()}일` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <section className="mt-16">
      <Reveal>
        <SectionHeader kicker={ko ? '이번 주 참빛' : 'This week'} title={ko ? '다음 만남까지' : 'Until we meet next'} />
      </Reveal>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="h-full">
          <button
            type="button"
            onClick={() => navigate('/worship')}
            className="w-full h-full text-left feed-card rounded-3xl p-5 lg:p-6 hover:border-[var(--brand-glow)] transition-[border-color]"
          >
            <div className="flex items-center gap-2 text-[12.5px] font-bold text-brand">
              <ClockIcon size={14} />
              {next ? (ko ? '다음 예배' : 'Next service') : (ko ? '주일예배' : 'Sunday worship')}
            </div>
            {next ? (
              <>
                {ongoing ? (
                  <>
                    <p className="mt-2 text-[20px] font-extrabold tracking-tight text-ink-strong leading-tight">
                      {ko ? ongoingService.name : ongoingService.name_en || ongoingService.name}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[13px] font-bold text-brand">
                      <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                      {ko ? '지금 예배 중 · 다음은' : 'In service now · next'} {dayLabel} {startLabel}
                    </p>
                  </>
                ) : (
                  <>
                  <p className="mt-2 text-[20px] font-extrabold tracking-tight text-ink-strong leading-tight">
                    {dayLabel} {startLabel} · {serviceName}
                  </p>
                  <div className="mt-4 flex items-end gap-3">
                    {days > 0 && (
                      <div><span className="ld-count text-[32px] font-extrabold text-ink-strong leading-none">{days}</span><span className="ml-1 text-[12px] font-bold text-ink-muted">{ko ? '일' : 'd'}</span></div>
                    )}
                    <div><span className="ld-count text-[32px] font-extrabold text-ink-strong leading-none">{pad(hours)}</span><span className="ml-1 text-[12px] font-bold text-ink-muted">{ko ? '시간' : 'h'}</span></div>
                    <div><span className="ld-count text-[32px] font-extrabold text-ink-strong leading-none">{pad(mins)}</span><span className="ml-1 text-[12px] font-bold text-ink-muted">{ko ? '분' : 'm'}</span></div>
                  </div>
                  </>
                )}
                <p className="mt-3 text-[13px] text-ink-muted">
                  {ko ? '30분 전부터 입장 가능 · 늦어도 괜찮아요, 자리는 충분합니다.' : 'Doors open 30 min early · running late is fine, there are plenty of seats.'}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[16px] font-bold text-ink-strong">{ko ? '주일 오전 7:30 · 9:20 · 11:20 · 오후 1:30' : 'Sun 7:30 · 9:20 · 11:20 AM · 1:30 PM'}</p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-brand">
              {ko ? '예배 안내 전체 보기' : 'All services'}<ChevronRightIcon size={15} />
            </span>
          </button>
        </Reveal>

        <Reveal className="h-full" delay={80}>
          <div className="feed-card rounded-3xl overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-[14px] font-extrabold text-ink-strong">{ko ? '다가오는 일정' : 'Upcoming events'}</p>
              <button type="button" onClick={() => navigate('/events')} className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-brand hover:underline">
                {ko ? '전체' : 'All'}<ChevronRightIcon size={14} />
              </button>
            </div>
            {events.length === 0 ? (
              <p className="px-5 pb-5 text-[13px] text-ink-muted">{ko ? '등록된 일정이 곧 올라와요.' : 'New events are coming soon.'}</p>
            ) : (
              <ul className="divide-y divide-[var(--card-border)]">
                {events.slice(0, 3).map((event) => {
                  const d = new Date(event.start_datetime)
                  return (
                    <li key={event.id}>
                      <button type="button" onClick={() => navigate('/events')} className="w-full flex items-center gap-3.5 px-5 py-3 text-left hover:bg-[var(--brand-soft)] transition-colors">
                        <span className="w-11 h-11 rounded-xl bg-[var(--brand-soft)] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-brand leading-none">{ko ? `${d.getMonth() + 1}월` : d.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-[16px] font-extrabold text-brand leading-tight">{d.getDate()}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14px] font-bold text-ink-strong truncate">{event.title}</span>
                          <span className="block text-[12px] text-ink-muted">{fmtDate(event.start_datetime)}</span>
                        </span>
                        <ChevronRightIcon size={16} className="text-ink-muted shrink-0" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default ThisWeekSection
