import { PLACES } from './data/places'
import { JOURNEYS, journeysAtPlace } from './data/journeys'
import type { AtlasPlace, AtlasJourney } from './atlasTypes'

// 본문에서 만난 지명 → 지도여행의 장소 찾기.
//
// /bible 본문의 성경 사전 칩(bibleGlossary)과 스토리 모드가 이 함수를 통해
// 지도로 건너온다. 사전은 개역개정 표기("우르", "애굽"), 지도는 슬러그를 쓰므로
// 이름으로 이어 주는 자리가 필요하다.
//
// 이 모듈은 basemap.ts(38KB 해안선)를 import 하지 않는다 — 그래야 읽기 화면이
// 지도 데이터를 통째로 안고 다니지 않는다. 실제 지도 그림은 이 모듈을 쓰는
// 컴포넌트(PlaceMiniMap)가 lazy 로 불러온다.

/**
 * 사전 표제어와 지도 장소 이름이 다른 경우의 대응표.
 * 같은 곳을 성경이 여러 이름으로 부르거나(호렙=시내산), 사전이 더 넓은 지역을
 * 가리키는 경우(가나안) 대표 지점으로 잇는다.
 */
const ALIASES: Record<string, string> = {
  호렙: 'sinai',
  시내: 'sinai',
  가데스: 'kadesh-barnea',
  요단: 'jordan',
  시온: 'jerusalem',
  모리아: 'jerusalem',
  가나안: 'shechem',
  갈대아: 'ur',
  구브로: 'salamis',
  마게도냐: 'philippi',
  아가야: 'corinth',
  밤빌리아: 'perga',
  그레데: 'fair-havens',
  아시아: 'ephesus',
  갈릴리: 'capernaum',
  베다니: 'jerusalem',
  겟세마네: 'olivet',
  골고다: 'jerusalem',
  '감람 산': 'olivet',
  감람산: 'olivet',
  실로암: 'jerusalem',
  벳새다: 'capernaum',
  사마리아: 'shechem',
  길갈: 'jericho',
  갈라디아: 'antioch-pisidia',
}

// 지도에 없는 곳은 굳이 가까운 다른 곳으로 잇지 않는다.
// 다메섹(안디옥에서 300km)이나 욥바(가이사랴에서 50km)를 이웃 도시로 대신하면
// 카드가 엉뚱한 자리를 가리키게 된다 — 카드가 안 뜨는 편이 낫다.

/**
 * 이름 → 장소 색인.
 * '안디옥'처럼 같은 이름이 둘인 곳은 더 많은 여정에 나오는 쪽을 대표로 삼는다
 * (수리아 안디옥은 바울의 세 여정 모두의 출발지, 비시디아는 1차에만 나온다).
 */
const buildIndex = (): Map<string, AtlasPlace> => {
  const index = new Map<string, AtlasPlace>()
  const weight = new Map<string, number>()

  for (const place of Object.values(PLACES)) {
    const score = journeysAtPlace(place.id).length
    const prev = index.get(place.name)
    if (!prev || score > (weight.get(place.name) ?? 0)) {
      index.set(place.name, place)
      weight.set(place.name, score)
    }
  }

  // 수식어까지 붙인 이름으로도 찾을 수 있게 ('안디옥(비시디아)')
  for (const place of Object.values(PLACES)) {
    if (place.qualifier) index.set(`${place.name}(${place.qualifier})`, place)
  }

  return index
}

let indexCache: Map<string, AtlasPlace> | null = null

const nameIndex = (): Map<string, AtlasPlace> => {
  if (!indexCache) indexCache = buildIndex()
  return indexCache
}

/** 사전 표제어(또는 지명 문자열)로 지도 장소 찾기 */
export const findPlaceByName = (name: string): AtlasPlace | undefined => {
  const trimmed = name.trim()
  const aliased = ALIASES[trimmed]
  if (aliased) return PLACES[aliased]
  return nameIndex().get(trimmed)
}

/** 이 장소를 보여 주기 가장 좋은 여정 — 성경 순서상 가장 이른 것 */
export const primaryJourneyOf = (placeId: string): AtlasJourney | undefined => {
  const list = journeysAtPlace(placeId)
  if (list.length) return list[0]
  return JOURNEYS[0]
}

/** 지도여행 딥링크 — 해당 여정을 열고 그 장소 카드를 펼친다 */
export const atlasLinkFor = (place: AtlasPlace): string => {
  const journey = primaryJourneyOf(place.id)
  const params = new URLSearchParams()
  if (journey && journey.id !== JOURNEYS[0].id) params.set('j', journey.id)
  params.set('p', place.id)
  return `/bible/atlas?${params.toString()}`
}
