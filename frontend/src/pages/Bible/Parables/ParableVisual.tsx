import type { Parable } from '../data/parables'
import ParableArt from './ParableArt'
import { parableArtVars } from './parableImages'

/**
 * 비유 그림 자리 — 삽화가 있으면 그림(가운데 기준 cover), 없으면 주제 색 선화.
 * 바깥 상자(크기·모서리·바탕)는 호출부 클래스가 정하고, 그림이 있으면 상자에 has-img 를 붙여 여백·바탕을 걷는다.
 */
const ParableVisual = ({ p, size = 'sm' }: { p: Pick<Parable, 'id' | 'art'>; size?: 'sm' | 'full' }) => {
  const vars = parableArtVars(p.id, size)
  if (vars) return <span className="pv-img" style={vars} aria-hidden />
  return <ParableArt kind={p.art} />
}

export default ParableVisual
