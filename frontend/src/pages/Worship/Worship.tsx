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

const Worship = () => {
  const { t } = useLanguage()
  const isAdminUser = isAdmin()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<WorshipService | null>(null)
  const [sundayServices, setSundayServices] = useState<WorshipService[]>([])
  const [weekdayServices, setWeekdayServices] = useState<WorshipService[]>([])
  const [loading, setLoading] = useState(true)

  // 예배 시간 데이터 로드
  useEffect(() => {
    loadServices()
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
                <div key={service.id} className="worship-item">
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
                          <p className="worship-item-loc">{service.location}</p>
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
                    // 일반 모드
                    <div className="worship-item-row">
                      <div className="worship-item-left">
                        <div className="worship-item-emblem">
                          <span className="material-icons-round">{weekdayIcon(service.name)}</span>
                        </div>
                        <div>
                          <h3 className="worship-item-name">{service.name}</h3>
                        </div>
                      </div>
                      <div className="worship-item-meta">
                        {service.subtitle && (
                          <p className="worship-item-time">{service.subtitle}</p>
                        )}
                        <p className="worship-item-loc">{service.time}</p>
                        {service.location && (
                          <p className="worship-item-loc">{service.location}</p>
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
