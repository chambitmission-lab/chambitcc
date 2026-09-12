// 국가별 선교사 그룹 리스트 — key로 region 이 바뀌면 re-mount 되어 stagger 애니 재실행.

import { useMemo } from 'react'
import { countryPrayerLine, avatarColor, type Missionary } from '../missionData'
import CountryFlag from '../CountryFlag'
import CountryMiniMap from '../CountryMiniMap'
import { useLanguage } from '../../../contexts/LanguageContext'

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

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { MissionaryGroups }
