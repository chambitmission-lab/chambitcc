// /worship 맨 위 — 계절 교회 사진 히어로("자리 하나 비워둘게요") + 시간 고르기 + 그 시간에 맞춘 주일 아침 길.
// 시안: /#/dev/worship-redesign?v=a2  (2026-11 "처음 온 성도" 개편)
//  - 사진·글씨 색은 /visit 과 같은 장면 정의(visitSceneFor). 라이트에선 어두운 막 없이, 옅은 하늘은 파란 구름 받침
//  - 계절 입자(LetterSeasonFx)는 사진 위에서만 — 시간·안내 글자 위로 지나가면 어지럽다는 피드백
//  - 장소는 모두 본당이라 카드에 따로 적지 않는다(데이터에 남은 옛 장소 표기를 띄우지 않으려고)

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { useAboutContent } from '../../../hooks/useAboutContent'
import type { WorshipService } from '../../../types/worship'
import { getNaturalSeason } from '../../../utils/naturalSeason'
import { visitSceneFor } from '../../../utils/themeAssets'
import { parseServiceTimes } from '../../../utils/worshipSchedule'
import LetterSeasonFx from '../../Ministry/LetterSeasonFx'
import { specialSundayLabel } from '../../Ministry/letterSeason'
import { StatusChip } from './WorshipBits'
import { formatTimeLabel, orderLabel, pick, serviceStatusToday } from './worshipTime'
import { SEASON_KEYS, downloadServiceIcs, sundaySkyBand } from './worshipSeason'

interface Props {
  services: WorshipService[]
  loading: boolean
  seoulNow: Date
  /** 이번 주일(오늘이 주일이면 오늘) */
  sunday: Date
  /** 지금 예배 중이면 그 예배 — 히어로 위 라이브 알약 */
  ongoing: WorshipService | null
  liveUrl: string
  editButton: (service: WorshipService) => ReactNode
}

const SERVICE_MIN = 60

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// 주일 카드 이름 — "(이른예배)" 부제가 있으면 괄호를 벗겨 쓰고, 없으면 예배 이름
const sundayName = (service: WorshipService, en: boolean): string => {
  const sub = pick(en ? 'en' : 'ko', service.subtitle, service.subtitle_en).replace(/[()]/g, '').trim()
  return sub || pick(en ? 'en' : 'ko', service.name, service.name_en)
}

// 길 위 정거장 아이콘 — 라인 아이콘(이모지·클립아트 대신). 상동역은 7호선 올리브 배지
const StopIcon = ({ kind }: { kind: 'subway' | 'door' | 'cross' | 'cup' }) => {
  if (kind === 'subway') return <span className="worship-stop-7" aria-label="7">7</span>
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'door' && (<><path d="M5 21V9.5L12 4l7 5.5V21" /><path d="M9.5 21v-6.5a2.5 2.5 0 0 1 5 0V21" /><path d="M3 21h18" /></>)}
      {kind === 'cross' && (<><path d="M12 3v18" /><path d="M7 8.5h10" /></>)}
      {kind === 'cup' && (<><path d="M4.5 10h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" /><path d="M16.5 11.5h1.5a2.5 2.5 0 0 1 0 5h-1.6" /><path d="M8.5 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3" /></>)}
    </svg>
  )
}

const ClockText = ({ min, en }: { min: number; en: boolean }) => {
  const [clock, ap] = formatTimeLabel(min, 'en').split(' ')
  return (
    <>
      <em>{en ? ap : min < 720 ? '오전' : '오후'}</em>
      {clock}
    </>
  )
}

