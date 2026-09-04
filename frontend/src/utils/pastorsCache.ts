// /greeting 담임목사 응답 localStorage 캐시
//
// React Query persist 는 빌드 버전(buster)이 바뀔 때마다 통째로 비워지므로 배포 직후
// 첫 진입은 늘 "히어로 → 스켈레톤 → (API 왕복) → 편지" 순서로 한 박자 늦게 그려졌다.
// 지난 방문 응답을 버전과 무관하게 남겨 두면 진입 즉시 편지·사진을 히어로와 같은
// 프레임에 그리고, 서버 응답은 뒤에서 조용히 갈아끼운다(placeholderData).
import type { PastorListResponse } from '../types/pastor'

const STORAGE_KEY = 'pastors_cache'

export const readPastorsCache = (): PastorListResponse | undefined => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as PastorListResponse
    // 형태가 깨진 값이 placeholder 로 들어가면 렌더가 터진다
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.past)) return undefined
    // 현직이 없던 응답은 placeholder 로 쓰지 않는다 — 그 사이 등록됐다면 스켈레톤이
    // 아니라 "준비 중" 안내가 먼저 번쩍이게 된다
    if (!parsed.current || typeof parsed.current !== 'object') return undefined
    return parsed
  } catch {
    return undefined
  }
}

export const writePastorsCache = (data: PastorListResponse): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // 용량 초과·프라이빗 모드 — 캐시는 부가 기능이므로 조용히 넘어간다
  }
}
