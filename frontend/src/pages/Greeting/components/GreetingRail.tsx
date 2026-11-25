/* PC 우측 레일 — 인사말을 읽는 사람이 "다음에" 궁금해할 것을 놓는다.
   왼쪽 편지에 이미 사진·이름·별칭·서명이 있으므로 여기서 반복하지 않는다.
   목차·읽기 트래커는 섹션이 두세 개뿐이라 보여주기식이 되어 뺐다(★재제안 금지).
   1) 목사님의 다음 이야기 — 지난 설교(영상 썸네일) + 이번 주 목양 편지 발췌. 둘 다 해당 글로 바로 간다
   2) 주일 초대장 — 처음 오시는 분께 이번 주일 날짜·예배 시간. 새벽기도회 같은 평일 모임은 권하지 않는다 */
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getColumns } from '../../../api/column'
import { getSermons } from '../../../api/sermon'
import { nextOccurrence, parseServiceTimes } from '../../../utils/worshipSchedule'
import { ChevronRightIcon } from '../icons'
import { sermonKeys, columnKeys } from '../../../hooks/queryKeys'
import { useWorshipServices } from '../../../hooks/useWorshipServices'
import { formatMonthDay, kstNow } from '../../../utils/date'
import { getNaturalSeason } from '../../../utils/naturalSeason'
import { columnPlainText } from '../../Ministry/blockFormat'
import { extractYouTubeVideoId, stripTitleDate, youtubeThumbnailUrl } from '../../Sermon/utils/sermonMeta'

interface Props {
  ko: boolean
}

/** '8월 5일' / 'Aug 5' — 파싱이 안 되면 입력을 그대로 */
const fmtDate = (iso: string, ko: boolean) => formatMonthDay(iso, { lang: ko ? 'ko' : 'en' }) || iso

const fmtTime = (startMin: number, ko: boolean) => {
  const h = Math.floor(startMin / 60)
  const m = startMin % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  const clock = `${h12}:${String(m).padStart(2, '0')}`
  return ko ? `${h < 12 ? '오전' : '오후'} ${clock}` : `${clock} ${h < 12 ? 'AM' : 'PM'}`
}

/** 유튜브 자동 등록분은 제목이 "주일 3부 예배"처럼 예배 이름뿐이다 — 무슨 설교인지 알 수 없는 제목 */
const isServiceNameOnly = (title: string) => /(예배|기도회|기도)$/.test(title.trim())

const EXCERPT_CHARS = 140

