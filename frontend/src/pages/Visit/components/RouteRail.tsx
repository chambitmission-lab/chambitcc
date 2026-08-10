import type { ReactNode } from 'react'

interface Stop {
  name: ReactNode
  sub: ReactNode
  /** 도착지 — 굵은 브랜드 원으로 강조 */
  terminal?: boolean
}

interface RouteRailProps {
  stops: Stop[]
}

/**
 * 노선도 스타일 경로 다이어그램.
 *
 * 지도 임베드 대신 쓴다 — 임베드 타일은 다크모드에서 흰 판으로 튀고,
 * 카카오 JS SDK 는 키 발급·도메인 등록이 필요한 반면
 * 사람이 실제로 기억하는 건 "역에서 나와 큰길 따라 골목" 이라는 순서뿐이다.
 * 정확한 지리는 아래 길찾기 버튼(지도 앱)에 위임한다.
 */
const RouteRail = ({ stops }: RouteRailProps) => (
  <ol className="visit-rail">
    {stops.map((stop, i) => (
      <li
        className={`visit-rail-stop${stop.terminal ? ' is-terminal' : ''}`}
        key={i}
      >
        <span className="visit-rail-marker" aria-hidden="true">
          <span className="visit-rail-dot" />
          {i < stops.length - 1 && <span className="visit-rail-line" />}
        </span>
        <span className="visit-rail-text">
          <span className="visit-rail-name">{stop.name}</span>
          <span className="visit-rail-sub">{stop.sub}</span>
        </span>
      </li>
    ))}
  </ol>
)

export default RouteRail
