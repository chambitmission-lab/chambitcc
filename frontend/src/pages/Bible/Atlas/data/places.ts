import type { AtlasPlace } from '../atlasTypes'
import { PLACES_OT } from './placesOT'
import { PLACES_GOSPEL } from './placesGospel'
import { PLACES_ACTS } from './placesActs'

// 성경 지도여행 — 장소 사전(합본).
//
// 한 장소는 여러 여정에 걸쳐 재사용된다. 헤브론은 아브라함이 사라를 장사한
// 곳이자 다윗이 처음 왕이 된 곳이고, 예루살렘은 아브라함·다윗·예수·사도행전
// 네 여정에 모두 나온다. 그래서 장소와 여정을 분리했다 — 여정은 이 사전의
// 슬러그만 참조하고, "이 장소가 나오는 다른 여정"도 여기서 역으로 찾는다.
//
// 시대별 파일로 나눈 것은 순전히 파일 크기 때문이다. 슬러그는 전역에서
// 유일해야 하며(방문 도장 저장 키), 겹치면 개발 중에 콘솔로 드러난다.

const SOURCES = [PLACES_OT, PLACES_GOSPEL, PLACES_ACTS]

const merge = (): Record<string, AtlasPlace> => {
  const out: Record<string, AtlasPlace> = {}
  for (const source of SOURCES) {
    for (const [id, place] of Object.entries(source)) {
      if (import.meta.env.DEV && out[id]) {
        // 같은 슬러그를 두 파일에서 정의하면 한쪽이 조용히 덮인다 — 개발 중에 잡는다
        console.warn(`[atlas] 장소 슬러그가 중복됩니다: ${id}`)
      }
      out[id] = place
    }
  }
  return out
}

export const PLACES: Record<string, AtlasPlace> = merge()

/** 슬러그로 장소 찾기 */
export const getPlace = (id: string): AtlasPlace | undefined => PLACES[id]

/** 표시용 이름 — 같은 이름이 여럿인 곳은 괄호로 구분한다 (안디옥(수리아) / 안디옥(비시디아)) */
export const placeLabel = (place: AtlasPlace): string =>
  place.qualifier ? `${place.name}(${place.qualifier})` : place.name
