import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAboutContent } from '../../hooks/useAboutContent'
import { EditableText } from '../../components/AboutEditor'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getSundayServices, getWeekdayServices } from '../../api/worship'
import type { WorshipService } from '../../types/worship'
import { soonestService } from '../../utils/worshipSchedule'
import { writeToClipboard } from '../Bible/components/verseCopy'
import RouteRail from './components/RouteRail'
import LastMile from './components/LastMile'
import LeaveNowCard from './components/LeaveNowCard'
import { parseCoords } from './geo'
import InviteCard from './components/InviteCard'
import {
  BusIcon,
  CarIcon,
  ChevronRightIcon,
  CompassIcon,
  CopyIcon,
  ParkingIcon,
  PhoneIcon,
  PinIcon,
  SproutIcon,
  SubwayIcon,
  WalkIcon,
} from './icons'
import './Visit.css'

type Mode = 'subway' | 'bus' | 'car' | 'first'

const MODES: { key: Mode; labelKey: 'visitModeSubway' | 'visitModeBus' | 'visitModeCar' | 'visitModeFirst'; Icon: typeof SubwayIcon }[] = [
  { key: 'first', labelKey: 'visitModeFirst', Icon: WalkIcon },
  { key: 'subway', labelKey: 'visitModeSubway', Icon: SubwayIcon },
  { key: 'bus', labelKey: 'visitModeBus', Icon: BusIcon },
  { key: 'car', labelKey: 'visitModeCar', Icon: CarIcon },
]

/** 히어로 하늘 — /worship 과 같은 --worship-sky-* 토큰을 시각으로 고른다 */
const moodOfHour = (h: number): 'dawn' | 'day' | 'dusk' | 'night' => {
  if (h < 8) return 'dawn'
  if (h < 17) return 'day'
  if (h < 20) return 'dusk'
  return 'night'
}

