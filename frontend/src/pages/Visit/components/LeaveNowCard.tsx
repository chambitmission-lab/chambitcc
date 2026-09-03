import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { ClockIcon, CrosshairIcon } from '../icons'
import { CAR_KMH, DETOUR, WALK_KMH, haversineKm } from '../geo'

/** 도착 여유 판정 — 이동 예상시간 대비 예배까지 남은 시간 */
type Verdict = 'ok' | 'tight' | 'late'

// 이보다 먼 예배는 "지금 출발" 판단이 의미 없어 카운트다운만 보여준다
const ACTIONABLE_WINDOW_MIN = 12 * 60

interface LeaveNowCardProps {
  /** 교회 좌표 — 없으면 위치 버튼 자체가 숨는다 */
  church: { lat: number; lng: number } | null
  /** 다음 예배 (없으면 예배 줄 생략) */
  nextServiceName?: string
  nextServiceInMin?: number
}

/**
 * "지금 출발하면" — 오시는 길이 시간을 아는 순간 정보가 아니라 돌봄이 된다.
 *
 * 소요 시간은 경로 API 없이 직선거리로 어림한 값이다. 대부분 근처 성도가 보는
 * 화면이라 정확도보다 "지금 나서도 되나"의 감이 목적이고, 화면에서도 어림값임을
 * 밝힌 뒤 정확한 경로는 지도 앱에 넘긴다. 위치 권한은 버튼을 눌렀을 때만 묻는다.
 */
const LeaveNowCard = ({ church, nextServiceName, nextServiceInMin }: LeaveNowCardProps) => {
  const { t } = useLanguage()
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [km, setKm] = useState<number | null>(null)

  const locate = () => {
    if (!navigator.geolocation || !church) {
      setState('denied')
      return
    }
    setState('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setKm(haversineKm({ lat: pos.coords.latitude, lng: pos.coords.longitude }, church))
        setState('ok')
      },
      () => setState('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
  }

  const roadKm = km === null ? null : km * DETOUR
  const carMin = roadKm === null ? null : Math.max(1, Math.round((roadKm / CAR_KMH) * 60))
  const walkMin = roadKm === null ? null : Math.round((roadKm / WALK_KMH) * 60)
  // 걸어갈 만한 거리일 때만 도보 시간을 함께 보여준다 (2km 넘으면 소음)
  const showWalk = roadKm !== null && roadKm <= 2

  const verdict: Verdict | null =
    carMin === null || nextServiceInMin === undefined || nextServiceInMin > ACTIONABLE_WINDOW_MIN
      ? null
      : nextServiceInMin >= carMin + 15
        ? 'ok'
        : nextServiceInMin >= carMin
          ? 'tight'
          : 'late'

  const remainText =
    nextServiceInMin === undefined
      ? null
      : nextServiceInMin >= 60
        ? `${Math.floor(nextServiceInMin / 60)}${t('visitHourUnit')} ${nextServiceInMin % 60}${t('visitMinuteUnit')}`
        : `${nextServiceInMin}${t('visitMinuteUnit')}`

  // 좌표도 예배 시간도 없으면 카드가 빈 껍데기라 아예 그리지 않는다
  if (!church && !nextServiceName) return null

  return (
    <section className="visit-now">
      <header className="visit-now-head">
        <span className="visit-now-icon">
          <ClockIcon size={16} />
        </span>
        <h2 className="visit-now-title">{t('visitNowTitle')}</h2>
      </header>

      {nextServiceName && remainText && (
        <p className="visit-now-service">
          <span className="visit-now-service-label">{t('visitNextService')}</span>
          <span className="visit-now-service-name">{nextServiceName}</span>
          <strong className="visit-now-service-remain">{remainText}</strong>
        </p>
      )}

      {state === 'ok' && km !== null ? (
        <>
          <div className="visit-now-metrics">
            <div className="visit-now-metric">
              <span className="visit-now-metric-label">{t('visitDistanceLabel')}</span>
              <span className="visit-now-metric-value">
                {km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`}
              </span>
            </div>
            <div className="visit-now-metric">
              <span className="visit-now-metric-label">{t('visitEtaCar')}</span>
              <span className="visit-now-metric-value">
                {carMin}
                <em>{t('visitMinuteUnit')}</em>
              </span>
            </div>
            {showWalk && (
              <div className="visit-now-metric">
                <span className="visit-now-metric-label">{t('visitEtaWalk')}</span>
                <span className="visit-now-metric-value">
                  {walkMin}
                  <em>{t('visitMinuteUnit')}</em>
                </span>
              </div>
            )}
          </div>

          {verdict && (
            <p className={`visit-now-verdict is-${verdict}`}>
              {verdict === 'ok' ? t('visitLeaveOk') : verdict === 'tight' ? t('visitLeaveTight') : t('visitLeaveLate')}
            </p>
          )}

          <p className="visit-now-note">{t('visitEtaNote')}</p>
        </>
      ) : state === 'denied' ? (
        <p className="visit-now-note">{t('visitLocateDenied')}</p>
      ) : (
        church && (
          <button type="button" className="visit-now-cta" onClick={locate} disabled={state === 'loading'}>
            <CrosshairIcon size={17} />
            <span>{state === 'loading' ? t('visitLocating') : t('visitLocateCta')}</span>
          </button>
        )
      )}
    </section>
  )
}

export default LeaveNowCard