export default function WorshipSunday({ services, loading, seoulNow, sunday, ongoing, liveUrl, editButton }: Props) {
  const { t, language } = useLanguage()
  const en = language === 'en'
  const { theme } = useTheme()
  const { tx } = useAboutContent()
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const groundRef = useRef<HTMLSpanElement>(null)

  const season = getNaturalSeason(seoulNow)
  const scene = visitSceneFor(theme === 'dark' ? 'dark' : 'light', seoulNow)

  // 시작 시각이 읽히는 주일 예배만 시간 카드로
  const cards = useMemo(
    () =>
      services
        .map((s) => ({ service: s, start: parseServiceTimes(s.time)[0] }))
        .filter((c): c is { service: WorshipService; start: number } => c.start !== undefined),
    [services],
  )

  // 기본 선택 — 주일에 아직 남은(입장 가능·진행 중 포함) 가장 이른 예배, 아니면 3부(메인 예배), 없으면 첫 예배
  const defaultId = useMemo(() => {
    const isSunday = seoulNow.getDay() === 0
    if (isSunday) {
      const live = cards.find((c) => {
        const st = serviceStatusToday(c.service, seoulNow)
        return st === 'open' || st === 'ongoing' || st === 'waiting'
      })
      if (live) return live.service.id
    }
    return (cards.find((c) => c.service.order === 3) ?? cards[0])?.service.id
    // 날짜가 바뀔 때만 다시 고른다 — 분 단위 틱마다 사용자의 선택을 덮지 않게
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, seoulNow.getDate()])
  const [pickedId, setPickedId] = useState<number | undefined>(undefined)
  const picked = cards.find((c) => c.service.id === (pickedId ?? defaultId)) ?? cards[0]

  const daysToSunday = Math.round((sunday.getTime() - new Date(seoulNow.getFullYear(), seoulNow.getMonth(), seoulNow.getDate()).getTime()) / 86_400_000)
  const sundayLabel = en
    ? `Sunday, ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : `${sunday.getMonth() + 1}월 ${sunday.getDate()}일 주일`
  const special = specialSundayLabel(ymd(sunday), !en)
  const kickerTail = special ?? (daysToSunday === 0 ? t('worshipSundayToday') : t('worshipKickerIn').replace('{n}', String(daysToSunday)))

  const seasonKeys = SEASON_KEYS[season]
  const order = picked ? orderLabel(picked.service.order, language) : ''

  const steps = picked
    ? [
        { t: picked.start - 20, icon: 'subway' as const, label: t('worshipStep1Label'), title: t('worshipStep1Title'), body: t(seasonKeys.care as 'worshipWalkCareAutumn'), seg: t('worshipSegWalk') },
        { t: picked.start - 10, icon: 'door' as const, label: t('worshipStep2Label'), title: t('worshipStep2Title'), body: t('worshipStep2Body'), seg: t('worshipSegSeat') },
        { t: picked.start, icon: 'cross' as const, label: t('worshipStep3Label').replace('{order}', order), title: t('worshipStep3Title'), body: t('worshipStep3Body'), seg: t('worshipSegAfter') },
        { t: picked.start + 70, icon: 'cup' as const, label: t('worshipStep4Label'), title: t('worshipStep4Title'), body: t('worshipStep4Body'), seg: '' },
      ]
    : []

  const addToCalendar = () => {
    if (!picked) return
    downloadServiceIcs({
      sunday,
      startMin: picked.start,
      durationMin: SERVICE_MIN,
      title: t('worshipCalendarTitle').replace('{order}', order),
      location: tx('visitAddress'),
      description: t('worshipCalendarDesc'),
    })
  }

  return (
    <section className="worship-hero">
      {/* 계절 교회 사진 — 입자는 이 안에서만 */}
      <div ref={boxRef} className="worship-photo" data-ink={scene?.ink ?? 'white'} data-ink-m={scene?.inkMobile ?? scene?.ink ?? 'white'}>
        {scene && <img src={scene.src} alt="" aria-hidden="true" />}
        <span className="worship-photo-shade" aria-hidden="true" />
        <span className="worship-photo-halo" aria-hidden="true" />
        <LetterSeasonFx key={season} season={season} boxRef={boxRef} targetRef={groundRef} />
        <span ref={groundRef} className="worship-photo-ground" aria-hidden="true" />
        <div className="worship-photo-copy">
          <p className="worship-kicker">
            <span className="worship-kicker-pill">{sundayLabel} · {kickerTail}</span>
            {ongoing && (
              <button
                type="button"
                className="worship-kicker-live"
                onClick={() => /^https?:\/\//i.test(liveUrl) && window.open(liveUrl, '_blank', 'noopener,noreferrer')}
              >
                <span className="worship-live-dot" aria-hidden />
                {t('worshipLiveOngoing')}
              </button>
            )}
          </p>
          <h1 className="worship-invite whitespace-pre-line">{t('worshipInviteTitle')}</h1>
          <p className="worship-invite-sub">{t('worshipInviteSub')}</p>
        </div>
      </div>

      <div className="worship-panel">
        <h2 className="worship-h2">{t('worshipPickTitle')}</h2>
        {loading ? (
          <div className="worship-state">
            <div className="worship-spinner" />
            <p>{t('loading')}</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="worship-state">{t('worshipNoSundayServices')}</div>
        ) : (
          <>
            <div className="worship-times" role="radiogroup" aria-label={t('worshipPickTitle')}>
              {cards.map(({ service, start }) => {
                const on = service.id === picked?.service.id
                const status = serviceStatusToday(service, seoulNow)
                return (
                  <div key={service.id} id={`worship-svc-${service.id}`} className="worship-time-wrap">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      className={`worship-time${on ? ' is-on' : ''}${status === 'ended' ? ' is-past' : ''}`}
                      onClick={() => setPickedId(service.id)}
                    >
                      <span className="worship-time-sky" style={{ background: sundaySkyBand(start) }} aria-hidden="true" />
                      <span className="worship-time-body">
                        <span className="worship-time-order">
                          {orderLabel(service.order, language)} · {sundayName(service, en)}
                        </span>
                        <span className="worship-time-clock"><ClockText min={start} en={en} /></span>
                        {(status === 'open' || status === 'ongoing') && <StatusChip status={status} />}
                      </span>
                      {on && (
                        <span className="worship-time-check" aria-hidden="true">
                          <span className="material-icons-round">check</span>
                        </span>
                      )}
                    </button>
                    {editButton(service)}
                  </div>
                )
              })}
            </div>

            {picked && (
              <div className="worship-morning">
                <p className="worship-walk-head">
                  <span className="worship-season-pill">{t(seasonKeys.name as 'worshipSeasonAutumn')}</span>
                  {t(seasonKeys.head as 'worshipWalkHeadAutumn')}
                </p>
                <p className="worship-sub">{t('worshipWalkSub').replace('{order}', order)}</p>
                <ol className="worship-walk" key={picked.service.id}>
                  {steps.map((s, i) => (
                    <li key={i} className="worship-walk-stop" style={{ animationDelay: `${i * 90}ms` }}>
                      <div className="worship-walk-rail" aria-hidden="true">
                        <span className="worship-walk-pin"><StopIcon kind={s.icon} /></span>
                        {s.seg && <span className="worship-walk-seg"><span>{s.seg}</span></span>}
                      </div>
                      <div className="worship-walk-text">
                        <p className="worship-walk-time">
                          <ClockText min={s.t} en={en} /> <span>{s.label}</span>
                        </p>
                        <p className="worship-walk-title">{s.title}</p>
                        <p className="worship-walk-body">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="worship-actions">
                  <button type="button" className="worship-action worship-action--brand" onClick={() => navigate('/visit')}>
                    <span className="material-icons-round" aria-hidden="true">directions</span>
                    {t('worshipDirections')}
                  </button>
                  <button type="button" className="worship-action" onClick={addToCalendar}>
                    <span className="material-icons-round" aria-hidden="true">event</span>
                    {t('worshipAddCalendar')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
