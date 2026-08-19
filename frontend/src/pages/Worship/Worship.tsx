import { memo, useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { Language } from '../../locales'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getSundayServices, getWeekdayServices, updateWorshipService } from '../../api/worship'
import type { WorshipService } from '../../types/worship'
// 시간표 파싱은 /visit(오시는 길)과 공유한다 — 두 화면의 "다음 예배"가 어긋나면 안 된다
import {
  DAY_CHARS,
  nextOccurrence,
  parseServiceTimes,
  serviceDays,
  type Occurrence,
} from '../../utils/worshipSchedule'
import './Worship.css'

// 평일 예배 종류별 emblem 아이콘 (새벽/수요/금요·기타)
const weekdayIcon = (name: string): string => {
  if (name.includes('새벽')) return 'wb_twilight'
  if (name.includes('수요')) return 'menu_book'
  return 'volunteer_activism'
}

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

// 표시 전용 — 영어 모드에서 _en 값이 있으면 사용, 없으면 한글로 폴백.
// 요일/시간 파싱 등 로직은 항상 한글 원본 필드를 사용한다.
const pick = (language: Language, ko: string | undefined | null, en: string | undefined | null): string =>
  (language === 'en' && en) ? en : (ko ?? '')

// 주일 예배 부수 표기 — ko: "1부", en: "1st"
const orderLabel = (order: number, language: Language): string => {
  if (language !== 'en') return `${order}부`
  const suffix = order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'
  return `${order}${suffix}`
}

// 추천 배너는 시작 15분 전까지만 해당 예배를 노출한다.
// 그 이후엔 이동 시간을 고려해 다음 예배를 추천하는 편이 현실적이기 때문.
const RECOMMEND_LEAD_MIN = 15
// 예배 진행 시간 가정치 — '예배 중' 표시 판정에만 사용
const SERVICE_DURATION_MIN = 60
// 시작 30분 전 ~ 시작 10분 후까지를 '입장 가능'으로 본다
const OPEN_BEFORE_MIN = 30
const OPEN_AFTER_MIN = 10

type ServiceStatus = 'waiting' | 'open' | 'ongoing' | 'ended'

// 오늘 열리는 예배의 현재 상태. 오늘 예배가 아니면 null (배지 없음).
const serviceStatusToday = (service: WorshipService, seoulNow: Date): ServiceStatus | null => {
  const days = serviceDays(service)
  if (!days || !days.includes(seoulNow.getDay())) return null
  const times = parseServiceTimes(service.time)
  if (times.length === 0) return null
  const nowMin = seoulNow.getHours() * 60 + seoulNow.getMinutes()
  for (const t of times) {
    if (nowMin < t - OPEN_BEFORE_MIN) return 'waiting'
    if (nowMin <= t + OPEN_AFTER_MIN) return 'open'
    if (nowMin < t + SERVICE_DURATION_MIN) return 'ongoing'
  }
  return 'ended'
}

const STATUS_KEY = {
  waiting: 'worshipStatusWaiting',
  open: 'worshipStatusOpen',
  ongoing: 'worshipStatusOngoing',
  ended: 'worshipStatusEnded'
} as const

const StatusChip = ({ status }: { status: ServiceStatus }) => {
  const { t } = useLanguage()
  return (
    <span className={`worship-status worship-status--${status}`}>
      <span className="worship-status-dot" aria-hidden />
      {t(STATUS_KEY[status])}
    </span>
  )
}

