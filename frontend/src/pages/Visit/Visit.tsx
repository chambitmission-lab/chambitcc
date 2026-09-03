import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAboutContent } from '../../hooks/useAboutContent'
import { useTheme } from '../../contexts/ThemeContext'
import { EditableText } from '../../components/AboutEditor'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getSundayServices, getWeekdayServices } from '../../api/worship'
import type { WorshipService } from '../../types/worship'
import { soonestService } from '../../utils/worshipSchedule'
import { writeToClipboard } from '../Bible/components/verseCopy'
import ChurchMap from './components/ChurchMap'
import TransportInfo from './components/TransportInfo'
import InviteCard from './components/InviteCard'
import LeaveNowCard from './components/LeaveNowCard'
import { parseCoords } from './geo'
import { ChurchIcon, CopyIcon, KakaoMapIcon, NaverMapIcon, PhoneIcon, PinIcon, StoreIcon, SubwayIcon, TmapIcon } from './icons'
import './Visit.css'

/** 히어로 하늘 — /worship 과 같은 --worship-sky-* 토큰을 시각으로 고른다 */
const moodOfHour = (h: number): 'dawn' | 'day' | 'dusk' | 'night' => {
  if (h < 8) return 'dawn'
  if (h < 17) return 'day'
  if (h < 20) return 'dusk'
  return 'night'
}

/**
 * 오시는 길 — 지도 한 장으로 안심시키고, 나머지는 필요한 사람만 펼쳐 본다.
 *
 * 방문자가 정말 원하는 건 셋뿐이다: 여기가 어디인지, 주소·전화, 그리고 길찾기.
 * 그래서 지도 카드가 맨 위에 오고 교통·주차 안내는 접어 두었다.
 */
/** 히어로 배경 — public/images/visit/. 실제 예배당 사진을 라이트=낮, 다크=밤으로 나눠 쓴다.
 *  (두 장 모두 왼쪽 하늘 여백 + 오른쪽 교회 구도로 가공된 1664x640 와이드 자산.
 *   이전 일러스트 배경은 _backup/church-hero.webp 에 보관) 비우면 /about 사진을 쓴다 */
const VISIT_HERO_IMAGES = {
  light: '/images/visit/church-day.webp',
  dark: '/images/visit/church-night.webp',
} as const

