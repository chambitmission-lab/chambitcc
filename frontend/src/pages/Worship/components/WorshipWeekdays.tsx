// 평일에도 모여요 — 카드마다 "그 시각의 우리 교회" 사진(히어로와 같은 계절).
// 새벽 = 밤 사진 위로 살구빛 동틈, 낮 = 맑은 날, 저녁 = 노을, 밤 = 불 켜진 창. CSS 색 띠는 "어색하고 약하다"로 반려됨.
// 장소는 모두 본당이라 시간 뒤에 적지 않는다(입력값의 "(오렌엘 홀)" 같은 괄호 메모는 걸러낸다).

import type { ReactNode } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { WorshipService } from '../../../types/worship'
import type { NaturalSeason } from '../../../utils/naturalSeason'
import { DAY_CHARS, parseServiceTimes, serviceDays } from '../../../utils/worshipSchedule'
import { StatusChip } from './WorshipBits'
import { DAY_NAMES_EN, formatTimeLabel, pick, serviceStatusToday, taglineKey, weekdayIcon } from './worshipTime'
import { SKY_DOT, SKY_KEY, skyOf, skyPhoto, type Sky } from './worshipSeason'

interface Props {
  services: WorshipService[]
  season: NaturalSeason
  seoulNow: Date
  editButton: (service: WorshipService) => ReactNode
}

const EN_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// 요일 알약 — 어르신 눈높이로 "월요일 ~ 금요일"처럼 온전히. 읽을 수 없으면 관리자가 적은 부제를 그대로
const dayPill = (service: WorshipService, en: boolean): string => {
  const days = serviceDays(service)
  if (days && days.length > 0) {
    const sorted = [...days].sort((a, b) => a - b)
    const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
    const full = (d: number) => (en ? DAY_NAMES_EN[d] : `${DAY_CHARS[d]}요일`)
    if (sorted.length === 1) return full(sorted[0])
    if (contiguous) return en ? `${EN_SHORT[sorted[0]]} – ${EN_SHORT[sorted[sorted.length - 1]]}` : `${full(sorted[0])} ~ ${full(sorted[sorted.length - 1])}`
    return sorted.map((d) => (en ? EN_SHORT[d] : full(d))).join(' · ')
  }
  return pick(en ? 'en' : 'ko', service.subtitle, service.subtitle_en).trim()
}

export default function WorshipWeekdays({ services, season, seoulNow, editButton }: Props) {
  const { t, language } = useLanguage()
  const en = language === 'en'

  if (services.length === 0) return <div className="worship-state">{t('worshipNoWeekdayServices')}</div>

  return (
    <div className="worship-wks">
      {services.map((service) => {
        const times = parseServiceTimes(service.time)
        const skies: Sky[] = times.map(skyOf)
        const lead: Sky = skies[0] ?? 'day'
        const when = [...new Set(skies)].map((s) => t(SKY_KEY[s])).join(' · ')
        const status = serviceStatusToday(service, seoulNow)
        const pill = dayPill(service, en)
        return (
          <article key={service.id} id={`worship-svc-${service.id}`} className="worship-wks-card">
            <div className={`worship-wks-sky worship-wks-sky--${lead}`}>
              <img src={skyPhoto(season, lead)} alt="" aria-hidden="true" loading="lazy" />
              <span className="worship-wks-veil" aria-hidden="true" />
              <span className="material-icons-round worship-wks-icon" aria-hidden="true">{weekdayIcon(service.name)}</span>
              {when && <span className="worship-wks-when">{when}</span>}
            </div>
            <div className="worship-wks-body">
              <p className="worship-wks-name">
                {pick(language, service.name, service.name_en)}
                {(status === 'open' || status === 'ongoing') && <StatusChip status={status} />}
              </p>
              {pill && <p className="worship-wks-day">{pill}</p>}
              <p className="worship-wks-tag">{t(taglineKey(service))}</p>
              <div className="worship-wks-slots">
                {times.length === 0 ? (
                  <p className="worship-wks-slot"><b>{pick(language, service.time, service.time_en)}</b></p>
                ) : en && service.time_en ? (
                  <p className="worship-wks-slot"><b>{service.time_en}</b></p>
                ) : (
                  times.map((m, i) => (
                    <p key={m} className="worship-wks-slot">
                      <span className="worship-wks-dot" style={{ background: SKY_DOT[skies[i]] }} aria-hidden="true" />
                      <b>{formatTimeLabel(m, language)}</b>
                    </p>
                  ))
                )}
              </div>
            </div>
            {editButton(service)}
          </article>
        )
      })}
    </div>
  )
}
