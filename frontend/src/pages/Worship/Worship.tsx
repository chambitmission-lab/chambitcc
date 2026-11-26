import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import { updateWorshipService } from '../../api/worship'
import { useWorshipServices } from '../../hooks/useWorshipServices'
import { useTickingNow } from '../../hooks/useTickingNow'
import { worshipKeys } from '../../hooks/queryKeys'
import type { WorshipService } from '../../types/worship'
import { parseServiceTimes } from '../../utils/worshipSchedule'
import { useAboutContent } from '../../hooks/useAboutContent'
import { getNaturalSeason } from '../../utils/naturalSeason'
import { toKstCalendarDate } from '../../utils/date'
import { can } from '../../utils/access'
import WorshipSunday from './components/WorshipSunday'
import WorshipWeekdays from './components/WorshipWeekdays'
import WorshipWorries from './components/WorshipWorries'
import WorshipMore from './components/WorshipMore'
import WorshipEditSheet from './components/WorshipEditSheet'
import { OPEN_AFTER_MIN, serviceStatusToday } from './components/worshipTime'
import './Worship.css'

/* /worship — 2026-11 "처음 온 성도" 개편 (시안 /#/dev/worship-redesign?v=a2).
 * 처음 온 분이 궁금한 "언제·어떻게 가서·뭘 하고·끝나면?"을 위에서 아래로 답한다.
 *   1. 계절 교회 사진 히어로 "이번 주일, 자리 하나 비워둘게요"
 *   2. 몇 시에 오실래요? → 고른 예배에 맞춘 주일 아침 길(상동역 → 입구 → 예배 → 새가족실)
 *   3. 평일에도 모여요 — 그 시각의 교회 사진
 *   4. 솔직히, 걱정되는 것들 — 랜딩과 같은 문구
 *   5. 오시기 어려우면 — 지난 설교 · 온라인 예배
 * 페이지 전체가 계절 옷(worship-season--*)을 입고, 모든 예배는 본당이라 장소는 따로 적지 않는다.
 * 이전(2026-10 주일 중심 타일·오늘 카드·다음 예배 줄)은 이 개편으로 대체. */

const Worship = () => {
  const { t } = useLanguage()
  const isAdminUser = can('content:manage')
  const { tx } = useAboutContent()
  const liveUrl = tx('worshipLiveUrl').trim()
  const [editingData, setEditingData] = useState<WorshipService | null>(null)
  const queryClient = useQueryClient()

  // 예배 시간표 — 홈 레일·⌘K·랜딩과 같은 캐시(worshipKeys.services()). 아래 수정도 그 캐시에 바로 반영된다.
  const { data: services, isPending: loading, isError } = useWorshipServices()
  useEffect(() => {
    if (isError) showToast(t('worshipLoadFailed'), 'error')
  }, [isError, t])

  // 입장 가능·예배 중 표시용 — 30초 간격이면 충분하다. 탭이 숨겨진 동안은 멈춘다.
  const nowMs = useTickingNow(30_000)

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
        is_active: editingData.is_active,
      })
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

  const activeSunday = services?.filter((s) => s.service_type === 'sunday' && s.is_active) ?? []
  const activeWeekday = services?.filter((s) => s.service_type !== 'sunday' && s.is_active) ?? []

  // 예배는 서울에서 열리므로 기기 시간대와 무관하게 항상 Asia/Seoul 기준으로 판정
  const seoulNow = toKstCalendarDate(new Date(nowMs))
  const nowMin = seoulNow.getHours() * 60 + seoulNow.getMinutes()
  const season = getNaturalSeason(seoulNow)

  // 이번 주일 — 오늘이 주일이면 오늘
  const sunday = new Date(seoulNow.getFullYear(), seoulNow.getMonth(), seoulNow.getDate() + ((7 - seoulNow.getDay()) % 7))

  // 지금 예배 중(막 시작한 '입장 가능' 포함) — 히어로 라이브 알약 · 온라인 카드 LIVE
  const ongoingNow = (() => {
    for (const service of [...activeSunday, ...activeWeekday]) {
      const status = serviceStatusToday(service, seoulNow)
      if (status !== 'ongoing' && status !== 'open') continue
      const started = parseServiceTimes(service.time).filter((x) => x <= nowMin).pop()
      if (started === undefined) continue
      if (status === 'open' && nowMin - started > OPEN_AFTER_MIN) continue
      return service
    }
    return null
  })()

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

  const phone = tx('visitPhone').trim()

  return (
    <div className={`worship-page page-stage worship-season--${season}`}>
      <div className="worship-wrap">
        <WorshipSunday
          services={activeSunday}
          loading={loading}
          seoulNow={seoulNow}
          sunday={sunday}
          ongoing={ongoingNow}
          liveUrl={liveUrl}
          editButton={editButton}
        />

        {!loading && (
          <>
            <section className="worship-section">
              <h2 className="worship-h2">{t('worshipWeekdayLead')}</h2>
              <p className="worship-sub worship-section-sub">{t('worshipWeekdaySub')}</p>
              <WorshipWeekdays services={activeWeekday} season={season} seoulNow={seoulNow} editButton={editButton} />
            </section>

            <section className="worship-section">
              <h2 className="worship-h2">{t('worshipWorryTitle')}</h2>
              <p className="worship-sub worship-section-sub">{t('worshipWorrySub')}</p>
              <WorshipWorries />
            </section>

            <section className="worship-section">
              <h2 className="worship-h2">{t('worshipAwayTitle')}</h2>
              <p className="worship-sub worship-section-sub">{t('worshipAwaySub')}</p>
              <WorshipMore isAdminUser={isAdminUser} ongoing={Boolean(ongoingNow)} season={season} />
            </section>

            <p className="worship-note">
              {t('worshipNoteLine')}
              {phone && ` ${t('worshipNoteCall').replace('{phone}', phone)}`}
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
