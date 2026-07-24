import { memo, useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getSundayServices, getWeekdayServices, updateWorshipService } from '../../api/worship'
import type { WorshipService } from '../../types/worship'
import './Worship.css'

// 평일 예배 종류별 emblem 아이콘 (새벽/수요/금요·기타)
const weekdayIcon = (name: string): string => {
  if (name.includes('새벽')) return 'wb_twilight'
  if (name.includes('수요')) return 'menu_book'
  return 'volunteer_activism'
}

const DAY_CHARS = ['일', '월', '화', '수', '목', '금', '토'] as const

// 관리자 자유 입력 시간("오전 11시 20분", "7:30" 등) → 자정 기준 분.
// 수요기도회처럼 한 항목에 시간이 여러 개("오전 10시 30분, 오후 7시 30분")면 전부 추출한다.
// 해석할 수 없는 형식이면 빈 배열을 반환해 추천/상태 표시만 조용히 생략한다.
const parseServiceTimes = (time: string): number[] => {
  const out: number[] = []
  const re = /(오전|오후)?\s*(\d{1,2})\s*[시:]\s*(\d{1,2})?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(time)) !== null) {
    let hour = parseInt(m[2], 10)
    const minute = m[3] ? parseInt(m[3], 10) : 0
    if (m[1] === '오후' && hour < 12) hour += 12
    if (m[1] === '오전' && hour === 12) hour = 0
    if (hour > 23 || minute > 59) continue
    out.push(hour * 60 + minute)
  }
  return [...new Set(out)].sort((a, b) => a - b)
}

// 예배가 열리는 요일들(0=일 … 6=토). 주일 예배는 항상 일요일,
// 평일 예배는 subtitle("매주 월~금", "수요일")을 우선 파싱하고 없으면 이름으로 유추한다.
const serviceDays = (service: WorshipService): number[] | null => {
  if (service.service_type === 'sunday') return [0]

  // "매월"의 월, "요일"의 일이 요일 글자로 오인되지 않게 먼저 제거
  const text = (service.subtitle ?? '').replace(/매월/g, '').replace(/요일/g, '')
  if (text.includes('매일')) return [0, 1, 2, 3, 4, 5, 6]

  const days = new Set<number>()
  const range = text.match(/([일월화수목금토])\s*[~-]\s*([일월화수목금토])/)
  if (range) {
    const from = DAY_CHARS.indexOf(range[1] as typeof DAY_CHARS[number])
    const to = DAY_CHARS.indexOf(range[2] as typeof DAY_CHARS[number])
    for (let d = from; ; d = (d + 1) % 7) {
      days.add(d)
      if (d === to) break
    }
  } else {
    for (const ch of text) {
      const idx = DAY_CHARS.indexOf(ch as typeof DAY_CHARS[number])
      if (idx >= 0) days.add(idx)
    }
  }
  if (days.size > 0) return [...days]

  const name = service.name
  if (name.includes('새벽')) return [1, 2, 3, 4, 5]
  if (name.includes('주일') || name.includes('일요')) return [0]
  if (name.includes('월요')) return [1]
  if (name.includes('화요')) return [2]
  if (name.includes('수요')) return [3]
  if (name.includes('목요')) return [4]
  if (name.includes('금요')) return [5]
  if (name.includes('토요')) return [6]
  return null
}

interface Occurrence {
  minutes: number // 지금부터 시작까지 남은 분
  dayOffset: number // 0=오늘, 1=내일 …
  startMin: number // 시작 시각 (자정 기준 분)
}

// 지금 이후 가장 가까운 이 예배의 회차
const nextOccurrence = (service: WorshipService, seoulNow: Date): Occurrence | null => {
  const days = serviceDays(service)
  const times = parseServiceTimes(service.time)
  if (!days || times.length === 0) return null
  const nowMin = seoulNow.getHours() * 60 + seoulNow.getMinutes()
  const today = seoulNow.getDay()
  for (let offset = 0; offset <= 7; offset++) {
    if (!days.includes((today + offset) % 7)) continue
    for (const t of times) {
      const minutes = offset * 1440 + t - nowMin
      if (minutes >= 0) return { minutes, dayOffset: offset, startMin: t }
    }
  }
  return null
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

const STATUS_LABEL: Record<ServiceStatus, string> = {
  waiting: '대기 중',
  open: '입장 가능',
  ongoing: '예배 중',
  ended: '종료'
}

const StatusChip = ({ status }: { status: ServiceStatus }) => (
  <span className={`worship-status worship-status--${status}`}>
    <span className="worship-status-dot" aria-hidden />
    {STATUS_LABEL[status]}
  </span>
)

const formatRemaining = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}시간 ${m}분`
  if (h > 0) return `${h}시간`
  return `${m}분`
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

const formatTimeLabel = (startMin: number): string => {
  const h = Math.floor(startMin / 60)
  const m = startMin % 60
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${h12}:${String(m).padStart(2, '0')}`
}