const Visit = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { tx } = useAboutContent()
  const isAdminUser = isAdmin()
  const ko = language === 'ko'

  const [mode, setMode] = useState<Mode>('first')
  const [services, setServices] = useState<WorshipService[]>([])
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let alive = true
    Promise.all([getSundayServices(), getWeekdayServices()])
      .then(([sunday, weekday]) => {
        if (alive) setServices([...sunday, ...weekday])
      })
      // 예배 시간을 못 불러와도 오시는 길 자체는 쓸 수 있어야 하므로 조용히 넘긴다
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // "다음 예배까지" 문구는 분 단위라 30초 갱신이면 충분하다
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const next = useMemo(() => soonestService(services, now), [services, now])

  const address = tx('visitAddress').trim()
  const postcode = tx('visitPostcode').trim()
  const phone = tx('visitPhone').trim()
  const mapQuery = tx('visitMapQuery').trim() || tx('visitAddress').trim()
  const church = parseCoords(tx('visitCoords').trim())
  const subwayExit = tx('visitSubwayExit').trim()
  const busBody = tx('visitBusBody').trim()
  const parkingBody = tx('visitParkingBody').trim()
  const parkingTip = tx('visitParkingTip').trim()

  const kakaoUrl = `https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`

  const openWeb = (url: string) => window.open(url, '_blank', 'noopener')

  // T맵은 웹 길찾기 URL 이 없어 앱 스킴으로 연다. 앱이 없으면 아무 일도 일어나지
  // 않으므로, 화면이 그대로 남아 있으면 웹 지도로 대신 보내 버튼이 먹통이 되지 않게 한다.
  const openTmap = () => {
    let handled = false
    const cancel = () => {
      handled = true
    }
    window.addEventListener('pagehide', cancel, { once: true })
    document.addEventListener('visibilitychange', cancel, { once: true })
    setTimeout(() => {
      if (!handled && document.visibilityState === 'visible') openWeb(kakaoUrl)
    }, 1200)
    window.location.href = `tmap://search?name=${encodeURIComponent(mapQuery)}`
  }

  const copyAddress = () => {
    const text = postcode ? `(${postcode}) ${address}` : address
    writeToClipboard(text).then((ok) => {
      showToast(ok ? t('visitCopied') : t('visitCopyFailed'), ok ? 'success' : 'error')
    })
  }

  const mood = moodOfHour(
    next ? Math.floor(next.occ.startMin / 60) : now.getHours(),
  )

  return (
    <div className="visit-page page-stage">
      <div className="visit-shell">
        <div className="visit-body">
          {/* Hero — 시각에 따라 하늘빛이 바뀐다 (/worship 과 같은 토큰) */}
          <header className={`visit-hero visit-hero--${mood}`}>
            <div className="visit-hero-top">
              <span className="visit-hero-emblem">
                <PinIcon size={22} />
              </span>
              <div className="visit-hero-body">
                <span className="visit-hero-label">{t('visitLabel')}</span>
                <h1 className="visit-hero-title">
                  <EditableText fieldKey="visitTitle" isAdmin={isAdminUser}>
                    {tx('visitTitle')}
                  </EditableText>
                </h1>
                <p className="visit-hero-subtitle">
                  <EditableText fieldKey="visitSubtitle" isAdmin={isAdminUser}>
                    {tx('visitSubtitle')}
                  </EditableText>
                </p>
              </div>
            </div>
          </header>

          {/* PC(lg+) 2단 — 좌: 오시는 방법 / 우: 지금 당장 필요한 것(출발 판단·지도앱·연락처).
              래퍼 3개는 lg 미만에서 display:contents 라 모바일 흐름은 기존과 완전히 동일하다. */}
          <div className="visit-columns">
            {/* 우측 레일 — PC 에선 sticky 라 왼쪽 안내를 읽는 내내 주소·전화·길찾기가 따라온다 */}
            <div className="visit-col-side">
              <LeaveNowCard
                church={church}
                nextServiceName={next?.service.name}
                nextServiceInMin={next?.occ.minutes}
              />

              {/* 길찾기 — 실제 내비게이션은 각자 쓰는 앱에 위임한다 */}
              <section className="visit-actions">
                <div className="visit-maps">
                  <button type="button" className="visit-map-btn" onClick={() => openWeb(kakaoUrl)}>
                    <CompassIcon size={17} />
                    <span>{t('visitOpenKakao')}</span>
                  </button>
                  <button type="button" className="visit-map-btn" onClick={() => openWeb(naverUrl)}>
                    <CompassIcon size={17} />
                    <span>{t('visitOpenNaver')}</span>
                  </button>
                  <button type="button" className="visit-map-btn" onClick={openTmap}>
                    <CarIcon size={17} />
                    <span>{t('visitOpenTmap')}</span>
                  </button>
                </div>

                <div className="visit-contact">
                  <div className="visit-contact-row">
                    <span className="visit-contact-icon">
                      <PinIcon size={18} />
                    </span>
                    <span className="visit-contact-main">
                      <span className="visit-contact-value">
                        <EditableText fieldKey="visitAddress" isAdmin={isAdminUser}>
                          {address}
                        </EditableText>
                      </span>
                      {(postcode || isAdminUser) && (
                        <span className="visit-contact-sub">
                          <EditableText fieldKey="visitPostcode" isAdmin={isAdminUser}>
                            {postcode ? `(${postcode})` : ''}
                          </EditableText>
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="visit-contact-action"
                      onClick={copyAddress}
                      aria-label={t('visitCopyAddress')}
                      title={t('visitCopyAddress')}
                    >
                      <CopyIcon size={17} />
                    </button>
                  </div>

                  {(phone || isAdminUser) && (
                    <div className="visit-contact-row">
                      <span className="visit-contact-icon">
                        <PhoneIcon size={18} />
                      </span>
                      <span className="visit-contact-main">
                        <span className="visit-contact-value">
                          <EditableText fieldKey="visitPhone" isAdmin={isAdminUser}>
                            {phone}
                          </EditableText>
                        </span>
                      </span>
                      {phone && (
                        <a
                          className="visit-contact-action"
                          href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                          aria-label={t('visitCall')}
                          title={t('visitCall')}
                        >
                          <PhoneIcon size={17} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="visit-col-main">
              {/* 경로 다이어그램 — 지도가 아니라 "순서"를 기억하게 한다 */}
              <section className="visit-section">
                <RouteRail
                  stops={[
                    {
                      name: (
                        <EditableText fieldKey="visitRouteFromName" isAdmin={isAdminUser}>
                          {tx('visitRouteFromName')}
                        </EditableText>
                      ),
                      sub: (
                        <EditableText fieldKey="visitRouteFromSub" isAdmin={isAdminUser}>
                          {tx('visitRouteFromSub')}
                        </EditableText>
                      ),
                    },
                    {
                      name: (
                        <EditableText fieldKey="visitRouteViaName" isAdmin={isAdminUser}>
                          {tx('visitRouteViaName')}
                        </EditableText>
                      ),
                      sub: (
                        <EditableText fieldKey="visitRouteViaSub" isAdmin={isAdminUser}>
                          {tx('visitRouteViaSub')}
                        </EditableText>
                      ),
                    },
                    {
                      terminal: true,
                      name: (
                        <EditableText fieldKey="visitRouteToName" isAdmin={isAdminUser}>
                          {tx('visitRouteToName')}
                        </EditableText>
                      ),
                      sub: (
                        <EditableText fieldKey="visitRouteToSub" isAdmin={isAdminUser}>
                          {tx('visitRouteToSub')}
                        </EditableText>
                      ),
                    },
                  ]}
                />
              </section>

              {/* 교통수단 선택 — 필요한 안내만 보여준다 */}
              <section className="visit-section">
                <h2 className="visit-section-title">{t('visitSectionHow')}</h2>
                <div className="visit-modes" role="tablist" aria-label={t('visitSectionHow')}>
                  {MODES.map(({ key, labelKey, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={mode === key}
                      className={`visit-mode${mode === key ? ' is-active' : ''}`}
                      onClick={() => setMode(key)}
                    >
                      <Icon size={19} />
                      <span>{t(labelKey)}</span>
                    </button>
                  ))}
                </div>

                <div className="visit-mode-panel">
                  {mode === 'subway' && (
                    <>
                      <h3 className="visit-panel-title">{t('visitSubwayTitle')}</h3>
                      {(subwayExit || isAdminUser) && (
                        <p className="visit-exit">
                          <span className="visit-exit-badge">
                            <EditableText fieldKey="visitSubwayExit" isAdmin={isAdminUser}>
                              {subwayExit || (isAdminUser ? '—' : '')}
                            </EditableText>
                          </span>
                          <span>{t('visitExitLabel')}</span>
                        </p>
                      )}
                      <p className="visit-panel-body">
                        <EditableText fieldKey="visitSubwayBody" multiline isAdmin={isAdminUser}>
                          {tx('visitSubwayBody')}
                        </EditableText>
                      </p>
                    </>
                  )}

                  {mode === 'bus' && (
                    <>
                      <h3 className="visit-panel-title">{t('visitBusTitle')}</h3>
                      {busBody || isAdminUser ? (
                        <p className="visit-panel-body">
                          <EditableText fieldKey="visitBusBody" multiline isAdmin={isAdminUser}>
                            {busBody || (ko ? '버스 노선을 등록해주세요' : 'Add bus routes')}
                          </EditableText>
                        </p>
                      ) : (
                        <p className="visit-panel-body is-muted">
                          {ko
                            ? '버스로 오실 때는 상동역 정류장에서 내려 주세요. 자세한 노선은 위 길찾기에서 확인하실 수 있습니다.'
                            : 'Get off near Sangdong Station. Check a map app above for exact routes.'}
                        </p>
                      )}
                    </>
                  )}

                  {mode === 'car' && (
                    <>
                      <h3 className="visit-panel-title">{t('visitCarTitle')}</h3>
                      <p className="visit-panel-body">
                        <EditableText fieldKey="visitCarBody" multiline isAdmin={isAdminUser}>
                          {tx('visitCarBody')}
                        </EditableText>
                      </p>

                      {(parkingBody || parkingTip || isAdminUser) && (
                        <div className="visit-parking">
                          <h4 className="visit-parking-title">
                            <ParkingIcon size={16} />
                            <span>{t('visitParkingTitle')}</span>
                          </h4>
                          {(parkingBody || isAdminUser) && (
                            <p className="visit-panel-body">
                              <EditableText fieldKey="visitParkingBody" multiline isAdmin={isAdminUser}>
                                {parkingBody || (ko ? '주차 안내를 등록해주세요' : 'Add parking info')}
                              </EditableText>
                            </p>
                          )}
                          {(parkingTip || isAdminUser) && (
                            <p className="visit-parking-tip">
                              <EditableText fieldKey="visitParkingTip" multiline isAdmin={isAdminUser}>
                                {parkingTip || (ko ? '혼잡 시간대 팁을 등록해주세요' : 'Add a busy-hours tip')}
                              </EditableText>
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {mode === 'first' && (
                    <>
                      <h3 className="visit-panel-title">{t('visitFirstTitle')}</h3>
                      <p className="visit-panel-body">
                        <EditableText fieldKey="visitFirstBody" multiline isAdmin={isAdminUser}>
                          {tx('visitFirstBody')}
                        </EditableText>
                      </p>
                      <button
                        type="button"
                        className="visit-first-cta"
                        onClick={() => navigate('/register')}
                      >
                        <SproutIcon size={17} />
                        <span>{t('visitFirstCta')}</span>
                        <ChevronRightIcon size={16} />
                      </button>
                    </>
                  )}
                </div>
              </section>

              <LastMile isAdminUser={isAdminUser} />

              <InviteCard />

              {isAdminUser && <p className="visit-admin-hint">{t('visitAdminHint')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Visit
