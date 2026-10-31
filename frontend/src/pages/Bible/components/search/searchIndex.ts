// 검색 탭 통합 결과용 로컬 색인 — 사건(장 개요 단락 제목 + 평행 본문)과 지명(성경 지도 장소).
// 데이터가 전부 프론트 정적 파일이라 서버 요청 없이 타이핑하는 대로 찾는다.
// 이 모듈은 useSearchIndex 가 동적 import 한다 — 장 개요 66권·지도 장소를 검색 탭에서
// 처음 검색어가 생길 때 한 번만 내려받고, 읽기 화면 번들에는 실리지 않는다.

import { loadBookOutline } from '../../data/chapterOutlines'
import parallels from '../../data/crossRefs/parallels'
import { PLACES } from '../../Atlas/data/places'
import { findPlaceByName } from '../../Atlas/placeLookup'
import type { AtlasRef } from '../../Atlas/atlasTypes'

/** 본문 위치 — 같은 장 안의 절 범위 */
export interface EventRef {
  b: number
  c: number
  v: number
  to: number
}

/** 사건 하나 — 같은 제목은 책이 달라도 한 줄로 묶는다(씨 뿌리는 자 비유 = 마·막·눅) */
export interface SearchEvent {
  title: string
  refs: EventRef[]
}

export interface SearchPlace {
  id: string
  name: string
  qualifier?: string
  modern: string
  blurb: string
  /** 이곳에서 일어난 첫 일의 본문 */
  firstRef?: AtlasRef
}

export interface SearchHits<T> {
  items: T[]
  /** 검색어가 제목·이름과 같거나 그것으로 시작하면 true — 절 결과보다 위에 세울지 정하는 기준 */
  strong: boolean
  /** 맨 앞 항목이 검색어와 같은 이름(별칭 포함) — 최상위 결과 카드로 세운다 */
  exact: boolean
}

export interface SearchIndex {
  events: SearchEvent[]
  findEvents: (query: string) => SearchHits<SearchEvent>
  findPlaces: (query: string) => SearchHits<SearchPlace>
}

const norm = (s: string) => s.replace(/\s/g, '').toLowerCase()

/**
 * 통칭 → 단락 제목. 성도들이 부르는 이름과 개요 제목이 다른 사건만 적는다
 * (방주·골리앗·홍해처럼 제목에 이미 들어 있는 말은 포함 일치로 잡힌다).
 */
const EVENT_ALIASES: Record<string, string[]> = {
  탕자: ['잃은 아들 비유'],
  탕자의비유: ['잃은 아들 비유'],
  오병이어: ['오천 명을 먹이심'],
  산상수훈: ['팔복'],
  산상설교: ['팔복'],
  주기도: ['주기도문'],
  사랑장: ['사랑이 없으면', '사랑의 성품', '제일은 사랑'],
  성찬: ['최후의 만찬', '성만찬의 제정과 자기 성찰'],
  성만찬: ['최후의 만찬', '성만찬의 제정과 자기 성찰'],
  성탄: ['임마누엘의 탄생', '예수의 탄생과 목자들'],
  예수탄생: ['임마누엘의 탄생', '예수의 탄생과 목자들'],
  천지창조: ['태초의 창조'],
  창조: ['태초의 창조'],
  성령강림: ['오순절 성령 강림'],
  다윗과골리앗: ['골리앗의 도전'],
}

/** 0 = 같음, 1 = 앞글자, 2 = 낱말 머리, 3 = 포함, -1 = 없음 */
const rankTitle = (title: string, q: string): number => {
  const key = norm(title)
  if (key === q) return 0
  if (key.startsWith(q)) return 1
  if (title.split(/\s+/).some((w) => norm(w).startsWith(q))) return 2
  if (q.length >= 2 && key.includes(q)) return 3
  return -1
}

const parseRef = (s: string): EventRef => {
  const [b, c, vs] = s.split(':')
  const [v, to = v] = vs.split('-')
  return { b: Number(b), c: Number(c), v: Number(v), to: Number(to) }
}

const buildEvents = async (): Promise<SearchEvent[]> => {
  const books = await Promise.all(
    Array.from({ length: 66 }, (_, i) => loadBookOutline(i + 1).catch(() => null))
  )
  const byTitle = new Map<string, SearchEvent>()
  const add = (title: string, ref: EventRef) => {
    const key = norm(title)
    const ev = byTitle.get(key)
    if (!ev) {
      byTitle.set(key, { title, refs: [ref] })
      return
    }
    // 평행 본문이 개요와 같은 자리를 또 가리키면 한 번만
    if (!ev.refs.some((r) => r.b === ref.b && r.c === ref.c && r.v === ref.v)) ev.refs.push(ref)
  }
  books.forEach((outline, i) => {
    if (!outline) return
    for (const [ch, sections] of Object.entries(outline)) {
      for (const s of sections) add(s.title, { b: i + 1, c: Number(ch), v: s.v[0], to: s.v[1] })
    }
  })
  for (const [title, ...refs] of parallels) {
    for (const r of refs) add(title, parseRef(r))
  }
  return [...byTitle.values()]
}

const PLACE_LIST = Object.values(PLACES).map<SearchPlace>((p) => ({
  id: p.id,
  name: p.name,
  qualifier: p.qualifier,
  modern: p.modern,
  blurb: p.blurb,
  firstRef: p.events?.[0]?.ref,
}))

export const buildSearchIndex = async (): Promise<SearchIndex> => {
  const events = await buildEvents()

  const findEvents = (query: string): SearchHits<SearchEvent> => {
    const q = norm(query)
    if (q.length < 2) return { items: [], strong: false, exact: false }
    const aliased = EVENT_ALIASES[q]
    const scored: { ev: SearchEvent; rank: number; order: number }[] = []
    events.forEach((ev, order) => {
      const rank = aliased?.some((t) => norm(t) === norm(ev.title)) ? 0 : rankTitle(ev.title, q)
      if (rank >= 0) scored.push({ ev, rank, order })
    })
    // 같은 순위끼리는 성경 순서(색인을 66권 차례로 쌓았다)
    scored.sort((a, b) => a.rank - b.rank || a.order - b.order)
    return { items: scored.map((s) => s.ev), strong: scored.some((s) => s.rank <= 2), exact: scored[0]?.rank === 0 }
  }

  const findPlaces = (query: string): SearchHits<SearchPlace> => {
    const q = norm(query)
    if (q.length < 2) return { items: [], strong: false, exact: false }
    // 별칭(호렙=시내산, 골고다=예루살렘)은 지도 쪽 대응표를 그대로 쓴다
    const aliased = findPlaceByName(query.trim())
    const scored: { place: SearchPlace; rank: number }[] = []
    for (const place of PLACE_LIST) {
      let rank = rankTitle(place.name, q)
      if (place.qualifier) {
        const r = rankTitle(`${place.name} ${place.qualifier}`, q)
        if (r >= 0 && (rank < 0 || r < rank)) rank = r
      }
      if (aliased?.id === place.id) rank = 0
      if (rank >= 0) scored.push({ place, rank })
    }
    scored.sort((a, b) => a.rank - b.rank || a.place.name.length - b.place.name.length)
    return { items: scored.map((s) => s.place), strong: scored.some((s) => s.rank <= 1), exact: scored[0]?.rank === 0 }
  }

  return { events, findEvents, findPlaces }
}
