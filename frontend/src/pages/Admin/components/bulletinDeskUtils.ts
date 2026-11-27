// 주보 데스크 헬퍼 — BulletinDesk(화면)와 BulletinManagement(필터)가 함께 쓴다
import type { BulletinAiStatus } from '../../../api/bulletin'

/** 관리자 상세(쪽 목록) 캐시 — 수정·삭제 뒤 BulletinManagement 가 무효화한다 */
export const adminBulletinDetailKey = (id: number) => ['admin', 'bulletin-detail', id] as const

export const bulletinDay = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
/** 다가오는 주일(오늘이 주일이면 오늘) */
export const upcomingSunday = () => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  t.setDate(t.getDate() + ((7 - t.getDay()) % 7))
  return t
}
export const READERS = ['column', 'news', 'digital'] as const
export type ReaderName = (typeof READERS)[number]
export type Overall = 'done' | 'reading' | 'attention' | 'idle'
/** 세 읽기를 한 상태로 — 실패가 하나라도 있으면 '확인 필요'가 이긴다 */
export const overallAi = (s?: BulletinAiStatus): Overall | null => {
  if (!s) return null
  const states = READERS.map((n) => s[n]?.state).filter(Boolean)
  if (states.includes('gave_up')) return 'attention'
  if (states.some((x) => x === 'queued' || x === 'running' || x === 'pending')) return 'reading'
  if (states.includes('idle')) return 'idle'
  return 'done'
}
