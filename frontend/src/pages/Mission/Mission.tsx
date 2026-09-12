import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { missionaryByRegion, allMissionaries, regionMeta, countryCoordinates, countryDetail, domesticChurches, domesticOrganizations, missionStats, type RegionKey, type Missionary } from './missionData'
import WorldGlobe from './WorldGlobe'
import CountryFlag from './CountryFlag'
import { useLanguage } from '../../contexts/LanguageContext'
import { useThemeArt } from '../../hooks/useThemeArt'
import { MISSION_HERO } from '../../utils/themeAssets'
import './Mission.css'
import { PinIcon, GlobeIcon, ZoomIcon, CheckIcon, HandHeartIcon, PersonIcon, MapIcon, HandshakeIcon } from './MissionIcons'
import { MissionaryGroups } from './components/MissionaryGroups'
import { MissionarySheet } from './components/MissionarySheet'

const REGION_ORDER: RegionKey[] = ['asia', 'europe', 'africa', 'americas']

const REGION_LABEL_KEY: Record<RegionKey, 'regionAsia' | 'regionEurope' | 'regionAfrica' | 'regionAmericas'> = {
  asia: 'regionAsia',
  europe: 'regionEurope',
  africa: 'regionAfrica',
  americas: 'regionAmericas',
}


/** 숫자 카운트업 — 화면에 들어오면 0→값으로 차오른다 (reduced-motion 시 즉시 표시) */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const CountUpNum = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null)
  // reduced-motion 이면 처음부터 최종값 — 이펙트에서 setState 로 되돌리지 않는다
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? value : 0))

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    let raf = 0
    const io = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const duration = 1200
        const tick = (t: number) => {
          const p = Math.min((t - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setDisplay(Math.round(value * eased))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value])

  return (
    <span ref={ref} className="stat-num">
      {display}
    </span>
  )
}

/** 통계 카드 아이콘 — 인라인 SVG(스트로크 1.8), 카드별 컬러는 --sc 로 받는다 */
const STAT_ICONS = {
  missionary: <PersonIcon />,
  countries: <GlobeIcon />,
  continents: <MapIcon />,
  partners: <HandshakeIcon />,
} as const

/** PC(lg+)에선 지구본이 우측에 고정되어 늘 보이므로 지도로 스크롤할 필요가 없다 */
const isDesktopTwoCol = () => window.matchMedia('(min-width: 1024px)').matches


