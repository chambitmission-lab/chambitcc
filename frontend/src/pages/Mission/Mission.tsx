import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  missionaryByRegion,
  allMissionaries,
  regionMeta,
  countryCoordinates,
  countryDetail,
  domesticChurches,
  domesticOrganizations,
  missionStats,
  SEOUL_GEO,
  countryPrayerLine,
  avatarColor,
  type RegionKey,
  type Missionary,
} from './missionData'
import WorldGlobe from './WorldGlobe'
import CountryFlag from './CountryFlag'
import CountryMiniMap from './CountryMiniMap'
import { useLanguage } from '../../contexts/LanguageContext'
import './Mission.css'
import {
  PinIcon,
  GlobeIcon,
  ZoomIcon,
  ClockIcon,
  HourglassIcon,
  PlaneIcon,
  CheckIcon,
  HandHeartIcon,
  PersonIcon,
  MapIcon,
  HandshakeIcon,
} from './MissionIcons'

const REGION_ORDER: RegionKey[] = ['asia', 'europe', 'africa', 'americas']

const REGION_LABEL_KEY: Record<RegionKey, 'regionAsia' | 'regionEurope' | 'regionAfrica' | 'regionAmericas'> = {
  asia: 'regionAsia',
  europe: 'regionEurope',
  africa: 'regionAfrica',
  americas: 'regionAmericas',
}

/** 해당 타임존의 UTC 오프셋(ms). 지원하지 않는 타임존이면 null */
const tzOffsetMs = (tz: string, at: Date): number | null => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at)
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value)
    const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
    return asUTC - Math.floor(at.getTime() / 1000) * 1000
  } catch {
    return null
  }
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

/** 두 지점 사이 대권 거리(km) */
const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

