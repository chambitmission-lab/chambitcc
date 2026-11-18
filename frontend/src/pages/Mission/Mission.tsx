import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react'
import { safeStorage } from '../../utils/safeStorage'
import { smoothScrollToElement } from '../../utils/scrollTo'
import { useLanguage } from '../../contexts/LanguageContext'
import { useThemeArt } from '../../hooks/useThemeArt'
import { useTickingNow } from '../../hooks/useTickingNow'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { MISSION_HERO } from '../../utils/themeAssets'
import {
  allMissionaries,
  regionMeta,
  domesticChurches,
  domesticOrganizations,
  missionStats,
  type RegionKey,
} from './missionData'
import { HandHeartIcon } from './MissionIcons'
import { buildRoutes, type PrayerRoute } from './departures/routes'
import { distanceFromSeoulKm, localHour, morningFirstKey } from './departures/missionTime'
import { SplitFlap } from './departures/SplitFlap'
import { DepartureBoard } from './departures/DepartureBoard'
import { BoardingPass } from './departures/BoardingPass'
import { NowCard } from './departures/NowCard'
import type { LampPoint } from './departures/LampMap'
import './Mission.css'

// 등불 지도 — 세계 지도 데이터(약 100KB)가 첫 화면 번들에 실리지 않게 따로 불러온다
// PC 는 세계 전체(view=world), 모바일은 탑승권 위에서 고른 노선만 확대(view=route)
const LampMap = lazy(() => import('./departures/LampMap'))

// 선교 — "출발 안내판" 화면 (2026-11-17 개편).
// 선교사 한 분이 기도 노선 하나다. 안내판에서 노선을 고르면 탑승권이 열리고, "기도 탑승"으로 검표(펀치)한다.
//   모바일: 글자판 통계 → 지금 이 시간 카드 → 게이트 칩 → 안내판 → 오늘의 노선 지도 → 탑승권 → 오늘 탑승 현황 → 국내 노선
//           (2026-11-18 M2: 탑승하면 탑승권 바로 위 노선 지도에서 부천발 여객기가 날아간다)
//   PC:     왼쪽 등불 지도(고정)+탑승권 / 오른쪽 지금 이 시간 카드·안내판·국내 노선.
//           탑승을 마치면 지도(항공 노선도)에서 부천발 여객기가 그 나라로 날아가 등불을 켠다.

const REGION_ORDER: RegionKey[] = ['asia', 'europe', 'africa', 'americas']
type Gate = 'all' | RegionKey

const REGION_LABEL_KEY: Record<RegionKey, 'regionAsia' | 'regionEurope' | 'regionAfrica' | 'regionAmericas'> = {
  asia: 'regionAsia',
  europe: 'regionEurope',
  africa: 'regionAfrica',
  americas: 'regionAmericas',
}