const Mission = () => {
  const { t, language } = useLanguage()
  // 히어로 삽화(라이트/다크 한 쌍) — 도착에 맞춰 페이드인
  const heroArtReady = useThemeArt(MISSION_HERO)
  const [activeRegion, setActiveRegion] = useState<RegionKey>('asia')
  const [hoverCountry, setHoverCountry] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null) // "country|name"
  // 기본은 지구 전체 보기 — 확대는 토글로만. 배율이 대륙마다 달라지지 않게
  // 확대도 고정 배율이라 대륙 탭 전환 시 지구본 크기는 항상 그대로다
  const [mapZoomOut, setMapZoomOut] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)

  // 함께 기도하기 — 개인 기기 기준 하루 한 번. 서버 없이도 참여감을 주는 소박한 액션
  const prayKey = `mission-prayed-${new Date().toISOString().slice(0, 10)}`
  const [prayedToday, setPrayedToday] = useState(
    () => localStorage.getItem(prayKey) === '1'
  )
  const handlePray = () => {
    localStorage.setItem(prayKey, '1')
    setPrayedToday(true)
  }

  const missionaries = useMemo(
    () => missionaryByRegion[activeRegion],
    [activeRegion]
  )

  // 오늘의 기도 선교사 — 날짜 기반 로테이션 (약 7주 주기로 전원 순환)
  const featured = useMemo(() => {
    const now = new Date()
    const dayNum = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000)
    return allMissionaries[dayNum % allMissionaries.length]
  }, [])
  const featuredRegion: RegionKey = countryCoordinates[featured.country]?.region ?? 'asia'
  const featuredColor = regionMeta[featuredRegion].color

  const activeMeta = regionMeta[activeRegion]
  const activeRegionLabel = t(REGION_LABEL_KEY[activeRegion])

  // selectedKey → 국가명 추출
  const selectedCountry = selectedKey ? selectedKey.split('|')[0] : null

  // 선교사 개인 탭 → 현지 시간 바텀시트
  const [sheetTarget, setSheetTarget] = useState<Missionary | null>(null)

  // 국가 그룹 헤더 클릭 → 지도에서 해당 국가 강조 (재클릭 시 해제)
  const handleCountryClick = (country: string) => {
    if (selectedCountry === country) {
      setSelectedKey(null)
      return
    }
    setSelectedKey(`${country}|@list`)
    // 지도를 화면에 부드럽게 가져오기
    if (!isDesktopTwoCol()) mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // 바텀시트의 "지도에서 위치 보기"
  const handleSheetLocate = (m: Missionary) => {
    setSheetTarget(null)
    const region = countryCoordinates[m.country]?.region
    if (region) setActiveRegion(region)
    setMapZoomOut(false)
    setSelectedKey(`${m.country}|${m.name}`)
    if (!isDesktopTwoCol()) mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // 지역 탭 변경 시 선택만 초기화 — 확대/전체 보기 상태는 사용자가 토글한 그대로 유지
  const handleRegionChange = (key: RegionKey) => {
    setActiveRegion(key)
    setSelectedKey(null)
  }

  // 지도 점 탭 → 국가 선택 (같은 국가 재탭 시 해제). 해당 대륙 탭도 함께 전환
  const handleMapSelect = useCallback((country: string) => {
    const coord = countryCoordinates[country]
    if (!coord) return
    setActiveRegion(coord.region)
    setMapZoomOut(false)
    setSelectedKey(prev => (prev?.split('|')[0] === country ? null : `${country}|@map`))
  }, [])

  // 오늘의 선교사 카드 탭 → 해당 국가를 지도에서 강조
  const handleFeaturedClick = () => {
    setActiveRegion(featuredRegion)
    setMapZoomOut(false)
    setSelectedKey(`${featured.country}|${featured.name}`)
    if (!isDesktopTwoCol()) mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // 지구본에 찍을 점: 전체 선교지 (활성 지역 강조) — 실좌표(countryDetail) 기준
  const mapPoints = useMemo(() => {
    return Object.entries(countryCoordinates).flatMap(([country, coord]) => {
      const geo = countryDetail[country]
      if (!geo) return []
      return [{
        country,
        lat: geo.lat,
        lng: geo.lng,
        active: coord.region === activeRegion,
        color: regionMeta[coord.region].color,
      }]
    })
  }, [activeRegion])

  return (
    <div className="mission-page">
      <div className="mission-shell">
        {/* ===== HERO ===== */}
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

        {/* ===== STATS ===== */}
        <div className="mission-stats">
          {([
            { key: 'missionary', value: missionStats.total, label: 'missionStatDispatched', desc: 'missionStatDispatchedDesc' },
            { key: 'countries', value: missionStats.countries, label: 'missionStatCountries', desc: 'missionStatCountriesDesc' },
            { key: 'continents', value: missionStats.regions, label: 'missionStatContinents', desc: 'missionStatContinentsDesc' },
            { key: 'partners', value: missionStats.domesticPartners, label: 'missionStatDomesticPartners', desc: 'missionStatDomesticPartnersDesc' },
          ] as const).map(s => (
            <div key={s.key} className="stat-card">
              <div className="stat-icon">{STAT_ICONS[s.key]}</div>
              <div className="stat-main">
                <CountUpNum value={s.value} />
                <span className="stat-label">{t(s.label)}</span>
              </div>
              <p className="stat-desc">{t(s.desc)}</p>
            </div>
          ))}
        </div>

        {/* ===== PRAY CTA BANNER ===== */}
        <section className="mission-cta">
          <div className="cta-icon" aria-hidden>
            <HandHeartIcon size={26} />
          </div>
          <div className="cta-text">
            <div className="cta-title">{t('missionCtaTitle')}</div>
            <div className="cta-sub">{t('missionCtaSub')}</div>
          </div>
          <button
            type="button"
            className={`cta-btn ${prayedToday ? 'done' : ''}`}
            onClick={handlePray}
            disabled={prayedToday}
          >
            {prayedToday ? (
              <>
                <CheckIcon className="mi-inline" width={14} height={14} />
                {t('missionPrayDone')}
              </>
            ) : (
              <>
                {t('missionCtaBtn')}
                <span className="cta-arrow">›</span>
              </>
            )}
          </button>
        </section>

        {/* ===== PC 2단 (모바일에선 display:contents 라 흐름 그대로) =====
            좌: 선교사 명단 / 우: 오늘의 선교사 + 지구본(sticky) */}
        <div className="mission-columns">
          <div className="mission-col-side">
            {/* ===== TODAY'S PRAYER MISSIONARY ===== */}
            {/* 매일 한 분씩 로테이션 — "읽는 화면"이 아니라 매일 들러 기도하는 화면으로 */}
            <section
              className="featured-card"
              style={{
                ['--fc' as string]: featuredColor,
              }}
              onClick={handleFeaturedClick}
            >
              <div className="featured-eyebrow">{t('missionTodayEyebrow')}</div>
              <div className="featured-body">
                <CountryFlag className="featured-flag" country={featured.country} />
                <div className="featured-text">
                  <p className="featured-sentence">
                    {language === 'ko' ? (
                      <>오늘은 <em>{featured.country}</em>의 <strong>{featured.name}</strong> 선교사님을 위해 기도해요</>
                    ) : (
                      <>Today, let&apos;s pray for <strong>{featured.name}</strong> serving in <em>{featured.country}</em></>
                    )}
                  </p>
                  <span className="featured-locate">
                    <PinIcon className="mi-inline" width={13} height={13} />
                    {t('missionTodayLocate')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={`mission-pray-btn ${prayedToday ? 'done' : ''}`}
                onClick={e => {
                  e.stopPropagation()
                  handlePray()
                }}
                disabled={prayedToday}
              >
                {prayedToday ? (
                  <>
                    <CheckIcon className="mi-inline" width={15} height={15} />
                    {t('missionPrayDone')}
                  </>
                ) : (
                  <>
                    <HandHeartIcon size={16} className="mi-inline" />
                    {t('missionPrayCta')}
                  </>
                )}
              </button>
            </section>

            {/* ===== WORLD MAP ===== */}
            <div className="mission-map-wrap" ref={mapRef}>
              <div className="map-heading">
                <span className="map-title">
                  <GlobeIcon className="mi-inline" width={15} height={15} />
                  {t('missionMapTitle')}
                </span>
                <span className="map-hint">
                  {selectedCountry ?? hoverCountry ?? `${activeRegionLabel} ${t('missionRegionEmphasize')}`}
                </span>
              </div>
              <div className="map-canvas">
                <WorldGlobe
                  points={mapPoints}
                  onHover={setHoverCountry}
                  onSelect={handleMapSelect}
                  selectedCountry={selectedCountry}
                  zoomOut={mapZoomOut}
                />
                <button
                  type="button"
                  className="map-zoom-toggle"
                  onClick={() => setMapZoomOut(v => !v)}
                >
                  {mapZoomOut ? (
                    <>
                      <ZoomIcon className="mi-inline" width={13} height={13} />
                      {t('missionMapZoomRegion')}
                    </>
                  ) : (
                    <>
                      <GlobeIcon className="mi-inline" width={13} height={13} />
                      {t('missionMapZoomWorld')}
                    </>
                  )}
                </button>
              </div>

              {/* 대륙 탭을 지도 카드 안에 붙여 "탭 → 지도 점·명단이 함께 반응"이
                  한 덩어리 인터랙션으로 읽히게 한다 */}
              <div className="region-tabs in-map">
                {REGION_ORDER.map(key => {
                  const meta = regionMeta[key]
                  const count = missionaryByRegion[key].length
                  return (
                    <button
                      key={key}
                      className={`region-tab ${activeRegion === key ? 'active' : ''}`}
                      onClick={() => handleRegionChange(key)}
                      style={{ ['--rc' as string]: meta.color }}
                    >
                      <span>{meta.emoji}</span>
                      <span>{t(REGION_LABEL_KEY[key])}</span>
                      <span className="tab-count">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mission-col-main">
            {/* ===== OVERSEAS LIST ===== */}
            <div className="mission-section-title">
              <span className="line" />
              <span>OVERSEAS MISSION</span>
              <span className="line" />
            </div>

            <div className="region-header" style={{ ['--rc' as string]: activeMeta.color }}>
              <div className="region-eyebrow">{activeMeta.labelEn}</div>
              <div className="region-label">
                {activeRegionLabel} {t('missionRegionArea')}
              </div>
            </div>

            {/* ===== MISSIONARY GROUPS (국가별) ===== */}
            <MissionaryGroups
              missionaries={missionaries}
              color={activeMeta.color}
              key={activeRegion}
              selectedCountry={selectedCountry}
              onCountryClick={handleCountryClick}
              onMemberClick={setSheetTarget}
            />
          </div>
        </div>

        {/* ===== DOMESTIC SECTION ===== */}
        {/* 해외 → 국내 전환점: 따뜻한 색의 구분선으로 공간이 바뀌었음을 명확히 */}
        <div className="mission-section-title domestic">
          <span className="line" />
          <span>DOMESTIC MISSION</span>
          <span className="line" />
        </div>

        <section className="domestic-section">
          <div className="domestic-header">
            <div className="domestic-eyebrow">{t('missionDomesticEyebrow')}</div>
            <span className="domestic-title">{t('missionDomesticTitle')}</span>
          </div>

          <div className="domestic-group">
            <div className="domestic-group-title">{t('missionDomesticChurches')}</div>
            <div className="domestic-chips">
              {domesticChurches.map(name => (
                <div key={name} className="domestic-chip">{name}</div>
              ))}
            </div>
          </div>

          <div className="domestic-group">
            <div className="domestic-group-title">{t('missionDomesticOrgs')}</div>
            <div className="domestic-chips">
              {domesticOrganizations.map(name => (
                <div key={name} className="domestic-chip">{name}</div>
              ))}
            </div>
          </div>
        </section>

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

      {/* ===== MISSIONARY DETAIL SHEET ===== */}
      {sheetTarget && (
        <MissionarySheet
          missionary={sheetTarget}
          color={regionMeta[countryCoordinates[sheetTarget.country]?.region ?? 'asia'].color}
          prayedToday={prayedToday}
          onPray={handlePray}
          onLocate={() => handleSheetLocate(sheetTarget)}
          onClose={() => setSheetTarget(null)}
        />
      )}
    </div>
  )
}


export default Mission
