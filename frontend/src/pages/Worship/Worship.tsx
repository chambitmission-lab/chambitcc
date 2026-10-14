import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import { updateWorshipService } from '../../api/worship'
import { useWorshipServices } from '../../hooks/useWorshipServices'
import { useTickingNow } from '../../hooks/useTickingNow'
import { worshipKeys } from '../../hooks/queryKeys'
import type { WorshipService } from '../../types/worship'
import type { Language } from '../../locales'
// 시간표 파싱은 /visit(오시는 길)과 공유한다 — 두 화면의 "다음 예배"가 어긋나면 안 된다
import {
  DAY_CHARS,
  nextOccurrence,
  parseServiceTimes,
  serviceDays,
  type Occurrence,
} from '../../utils/worshipSchedule'
import { useAboutContent } from '../../hooks/useAboutContent'
import './Worship.css'
import { can } from '../../utils/access'
import { StatusChip } from './components/WorshipBits'
import WorshipTodayCard from './components/WorshipTodayCard'
import WorshipMore from './components/WorshipMore'
import WorshipEditSheet from './components/WorshipEditSheet'
import { DAY_NAMES_EN, OPEN_AFTER_MIN, OPEN_BEFORE_MIN, dayLabel, formatRemaining, formatTimeLabel, liturgicalSeason, moodOfTime, orderLabel, pick, serviceStatusToday, taglineKey, weekdayIcon } from './components/worshipTime'
import type { Mood } from './components/worshipTime'
import { toKstCalendarDate } from '../../utils/kstTime'

/* /worship — 2026-10 "주일 중심" 개편.
 * 처음 온 성도가 제일 궁금한 "주일 몇 시?"를 히어로의 큰 시간 타일로 바로 답한다.
 * 예전의 숫자 필터·요일 필터·요일 스트립은 걷어냈다 — 예배가 7개뿐이라 한 화면에 다 보이고,
 * '오늘' 기본 필터가 평일 방문자에게 주일 시간을 숨기던 문제가 있었다.
 * 시간대 하늘·양 삽화·절기 배지는 히어로에 그대로 남긴다. */

const WEEKDAY_DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// 평일 예배 요일 배지 — 관리자가 적은 subtitle 이 있으면 그대로, 없으면 파싱한 요일로 만든다
const weekdayBadge = (service: WorshipService, en: boolean): string => {
  const typed = pick(en ? 'en' : 'ko', service.subtitle, service.subtitle_en).trim()
  if (typed) return typed
  const days = serviceDays(service)
  if (!days || days.length === 0) return ''
  const names = en ? WEEKDAY_DAY_EN : DAY_CHARS
  const sorted = [...days].sort((a, b) => a - b)
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1)
  if (sorted.length > 1 && contiguous) return `${names[sorted[0]]}–${names[sorted[sorted.length - 1]]}`
  if (sorted.length === 1) return en ? DAY_NAMES_EN[sorted[0]] : `${DAY_CHARS[sorted[0]]}요일`
  return sorted.map((d) => names[d]).join('·')
}

// 평일 예배 시간 — "오전 10시 30분, 오후 7시 30분 (본당)" 같은 자유 입력을 "오전 10:30 · 오후 7:30"으로
// 정리하고, 괄호 메모("본당")는 따로 돌려줘 아래 작은 줄에 붙인다. 영어 원문이 있으면 그대로 쓴다.
const weekdayTime = (service: WorshipService, language: Language): { time: string; note: string } => {
  if (language === 'en' && service.time_en) return { time: service.time_en, note: '' }
  const times = parseServiceTimes(service.time)
  if (times.length === 0) return { time: pick(language, service.time, service.time_en), note: '' }
  const notes = [...service.time.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim())
  return { time: times.map((m) => formatTimeLabel(m, language)).join(' · '), note: notes.join(' · ') }
}

// 주일 예배 타일 이름 — "(이른예배)" 부제가 있으면 괄호를 벗겨 쓰고, 없으면 예배 이름
const sundayTileName = (service: WorshipService, language: Language): string => {
  const sub = pick(language, service.subtitle, service.subtitle_en).replace(/[()]/g, '').trim()
  return sub || pick(language, service.name, service.name_en)
}