/** 오늘 탑승 기록 — 기기 기준 하루 단위(서버 없음). 날짜가 바뀌면 새 키라 저절로 비워진다 */
const todayKey = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `mission-boarded-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const readBoarded = (): Set<string> => {
  const raw = safeStorage.getJson(todayKey())
  return new Set(Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [])
}

const Mission = () => {
  const { t, language } = useLanguage()
  const ko = language === 'ko'
  const heroArtReady = useThemeArt(MISSION_HERO)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const nowMs = useTickingNow(30_000)

  // 대륙 순서로 묶은 노선 — 게이트 칩이 같은 순서다
  const routes = useMemo(() => {
    const all = buildRoutes(allMissionaries)
    return REGION_ORDER.flatMap(r => all.filter(x => x.region === r))
  }, [])

  const [gate, setGate] = useState<Gate>('all')
  const visibleRoutes = useMemo(() => (gate === 'all' ? routes : routes.filter(r => r.region === gate)), [routes, gate])

  // 처음 고른 노선 = 현지에서 하루를 막 시작한 곳
  const [selectedKey, setSelectedKey] = useState<string | null>(() => {
    const now = Date.now()
    const first = [...routes].sort(
      (a, b) => morningFirstKey(localHour(a.detail.tz, now)) - morningFirstKey(localHour(b.detail.tz, now)),
    )[0]
    return first?.key ?? null
  })
  const selected: PrayerRoute | undefined = routes.find(r => r.key === selectedKey) ?? routes[0]

  const [boarded, setBoarded] = useState<Set<string>>(readBoarded)
  // 등불은 비행기가 도착해야 켜진다 — 처음엔 이미 탑승한 나라들
  const [lit, setLit] = useState<Set<string>>(() => {
    const keys = readBoarded()
    return new Set(routes.filter(r => keys.has(r.key)).map(r => r.country))
  })
  const [flight, setFlight] = useState<{ country: string; id: number } | null>(null)
  const flightSeq = useRef(0)
  const passRef = useRef<HTMLDivElement>(null)

  const handleBoarded = useCallback(
    (key: string) => {
      setBoarded(prev => {
        if (prev.has(key)) return prev
        const next = new Set(prev).add(key)
        safeStorage.setJson(todayKey(), [...next])
        return next
      })
      const route = routes.find(r => r.key === key)
      if (!route) return
      // PC·모바일 모두 지도에서 비행 — 착륙하면 등불이 켜진다(handleLanded)
      setFlight({ country: route.country, id: ++flightSeq.current })
    },
    [routes],
  )

  const handleSelect = useCallback(
    (key: string) => {
      setSelectedKey(key)
      if (isDesktop) return
      // 모바일 — 노선이 길어 탑승권이 화면 밖이면 데려온다
      requestAnimationFrame(() => {
        const el = passRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.top > window.innerHeight * 0.75 || r.bottom < 0) smoothScrollToElement(el, { offset: 72 })
      })
    },
    [isDesktop],
  )

  // 지도 등불 탭 → 그 나라의 첫 노선 (게이트가 다른 대륙이면 '모든 게이트'로)
  const handleMapSelect = useCallback(
    (country: string) => {
      const r = routes.find(x => x.country === country)
      if (!r) return
      if (gate !== 'all' && gate !== r.region) setGate('all')
      setSelectedKey(r.key)
    },
    [routes, gate],
  )
  const handleLanded = useCallback((country: string) => setLit(prev => new Set(prev).add(country)), [])

  const lampPoints = useMemo<LampPoint[]>(() => {
    const seen = new Set<string>()
    return routes.flatMap(r => {
      if (seen.has(r.country)) return []
      seen.add(r.country)
      return [{ country: r.country, lat: r.detail.lat, lng: r.detail.lng, code: r.detail.code }]
    })
  }, [routes])

  const ticker = ko
    ? `${missionStats.total}명 ${missionStats.countries}개국 ${missionStats.regions}대륙 ${missionStats.domesticPartners}협력`
    : `${missionStats.total} SENT ${missionStats.countries} NATIONS`

  const gateChips = (
    <div className="gate-chips" role="tablist" aria-label={t('missionGateAll')}>
      {(['all', ...REGION_ORDER] as Gate[]).map(g => (
        <button
          key={g}
          type="button"
          role="tab"
          aria-selected={gate === g}
          className={`gate-chip${gate === g ? ' is-on' : ''}`}
          onClick={() => setGate(g)}
        >
          {g === 'all' ? (
            t('missionGateAll')
          ) : (
            <>
              <i style={{ background: regionMeta[g].color }} />
              {t(REGION_LABEL_KEY[g])}
            </>
          )}
        </button>
      ))}
    </div>
  )

  const board = (
    <DepartureBoard
      routes={visibleRoutes}
      nowMs={nowMs}
      selectedKey={selected?.key ?? null}
      boarded={boarded}
      onSelect={handleSelect}
    />
  )

  const pass = selected ? (
    <div ref={passRef} className="mission-pass-slot">
      <BoardingPass
        key={selected.key}
        route={selected}
        nowMs={nowMs}
        boarded={boarded.has(selected.key)}
        layout={isDesktop ? 'bottom' : 'side'}
        onBoarded={handleBoarded}
      />
    </div>
  ) : null

  const domestic = (
    <section className="dep-card domestic-routes">
      <h2 className="domestic-routes__title">
        {t('missionDomesticRoutes')}
        <small>DOMESTIC</small>
      </h2>
      <div className="domestic-routes__group">{t('missionDomesticChurches')}</div>
      <div className="domestic-routes__tix">
        {domesticChurches.map(name => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div className="domestic-routes__group">{t('missionDomesticOrgs')}</div>
      <div className="domestic-routes__tix">
        {domesticOrganizations.map(name => (
          <span key={name} className="is-org">
            {name}
          </span>
        ))}
      </div>
    </section>
  )

  const boardedCount = routes.filter(r => boarded.has(r.key)).length

  return (
    <div className="mission-page">
      <div className="mission-shell">
        {/* ===== HERO (그대로) ===== */}
        <section className={`mission-hero${heroArtReady ? ' is-art-ready' : ''}`}>
          <div className="hero-eyebrow">CHAMBIT CHURCH · MISSION</div>
          <h1 className="hero-title">
            {t('missionHeroTitleLine1')}
            <br />
            {t('missionHeroTitleLine2')}
          </h1>
          <div className="hero-verse">
            {t('missionHeroVerse')}
            <span className="hero-verse-ref">{t('missionHeroVerseRef')}</span>
          </div>
        </section>

        {isDesktop ? (
          <div className="dep-layout">
            <div className="dep-layout__side">
              <section className="dep-card lamp-map">
                <Suspense fallback={null}>
                  <LampMap
                    points={lampPoints}
                    selectedCountry={selected?.country ?? null}
                    litCountries={lit}
                    flight={flight}
                    onSelect={handleMapSelect}
                    onLanded={handleLanded}
                    originLabel={t('missionMapOrigin')}
                  />
                </Suspense>
                <div className="lamp-map__count">
                  <b>{lit.size}</b>
                  <span>{t('missionLampsLit')}</span>
                </div>
                <div className="lamp-map__legend">
                  <span>
                    <i className="is-lamp" />
                    {t('missionLampLegend')}
                  </span>
                  <span>
                    <i className="is-seoul" />
                    {t('missionSeoulLegend')}
                  </span>
                </div>
              </section>
              {pass}
            </div>
            <div className="dep-layout__main">
              {selected && <NowCard route={selected} nowMs={nowMs} />}
              {gateChips}
              {board}
              {domestic}
            </div>
          </div>
        ) : (
          <div className="dep-mobile">
            <div className="dep-section-label">{t('missionRoutesLabel')}</div>
            <div className="dep-ticker">
              <SplitFlap text={ticker} />
            </div>
            {selected && <NowCard route={selected} nowMs={nowMs} />}
            {gateChips}
            {board}
            {selected && (
              <>
                <div className="dep-section-label">{t('missionTodayRoute')}</div>
                <section className="dep-card lamp-map lamp-map--route">
                  <Suspense fallback={null}>
                    <LampMap
                      view="route"
                      points={lampPoints}
                      selectedCountry={selected.country}
                      litCountries={lit}
                      flight={flight}
                      onSelect={handleMapSelect}
                      onLanded={handleLanded}
                      originLabel={t('missionMapOrigin')}
                    />
                  </Suspense>
                  <div className="lamp-map__route-tag">
                    {t('missionRouteFrom')} <i>→</i> {ko ? selected.detail.city : selected.detail.cityEn} ·{' '}
                    {(Math.round(distanceFromSeoulKm(selected.detail) / 100) * 100).toLocaleString()}km
                  </div>
                  <div className="lamp-map__lit">
                    <b>{lit.size}</b> {t('missionLampsUnit')}
                  </div>
                </section>
              </>
            )}
            <div className="dep-section-label">{t('missionPassHint')}</div>
            {pass}
            <section className="dep-card dep-progress">
              <div className="dep-progress__label">{t('missionProgressTitle')}</div>
              <div className="dep-progress__num">
                <b>{boardedCount}</b>
                <span>
                  / {routes.length} {t('missionProgressUnit')}
                </span>
              </div>
              <div className="dep-progress__bar">
                <i style={{ width: `${routes.length ? (boardedCount / routes.length) * 100 : 0}%` }} />
              </div>
            </section>
            {domestic}
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <section className="mission-footer">
          <div className="footer-icon" aria-hidden>
            <HandHeartIcon size={28} />
          </div>
          <p className="footer-text">
            {t('missionFooterLine1')}
            <br />
            {t('missionFooterLine2')}
          </p>
          <span className="footer-sign">FOR HIS GLORY</span>
        </section>
      </div>
    </div>
  )
}

export default Mission
