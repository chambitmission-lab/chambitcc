import { useNavigate } from 'react-router-dom'
import { PLACES, placeLabel } from '../data/places'
import { atlasLinkFor, findPlaceByName } from '../placeLookup'
import { project } from '../projection'
import { useLandPath } from '../useLandPath'
import '../Atlas.css'

interface AtlasPlaceCardProps {
  /** 사전 표제어나 지명 문자열 — 슬러그를 모를 때 */
  name?: string
  /** 장소 슬러그 — 아는 경우 (스토리 모드 연동) */
  placeId?: string
  /** 시트를 닫고 이동해야 하는 화면에서 넘긴다 */
  onNavigate?: () => void
}

// 미니맵이 담는 범위 (지도 단위). 좁게 자르면 하란처럼 내륙 깊은 곳은
// 사방이 육지라 아무 특징 없는 회색 판이 된다 — 해안선이 한 줄이라도 들어와야
// "여기가 어디쯤인지"가 읽힌다. 대략 550km 폭.
const SPAN = 260
const SPAN_RATIO = 0.3

/**
 * 본문에서 만난 지명을 지도 위 한 조각으로 보여 주는 카드.
 *
 * /bible 본문의 성경 사전 칩과 스토리 모드 에피소드에서 쓴다. 읽는 흐름을
 * 끊지 않는 것이 목적이라 지도는 작게, 문장은 한 줄만 둔다 — "아, 여기구나"
 * 까지가 이 카드의 일이고, 더 궁금해지면 지도여행으로 건너간다.
 *
 * 지도 장소 사전에 없는 지명이면 아무것도 그리지 않는다(null). 그래서 이 카드를
 * 쓰는 쪽은 매칭 여부를 미리 확인할 필요가 없다.
 */
const AtlasPlaceCard = ({ name, placeId, onNavigate }: AtlasPlaceCardProps) => {
  const navigate = useNavigate()
  // 해안선은 따로 받는다 — 읽기 흐름을 끊지 않으려면 카드가 먼저 떠야 한다
  const landPath = useLandPath()

  const place = placeId ? PLACES[placeId] : name ? findPlaceByName(name) : undefined
  if (!place) return null

  const point = project(place.lat, place.lng)
  const height = SPAN * SPAN_RATIO
  const viewBox = `${point.x - SPAN / 2} ${point.y - height / 2} ${SPAN} ${height}`

  const open = () => {
    onNavigate?.()
    navigate(atlasLinkFor(place))
  }

  return (
    <button type="button" className="atl-card" onClick={open}>
      <span className="atl-card__map">
        <svg viewBox={viewBox} className="atl-card__svg" aria-hidden>
          <rect
            x={point.x - SPAN}
            y={point.y - SPAN}
            width={SPAN * 2}
            height={SPAN * 2}
            className="atl-card__sea"
          />
          {landPath && <path d={landPath} className="atl-card__land" fillRule="evenodd" />}
          {/* 핀 — 미니맵은 확대/이동이 없으므로 크기를 고정값으로 둔다 */}
          <g transform={`translate(${point.x} ${point.y})`}>
            <circle r={9} className="atl-card__halo" />
            <circle r={3.4} className="atl-card__dot" />
          </g>
        </svg>
      </span>

      <span className="atl-card__row">
        <span className="atl-card__body">
          <span className="atl-card__eyebrow">지도여행에서 보기</span>
          <span className="atl-card__title">{placeLabel(place)}</span>
          <span className="atl-card__modern">{place.modern}</span>
        </span>
        <span className="material-icons-round atl-card__chevron">chevron_right</span>
      </span>
    </button>
  )
}

export default AtlasPlaceCard
