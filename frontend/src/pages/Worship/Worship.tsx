import { Info, MapPin } from '../../components/icons/phosphor'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
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
import WorshipRail from './components/WorshipRail'
import { useNavigate } from 'react-router-dom'
import { useAboutContent } from '../../hooks/useAboutContent'
import { BookOpenIcon, ChevronRightIcon, ClockIcon, MapPinIcon, PlayCircleIcon } from '../About/icons'
import './Worship.css'
import { can } from '../../utils/access'
import { CountdownClock, MOOD_ICON, StatusChip } from './components/WorshipBits'
import { DAY_NAMES_EN, FILTER_KEY, NARRATIVE_KEY, OPEN_BEFORE_MIN, RECOMMEND_LEAD_MIN, dayLabel, formatRemaining, formatTimeLabel, liturgicalSeason, moodOfTime, orderLabel, pick, serviceStatusToday, taglineKey, weekdayIcon } from './components/worshipTime'
import type { DayFilter, Mood } from './components/worshipTime'


const Worship = () => {
  const { t, language } = useLanguage()
  const isAdminUser = can('content:manage')
  const navigate = useNavigate()
  const { tx } = useAboutContent()
  const liveUrl = tx('worshipLiveUrl').trim()
  const hasLive = /^https?:\/\//i.test(liveUrl)
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
    const MoodIcon = MOOD_ICON[moodOfTime(firstTime ?? 720)]
    return (
      <p className="worship-ended-note">
        <span className="worship-ended-line">
          <MoodIcon size={15} />
          {t(service.name.includes('기도') ? 'worshipEndedPrayed' : 'worshipEndedWorshiped')}
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
            {/* 카운터 = 필터 탭. 누르면 아래 목록이 그 유형으로 걸러지고, 다시 누르면 전체로 */}
            {!loading && (
              <div className="worship-hero-stats" role="group" aria-label={t('worshipFilterAria')}>
                {(
                  [
                    ['sunday', activeSunday.length, t('worshipSundayStat')],
                    ['weekday', activeWeekday.length, t('worshipWeekdayStat')],
                  ] as const
                ).map(([key, count, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`worship-stat${filter === key ? ' worship-stat--active' : ''}`}
                    aria-pressed={filter === key}
                    onClick={() => setFilter(filter === key ? 'all' : key)}
                  >
                    <span className="worship-stat-num">{count}</span>
                    <span className="worship-stat-label">{label}</span>
                    <span className="worship-stat-chev" aria-hidden="true">
                      <ChevronRightIcon size={13} />
                    </span>
                  </button>
                ))}
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

              {/* 오늘 예배가 없을 때 — 문구 하나 대신 벤토 타일로 채운다:
                  가장 가까운 예배(큰 카드) / 온라인으로 함께 / 오시는 길 */}
              {emptyToday && (
                <div className="worship-empty" key="empty">
                  <p className="worship-empty-lead">{t('worshipEmptyLead')}</p>
                  <div className="worship-empty-bento">
                    {upcoming && (
                      <button
                        type="button"
                        className="worship-empty-tile worship-empty-tile--next"
                        style={{ '--i': 0 } as React.CSSProperties}
                        onClick={() => scrollToService(upcoming.service.id)}
                      >
                        <span className="worship-empty-label">
                          <span className="worship-next-dot" aria-hidden />
                          {t('worshipNearestService')}
                        </span>
                        <span className="worship-empty-name">
                          {pick(language, upcoming.service.name, upcoming.service.name_en)}
                        </span>
                        <span className="worship-empty-time">
                          <ClockIcon size={14} />
                          {dayLabel(upcoming.occ, seoulNow, language, t('worshipToday'), t('worshipTomorrow'))}{' '}
                          {formatTimeLabel(upcoming.occ.startMin, language)}
                          {upcoming.service.location
                            ? ` · ${pick(language, upcoming.service.location, upcoming.service.location_en)}`
                            : ''}
                        </span>
                        <span className="worship-empty-tag">{t(taglineKey(upcoming.service))}</span>
                        <span className="worship-empty-cta">
                          {t('worshipEmptyNextCta')}
                          <ChevronRightIcon size={14} />
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="worship-empty-tile"
                      style={{ '--i': 1 } as React.CSSProperties}
                      onClick={() => {
                        if (hasLive) window.open(liveUrl, '_blank', 'noopener,noreferrer')
                        else navigate('/sermon')
                      }}
                    >
                      <span className="worship-empty-icon">
                        {hasLive ? <PlayCircleIcon size={20} /> : <BookOpenIcon size={20} />}
                      </span>
                      <span className="worship-empty-tile-title">
                        {hasLive ? t('worshipRailChannelCta') : t('worshipEmptyOnlineTitle')}
                      </span>
                      <span className="worship-empty-tile-desc">
                        {hasLive ? t('worshipRailLiveDesc') : t('worshipEmptyOnlineDesc')}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="worship-empty-tile"
                      style={{ '--i': 2 } as React.CSSProperties}
                      onClick={() => navigate('/visit')}
                    >
                      <span className="worship-empty-icon">
                        <MapPinIcon size={20} />
                      </span>
                      <span className="worship-empty-tile-title">{t('worshipEmptyVisitTitle')}</span>
                      <span className="worship-empty-tile-desc">{t('worshipEmptyVisitDesc')}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    className="worship-btn worship-btn--outline worship-empty-all"
                    onClick={() => setFilter('all')}
                  >
                    {t('worshipViewAll')}
                  </button>
                </div>
              )}

              {/* 주일 예배 — 필터가 바뀌면 key 로 다시 마운트해 타임라인 전환 애니메이션을 재생한다 */}
              {showSunday && (
                <section className="worship-block worship-block--timeline" key={`sunday-${filter}`}>
                  <h2 className="worship-block-title">{t('worshipScheduleTitle')}</h2>
                  {activeSunday.length === 0 ? (
                    <div className="worship-state">{t('worshipNoSundayServices')}</div>
                  ) : (
                    activeSunday.map((service, i) => {
                      const status = serviceStatusToday(service, seoulNow)
                      return (
                        <div
                          key={service.id}
                          id={`worship-svc-${service.id}`}
                          className={`worship-item${highlightId === service.id ? ' worship-item--next' : ''}${status === 'ended' ? ' worship-item--ended' : ''}`}
                          style={{ '--i': i } as React.CSSProperties}
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
                <section className="worship-block worship-block--timeline" key={`weekday-${filter}`}>
                  <h2 className="worship-block-title">{t('worshipWeekdayTitle')}</h2>
                  {visibleWeekday.length === 0 ? (
                    <div className="worship-state">{t('worshipNoWeekdayServices')}</div>
                  ) : (
                    visibleWeekday.map((service, i) => {
                      const status = serviceStatusToday(service, seoulNow)
                      return (
                        <div
                          key={service.id}
                          id={`worship-svc-${service.id}`}
                          className={`worship-item${highlightId === service.id ? ' worship-item--next' : ''}${status === 'ended' ? ' worship-item--ended' : ''}`}
                          style={{ '--i': i } as React.CSSProperties}
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
                  <span className="worship-note-key"><MapPin size={14} weight="duotone" aria-hidden="true" /> {t('worshipLocationNote')}</span> {t('worshipLocationText')}
                </p>
                <p className="worship-note-line">
                  <span className="worship-note-key"><Info size={14} weight="duotone" aria-hidden="true" /> {t('worshipInfoNote')}</span> {t('worshipInfoText')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 우측 위젯 레일 (lg+) — 본문과 겹치는 '다음 예배'·시간표는 두지 않는다(★중복 제거).
          라이브·이번 주 설교·오시는 길 CTA 만 놓는다 (components/WorshipRail) */}
      <aside className="worship-rail">
        {!loading && <WorshipRail isAdminUser={isAdminUser} ongoing={Boolean(ongoingNow)} />}
      </aside>
      </div>
    </div>
  )
}

export default Worship