const dayLabel = (occ: Occurrence, seoulNow: Date): string => {
  if (occ.dayOffset === 0) return '오늘'
  if (occ.dayOffset === 1) return '내일'
  return `${DAY_CHARS[(seoulNow.getDay() + occ.dayOffset) % 7]}요일`
}

// 초 단위 카운트다운만 따로 떼어낸 컴포넌트.
// 1초 인터벌을 여기서만 돌려, 페이지 전체(히어로·필터·카드 전부)가
// 매초 재렌더되며 CPU/배터리를 소모하던 것을 이 span 하나의 갱신으로 줄인다.
const CountdownClock = memo(({ deadlineTs }: { deadlineTs: number }) => {
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
    <div className="worship-cd" role="timer" aria-label="시작까지 남은 시간">
      <CountdownSeg value={h} label="시간" />
      <span className="worship-cd-sep" aria-hidden>:</span>
      <CountdownSeg value={m} label="분" />
      <span className="worship-cd-sep" aria-hidden>:</span>
      <CountdownSeg value={s} label="초" />
    </div>
  )
})

type DayFilter = 'today' | 'all' | 'sunday' | 'weekday'

const FILTER_LABEL: Record<DayFilter, string> = {
  today: '오늘',
  all: '전체',
  sunday: '주일',
  weekday: '평일'
}

