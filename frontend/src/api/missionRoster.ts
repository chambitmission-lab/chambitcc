import { API_V1 } from '../config/api'
import type { PeopleDirectory } from '../types/people'
import type { Missionary } from '../pages/Mission/missionData'
import { request } from './utils/request'

// /mission 명단 — 섬기는 사람들(church_people)의 선교사. 발자취(api/churchHistory.ts)와 같은 방식:
// 라우트 로더가 명단을 먼저 채우고 화면 청크를 연다. 재방문은 지난번 명단으로 바로 열고
// 새 명단은 백그라운드로 받아 다음 방문에 쓴다.
const STORAGE_KEY = 'chambit:mission-roster:v1'
// 선교 화면의 '주파송' 배지는 이 그룹에서 온다 (scripts/seeds/seed_missionaries_from_mission_page.py)
const MAIN_GROUP = '파송선교사'

const readCache = (): Missionary[] | null => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Missionary[] | null
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

const writeCache = (roster: Missionary[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roster))
  } catch {
    // 저장소가 막혀 있으면 다음 방문도 네트워크로 받으면 된다
  }
}

const fetchRoster = async (): Promise<Missionary[]> => {
  const dir = await request<PeopleDirectory>(`${API_V1}/people`, {
    auth: false,
    errorMessage: '선교사 명단을 불러오지 못했습니다',
  })
  const roster = dir.people
    .filter((p) => p.category === 'missionary' && p.field_ko)
    .map((p) => ({
      country: p.field_ko as string,
      name: p.name_ko,
      ...(p.group_ko === MAIN_GROUP ? { note: '주파송' } : {}),
    }))
  if (roster.length === 0) throw new Error('선교사 명단이 비어 있습니다')
  return roster
}

let ready = false
let inflight: Promise<void> | null = null

/** 선교사 명단을 채운다 — 화면 청크를 열기 전에 끝나야 한다. 실패하면 다음 호출에서 다시 받는다 */
export const loadMissionRoster = (): Promise<void> => {
  if (ready) return Promise.resolve()
  if (inflight) return inflight

  // 지리 표가 큰 모듈이라 첫 로드 번들에 끌어오지 않게 동적으로 연다 (화면 청크와 같은 청크)
  const store = import('../pages/Mission/missionData')
  const cached = readCache()
  const fresh = fetchRoster().then((roster) => {
    writeCache(roster)
    return roster
  })
  const fill = (roster: Missionary[]) =>
    store.then((m) => {
      m.setMissionRoster(roster)
      ready = true
    })

  if (cached) {
    void fresh.catch(() => undefined)
    inflight = fill(cached)
  } else {
    inflight = fresh.then(fill)
  }
  inflight = inflight.finally(() => {
    inflight = null
  })
  return inflight
}

/** 선교 화면 청크 로더를 감싼다 — 명단을 먼저 채우고 청크를 연다 */
export const withMissionRoster =
  <T,>(load: () => Promise<T>) =>
  (): Promise<T> =>
    loadMissionRoster().then(load)
