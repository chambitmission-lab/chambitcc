import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import type { WorshipService } from '../../types/worship'
import '../Home/styles/WorshipTimes.css'

const Worship = () => {
  const { t } = useLanguage()
  const isAdminUser = isAdmin()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<WorshipService | null>(null)
  
  // 임시 데이터 (나중에 API로 교체)
  const [sundayServices, setSundayServices] = useState<WorshipService[]>([
    { id: 1, order: 1, name: '주일낮예배 1부', subtitle: '(이른예배)', time: '오전 7시 30분', location: '오렌엘 홀', is_active: true, service_type: 'sunday' },
    { id: 2, order: 2, name: '주일낮예배 2부', subtitle: '(밤은예배)', time: '오전 9시 20분', location: '', is_active: true, service_type: 'sunday' },
    { id: 3, order: 3, name: '주일낮예배 3부', subtitle: '(길은예배)', time: '오전 11시 20분', location: '', is_active: true, service_type: 'sunday' },
    { id: 4, order: 4, name: '주일낮예배 4부', subtitle: '(열린예배)', time: '오후 1시 30분', location: '', is_active: true, service_type: 'sunday' },
  ])

  const handleEditClick = (service: WorshipService) => {
    setEditingId(service.id!)
    setEditingData({ ...service })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const handleSaveEdit = () => {
    if (!editingData) return
    
    // TODO: API 호출로 교체
    setSundayServices(prev => 
      prev.map(s => s.id === editingData.id ? editingData : s)
    )
    setEditingId(null)
    setEditingData(null)
    showToast('예배 시간이 수정되었습니다', 'success')
  }

  const handleFieldChange = (field: keyof WorshipService, value: string | number) => {
    if (!editingData) return
    setEditingData({ ...editingData, [field]: value })
  }
  
  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(234,179,8,0.1),transparent_50%)]"></div>
          <div className="relative px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full shadow-lg">
              <span className="text-4xl">🙌</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('worshipTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('worshipSubtitle')}</p>
          </div>
        </div>

        {/* Worship Schedule */}
        <div className="p-6 space-y-8">
          {/* 주일 예배 Section */}
          <section className="worship-section">
            <h2 className="worship-section-title">{t('worshipScheduleTitle')}</h2>
            <div className="space-y-3">
              {sundayServices.filter(s => s.is_active).map((service) => (
                <div key={service.id} className="worship-card">
                  {editingId === service.id && editingData ? (
                    // 편집 모드
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editingData.order}
                          onChange={(e) => handleFieldChange('order', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                          min="1"
                          max="10"
                        />
                        <input
                          type="text"
                          value={editingData.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                          placeholder="예배 이름"
                        />
                      </div>
                      <input
                        type="text"
                        value={editingData.subtitle || ''}
                        onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        placeholder="부제목 (선택)"
                      />
                      <input
                        type="text"
                        value={editingData.time}
                        onChange={(e) => handleFieldChange('time', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="시간"
                      />
                      <input
                        type="text"
                        value={editingData.location || ''}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        placeholder="장소 (선택)"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 일반 모드
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="card-icon-text">{service.order}</div>
                        <div className="text-left">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">{service.name}</h3>
                          {service.subtitle && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{service.subtitle}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="time text-base">{service.time}</p>
                          {service.location && (
                            <p className="location text-xs">{service.location}</p>
                          )}
                        </div>
                        {isAdminUser && (
                          <button
                            onClick={() => handleEditClick(service)}
                            className="ml-2 px-2 py-1 text-lg bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                            title="수정"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 평일 예배 Section */}
          <section className="worship-section">
            <h2 className="worship-section-title">{t('worshipWeekdayTitle')}</h2>
            <div className="space-y-3">
              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">🌅</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worshipDawnPrayer')}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipDawnTime')}</p>
                    <p className="location text-sm">{t('worshipDawnTimeDetail')}</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">📖</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worshipWednesday')}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipWednesdayDay')}</p>
                    <p className="location text-sm">{t('worshipWednesdayTime1')}</p>
                    <p className="location text-sm">{t('worshipWednesdayTime2')}</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">🙏</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worshipFriday')}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipFridayDay')}</p>
                    <p className="location text-sm">{t('worshipFridayTime')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Info Note */}
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-gray-800 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-semibold">📍 {t('worshipLocationNote')}</span> {t('worshipLocationText')}<br/>
              <span className="font-semibold">ℹ️ {t('worshipInfoNote')}</span> {t('worshipInfoText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Worship
