/* PC 우측 레일 — 인사말을 읽는 사람이 "다음에" 궁금해할 것을 놓는다.
   왼쪽 편지에 이미 사진·이름·별칭·서명이 있으므로 여기서 반복하지 않는다.
   1) 읽기 트래커 — 현재 섹션 + 편지 읽은 비율(scroll-spy)
   2) 목사님의 다음 이야기 — 최근 목양 편지 · 최근 설교 (기존 캐시 키 재사용)
   3) 처음 오셨나요? — 가장 가까운 예배 회차 · 오시는 길 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getColumns } from '../../../api/column'
import { getSermons } from '../../../api/sermon'
import { getSundayServices, getWeekdayServices } from '../../../api/worship'
import { DAY_CHARS, soonestService } from '../../../utils/worshipSchedule'
import { ChevronRightIcon } from '../icons'

export interface TocItem {
  id: string
  label: string
}

interface Props {
  ko: boolean
  toc: TocItem[]
}

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? '')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (ids.length === 0) return
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return

    // 뷰포트 상단 1/3 선을 기준으로 "지금 읽는 섹션" 판정
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))

    // 편지(첫 섹션) 읽기 진행률
    const letter = els[0]
    const onScroll = () => {
      const rect = letter.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.5
      const passed = Math.min(Math.max(-rect.top + window.innerHeight * 0.25, 0), Math.max(total, 1))
      setProgress(total > 0 ? passed / total : 1)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [ids.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  return { active, progress }
}

const fmtDate = (iso: string, ko: boolean) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return ko
    ? `${d.getMonth() + 1}월 ${d.getDate()}일`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const fmtTime = (startMin: number, ko: boolean) => {
  const h = Math.floor(startMin / 60)
  const m = startMin % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  const clock = `${h12}:${String(m).padStart(2, '0')}`
  return ko ? `${h < 12 ? '오전' : '오후'} ${clock}` : `${clock} ${h < 12 ? 'AM' : 'PM'}`
}

const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function GreetingRail({ ko, toc }: Props) {
  const navigate = useNavigate()
  const { active, progress } = useScrollSpy(toc.map((t) => t.id))
  const pct = Math.round(progress * 100)

  // 목양칼럼 — Ministry 페이지와 같은 키(['columns', ''])라 캐시를 나눠 쓴다
  const { data: columns } = useQuery({
    queryKey: ['columns', ''],
    queryFn: async () => (await getColumns('')).filter((c) => c.is_active),
    staleTime: 1000 * 60 * 30,
  })
  const latestColumn = columns?.[0]

  const { data: sermons } = useQuery({
    queryKey: ['sermons', 0, 1, 'light'],
    queryFn: () => getSermons(0, 1, false),
    staleTime: 1000 * 60 * 5,
  })
  const latestSermon = sermons?.[0]

  const { data: services } = useQuery({
    queryKey: ['worship-services', 'all'],
    queryFn: async () => {
      const [sun, week] = await Promise.all([getSundayServices(), getWeekdayServices()])
      return [...sun, ...week]
    },
    staleTime: 1000 * 60 * 30,
  })
  const seoulNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const next = services ? soonestService(services, seoulNow) : null
  const nextDay = next
    ? next.occ.dayOffset === 0
      ? ko ? '오늘' : 'Today'
      : next.occ.dayOffset === 1
        ? ko ? '내일' : 'Tomorrow'
        : ko
          ? `${DAY_CHARS[(seoulNow.getDay() + next.occ.dayOffset) % 7]}요일`
          : DAY_EN[(seoulNow.getDay() + next.occ.dayOffset) % 7]
    : ''

  return (
    <>
      {toc.length > 0 && (
        <nav className="gr-tracker" aria-label={ko ? '페이지 구간' : 'Sections'}>
          <div className="gr-tracker-head">
            <span className="gr-tracker-title">{ko ? '읽는 중' : 'Reading'}</span>
            <span className="gr-tracker-pct" aria-live="polite">
              {pct >= 100 ? (ko ? '다 읽었어요' : 'Done') : `${pct}%`}
            </span>
          </div>
          <ol className="gr-tracker-list">
            {toc.map((item, i) => (
              <li key={item.id} className="gr-tracker-item">
                <button
                  type="button"
                  className={`gr-tracker-link${active === item.id ? ' is-active' : ''}`}
                  onClick={() =>
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                >
                  <span className="gr-tracker-dot" aria-hidden="true">
                    {i === 0 && (
                      <span className="gr-tracker-fill" style={{ transform: `scaleY(${progress})` }} />
                    )}
                  </span>
                  <span className="gr-tracker-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {(latestColumn || latestSermon) && (
        <section className="gr-next">
          <p className="gr-next-title">{ko ? '목사님의 다음 이야기' : 'More from the Pastor'}</p>
          {latestColumn && (
            <button type="button" className="gr-next-item" onClick={() => navigate('/ministry')}>
              <span className="gr-next-kind">{ko ? '최근 목양 편지' : 'Latest letter'}</span>
              <span className="gr-next-name">{ko ? latestColumn.title : latestColumn.title_en || latestColumn.title}</span>
              <span className="gr-next-meta">{fmtDate(latestColumn.date, ko)}</span>
              <ChevronRightIcon size={14} className="gr-next-chev" />
            </button>
          )}
          {latestSermon && (
            <button type="button" className="gr-next-item" onClick={() => navigate('/sermon')}>
              <span className="gr-next-kind">{ko ? '최근 설교' : 'Latest sermon'}</span>
              <span className="gr-next-name">{latestSermon.title}</span>
              <span className="gr-next-meta">
                {latestSermon.bible_verse ? `${latestSermon.bible_verse} · ` : ''}
                {fmtDate(latestSermon.sermon_date, ko)}
              </span>
              <ChevronRightIcon size={14} className="gr-next-chev" />
            </button>
          )}
        </section>
      )}

      <section className="gr-visit">
        <p className="gr-visit-title">{ko ? '처음 오셨나요?' : 'First time here?'}</p>
        <p className="gr-visit-lead">
          {ko ? '목사님이 편지에서 청한 그 만남, 이번 주에 직접 오세요.' : 'Come meet us in person this week.'}
        </p>
        {next && (
          <button type="button" className="gr-visit-next" onClick={() => navigate('/worship')}>
            <span className="gr-visit-next-label">{ko ? '가장 가까운 예배' : 'Next service'}</span>
            <span className="gr-visit-next-name">{ko ? next.service.name : next.service.name_en || next.service.name}</span>
            <span className="gr-visit-next-time">
              {nextDay} {fmtTime(next.occ.startMin, ko)}
              {next.service.location ? ` · ${ko ? next.service.location : next.service.location_en || next.service.location}` : ''}
            </span>
          </button>
        )}
        <div className="gr-visit-links">
          <button type="button" className="gr-visit-link" onClick={() => navigate('/worship')}>
            {ko ? '예배 안내' : 'Worship'}
          </button>
          <button type="button" className="gr-visit-link" onClick={() => navigate('/visit')}>
            {ko ? '오시는 길' : 'Directions'}
          </button>
        </div>
      </section>
    </>
  )
}