const Worship = () => {
  const { t } = useLanguage()
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
      showToast('예배 시간을 불러오는데 실패했습니다', 'error')
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
        subtitle: editingData.subtitle,
        time: editingData.time,
        location: editingData.location,
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
      showToast('예배 시간이 수정되었습니다', 'success')
    } catch (error) {
      console.error('Failed to update worship service:', error)
      showToast('예배 시간 수정에 실패했습니다', 'error')
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

  const handleBannerClick = () => {
    if (!upcoming?.service.id) return
    setFilter('all')
    requestAnimationFrame(() => {
      document
        .getElementById(`worship-svc-${upcoming.service.id}`)
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
          ? '⏳ 지금 시작해요!'
          : `⏳ 시작까지 ${formatRemaining(upcoming.occ.minutes)} 남았어요!`}
      </div>
    )
  )

  return (
    <div className="worship-page">
      <div className="worship-shell">
        <div className="worship-body">
          {/* Hero */}
          <section className="worship-hero">
            <div className="worship-hero-top">
              <div className="worship-hero-emblem" aria-hidden>
                <span className="material-icons-round">church</span>
              </div>
              <div className="worship-hero-body">
                <span className="worship-hero-label">WORSHIP</span>
                <h1 className="worship-hero-title">{t('worshipTitle')}</h1>
                <p className="worship-hero-subtitle">{t('worshipSubtitle')}</p>
              </div>
            </div>
            {!loading && (
              <div className="worship-hero-stats">
                <div className="worship-stat">
                  <span className="worship-stat-num">{activeSunday.length}</span>
                  <span className="worship-stat-label">주일 예배</span>
                </div>
                <div className="worship-stat">
                  <span className="worship-stat-num">{activeWeekday.length}</span>
                  <span className="worship-stat-label">평일 예배</span>
                </div>
              </div>
            )}
            {/* 지금 참여 가능한 예배 실시간 배너 */}
            {!loading && upcoming && (
              <button type="button" className="worship-live" onClick={handleBannerClick}>
                <span className="worship-live-label">
                  <span className="worship-next-dot" aria-hidden />
                  {upcoming.occ.dayOffset === 0 ? '지금 참석 가능한 예배' : '다가오는 가장 빠른 예배'}
                </span>
                <span className="worship-live-row">
                  <span className="worship-live-name">{upcoming.service.name}</span>
                  <span className="worship-live-time">
                    {dayLabel(upcoming.occ, seoulNow)} {formatTimeLabel(upcoming.occ.startMin)}
                  </span>
                </span>
                {upcoming.occ.dayOffset === 0 && (
                  <CountdownClock deadlineTs={Date.now() + upcomingRemainSec * 1000} />
                )}
              </button>
            )}
          </section>

          {loading ? (
            <div className="worship-state">
              <div className="worship-spinner" />
              <p>로딩 중...</p>
            </div>
          ) : (
            <>
              {/* 요일 필터 칩 */}
              <div className="worship-filters" role="tablist" aria-label="예배 필터">
                {(['today', 'all', 'sunday', 'weekday'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={filter === f}
                    className={`worship-filter${filter === f ? ' worship-filter--active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {FILTER_LABEL[f]}
                  </button>
                ))}
              </div>

              {emptyToday && (
                <div className="worship-state">
                  <p>오늘 예정된 예배가 없어요</p>
                  {upcoming && (
                    <p className="worship-state-hint">
                      가장 가까운 예배 · {upcoming.service.name} ({dayLabel(upcoming.occ, seoulNow)}{' '}
                      {formatTimeLabel(upcoming.occ.startMin)})
                    </p>
                  )}
                  <button
                    type="button"
                    className="worship-btn worship-btn--outline"
                    onClick={() => setFilter('all')}
                  >
                    전체 예배 보기
                  </button>
                </div>
              )}

              {/* 주일 예배 */}
              {showSunday && (
                <section className="worship-block">
                  <h2 className="worship-block-title">{t('worshipScheduleTitle')}</h2>
                  {activeSunday.length === 0 ? (
                    <div className="worship-state">등록된 예배 시간이 없습니다</div>
                  ) : (
                    activeSunday.map((service) => {
                      const status = serviceStatusToday(service, seoulNow)
                      return (
                        <div
                          key={service.id}
                          id={`worship-svc-${service.id}`}
                          className={`worship-item${highlightId === service.id ? ' worship-item--next' : ''}`}
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
                                value={editingData.subtitle || ''}
                                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                                className="worship-input"
                                placeholder="부제목 (선택)"
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
                                value={editingData.location || ''}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                className="worship-input"
                                placeholder="장소 (선택)"
                              />
                              <div className="worship-edit-actions">
                                <button onClick={handleCancelEdit} className="worship-btn worship-btn--cancel">
                                  취소
                                </button>
                                <button onClick={handleSaveEdit} className="worship-btn worship-btn--save">
                                  저장
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 일반 모드
                            <>
                            {renderNextBanner(service)}
                            <div className="worship-item-row">
                              <div className="worship-item-left">
                                <div className="worship-item-emblem">{service.order}부</div>
                                <div>
                                  <div className="worship-item-namewrap">
                                    <h3 className="worship-item-name">{service.name}</h3>
                                    {status && <StatusChip status={status} />}
                                  </div>
                                  {service.subtitle && (
                                    <p className="worship-item-sub">{service.subtitle}</p>
                                  )}
                                </div>
                              </div>
                              <div className="worship-item-meta">
                                <p className="worship-item-time">{service.time}</p>
                                {service.location && (
                                  <p className="worship-item-loc worship-item-loc--place">
                                    <span className="material-icons-round" aria-hidden>place</span>
                                    {service.location}
                                  </p>
                                )}
                              </div>
                              {isAdminUser && (
                                <button
                                  onClick={() => handleEditClick(service)}
                                  className="worship-edit-btn"
                                  title="수정"
                                  aria-label="수정"
                                >
                                  <span className="material-icons-round">edit</span>
                                </button>
                              )}
                            </div>
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
                    <div className="worship-state">등록된 평일 예배가 없습니다</div>
                  ) : (
                    visibleWeekday.map((service) => {
                      const status = serviceStatusToday(service, seoulNow)
                      return (
                        <div
                          key={service.id}
                          id={`worship-svc-${service.id}`}
                          className={`worship-item${highlightId === service.id ? ' worship-item--next' : ''}`}
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
                                value={editingData.subtitle || ''}
                                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                                className="worship-input"
                                placeholder="요일 (예: 매주 월~금)"
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
                                value={editingData.location || ''}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                className="worship-input"
                                placeholder="추가 시간 정보 (선택)"
                              />
                              <div className="worship-edit-actions">
                                <button onClick={handleCancelEdit} className="worship-btn worship-btn--cancel">
                                  취소
                                </button>
                                <button onClick={handleSaveEdit} className="worship-btn worship-btn--save">
                                  저장
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
                                    <h3 className="worship-item-name">{service.name}</h3>
                                    {status && <StatusChip status={status} />}
                                  </div>
                                </div>
                                {isAdminUser && (
                                  <button
                                    onClick={() => handleEditClick(service)}
                                    className="worship-edit-btn"
                                    title="수정"
                                    aria-label="수정"
                                  >
                                    <span className="material-icons-round">edit</span>
                                  </button>
                                )}
                              </div>
                              <div className="worship-item-schedule">
                                {service.subtitle && (
                                  <span className="worship-sched-day">{service.subtitle}</span>
                                )}
                                <p className="worship-sched-time">{service.time}</p>
                                {service.location && (
                                  <p className="worship-item-loc">{service.location}</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })
                  )}
                </section>
              )}

              {/* 안내 노트 */}
              <div className="worship-note">
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
    </div>
  )
}

export default Worship
