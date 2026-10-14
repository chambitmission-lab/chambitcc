// 히어로 오른쪽 '오늘' 카드 (lg+ 전용 — 모바일은 제목 옆 "주일까지 N일" 칩이 같은 일을 한다).
// 오늘 날짜만 두면 왼쪽 "10월 18일 주일"과 날짜 두 개가 나란히 놓여 헷갈리므로,
// 오늘 → 주일까지 징검다리로 이어 두 날짜의 관계를 함께 보여 준다.
import { useLanguage } from '../../../contexts/LanguageContext'
import { DAY_CHARS } from '../../../utils/worshipSchedule'
import { DAY_NAMES_EN } from './worshipTime'

interface Props {
  /** Asia/Seoul 기준 지금 (toKstCalendarDate 결과) */
  seoulNow: Date
}

export default function WorshipTodayCard({ seoulNow }: Props) {
  const { t, language } = useLanguage()
  const en = language === 'en'
  const today = seoulNow.getDay()
  const daysToSunday = (7 - today) % 7

  const steps = Array.from({ length: daysToSunday + 1 }, (_, k) => {
    const d = new Date(seoulNow)
    d.setDate(d.getDate() + k)
    const dow = (today + k) % 7
    return {
      key: k,
      date: d.getDate(),
      label: k === 0 ? t('worshipToday') : en ? DAY_NAMES_EN[dow].slice(0, 3) : DAY_CHARS[dow],
      tone: k === 0 ? 'now' : k === daysToSunday ? 'sunday' : '',
    }
  })

  return (
    <aside className="worship-today" aria-label={t('worshipTodayAria')}>
      <p className="worship-today-label">{t('worshipToday')}</p>
      <p className="worship-today-big">
        <b>{seoulNow.getDate()}</b>
        <span>
          {en
            ? seoulNow.toLocaleDateString('en-US', { month: 'short' })
            : `${seoulNow.getMonth() + 1}월`}
          <br />
          {en ? DAY_NAMES_EN[today] : `${DAY_CHARS[today]}요일`}
        </span>
      </p>
      {daysToSunday === 0 ? (
        <p className="worship-today-foot worship-today-foot--sunday">
          <b>{t('worshipTodayIsSunday')}</b>
        </p>
      ) : (
        <>
          <div className="worship-today-path" aria-hidden>
            {steps.map((s, i) => (
              <span key={s.key} className="worship-today-stepwrap">
                {i > 0 && <span className="worship-today-line" />}
                <span className={`worship-today-step${s.tone ? ` is-${s.tone}` : ''}`}>
                  <i>{s.label}</i>
                  <em>{s.date}</em>
                </span>
              </span>
            ))}
          </div>
          <p className="worship-today-foot">
            {t('worshipDaysToSundayLong').split('{n}')[0]}
            <b>{daysToSunday}</b>
            {t('worshipDaysToSundayLong').split('{n}')[1]}
          </p>
        </>
      )}
    </aside>
  )
}
