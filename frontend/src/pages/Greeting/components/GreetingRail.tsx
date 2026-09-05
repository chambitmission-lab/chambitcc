/* PC 우측 레일 — 인사말을 읽는 사람이 "다음에" 궁금해할 것을 놓는다.
   왼쪽 편지에 이미 사진·이름·별칭·서명이 있으므로 여기서 반복하지 않는다.
   목차·읽기 트래커는 섹션이 두세 개뿐이라 보여주기식이 되어 뺐다(★재제안 금지).
   1) 목사님의 다음 이야기 — 최근 목양 편지 · 최근 설교 (기존 캐시 키 재사용)
   2) 처음 오셨나요? — 가장 가까운 예배 회차 · 오시는 길 */
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getColumns } from '../../../api/column'
import { getSermons } from '../../../api/sermon'
import { getSundayServices, getWeekdayServices } from '../../../api/worship'
import { DAY_CHARS, soonestService } from '../../../utils/worshipSchedule'
import { ChevronRightIcon } from '../icons'
import { sermonKeys, columnKeys, worshipKeys } from '../../../hooks/queryKeys'

interface Props {
  ko: boolean
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

export default function GreetingRail({ ko }: Props) {
  const navigate = useNavigate()

  // 목양칼럼 — Ministry 페이지와 같은 키(columnKeys.list(''))라 캐시를 나눠 쓴다
  const { data: columns } = useQuery({
    queryKey: columnKeys.list(''),
    queryFn: async () => (await getColumns('')).filter((c) => c.is_active),
    staleTime: 1000 * 60 * 30,
  })
  const latestColumn = columns?.[0]

  const { data: sermons } = useQuery({
    queryKey: sermonKeys.list(0, 1, false),
    queryFn: () => getSermons(0, 1, false),
    staleTime: 1000 * 60 * 5,
  })
  const latestSermon = sermons?.[0]

  const { data: services } = useQuery({
    queryKey: worshipKeys.services(),
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
          {/* 가장 많이 누르는 길 하나만 프라이머리 — 나머지는 보조 */}
          <button type="button" className="gr-visit-link gr-visit-link--primary" onClick={() => navigate('/worship')}>
            {ko ? '예배 안내' : 'Worship'}
            <ChevronRightIcon size={14} />
          </button>
          <button type="button" className="gr-visit-link" onClick={() => navigate('/visit')}>
            {ko ? '오시는 길' : 'Directions'}
          </button>
        </div>
      </section>
    </>
  )
}