const Mission = () => {
  const { t, language } = useLanguage()
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
        <section className="mission-hero">
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

/** 국가별 그룹 리스트 — key로 region 바뀌면 re-mount되어 stagger 애니 재실행 */
const MissionaryGroups = ({
  missionaries,
  color,
  selectedCountry,
  onCountryClick,
  onMemberClick,
}: {
  missionaries: Missionary[]
  color: string
  selectedCountry: string | null
  onCountryClick: (country: string) => void
  onMemberClick: (m: Missionary) => void
}) => {
  const { language } = useLanguage()
  // 국가별 묶음 — 파송 인원이 많은 국가부터, 동수면 데이터 순서 유지
  const groups = useMemo(() => {
    const byCountry = new Map<string, Missionary[]>()
    missionaries.forEach(m => {
      const list = byCountry.get(m.country)
      if (list) list.push(m)
      else byCountry.set(m.country, [m])
    })
    return [...byCountry.entries()]
      .map(([country, members]) => ({ country, members }))
      .sort((a, b) => b.members.length - a.members.length)
  }, [missionaries])

  return (
    <div className="country-groups">
      {groups.map((g, idx) => {
        const isSelected = selectedCountry === g.country
        return (
          <div
            key={g.country}
            className={`country-group ${isSelected ? 'selected' : ''}`}
            /* 카드 어디를 눌러도 국가 선택 — 헤더 버튼 클릭도 여기로 버블링된다 */
            onClick={() => onCountryClick(g.country)}
            style={{
              ['--rc' as string]: color,
              animationDelay: `${Math.min(idx * 0.04, 0.4)}s`,
            }}
          >
            {/* 우측 배경의 미니 지역 지도 + 위치 핀 — 선택되면 밝아진다 */}
            <div className="group-map" aria-hidden>
              <CountryMiniMap country={g.country} />
            </div>

            <button type="button" className="group-head">
              <CountryFlag className="group-flag" country={g.country} />
              <span className="group-country">{g.country}</span>
              <span className="group-count">
                {g.members.length}
                {language === 'ko' ? '명' : ''}
              </span>
            </button>

            <p className="group-desc">{countryPrayerLine(g.country, language === 'ko' ? 'ko' : 'en')}</p>

            <div className="group-members">
              {g.members.map((m, i) => {
                const av = avatarColor(m.name)
                return (
                  <button
                    type="button"
                    key={`${m.name}-${i}`}
                    className="member-avatar-item"
                    onClick={e => {
                      e.stopPropagation() // 카드의 국가 선택으로 번지지 않게
                      onMemberClick(m)
                    }}
                  >
                    <span
                      className="member-avatar"
                      style={{
                        background: av,
                        boxShadow: `0 0 0 2px var(--av-gap, #fff), 0 0 0 3.5px ${av}55`,
                      }}
                    >
                      {m.name.charAt(0)}
                    </span>
                    <span className="member-name">
                      {m.name}
                      {m.note && <span className="member-note">{m.note}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** 선교사 상세 바텀시트 — 현지 시간·시차·거리로 "그곳"과의 연결감을 만든다 */
const MissionarySheet = ({
  missionary,
  color,
  prayedToday,
  onPray,
  onLocate,
  onClose,
}: {
  missionary: Missionary
  color: string
  prayedToday: boolean
  onPray: () => void
  onLocate: () => void
  onClose: () => void
}) => {
  const { t, language } = useLanguage()
  const detail = countryDetail[missionary.country]
  const [now, setNow] = useState(() => new Date())

  // 시트가 열려 있는 동안 현지 시간을 30초마다 갱신
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  // 배경 스크롤 잠금 — PC(lg+)에선 .mission-page 가 스스로 스크롤하는 상자라
  // body 만 잠그면 시트 뒤가 그대로 굴러간다. 둘 다 잠근다.
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.mission-page')
    const prev = document.body.style.overflow
    const prevPage = page?.style.overflow
    document.body.style.overflow = 'hidden'
    if (page) page.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      if (page) page.style.overflow = prevPage ?? ''
    }
  }, [])

  const isKo = language === 'ko'
  const city = detail ? (isKo ? detail.city : detail.cityEn) : null

  let localTime: string | null = null
  if (detail) {
    try {
      localTime = new Intl.DateTimeFormat(isKo ? 'ko-KR' : 'en-US', {
        timeZone: detail.tz,
        hour: 'numeric',
        minute: '2-digit',
      }).format(now)
    } catch {
      localTime = null
    }
  }

  let diffText: string | null = null
  if (detail) {
    const there = tzOffsetMs(detail.tz, now)
    const seoul = tzOffsetMs('Asia/Seoul', now)
    if (there !== null && seoul !== null) {
      const diffMin = Math.round((there - seoul) / 60000)
      const h = Math.floor(Math.abs(diffMin) / 60)
      const m = Math.abs(diffMin) % 60
      const span = isKo
        ? `${h ? `${h}시간` : ''}${h && m ? ' ' : ''}${m ? `${m}분` : ''}`
        : `${h ? `${h}h` : ''}${h && m ? ' ' : ''}${m ? `${m}m` : ''}`
      diffText =
        diffMin === 0
          ? isKo ? '서울과 같은 시간이에요' : 'Same time as Seoul'
          : isKo
            ? `서울보다 ${span} ${diffMin < 0 ? '느려요' : '빨라요'}`
            : `${span} ${diffMin < 0 ? 'behind' : 'ahead of'} Seoul`
    }
  }

  const distText = detail
    ? (() => {
        const km = Math.round(haversineKm(SEOUL_GEO, detail) / 10) * 10
        const s = km.toLocaleString()
        return isKo ? `서울에서 약 ${s}km` : `About ${s}km from Seoul`
      })()
    : null

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet-panel"
        onClick={e => e.stopPropagation()}
        style={{
          ['--fc' as string]: color,
        }}
      >
        <div className="sheet-grabber" />
        <div className="sheet-head">
          <CountryFlag className="sheet-flag" country={missionary.country} />
          <div className="sheet-titles">
            <div className="sheet-name">
              {missionary.name}
              {isKo && <span className="sheet-suffix"> 선교사</span>}
            </div>
            <div className="sheet-country">
              {missionary.country}
              {city && city !== missionary.country && ` · ${city}`}
              {missionary.note && <span className="sheet-note">{missionary.note}</span>}
            </div>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>

        {(localTime || diffText || distText) && (
          <div className="sheet-rows">
            {localTime && (
              <div className="sheet-row">
                <span className="sheet-row-label">
                  <ClockIcon className="mi-inline" width={13} height={13} />
                  {t('missionSheetLocalTime')}
                </span>
                <span className="sheet-row-value strong">{localTime}</span>
              </div>
            )}
            {diffText && (
              <div className="sheet-row">
                <span className="sheet-row-label">
                  <HourglassIcon className="mi-inline" width={13} height={13} />
                  {t('missionSheetTimeDiff')}
                </span>
                <span className="sheet-row-value">{diffText}</span>
              </div>
            )}
            {distText && (
              <div className="sheet-row">
                <span className="sheet-row-label">
                  <PlaneIcon className="mi-inline" width={13} height={13} />
                  {t('missionSheetDistance')}
                </span>
                <span className="sheet-row-value">{distText}</span>
              </div>
            )}
          </div>
        )}

        <div className="sheet-actions">
          <button type="button" className="sheet-locate-btn" onClick={onLocate}>
            <PinIcon className="mi-inline" width={14} height={14} />
            {t('missionTodayLocate')}
          </button>
          <button
            type="button"
            className={`mission-pray-btn in-sheet ${prayedToday ? 'done' : ''}`}
            onClick={onPray}
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
        </div>
      </div>
    </div>
  )
}

export default Mission
