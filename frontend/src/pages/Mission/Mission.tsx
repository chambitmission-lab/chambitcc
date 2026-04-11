import { useMemo, useRef, useState } from 'react'
import {
  missionaryByRegion,
  regionMeta,
  countryCoordinates,
  domesticChurches,
  domesticOrganizations,
  missionStats,
  type RegionKey,
  type Missionary,
} from './missionData'
import WorldMap from './WorldMap'
import './Mission.css'

const REGION_ORDER: RegionKey[] = ['asia', 'europe', 'africa', 'americas']

const Mission = () => {
  const [activeRegion, setActiveRegion] = useState<RegionKey>('asia')
  const [hoverCountry, setHoverCountry] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null) // "country|name"
  const mapRef = useRef<HTMLDivElement>(null)

  const missionaries = useMemo(
    () => missionaryByRegion[activeRegion],
    [activeRegion]
  )

  const activeMeta = regionMeta[activeRegion]

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
            땅 끝까지
            <br />
            복음의 빛을
          </h1>
          <div className="hero-title-en">WORLDWIDE&nbsp;·&nbsp;MISSION&nbsp;·&nbsp;STATUS</div>

          <div className="hero-verse">
            "오직 성령이 너희에게 임하시면 너희가 권능을 받고
            예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러
            내 증인이 되리라"
            <span className="hero-verse-ref">— 사도행전 1:8</span>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <div className="mission-stats">
          <div className="stat-card">
            <span className="stat-num">{missionStats.total}</span>
            <span className="stat-label">파송 선교사</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{missionStats.countries}</span>
            <span className="stat-label">사역 국가</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{missionStats.regions}</span>
            <span className="stat-label">대륙</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{missionStats.domesticPartners}</span>
            <span className="stat-label">국내 협력</span>
          </div>
        </div>

        {/* ===== WORLD MAP ===== */}
        <div className="mission-map-wrap" ref={mapRef}>
          <div className="map-heading">
            <span className="map-title">🌐 해외 사역 지도</span>
            <span className="map-hint">
              {selectedCountry ?? hoverCountry ?? `${activeMeta.label} 강조`}
            </span>
          </div>
          <WorldMap
            points={mapPoints}
            onHover={setHoverCountry}
            selectedCountry={selectedCountry}
          />
        </div>

        {/* ===== REGION TABS ===== */}
        <div className="mission-section-title">
          <span className="line" />
          <span>OVERSEAS MISSION</span>
          <span className="line" />
        </div>

        <div className="region-tabs">
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
                <span>{meta.label}</span>
                <span className="tab-count">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="region-header">
          <div className="region-eyebrow">{activeMeta.labelEn}</div>
          <div className="region-label" style={{
            backgroundImage: `linear-gradient(135deg, #fff, ${activeMeta.color})`,
          }}>
            {activeMeta.label} 지역
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
        <div className="mission-section-title">
          <span className="line" />
          <span>DOMESTIC MISSION</span>
          <span className="line" />
        </div>

        <section className="domestic-section">
          <div className="domestic-header">
            <div className="domestic-eyebrow">국내 선교 · 함께 세워가는 교회</div>
            <span className="domestic-title">국내선교</span>
          </div>

          <div className="domestic-group">
            <div className="domestic-group-title">미자립 교회 지원</div>
            <div className="domestic-chips">
              {domesticChurches.map(name => (
                <div key={name} className="domestic-chip">{name}</div>
              ))}
            </div>
          </div>

          <div className="domestic-group">
            <div className="domestic-group-title">협력 기관</div>
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
            참빛교회는 세계 곳곳에 복음의 빛을 밝히는
            <br />
            선교사님들을 위해 오늘도 기도합니다.
          </p>
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
