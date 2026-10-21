// ⌘K 최근 항목 — 팔레트에서 연 것(성구·설교·메뉴)을 이 브라우저에만 기억한다(최대 6개).
// 서버 없이 localStorage. 실패(프라이빗 모드 등)해도 조용히 빈 목록.
import { safeStorage } from '../../utils/safeStorage'

export interface RecentItem {
  id: string
  kind: 'page' | 'ref' | 'verse' | 'sermon'
  label: string
  desc: string
  to: string
  at: number
}

const KEY = 'chambit:cmdk-recent'
const MAX = 6

export const readRecent = (): RecentItem[] => {
  const list = safeStorage.getJson(KEY) as RecentItem[] | undefined
  return Array.isArray(list) ? list.filter((x) => x && x.id && x.to) : []
}

export const pushRecent = (item: Omit<RecentItem, 'at'>) => {
  const next = [{ ...item, at: Date.now() }, ...readRecent().filter((x) => x.id !== item.id)].slice(0, MAX)
  safeStorage.setJson(KEY, next)
}

export const clearRecent = () => {
  safeStorage.remove(KEY)
}