// ko: "1시간 30분" / en: "1 hr 30 min"
const formatRemaining = (minutes: number, language: Language, hourUnit: string, minuteUnit: string): string => {
  const sep = language === 'en' ? ' ' : ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}${sep}${hourUnit} ${m}${sep}${minuteUnit}`
  if (h > 0) return `${h}${sep}${hourUnit}`
  return `${m}${sep}${minuteUnit}`
}

// 세그먼트 한 칸 — 카드는 고정하고, 바뀐 자리 숫자만 key 교체로 remount 되어
// 아래에서 굴러 올라오는 롤 애니메이션이 재생된다 (자리별 key = 위치+값)
const CountdownSeg = ({ value, label }: { value: number; label: string }) => {
  const text = String(value).padStart(2, '0')
  return (
    <div className="worship-cd-box">
      <span className="worship-cd-num">
        {text.split('').map((ch, i) => (
          <span key={`${i}${ch}`} className="worship-cd-digit">{ch}</span>
        ))}
      </span>
      <span className="worship-cd-lab">{label}</span>
    </div>
  )
}

// ko: "오전 11:20" / en: "11:20 AM"
const formatTimeLabel = (startMin: number, language: Language): string => {
  const h = Math.floor(startMin / 60)
  const m = startMin % 60
  const h12 = h % 12 === 0 ? 12 : h % 12
  const clock = `${h12}:${String(m).padStart(2, '0')}`
  if (language === 'en') return `${clock} ${h < 12 ? 'AM' : 'PM'}`
  return `${h < 12 ? '오전' : '오후'} ${clock}`
}

const dayLabel = (occ: Occurrence, seoulNow: Date, language: Language, today: string, tomorrow: string): string => {
  if (occ.dayOffset === 0) return today
  if (occ.dayOffset === 1) return tomorrow
  const day = (seoulNow.getDay() + occ.dayOffset) % 7
  return language === 'en' ? DAY_NAMES_EN[day] : `${DAY_CHARS[day]}요일`
}

/* ── 감성 레이어: 시간대 무드 ─────────────────────────────
 * 예배 시작 시각 → 그 시간의 '빛'. 히어로 하늘·서사 문구·이모지가 이 무드를 따른다.
 * 새벽기도회(5:30)=여명, 주일 낮=낮, 수요 저녁(19:30)=노을, 금요(20:30)=밤 */
type Mood = 'dawn' | 'day' | 'dusk' | 'night'

const moodOfTime = (startMin: number): Mood => {
  const h = startMin / 60
  if (h < 7) return 'dawn'
  if (h < 16) return 'day'
  if (h < 20) return 'dusk'
  return 'night'
}

const MOOD_EMOJI: Record<Mood, string> = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' }

const NARRATIVE_KEY = {
  dawn: 'worshipNarrativeDawn',
  day: 'worshipNarrativeDay',
  dusk: 'worshipNarrativeDusk',
  night: 'worshipNarrativeNight'
} as const

// 예배별 한 줄 초대 문구 — 이름 기반 프리셋
const taglineKey = (service: WorshipService) => {
  if (service.service_type === 'sunday') return 'worshipTaglineSunday' as const
  if (service.name.includes('새벽')) return 'worshipTaglineDawn' as const
  if (service.name.includes('수요')) return 'worshipTaglineWednesday' as const
  if (service.name.includes('금요')) return 'worshipTaglineFriday' as const
  return 'worshipTaglineDefault' as const
}

/* ── 교회력 절기 ─────────────────────────────────────────
 * 대림절·성탄절기·사순절·부활절기·추수감사주간에 히어로에 배지가 얹힌다.
 * 색은 전례색 시맨틱: 대림·사순=보라, 성탄·부활·추수감사=앰버(빛/영광) */
interface LiturgicalSeason {
  labelKey: 'worshipSeasonAdvent' | 'worshipSeasonChristmas' | 'worshipSeasonLent' | 'worshipSeasonEaster' | 'worshipSeasonThanksgiving'
  emoji: string
  tone: 'violet' | 'amber'
}

// 부활절 날짜 — 그레고리력 컴퓨투스 (Anonymous Gregorian algorithm)
const easterOf = (y: number): Date => {
  const a = y % 19
  const b = Math.floor(y / 100)
  const c = y % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(y, month - 1, day)
}

const DAY_MS = 86_400_000

const liturgicalSeason = (now: Date): LiturgicalSeason | null => {
  const y = now.getFullYear()
  const ts = new Date(y, now.getMonth(), now.getDate()).getTime()
  const at = (yy: number, m: number, d: number) => new Date(yy, m, d).getTime()

  // 성탄절기: 12/25 ~ 1/6 (주현절)
  if (ts >= at(y, 11, 25) || ts <= at(y, 0, 6)) {
    return { labelKey: 'worshipSeasonChristmas', emoji: '⭐', tone: 'amber' }
  }
  // 대림절: 성탄 전 네 번째 주일 ~ 12/24
  const christmasDow = new Date(y, 11, 25).getDay()
  const adventStart = at(y, 11, 25 - (christmasDow === 0 ? 7 : christmasDow) - 21)
  if (ts >= adventStart) {
    return { labelKey: 'worshipSeasonAdvent', emoji: '🕯️', tone: 'violet' }
  }
  const easter = easterOf(y).getTime()
  // 사순절: 재의 수요일(부활절 46일 전) ~ 부활절 전날
  if (ts >= easter - 46 * DAY_MS && ts < easter) {
    return { labelKey: 'worshipSeasonLent', emoji: '✝️', tone: 'violet' }
  }
  // 부활절기: 부활절 ~ 오순절(50일)
  if (ts >= easter && ts <= easter + 49 * DAY_MS) {
    return { labelKey: 'worshipSeasonEaster', emoji: '🌷', tone: 'amber' }
  }
  // 추수감사주간: 11월 셋째 주일로 끝나는 한 주 (한국 교회 관례)
  const firstSunday = 1 + ((7 - new Date(y, 10, 1).getDay()) % 7)
  const thirdSunday = at(y, 10, firstSunday + 14)
  if (ts > thirdSunday - 7 * DAY_MS && ts <= thirdSunday) {
    return { labelKey: 'worshipSeasonThanksgiving', emoji: '🍂', tone: 'amber' }
  }
  return null
}

// 초 단위 카운트다운만 따로 떼어낸 컴포넌트.
// 1초 인터벌을 여기서만 돌려, 페이지 전체(히어로·필터·카드 전부)가
// 매초 재렌더되며 CPU/배터리를 소모하던 것을 이 span 하나의 갱신으로 줄인다.
const CountdownClock = memo(({ deadlineTs }: { deadlineTs: number }) => {
  const { t } = useLanguage()
  const [remainSec, setRemainSec] = useState(0)
  useEffect(() => {
    const update = () =>
      setRemainSec(Math.max(0, Math.round((deadlineTs - Date.now()) / 1000)))
    update()
    const timer = setInterval(update, 1_000)
    return () => clearInterval(timer)
  }, [deadlineTs])
  const sec = Math.max(0, remainSec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return (
    <div className="worship-cd" role="timer" aria-label={t('worshipCountdownAria')}>
      <CountdownSeg value={h} label={t('worshipHourUnit')} />
      <span className="worship-cd-sep" aria-hidden>:</span>
      <CountdownSeg value={m} label={t('worshipMinuteUnit')} />
      <span className="worship-cd-sep" aria-hidden>:</span>
      <CountdownSeg value={s} label={t('worshipSecondUnit')} />
    </div>
  )
})

type DayFilter = 'today' | 'all' | 'sunday' | 'weekday'

const FILTER_KEY = {
  today: 'worshipFilterToday',
  all: 'worshipFilterAll',
  sunday: 'worshipFilterSunday',
  weekday: 'worshipFilterWeekday'
} as const

const Worship = () => {
  const { t, language } = useLanguage()
  const isAdminUser = isAdmin()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<WorshipService | null>(null)
  const [sundayServices, setSundayServices] = useState<WorshipService[]>([])
  const [weekdayServices, setWeekdayServices] = useState<WorshipService[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<DayFilter>('today')
  const [now, setNow] = useState(() => new Date())

  // 예배 시간 데이터 로드
  useEffect(() => {
    loadServices()
  }, [])

  // 예배 목록/배너 갱신용 — 초 단위 표시는 CountdownClock 이 자체 처리하므로
  // 페이지 전체 재렌더는 15초 간격이면 충분하다 (분 단위 문구·다음 예배 전환용)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(timer)
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const [sundayData, weekdayData] = await Promise.all([
        getSundayServices(),
        getWeekdayServices()
      ])
      setSundayServices(sundayData)
      setWeekdayServices(weekdayData)
    } catch (error) {
      console.error('Failed to load services:', error)
      showToast(t('worshipLoadFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (service: WorshipService) => {
    setEditingId(service.id!)
    setEditingData({ ...service })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

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

      // 주일 예배인지 평일 예배인지 확인하여 업데이트
      if (updatedService.service_type === 'sunday') {
        setSundayServices(prev =>
          prev.map(s => s.id === updatedService.id ? updatedService : s)
        )
      } else {
        setWeekdayServices(prev =>
          prev.map(s => s.id === updatedService.id ? updatedService : s)
        )
      }

      setEditingId(null)
      setEditingData(null)
      showToast(t('worshipUpdateSuccess'), 'success')
    } catch (error) {
      console.error('Failed to update worship service:', error)
      showToast(t('worshipUpdateFailed'), 'error')
    }
  }

  const handleFieldChange = (field: keyof WorshipService, value: string | number) => {
    if (!editingData) return
    setEditingData({ ...editingData, [field]: value })
  }

  const activeSunday = sundayServices.filter(s => s.is_active)
  const activeWeekday = weekdayServices.filter(s => s.is_active)

  // 예배는 서울에서 열리므로 기기 시간대와 무관하게 항상 Asia/Seoul 기준으로 판정
  const seoulNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const todayDay = seoulNow.getDay()

  // 지금 이후 가장 가까운 예배 (주일+평일 통합).
  // 시작이 임박(15분 미만)하면 다음 예배로 넘어가되, 넘어갈 곳이 없으면 임박한 예배라도 보여준다.
  const upcoming = (() => {
    const candidates = [...activeSunday, ...activeWeekday]
      .map(service => ({ service, occ: nextOccurrence(service, seoulNow) }))
      .filter((c): c is { service: WorshipService; occ: Occurrence } => c.occ !== null)
      .sort((a, b) => a.occ.minutes - b.occ.minutes)
    return candidates.find(c => c.occ.minutes >= RECOMMEND_LEAD_MIN) ?? candidates[0] ?? null
  })()

  const upcomingRemainSec = upcoming
    ? upcoming.occ.minutes * 60 - seoulNow.getSeconds()
    : 0

  // 오늘 열리는 예배 카드에만 글로우 + 카드 내 배너 강조
  const highlightId = upcoming && upcoming.occ.dayOffset === 0 ? upcoming.service.id : null

  // 지금 진행 중인 예배 — 있으면 히어로 배너가 카운트다운 대신 '라이브 모드'로 전환된다
  const ongoingNow = (() => {
    const nowMin = seoulNow.getHours() * 60 + seoulNow.getMinutes()
    for (const service of [...activeSunday, ...activeWeekday]) {
      if (serviceStatusToday(service, seoulNow) !== 'ongoing') continue
      const started = parseServiceTimes(service.time).filter(t => t <= nowMin).pop()
      if (started !== undefined) return { service, startMin: started }
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

  // 서사형 카운트다운 문구 — 정보(숫자)는 유지하고 그 위에 초대의 언어를 얹는다
  const narrativeText = (() => {
    if (ongoingNow) return t('worshipNarrativeOngoing')
    if (!upcoming) return null
    if (upcoming.occ.dayOffset === 0) {
      if (upcoming.occ.minutes <= OPEN_BEFORE_MIN) return t('worshipNarrativeOpen')
      if (upcoming.occ.minutes <= 60) return t('worshipNarrativeSoon')
      return t(NARRATIVE_KEY[heroMood])
    }
    return t(taglineKey(upcoming.service))
  })()

  // 주간 리듬 스트립 — 예배가 열리는 요일 dot
  const weekHasService = Array.from({ length: 7 }, (_, d) =>
    [...activeSunday, ...activeWeekday].some(s => serviceDays(s)?.includes(d))
  )

  const scrollToService = (id?: number) => {
    if (!id) return
    setFilter('all')
    requestAnimationFrame(() => {
      document
        .getElementById(`worship-svc-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  // 요일 필터: '오늘'이면 오늘 열리는 예배만.
  // 요일을 해석할 수 없는 평일 예배는 정보를 숨기지 않도록 항상 포함한다.
  const visibleWeekday = filter === 'today'
    ? activeWeekday.filter(s => serviceDays(s)?.includes(todayDay) ?? true)
    : activeWeekday
  const showSunday = filter === 'all' || filter === 'sunday' ||
    (filter === 'today' && todayDay === 0 && activeSunday.length > 0)
  const showWeekday = filter === 'all' || filter === 'weekday' ||
    (filter === 'today' && visibleWeekday.length > 0)
  const emptyToday = filter === 'today' && !showSunday && !showWeekday

  const renderNextBanner = (service: WorshipService) => (
    highlightId != null && highlightId === service.id && upcoming && (
      <div className="worship-next-banner">
        <span className="worship-next-dot" aria-hidden />
        {upcoming.occ.minutes === 0
          ? t('worshipStartsNow')
          : t('worshipStartsIn').replace(
              '{time}',
              formatRemaining(upcoming.occ.minutes, language, t('worshipHourUnit'), t('worshipMinuteUnit'))
            )}
      </div>
    )
  )

  // 종료된 예배의 따뜻한 마무리 — 차가운 '종료' 칩 대신 잔향 + 다음 만남 안내
  const renderEndedNote = (service: WorshipService) => {
    const next = nextOccurrence(service, seoulNow)
    const firstTime = parseServiceTimes(service.time)[0]
    const emoji = MOOD_EMOJI[moodOfTime(firstTime ?? 720)]
    return (
      <p className="worship-ended-note">
        <span>
          {emoji} {t(service.name.includes('기도') ? 'worshipEndedPrayed' : 'worshipEndedWorshiped')}
        </span>
        {next && (
          <span className="worship-ended-next">
            {t('worshipEndedNext')
              .replace('{day}', dayLabel(next, seoulNow, language, t('worshipToday'), t('worshipTomorrow')))
              .replace('{time}', formatTimeLabel(next.startMin, language))}
          </span>
        )}
      </p>
    )
  }

  return (
    <div className="worship-page page-stage">
      {/* lg+: 좁은 셸을 풀고 본문 + 우측 위젯 레일 2단으로 (/news·/ministry와 같은 문법).
          아래 폭에서는 .worship-layout에 아무 스타일이 없어 기존 그대로다 */}
      <div className="worship-layout">
      <div className="worship-shell">
        <div className="worship-body">
          {/* Hero — 다음(또는 진행 중인) 예배의 시간대에 따라 하늘 무드가 바뀐다 */}
          <section className={`worship-hero worship-hero--${heroMood}`}>
            <div className="worship-hero-top">
              <div className="worship-hero-emblem" aria-hidden>
                <span className="material-icons-round">church</span>
              </div>
              <div className="worship-hero-body">
                <div className="worship-hero-labels">
                  <span className="worship-hero-label">WORSHIP</span>
                  {season && (
                    <span className={`worship-season worship-season--${season.tone}`}>
                      {season.emoji} {t(season.labelKey)}
                    </span>
                  )}
                </div>
                <h1 className="worship-hero-title">{t('worshipTitle')}</h1>
                <p className="worship-hero-subtitle">{t('worshipSubtitle')}</p>
              </div>
            </div>
            {!loading && (
              <div className="worship-hero-stats">
                <div className="worship-stat">
                  <span className="worship-stat-num">{activeSunday.length}</span>
                  <span className="worship-stat-label">{t('worshipSundayStat')}</span>
                </div>
                <div className="worship-stat">
                  <span className="worship-stat-num">{activeWeekday.length}</span>
                  <span className="worship-stat-label">{t('worshipWeekdayStat')}</span>
                </div>
              </div>
            )}
            {/* 지금 예배 중이면 라이브 배너, 아니면 다음 예배 카운트다운 배너 */}
            {!loading && ongoingNow && (
              <button
                type="button"
                className="worship-live worship-live--ongoing"
                onClick={() => scrollToService(ongoingNow.service.id)}
              >
                <span className="worship-live-label">
                  <span className="worship-next-dot" aria-hidden />
                  {t('worshipLiveOngoing')}
                </span>
                <span className="worship-live-row">
                  <span className="worship-live-name">
                    {pick(language, ongoingNow.service.name, ongoingNow.service.name_en)}
                  </span>
                  <span className="worship-live-time">
                    {formatTimeLabel(ongoingNow.startMin, language)}
                  </span>
                </span>
                {narrativeText && <span className="worship-live-narr">{narrativeText}</span>}
              </button>
            )}
            {!loading && !ongoingNow && upcoming && (
              <button type="button" className="worship-live" onClick={() => scrollToService(upcoming.service.id)}>
                <span className="worship-live-label">
                  <span className="worship-next-dot" aria-hidden />
                  {upcoming.occ.dayOffset === 0 ? t('worshipLiveNow') : t('worshipLiveNext')}
                </span>
                <span className="worship-live-row">
                  <span className="worship-live-name">
                    {pick(language, upcoming.service.name, upcoming.service.name_en)}
                  </span>
                  <span className="worship-live-time">
                    {dayLabel(upcoming.occ, seoulNow, language, t('worshipToday'), t('worshipTomorrow'))}{' '}
                    {formatTimeLabel(upcoming.occ.startMin, language)}
                  </span>
                </span>
                {narrativeText && <span className="worship-live-narr">{narrativeText}</span>}
                {upcoming.occ.dayOffset === 0 && (
                  <CountdownClock deadlineTs={Date.now() + upcomingRemainSec * 1000} />
                )}
              </button>
            )}
          </section>

          {loading ? (
            <div className="worship-state">
              <div className="worship-spinner" />
              <p>{t('loading')}</p>
            </div>
          ) : (
            <>
              {/* 주간 리듬 스트립 + 요일 필터 칩 */}
              <div className="worship-controls">
                <div className="worship-week" aria-label={t('worshipWeekAria')}>
                  {DAY_CHARS.map((ch, d) => (
                    <div
                      key={d}
                      className={`worship-week-cell${d === todayDay ? ' worship-week-cell--today' : ''}`}
                    >
                      <span className="worship-week-day">
                        {language === 'en' ? DAY_NAMES_EN[d][0] : ch}
                      </span>
                      <span
                        className={`worship-week-dot${weekHasService[d] ? ' worship-week-dot--on' : ''}`}
                        aria-hidden
                      />
                    </div>
                  ))}
                </div>
                <div className="worship-filters" role="tablist" aria-label={t('worshipFilterAria')}>
                  {(['today', 'all', 'sunday', 'weekday'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      role="tab"
                      aria-selected={filter === f}
                      className={`worship-filter${filter === f ? ' worship-filter--active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {t(FILTER_KEY[f])}
                    </button>
                  ))}
                </div>
              </div>

              {emptyToday && (
                <div className="worship-state">
                  <p>{t('worshipEmptyToday')}</p>
                  {upcoming && (
                    <p className="worship-state-hint">
                      {t('worshipNearestService')} · {pick(language, upcoming.service.name, upcoming.service.name_en)}{' '}
                      ({dayLabel(upcoming.occ, seoulNow, language, t('worshipToday'), t('worshipTomorrow'))}{' '}
                      {formatTimeLabel(upcoming.occ.startMin, language)})
                    </p>
                  )}
                  <button
                    type="button"
                    className="worship-btn worship-btn--outline"
                    onClick={() => setFilter('all')}
                  >
                    {t('worshipViewAll')}
                  </button>
                </div>
              )}

              {/* 주일 예배 */}
              {showSunday && (
                <section className="worship-block">
                  <h2 className="worship-block-title">{t('worshipScheduleTitle')}</h2>
                  {activeSunday.length === 0 ? (
                    <div className="worship-state">{t('worshipNoSundayServices')}</div>
                  ) : (
                    activeSunday.map((service) => {
                      const status = serviceStatusToday(service, seoulNow)
                      return (
                        <div
                          key={service.id}
                          id={`worship-svc-${service.id}`}
                          className={`worship-item${highlightId === service.id ? ' worship-item--next' : ''}${status === 'ended' ? ' worship-item--ended' : ''}`}
                        >
                          {editingId === service.id && editingData ? (
                            // 편집 모드
                            <div className="worship-edit">
                              <div className="worship-edit-row">
                                <input
                                  type="number"
                                  value={editingData.order}
                                  onChange={(e) => handleFieldChange('order', parseInt(e.target.value))}
                                  className="worship-input worship-input--order"
                                  min="1"
                                  max="10"
                                />
                                <input
                                  type="text"
                                  value={editingData.name}
                                  onChange={(e) => handleFieldChange('name', e.target.value)}
                                  className="worship-input worship-input--name"
                                  placeholder="예배 이름"
                                />
                              </div>
                              <input
                                type="text"
                                value={editingData.name_en || ''}
                                onChange={(e) => handleFieldChange('name_en', e.target.value)}
                                className="worship-input"
                                placeholder="예배 이름 (영어)"
                              />
                              <input
                                type="text"
                                value={editingData.subtitle || ''}
                                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                                className="worship-input"
                                placeholder="부제목 (선택)"
                              />
                              <input
                                type="text"
                                value={editingData.subtitle_en || ''}
                                onChange={(e) => handleFieldChange('subtitle_en', e.target.value)}
                                className="worship-input"
                                placeholder="부제목 (영어)"
                              />
                              <input
                                type="text"
                                value={editingData.time}
                                onChange={(e) => handleFieldChange('time', e.target.value)}
                                className="worship-input"
                                placeholder="시간"
                              />
                              <input
                                type="text"
                                value={editingData.time_en || ''}
                                onChange={(e) => handleFieldChange('time_en', e.target.value)}
                                className="worship-input"
                                placeholder="시간 (영어)"
                              />
                              <input
                                type="text"
                                value={editingData.location || ''}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                className="worship-input"
                                placeholder="장소 (선택)"
                              />
                              <input
                                type="text"
                                value={editingData.location_en || ''}
                                onChange={(e) => handleFieldChange('location_en', e.target.value)}
                                className="worship-input"
                                placeholder="장소 (영어)"
                              />
                              <div className="worship-edit-actions">
                                <button onClick={handleCancelEdit} className="worship-btn worship-btn--cancel">
                                  {t('cancel')}
                                </button>
                                <button onClick={handleSaveEdit} className="worship-btn worship-btn--save">
                                  {t('save')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 일반 모드
                            <>
                            {renderNextBanner(service)}
                            <div className="worship-item-row">
                              <div className="worship-item-left">
                                <div className="worship-item-emblem">{orderLabel(service.order, language)}</div>
                                <div>
                                  <div className="worship-item-namewrap">
                                    <h3 className="worship-item-name">{pick(language, service.name, service.name_en)}</h3>
                                    {status && status !== 'ended' && <StatusChip status={status} />}
                                  </div>
                                  {service.subtitle && (
                                    <p className="worship-item-sub">{pick(language, service.subtitle, service.subtitle_en)}</p>
                                  )}
                                </div>
                              </div>
                              <div className="worship-item-meta">
                                <p className="worship-item-time">{pick(language, service.time, service.time_en)}</p>
                                {service.location && (
                                  <p className="worship-item-loc worship-item-loc--place">
                                    <span className="material-icons-round" aria-hidden>place</span>
                                    {pick(language, service.location, service.location_en)}
                                  </p>
                                )}
                              </div>
                              {isAdminUser && (
                                <button
                                  onClick={() => handleEditClick(service)}
                                  className="worship-edit-btn"
                                  title={t('edit')}
                                  aria-label={t('edit')}
                                >
                                  <span className="material-icons-round">edit</span>
                                </button>
                              )}
                            </div>
                            {status === 'ended' && renderEndedNote(service)}
                            </>
                          )}
                        </div>
                      )
                    })
                  )}
                </section>
              )}

              {/* 평일 예배 */}
              {showWeekday && (
                <section className="worship-block">
                  <h2 className="worship-block-title">{t('worshipWeekdayTitle')}</h2>
                  {visibleWeekday.length === 0 ? (
                    <div className="worship-state">{t('worshipNoWeekdayServices')}</div>
                  ) : (
                    visibleWeekday.map((service) => {
                      const status = serviceStatusToday(service, seoulNow)
                      return (
                        <div
                          key={service.id}
                          id={`worship-svc-${service.id}`}
                          className={`worship-item${highlightId === service.id ? ' worship-item--next' : ''}${status === 'ended' ? ' worship-item--ended' : ''}`}
                        >
                          {editingId === service.id && editingData ? (
                            // 편집 모드
                            <div className="worship-edit">
                              <input
                                type="text"
                                value={editingData.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                className="worship-input worship-input--name"
                                placeholder="예배 이름"
                              />
                              <input
                                type="text"
                                value={editingData.name_en || ''}
                                onChange={(e) => handleFieldChange('name_en', e.target.value)}
                                className="worship-input"
                                placeholder="예배 이름 (영어)"
                              />
                              <input
                                type="text"
                                value={editingData.subtitle || ''}
                                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                                className="worship-input"
                                placeholder="요일 (예: 매주 월~금)"
                              />
                              <input
                                type="text"
                                value={editingData.subtitle_en || ''}
                                onChange={(e) => handleFieldChange('subtitle_en', e.target.value)}
                                className="worship-input"
                                placeholder="요일 (영어, 예: Mon-Fri)"
                              />
                              <input
                                type="text"
                                value={editingData.time}
                                onChange={(e) => handleFieldChange('time', e.target.value)}
                                className="worship-input"
                                placeholder="시간"
                              />
                              <input
                                type="text"
                                value={editingData.time_en || ''}
                                onChange={(e) => handleFieldChange('time_en', e.target.value)}
                                className="worship-input"
                                placeholder="시간 (영어)"
                              />
                              <input
                                type="text"
                                value={editingData.location || ''}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                className="worship-input"
                                placeholder="추가 시간 정보 (선택)"
                              />
                              <input
                                type="text"
                                value={editingData.location_en || ''}
                                onChange={(e) => handleFieldChange('location_en', e.target.value)}
                                className="worship-input"
                                placeholder="추가 시간 정보 (영어)"
                              />
                              <div className="worship-edit-actions">
                                <button onClick={handleCancelEdit} className="worship-btn worship-btn--cancel">
                                  {t('cancel')}
                                </button>
                                <button onClick={handleSaveEdit} className="worship-btn worship-btn--save">
                                  {t('save')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 일반 모드 — 평일 일정은 길어질 수 있어 이름 아래 전체폭으로 배치
                            <>
                              {renderNextBanner(service)}
                              <div className="worship-item-row">
                                <div className="worship-item-left">
                                  <div className="worship-item-emblem worship-item-emblem--weekday">
                                    <span className="material-icons-round">{weekdayIcon(service.name)}</span>
                                  </div>
                                  <div className="worship-item-namewrap">
                                    <h3 className="worship-item-name">{pick(language, service.name, service.name_en)}</h3>
                                    {status && status !== 'ended' && <StatusChip status={status} />}
                                  </div>
                                </div>
                                {isAdminUser && (
                                  <button
                                    onClick={() => handleEditClick(service)}
                                    className="worship-edit-btn"
                                    title={t('edit')}
                                    aria-label={t('edit')}
                                  >
                                    <span className="material-icons-round">edit</span>
                                  </button>
                                )}
                              </div>
                              <div className="worship-item-schedule">
                                <p className="worship-item-tagline">{t(taglineKey(service))}</p>
                                {service.subtitle && (
                                  <span className="worship-sched-day">{pick(language, service.subtitle, service.subtitle_en)}</span>
                                )}
                                <p className="worship-sched-time">{pick(language, service.time, service.time_en)}</p>
                                {service.location && (
                                  <p className="worship-item-loc">{pick(language, service.location, service.location_en)}</p>
                                )}
                              </div>
                              {status === 'ended' && renderEndedNote(service)}
                            </>
                          )}
                        </div>
                      )
                    })
                  )}
                </section>
              )}

              {/* 안내 노트 — lg에선 우측 레일의 같은 카드가 대신한다 */}
              <div className="worship-note worship-note--body">
                <p className="worship-note-line">
                  <span className="worship-note-key">📍 {t('worshipLocationNote')}</span> {t('worshipLocationText')}
                </p>
                <p className="worship-note-line">
                  <span className="worship-note-key">ℹ️ {t('worshipInfoNote')}</span> {t('worshipInfoText')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 우측 위젯 레일 (lg+) — 스크롤해도 '다음 예배'와 바로가기가 따라온다.
          새 API 없이 이미 계산된 값(upcoming·activeSunday·activeWeekday)만 재사용 */}
      <aside className="worship-rail">
        {!loading && (ongoingNow || upcoming) && (() => {
          const target = ongoingNow ?? upcoming!
          return (
            <button
              type="button"
              className="worship-rail-card worship-rail-next"
              onClick={() => scrollToService(target.service.id)}
            >
              <span className="worship-rail-label">
                <span className="worship-next-dot" aria-hidden />
                {ongoingNow
                  ? t('worshipLiveOngoing')
                  : upcoming!.occ.dayOffset === 0
                    ? t('worshipLiveNow')
                    : t('worshipLiveNext')}
              </span>
              <span className="worship-rail-name">
                {pick(language, target.service.name, target.service.name_en)}
              </span>
              <span className="worship-rail-time">
                {ongoingNow
                  ? formatTimeLabel(ongoingNow.startMin, language)
                  : `${dayLabel(upcoming!.occ, seoulNow, language, t('worshipToday'), t('worshipTomorrow'))} ${formatTimeLabel(upcoming!.occ.startMin, language)}`}
              </span>
            </button>
          )
        })()}

        {!loading && (activeSunday.length > 0 || activeWeekday.length > 0) && (
          <section className="worship-rail-card">
            {activeSunday.length > 0 && (
              <>
                <p className="worship-rail-title">{t('worshipScheduleTitle')}</p>
                <div className="worship-rail-list">
                  {activeSunday.map(service => (
                    <button
                      key={service.id}
                      type="button"
                      className="worship-rail-link"
                      onClick={() => scrollToService(service.id)}
                    >
                      <span className="worship-rail-link-name">
                        {pick(language, service.name, service.name_en)}
                      </span>
                      <span className="worship-rail-link-time">
                        {pick(language, service.time, service.time_en)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {activeWeekday.length > 0 && (
              <>
                <p className="worship-rail-title">{t('worshipWeekdayTitle')}</p>
                <div className="worship-rail-list">
                  {activeWeekday.map(service => (
                    <button
                      key={service.id}
                      type="button"
                      className="worship-rail-link"
                      onClick={() => scrollToService(service.id)}
                    >
                      <span className="worship-rail-link-name">
                        {pick(language, service.name, service.name_en)}
                      </span>
                      <span className="worship-rail-link-time">
                        {pick(language, service.time, service.time_en)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        <div className="worship-note">
          <p className="worship-note-line">
            <span className="worship-note-key">📍 {t('worshipLocationNote')}</span> {t('worshipLocationText')}
          </p>
          <p className="worship-note-line">
            <span className="worship-note-key">ℹ️ {t('worshipInfoNote')}</span> {t('worshipInfoText')}
          </p>
        </div>
      </aside>
      </div>
    </div>
  )
}

export default Worship
