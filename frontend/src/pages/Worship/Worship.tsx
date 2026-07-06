import { useState, useEffect } from 'react'
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

// 관리자 자유 입력 시간("오전 11시 20분", "7:30" 등) → 자정 기준 분.
// 형식을 해석할 수 없으면 null 을 반환해 다음 예배 강조만 조용히 생략한다.
const parseServiceTime = (time: string): number | null => {
  const m = time.match(/(오전|오후)?\s*(\d{1,2})\s*[시:]\s*(\d{1,2})?/)
  if (!m) return null
  let hour = parseInt(m[2], 10)
  const minute = m[3] ? parseInt(m[3], 10) : 0
  if (m[1] === '오후' && hour < 12) hour += 12
  if (m[1] === '오전' && hour === 12) hour = 0
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

const formatRemaining = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}시간 ${m}분`
  if (h > 0) return `${h}시간`
  return `${m}분`
}

const Worship = () => {
  const { t } = useLanguage()
  const isAdminUser = isAdmin()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<WorshipService | null>(null)
  const [sundayServices, setSundayServices] = useState<WorshipService[]>([])
  const [weekdayServices, setWeekdayServices] = useState<WorshipService[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())

  // 예배 시간 데이터 로드
  useEffect(() => {
    loadServices()
  }, [])

  // 다음 예배 카운트다운 갱신용 (30초 주기)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
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

  // 일요일에만: 지금 이후 가장 가까운 주일예배를 찾아 강조 (지각 방지 넛지)
  // 예배는 서울에서 열리므로 기기 시간대와 무관하게 항상 Asia/Seoul 기준으로 판정
  const nextService = (() => {
    const seoulNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    if (seoulNow.getDay() !== 0) return null
    const nowMin = seoulNow.getHours() * 60 + seoulNow.getMinutes()
    let best: { id: number; remaining: number } | null = null
    for (const s of activeSunday) {
      if (!s.id) continue
      const start = parseServiceTime(s.time)
      if (start === null || start < nowMin) continue
      const remaining = start - nowMin
      if (!best || remaining < best.remaining) best = { id: s.id, remaining }
    }
    return best
  })()

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
          </section>

          {/* 주일 예배 */}
          <section className="worship-block">
            <h2 className="worship-block-title">{t('worshipScheduleTitle')}</h2>
            {loading ? (
              <div className="worship-state">
                <div className="worship-spinner" />
                <p>로딩 중...</p>
              </div>
            ) : activeSunday.length === 0 ? (
              <div className="worship-state">등록된 예배 시간이 없습니다</div>
            ) : (
              activeSunday.map((service) => (
                <div
                  key={service.id}
                  className={`worship-item${nextService?.id === service.id ? ' worship-item--next' : ''}`}
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
                    {nextService && nextService.id === service.id && (
                      <div className="worship-next-banner">
                        <span className="worship-next-dot" aria-hidden />
                        {nextService.remaining === 0
                          ? '⏳ 지금 시작해요!'
                          : `⏳ 시작까지 ${formatRemaining(nextService.remaining)} 남았어요!`}
                      </div>
                    )}
                    <div className="worship-item-row">
                      <div className="worship-item-left">
                        <div className="worship-item-emblem">{service.order}부</div>
                        <div>
                          <h3 className="worship-item-name">{service.name}</h3>
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
              ))
            )}
          </section>

          {/* 평일 예배 */}
          <section className="worship-block">
            <h2 className="worship-block-title">{t('worshipWeekdayTitle')}</h2>
            {loading ? (
              <div className="worship-state">
                <div className="worship-spinner" />
                <p>로딩 중...</p>
              </div>
            ) : activeWeekday.length === 0 ? (
              <div className="worship-state">등록된 평일 예배가 없습니다</div>
            ) : (
              activeWeekday.map((service) => (
                <div key={service.id} className="worship-item">
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
                      <div className="worship-item-row">
                        <div className="worship-item-left">
                          <div className="worship-item-emblem worship-item-emblem--weekday">
                            <span className="material-icons-round">{weekdayIcon(service.name)}</span>
                          </div>
                          <h3 className="worship-item-name">{service.name}</h3>
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
              ))
            )}
          </section>

          {/* 안내 노트 */}
          <div className="worship-note">
            <p className="worship-note-line">
              <span className="worship-note-key">📍 {t('worshipLocationNote')}</span> {t('worshipLocationText')}
            </p>
            <p className="worship-note-line">
              <span className="worship-note-key">ℹ️ {t('worshipInfoNote')}</span> {t('worshipInfoText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Worship