const Worship = () => {
  const { t, language } = useLanguage()
  const en = language === 'en'
  const isAdminUser = can('content:manage')
  const { tx } = useAboutContent()
  const liveUrl = tx('worshipLiveUrl').trim()
  const hasLive = /^https?:\/\//i.test(liveUrl)
  const [editingData, setEditingData] = useState<WorshipService | null>(null)
  const queryClient = useQueryClient()

  // 예배 시간표 — 홈 레일·⌘K·랜딩과 같은 캐시(worshipKeys.services()). 다른 화면에서
  // 먼저 받아 뒀으면 여기선 즉시 그려지고, 아래 수정도 그 캐시에 바로 반영된다.
  const { data: services, isPending: loading, isError } = useWorshipServices()
  useEffect(() => {
    if (isError) showToast(t('worshipLoadFailed'), 'error')
  }, [isError, t])

  // 분 단위 문구·다음 예배 전환용 — 15초 간격이면 충분하다. 탭이 숨겨진 동안은 멈춘다.
  const nowMs = useTickingNow(15_000)

  const handleSaveEdit = async () => {
    if (!editingData || !editingData.id) return
    try {
      const updatedService = await updateWorshipService(editingData.id, {
        order: editingData.order,
        name: editingData.name,
        name_en: editingData.name_en,
        subtitle: editingData.subtitle,
        subtitle_en: editingData.subtitle_en,
        time: editingData.time,
        time_en: editingData.time_en,
        location: editingData.location,
        location_en: editingData.location_en,
        is_active: editingData.is_active
      })
      // 공유 캐시에 바로 반영 — 홈 레일·⌘K 등 같은 키를 보는 화면도 함께 바뀐다
      queryClient.setQueryData<WorshipService[]>(worshipKeys.services(), (prev) =>
        prev?.map((s) => (s.id === updatedService.id ? updatedService : s)),
      )
      setEditingData(null)
      showToast(t('worshipUpdateSuccess'), 'success')
    } catch (error) {
      console.error('Failed to update worship service:', error)
      showToast(t('worshipUpdateFailed'), 'error')
    }
  }

  const activeSunday = services?.filter(s => s.service_type === 'sunday' && s.is_active) ?? []
  const activeWeekday = services?.filter(s => s.service_type !== 'sunday' && s.is_active) ?? []

  // 예배는 서울에서 열리므로 기기 시간대와 무관하게 항상 Asia/Seoul 기준으로 판정
  const seoulNow = toKstCalendarDate(new Date(nowMs))
  const todayDay = seoulNow.getDay()
  const nowMin = seoulNow.getHours() * 60 + seoulNow.getMinutes()

  // 지금 이후 가장 가까운 예배 (주일+평일 통합)
  const upcoming = [...activeSunday, ...activeWeekday]
    .map(service => ({ service, occ: nextOccurrence(service, seoulNow) }))
    .filter((c): c is { service: WorshipService; occ: Occurrence } => c.occ !== null)
    .sort((a, b) => a.occ.minutes - b.occ.minutes)[0] ?? null

  // 지금 진행 중인 예배 — 있으면 히어로 아래 줄이 '라이브 모드'로 바뀐다
  const ongoingNow = (() => {
    for (const service of [...activeSunday, ...activeWeekday]) {
      // 막 시작한 예배(시작 후 10분 이내 '입장 가능')도 라이브로 본다
      const status = serviceStatusToday(service, seoulNow)
      if (status !== 'ongoing' && status !== 'open') continue
      const started = parseServiceTimes(service.time).filter(x => x <= nowMin).pop()
      if (started === undefined) continue
      if (status === 'open' && nowMin - started > OPEN_AFTER_MIN) continue
      return { service, startMin: started }
    }
    return null
  })()

  // 히어로 하늘 무드 — 진행 중이면 그 예배의 시간, 아니면 다음 예배의 시간을 따른다
  const heroMood: Mood = ongoingNow
    ? moodOfTime(ongoingNow.startMin)
    : upcoming
      ? moodOfTime(upcoming.occ.startMin)
      : 'day'
  const season = liturgicalSeason(seoulNow)

  // 이번 주일 — 오늘이 주일이면 오늘
  const daysToSunday = (7 - todayDay) % 7
  const sunday = new Date(seoulNow)
  sunday.setDate(sunday.getDate() + daysToSunday)
  const sundayLabel = en
    ? `Sunday, ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : `${sunday.getMonth() + 1}월 ${sunday.getDate()}일 주일`

  const scrollToService = (id?: number) => {
    if (!id) return
    document
      .getElementById(`worship-svc-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const editButton = (service: WorshipService) =>
    isAdminUser && (
      <button
        type="button"
        onClick={() => setEditingData({ ...service })}
        className="worship-edit-btn"
        title={t('edit')}
        aria-label={t('edit')}
      >
        <span className="material-icons-round">edit</span>
      </button>
    )

  // 히어로 아래 한 줄 — 지금 예배 중이면 라이브, 아니면 다음 예배 + 남은 시간
  const renderNextBar = () => {
    if (ongoingNow) {
      return (
        <div className="worship-nextbar worship-nextbar--live">
          <span className="worship-live-dot" aria-hidden />
          <b>{t('worshipLiveOngoing')}</b>
          <span>
            {pick(language, ongoingNow.service.name, ongoingNow.service.name_en)} ·{' '}
            {formatTimeLabel(ongoingNow.startMin, language)}
          </span>
          {hasLive && (
            <button
              type="button"
              className="worship-nextbar-end worship-nextbar-link"
              onClick={() => window.open(liveUrl, '_blank', 'noopener,noreferrer')}
            >
              {t('worshipRailLiveCta')}
            </button>
          )}
        </div>
      )
    }
    if (!upcoming) return null
    const { occ, service } = upcoming
    const remain =
      occ.dayOffset === 0 && occ.minutes <= OPEN_BEFORE_MIN
        ? t('worshipStatusOpen')
        : occ.minutes < 24 * 60
          ? t('worshipInTime').replace(
              '{time}',
              formatRemaining(occ.minutes, language, t('worshipHourUnit'), t('worshipMinuteUnit')),
            )
          : ''
    return (
      <button
        type="button"
        className="worship-nextbar"
        aria-label={t('worshipLiveNext')}
        onClick={() => scrollToService(service.id)}
      >
        <span className="worship-nextbar-dot" aria-hidden />
        <b>{pick(language, service.name, service.name_en)}</b>
        <span>
          {dayLabel(occ, seoulNow, language, t('worshipToday'), t('worshipTomorrow'))}{' '}
          {formatTimeLabel(occ.startMin, language)}
        </span>
        {remain && <span className="worship-nextbar-end">{remain}</span>}
      </button>
    )
  }

  return (
    <div className="worship-page page-stage">
      <div className="worship-wrap">
        {/* Hero — 이번 주일 시간 타일 + 시간대 하늘 + 양 삽화 */}
        <section className={`worship-hero worship-hero--${heroMood}`}>
          <div className="worship-hero-head">
            <div className="worship-hero-copy">
              <div className="worship-hero-date">
                <span className="worship-hero-sunday">{sundayLabel}</span>
                <span className="worship-hero-dday">
                  {daysToSunday === 0
                    ? t('worshipSundayToday')
                    : t('worshipDaysToSunday').replace('{n}', String(daysToSunday))}
                </span>
                {season && (
                  <span className={`worship-season worship-season--${season.tone}`}>
                    {season.emoji} {t(season.labelKey)}
                  </span>
                )}
              </div>
              <h1 className="worship-hero-title">
                <span className="worship-hero-underline">
                  {t('worshipHeroLine1')}
                  <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden>
                    <path pathLength={1} d="M3 9 C 50 3, 120 3, 197 7" />
                  </svg>
                </span>
                ,
                <br />
                {t('worshipHeroLine2')}
              </h1>
              <p className="worship-hero-lead">{t('worshipHeroLead')}</p>
            </div>
            <WorshipTodayCard seoulNow={seoulNow} />
          </div>

          {loading ? (
            <div className="worship-state">
              <div className="worship-spinner" />
              <p>{t('loading')}</p>
            </div>
          ) : activeSunday.length === 0 ? (
            <div className="worship-state">{t('worshipNoSundayServices')}</div>
          ) : (
            <div className="worship-tiles">
              {activeSunday.map(service => {
                const times = parseServiceTimes(service.time)
                const status = serviceStatusToday(service, seoulNow)
                const isNext = !ongoingNow && upcoming?.service.id === service.id
                const start = times.length === 1 ? times[0] : null
                const loc = service.location ? pick(language, service.location, service.location_en) : ''
                return (
                  <div
                    key={service.id}
                    id={`worship-svc-${service.id}`}
                    className={`worship-tile${isNext ? ' is-next' : ''}${status === 'ended' ? ' is-past' : ''}`}
                  >
                    <p className="worship-tile-order">
                      {orderLabel(service.order, language)}
                      {loc && ` · ${loc}`}
                    </p>
                    {start !== null ? (
                      <p className="worship-tile-time">
                        <em>{en ? (start < 720 ? 'AM' : 'PM') : start < 720 ? '오전' : '오후'}</em>
                        {formatTimeLabel(start, 'en').split(' ')[0]}
                      </p>
                    ) : (
                      <p className="worship-tile-time worship-tile-time--raw">
                        {pick(language, service.time, service.time_en)}
                      </p>
                    )}
                    <p className="worship-tile-name">{sundayTileName(service, language)}</p>
                    {(status === 'open' || status === 'ongoing') && (
                      <span className="worship-tile-status"><StatusChip status={status} /></span>
                    )}
                    {editButton(service)}
                  </div>
                )
              })}
            </div>
          )}

          {!loading && renderNextBar()}
        </section>

        {!loading && (
          <>
            {/* 평일 예배 */}
            <section className="worship-section">
              <h2 className="worship-section-title">{t('worshipWeekdayLead')}</h2>
              {activeWeekday.length === 0 ? (
                <div className="worship-state">{t('worshipNoWeekdayServices')}</div>
              ) : (
                <div className="worship-weekdays">
                  {activeWeekday.map(service => {
                    const status = serviceStatusToday(service, seoulNow)
                    const badge = weekdayBadge(service, en)
                    const wt = weekdayTime(service, language)
                    const loc = [wt.note, service.location ? pick(language, service.location, service.location_en) : '']
                      .filter(Boolean)
                      .join(' · ')
                    const isNext = !ongoingNow && upcoming?.service.id === service.id
                    return (
                      <div
                        key={service.id}
                        id={`worship-svc-${service.id}`}
                        className={`worship-wk${isNext ? ' is-next' : ''}`}
                      >
                        <span className="worship-wk-icon" aria-hidden>
                          <span className="material-icons-round">{weekdayIcon(service.name)}</span>
                        </span>
                        <div className="worship-wk-body">
                          <p className="worship-wk-head">
                            <b>{pick(language, service.name, service.name_en)}</b>
                            {badge && <span className="worship-wk-day">{badge}</span>}
                            {(status === 'open' || status === 'ongoing') && <StatusChip status={status} />}
                          </p>
                          <p className="worship-wk-tag">{t(taglineKey(service))}</p>
                          <p className="worship-wk-time">{wt.time}</p>
                          {loc && <p className="worship-wk-loc">{loc}</p>}
                        </div>
                        {editButton(service)}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* 더 알아보기 — 지난 설교 · 온라인 예배 · 오시는 길 */}
            <section className="worship-section">
              <h2 className="worship-section-title">{t('worshipMoreTitle')}</h2>
              <WorshipMore isAdminUser={isAdminUser} ongoing={Boolean(ongoingNow)} />
            </section>

            <p className="worship-note">
              {t('worshipLocationText')} {t('worshipInfoText')}
            </p>
          </>
        )}
      </div>

      {editingData && (
        <WorshipEditSheet
          data={editingData}
          onChange={(field, value) => setEditingData({ ...editingData, [field]: value })}
          onCancel={() => setEditingData(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}

export default Worship