export default function GreetingRail({ ko }: Props) {
  const navigate = useNavigate()

  // 목양칼럼 — Ministry 페이지와 같은 키(columnKeys.list(''))라 캐시를 나눠 쓴다
  const { data: columns } = useQuery({
    queryKey: columnKeys.list(''),
    queryFn: async () => (await getColumns('')).filter((c) => c.is_active),
    staleTime: 1000 * 60 * 30,
  })
  const latestColumn = columns?.[0]
  const columnTitle = latestColumn ? (ko ? latestColumn.title : latestColumn.title_en || latestColumn.title) : ''
  const columnExcerpt = latestColumn
    ? columnPlainText((!ko && latestColumn.content_en) || latestColumn.content)
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, EXCERPT_CHARS)
    : ''

  const { data: sermons } = useQuery({
    queryKey: sermonKeys.list(0, 1, false),
    queryFn: () => getSermons(0, 1, false),
    staleTime: 1000 * 60 * 5,
  })
  const latestSermon = sermons?.[0]
  const sermonTitle = latestSermon ? stripTitleDate(latestSermon.title) : ''
  // 제목이 예배 이름뿐이면 본문 구절을 제목으로 올리고, 예배 이름은 아랫줄로 내린다
  const verseAsTitle = Boolean(latestSermon?.bible_verse) && isServiceNameOnly(sermonTitle)
  const videoId = latestSermon?.video_url ? extractYouTubeVideoId(latestSermon.video_url) : null
  const thumb = latestSermon?.thumbnail_url || (videoId ? youtubeThumbnailUrl(videoId) : null)

  // 주일 초대장 — 주일예배만. 오늘이 주일이고 아직 남은 예배가 있으면 오늘, 아니면 다가오는 주일
  const { data: services } = useWorshipServices()
  const seoulNow = kstNow()
  const sundayServices = (services ?? [])
    .filter((s) => s.is_active && s.service_type === 'sunday')
    .sort((a, b) => a.order - b.order)
    .map((service) => ({ service, startMin: parseServiceTimes(service.time)[0], occ: nextOccurrence(service, seoulNow) }))
    .filter((s) => s.startMin !== undefined)
  const upcoming = sundayServices
    .filter((s) => s.occ !== null)
    .sort((a, b) => a.occ!.minutes - b.occ!.minutes)[0]
  const dayOffset = upcoming?.occ?.dayOffset ?? 0
  const sunday = new Date(seoulNow)
  sunday.setDate(sunday.getDate() + dayOffset)
  const dayBadge =
    dayOffset === 0 ? (ko ? '오늘' : 'Today') : dayOffset === 1 ? (ko ? '내일' : 'Tomorrow') : ko ? `${dayOffset}일 뒤` : `In ${dayOffset} days`

  return (
    <>
      {(latestColumn || latestSermon) && (
        <section className="gr-next">
          {latestSermon && (
            <button
              type="button"
              className={`gr-next-video ${thumb ? '' : 'is-plain'}`}
              onClick={() => navigate(`/sermon?id=${latestSermon.id}`)}
            >
              {thumb && <img src={thumb} alt="" loading="lazy" className="gr-next-thumb" />}
              <span className="gr-next-play" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              </span>
              <span className="gr-next-over">
                <span className="gr-next-kind">{ko ? '지난 설교' : 'Latest sermon'}</span>
                <span className="gr-next-name">{verseAsTitle ? latestSermon.bible_verse : sermonTitle}</span>
                <span className="gr-next-meta">
                  {fmtDate(latestSermon.sermon_date, ko)}
                  {verseAsTitle ? ` · ${sermonTitle}` : latestSermon.bible_verse ? ` · ${latestSermon.bible_verse}` : ''}
                </span>
              </span>
            </button>
          )}
          {latestColumn && (
            <button type="button" className="gr-next-letter" onClick={() => navigate(`/ministry?c=${latestColumn.id}`)}>
              <span className="gr-next-kind">
                {ko ? '최근 목양 편지' : 'Latest letter'} · {fmtDate(latestColumn.date, ko)}
              </span>
              <span className="gr-next-name">{columnTitle}</span>
              {columnExcerpt && <span className="gr-next-excerpt">{columnExcerpt}</span>}
              <span className="gr-next-more">
                {ko ? '편지 이어 읽기' : 'Keep reading'}
                <ChevronRightIcon size={14} />
              </span>
            </button>
          )}
        </section>
      )}

      {/* 초대장 윗면 색은 초대하는 주일의 계절을 따른다 — 히어로 사진과 같은 계절 기준(getNaturalSeason) */}
      <section className="gr-visit" data-season={getNaturalSeason(sunday)}>
        <div className="gr-visit-top">
          <p className="gr-visit-title">{ko ? '처음 오시는 분께 · 주일 초대장' : 'First time here? · Sunday invitation'}</p>
          {upcoming && (
            <p className="gr-visit-date">
              <span className="gr-visit-day">
                {sunday.getMonth() + 1}.{sunday.getDate()}
              </span>
              <span className="gr-visit-when">
                {ko ? '주일' : 'Sunday'}
                <span className="gr-visit-badge">{dayBadge}</span>
              </span>
            </p>
          )}
          <p className="gr-visit-lead">
            {ko ? '목사님이 편지에서 청한 그 만남, 이번 주일에 직접 오세요.' : 'Come meet us in person this Sunday.'}
          </p>
        </div>
        <div className="gr-visit-cut" aria-hidden />
        <div className="gr-visit-bottom">
          {sundayServices.length > 0 && (
            <ul className="gr-visit-times">
              {sundayServices.map(({ service, startMin }) => (
                // 주일 당일에는 곧 시작할 예배 하나만 짚어 준다
                <li key={service.id ?? service.order} className={dayOffset === 0 && service === upcoming?.service ? 'is-next' : ''}>
                  <b>{ko ? `${service.order}부` : `#${service.order}`}</b>
                  {fmtTime(startMin, ko)}
                </li>
              ))}
            </ul>
          )}
          <div className="gr-visit-links">
            {/* 가장 많이 누르는 길 하나만 프라이머리 — 나머지는 보조 */}
            <button type="button" className="gr-visit-link gr-visit-link--primary" onClick={() => navigate('/visit')}>
              {ko ? '이번 주일에 갈게요' : "I'll come this Sunday"}
            </button>
            <button type="button" className="gr-visit-link" onClick={() => navigate('/worship')}>
              {ko ? '예배 안내' : 'Worship'}
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
