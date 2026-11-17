import { useLanguage } from '../../../contexts/LanguageContext'
import CountryFlag from '../CountryFlag'
import { PHASE_COLOR, dayPhase, localHM, localHour, topicParticle, type DayPhase } from './missionTime'
import type { PrayerRoute } from './routes'

// '지금 이 시간' 카드 — 고른 노선의 현지 때(아침·한낮·저녁·밤)에 맞춘 기도 한 줄.
// 처음 열면 현지에서 하루를 막 시작한 곳이 골라져 있다.

const PHASE_KO: Record<DayPhase, string> = { morning: '아침', midday: '한낮', evening: '저녁', night: '밤' }
const FOCUS_KO: Record<DayPhase, string> = {
  morning: '하루 첫걸음',
  midday: '오늘 사역',
  evening: '쉼과 가정',
  night: '평안한 밤',
}
const PHASE_EN: Record<DayPhase, string> = { morning: 'Morning', midday: 'Midday', evening: 'Evening', night: 'Night' }
const FOCUS_EN: Record<DayPhase, string> = {
  morning: 'first steps of the day',
  midday: 'work today',
  evening: 'rest and family',
  night: 'peaceful night',
}

export function NowCard({ route, nowMs }: { route: PrayerRoute; nowMs: number }) {
  const { language } = useLanguage()
  const { detail, missionary } = route
  const phase = dayPhase(localHour(detail.tz, nowMs))
  const time = localHM(detail.tz, nowMs)
  const color = PHASE_COLOR[phase]

  return (
    <section className="now-card" aria-live="polite">
      <CountryFlag className="now-card__flag" country={route.country} />
      <div className="now-card__text">
        {language === 'ko' ? (
          <>
            <p className="now-card__title">
              {route.country} {detail.city}
              {topicParticle(detail.city)} 지금 <span style={{ color }}>{PHASE_KO[phase]}</span>{' '}
              <span className="now-card__time">{time}</span>
            </p>
            <p className="now-card__line">
              {missionary.name} 선교사님의 {FOCUS_KO[phase]}을 위해 기도해요
            </p>
          </>
        ) : (
          <>
            <p className="now-card__title">
              <span style={{ color }}>{PHASE_EN[phase]}</span> in {detail.cityEn} ·{' '}
              <span className="now-card__time">{time}</span>
            </p>
            <p className="now-card__line">
              Pray for {missionary.name}&apos;s {FOCUS_EN[phase]}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