const Visit = () => {
  const { t } = useLanguage()
  const { tx, heroBackgroundUrl } = useAboutContent()
  const { theme } = useTheme()
  // 히어로 사진 — /visit 전용 자산(왼쪽 하늘 여백 + 오른쪽 교회 구도)을 테마에 맞춰 고르고,
  // 없으면 /about 의 교회 사진으로 대체한다
  const heroImage = VISIT_HERO_IMAGES[theme] || heroBackgroundUrl

  // 반대 테마 사진을 한가할 때 미리 받아 둔다 — 토글 크로스페이드 순간에 빈 화면이 끼지 않도록
  useEffect(() => {
    const other = VISIT_HERO_IMAGES[theme === 'dark' ? 'light' : 'dark']
    const warm = () => {
      const img = new Image()
      img.src = other
    }
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
    if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(warm)
    else setTimeout(warm, 1500)
  }, [theme])
  const isAdminUser = isAdmin()

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
  const mapQuery = tx('visitMapQuery').trim() || address
  const pinLabel = tx('visitMapPinLabel').trim()
  const coords = parseCoords(tx('visitCoords').trim())

  // 지도 앱에는 이름이 아니라 좌표를 넘긴다. 이름 검색(link/search)은 검색 결과
  // 화면으로 떨어져 교회가 중심에 오지 않는다. 좌표가 없을 때만 검색으로 물러선다.
  const place = encodeURIComponent(pinLabel || mapQuery)
  const kakaoSearchUrl = `https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`
  const kakaoMapUrl = coords
    ? `https://map.kakao.com/link/map/${place},${coords.lat},${coords.lng}`
    : kakaoSearchUrl
  const kakaoRouteUrl = coords
    ? `https://map.kakao.com/link/to/${place},${coords.lat},${coords.lng}`
    : kakaoSearchUrl
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
      if (!handled && document.visibilityState === 'visible') openWeb(kakaoRouteUrl)
    }, 1200)
    window.location.href = coords
      ? `tmap://route?goalname=${place}&goalx=${coords.lng}&goaly=${coords.lat}`
      : `tmap://search?name=${encodeURIComponent(mapQuery)}`
  }

  const copyAddress = () => {
    const text = postcode ? `(${postcode}) ${address}` : address
    writeToClipboard(text).then((ok) => {
      showToast(ok ? t('visitCopied') : t('visitCopyFailed'), ok ? 'success' : 'error')
    })
  }

  const routeSteps = (
    [
      { key: 1, icon: <SubwayIcon size={17} strokeWidth={2} /> },
      { key: 2, icon: <StoreIcon size={17} strokeWidth={2} /> },
      { key: 3, icon: <ChurchIcon size={17} strokeWidth={2} /> },
    ] as const
  )
    .map(({ key, icon }) => {
      const titleKey = `visitRouteStep${key}Title` as const
      const descKey = `visitRouteStep${key}Desc` as const
      return { key, icon, titleKey, descKey, title: tx(titleKey).trim(), desc: tx(descKey).trim(), last: false }
    })
    .filter((s) => s.title || isAdminUser)
    .map((s, i, arr) => ({ ...s, last: i === arr.length - 1 }))

  const mood = moodOfHour(next ? Math.floor(next.occ.startMin / 60) : now.getHours())

  return (
    <div className="visit-page page-stage">
      <div className="visit-shell">
        <div className="visit-body">
          {/* Hero — 교회 사진(/about 와 같은 자산) 위에 제목, 아래로 경로 요약 레일 */}
          <header className={`visit-hero visit-hero--${mood}${heroImage ? ' has-photo' : ''}`}>
            <div className="visit-hero-photo">
              {heroImage && (
                <img
                  className="visit-hero-img"
                  src={heroImage}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  fetchPriority="high"
                />
              )}
              <div className="visit-hero-scrim" />
              <div className="visit-hero-body">
                <span className="visit-hero-label">
                  <PinIcon size={12} strokeWidth={2.2} />
                  {t('visitLabel')}
                </span>
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

            {/* 경로 요약 — 역 → 골목 → 교회. 제목이 비어 있는 칸은 숨긴다.
                --route-count: 진행선이 첫 점~마지막 점 중심에서 정확히 끝나도록 칼럼 수를 CSS에 알린다 */}
            {routeSteps.length > 0 && (
              <ol
                className="visit-route"
                style={{ '--route-count': routeSteps.length } as CSSProperties}
                aria-label={t('visitSubtitle')}
              >
                {routeSteps.map((step) => (
                  <li key={step.key} className={`visit-route-step${step.last ? ' is-last' : ''}`}>
                    {/* 스텝 번호 — 완료/도착 배지 대신 순서가 곧 진행도다 */}
                    <span className="visit-route-num">{step.last ? t('visitRouteArrive') : `STEP ${step.key}`}</span>
                    <span className="visit-route-dot">{step.icon}</span>
                    <strong className="visit-route-title">
                      <EditableText fieldKey={step.titleKey} isAdmin={isAdminUser}>
                        {step.title}
                      </EditableText>
                    </strong>
                    {(step.desc || isAdminUser) && (
                      <span className="visit-route-desc">
                        <EditableText fieldKey={step.descKey} isAdmin={isAdminUser}>
                          {step.desc}
                        </EditableText>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </header>

          {/* 지도 — 레거시가 주던 "여기 어디쯤이구나". 누르면 카카오맵으로 넘어간다 */}
          <ChurchMap coords={coords} pinLabel={pinLabel} onOpen={() => openWeb(kakaoMapUrl)} />

          {/* PC(lg+) 2단 — 좌: 읽는 안내 / 우: 지금 당장 쓰는 것(주소·전화·길찾기).
              래퍼 3개는 lg 미만에서 display:contents 라 모바일은 DOM 순서 그대로 흐른다. */}
          <div className="visit-columns">
            <div className="visit-col-side">
              <section className="visit-actions">
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

                {/* 길찾기 — 실제 내비게이션은 각자 쓰는 앱에 위임한다 */}
                <div className="visit-maps">
                  <button type="button" className="visit-map-btn" onClick={() => openWeb(kakaoRouteUrl)}>
                    <KakaoMapIcon size={22} />
                    <span>{t('visitOpenKakao')}</span>
                  </button>
                  <button type="button" className="visit-map-btn" onClick={() => openWeb(naverUrl)}>
                    <NaverMapIcon size={22} />
                    <span>{t('visitOpenNaver')}</span>
                  </button>
                  <button type="button" className="visit-map-btn" onClick={openTmap}>
                    <TmapIcon size={22} />
                    <span>{t('visitOpenTmap')}</span>
                  </button>
                </div>
              </section>

              {/* 지금 출발하면 — 다음 예배 카운트다운 + (원하면) 내 위치 기준 어림 소요시간.
                  예배 시간을 아는 페이지라야 "언제 나설까"에 답한다 */}
              <LeaveNowCard church={coords} nextServiceName={next?.service.name} nextServiceInMin={next?.occ.minutes} />
            </div>

            <div className="visit-col-main">
              {/* 교통·주차·처음 오시는 분 — 탭으로 나눠 필요한 안내만 집중해서 본다 */}
              <TransportInfo isAdminUser={isAdminUser} />

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
