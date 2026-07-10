import { useMemo, useRef, useState } from 'react'
import {
  missionaryByRegion,
  regionMeta,
  countryCoordinates,
  countryFlag,
  domesticChurches,
  domesticOrganizations,
  missionStats,
  type RegionKey,
  type Missionary,
} from './missionData'
import WorldMap from './WorldMap'
import { useLanguage } from '../../contexts/LanguageContext'
import './Mission.css'

const REGION_ORDER: RegionKey[] = ['asia', 'europe', 'africa', 'americas']

const REGION_LABEL_KEY: Record<RegionKey, 'regionAsia' | 'regionEurope' | 'regionAfrica' | 'regionAmericas'> = {
  asia: 'regionAsia',
  europe: 'regionEurope',
  africa: 'regionAfrica',
  americas: 'regionAmericas',
}

const Mission = () => {
  const { t } = useLanguage()
  const [activeRegion, setActiveRegion] = useState<RegionKey>('asia')
  const [hoverCountry, setHoverCountry] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null) // "country|name"
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

  const activeMeta = regionMeta[activeRegion]
  const activeRegionLabel = t(REGION_LABEL_KEY[activeRegion])

  // selectedKey → 국가명 추출
  const selectedCountry = selectedKey ? selectedKey.split('|')[0] : null

  const handleCardClick = (country: string, name: string) => {
    const key = `${country}|${name}`
    if (selectedKey === key) {
      // 같은 카드 재클릭 시 선택 해제
      setSelectedKey(null)
      return
    }
    setSelectedKey(key)
    // 지도를 화면에 부드럽게 가져오기
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // 지역 탭 변경 시 선택 초기화
  const handleRegionChange = (key: RegionKey) => {
    setActiveRegion(key)
    setSelectedKey(null)
  }

  // 지도에 찍을 점: 전체 선교지 (활성 지역 강조)
  const mapPoints = useMemo(() => {
    return Object.entries(countryCoordinates).map(([country, coord]) => ({
      country,
      ...coord,
      active: coord.region === activeRegion,
      color: regionMeta[coord.region].color,
    }))
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
          <div className="hero-title-en">WORLDWIDE&nbsp;·&nbsp;MISSION&nbsp;·&nbsp;STATUS</div>

          <div className="hero-verse">
            {t('missionHeroVerse')}
            <span className="hero-verse-ref">{t('missionHeroVerseRef')}</span>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <div className="mission-stats">
          <div className="stat-card">
            <span className="stat-num">{missionStats.total}</span>
            <span className="stat-label">{t('missionStatDispatched')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{missionStats.countries}</span>
            <span className="stat-label">{t('missionStatCountries')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{missionStats.regions}</span>
            <span className="stat-label">{t('missionStatContinents')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{missionStats.domesticPartners}</span>
            <span className="stat-label">{t('missionStatDomesticPartners')}</span>
          </div>
        </div>

        {/* ===== WORLD MAP ===== */}
        <div className="mission-map-wrap" ref={mapRef}>
          <div className="map-heading">
            <span className="map-title">{t('missionMapTitle')}</span>
            <span className="map-hint">
              {selectedCountry ?? hoverCountry ?? `${activeRegionLabel} ${t('missionRegionEmphasize')}`}
            </span>
          </div>
          <WorldMap
            points={mapPoints}
            onHover={setHoverCountry}
            selectedCountry={selectedCountry}
          />

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
                  style={activeRegion === key ? {
                    borderColor: meta.color,
                    boxShadow: `0 0 20px ${meta.color}55`,
                  } : undefined}
                >
                  <span>{meta.emoji}</span>
                  <span>{t(REGION_LABEL_KEY[key])}</span>
                  <span className="tab-count">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ===== OVERSEAS LIST ===== */}
        <div className="mission-section-title">
          <span className="line" />
          <span>OVERSEAS MISSION</span>
          <span className="line" />
        </div>

        <div className="region-header">
          <div className="region-eyebrow">{activeMeta.labelEn}</div>
          <div className="region-label" style={{
            backgroundImage: `linear-gradient(135deg, #fff, ${activeMeta.color})`,
          }}>
            {activeRegionLabel} {t('missionRegionArea')}
          </div>
        </div>

        {/* ===== MISSIONARY GRID ===== */}
        <MissionaryGrid
          missionaries={missionaries}
          color={activeMeta.color}
          key={activeRegion}
          selectedKey={selectedKey}
          onCardClick={handleCardClick}
        />

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
          <div className="footer-icon">🙏</div>
          <p className="footer-text">
            {t('missionFooterLine1')}
            <br />
            {t('missionFooterLine2')}
          </p>
          {/* 읽고 끝나는 화면이 아니라 마음을 보태는 화면으로 — 하루 한 번 리셋 */}
          <button
            type="button"
            className={`footer-pray-btn ${prayedToday ? 'done' : ''}`}
            onClick={handlePray}
            disabled={prayedToday}
          >
            {prayedToday ? `✓ ${t('missionPrayDone')}` : `🙏 ${t('missionPrayCta')}`}
          </button>
          <span className="footer-sign">FOR HIS GLORY</span>
        </section>
      </div>
    </div>
  )
}

/** 선교사 카드 그리드 — key로 region 바뀌면 re-mount되어 stagger 애니 재실행 */
const MissionaryGrid = ({
  missionaries,
  color,
  selectedKey,
  onCardClick,
}: {
  missionaries: Missionary[]
  color: string
  selectedKey: string | null
  onCardClick: (country: string, name: string) => void
}) => {
  return (
    <div className="missionary-grid">
      {missionaries.map((m, idx) => {
        const key = `${m.country}|${m.name}`
        const isSelected = selectedKey === key
        return (
          <button
            type="button"
            key={`${m.country}-${m.name}-${idx}`}
            className={`missionary-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onCardClick(m.country, m.name)}
            style={{
              ['--card-glow' as string]: `${color}40`,
              ...(isSelected ? {
                borderColor: color,
                boxShadow: `0 0 24px ${color}66, 0 0 8px ${color}33`,
              } : {}),
            }}
          >
            <div className="card-country" style={{ color }}>
              <span className="card-flag">{countryFlag[m.country] ?? '🌐'}</span>
              {m.country}
            </div>
            <div className="card-name">{m.name}</div>
            {m.note && <div className="card-note">{m.note}</div>}
          </button>
        )
      })}
    </div>
  )
}

export default Mission
