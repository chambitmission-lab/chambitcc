// 만나 내리기 화면(MannaPage·한 판·결과 카드·라이브 안내)이 같이 쓰는 라벨·타입
import type { MannaRival, MannaRunResult, MannaSet } from '../../../../api/bibleTyping'
import { parseApiDate } from '../../../../utils/dateUtils'
import { MANNA_MODES, type MannaMode, type MannaResult } from './mannaEngine'

export const modeLabel = (m: MannaMode) => MANNA_MODES.find((x) => x.key === m)?.label ?? ''

export type Rival = NonNullable<MannaRival['rival']>

/** "n분 남음" 같은 남은 시간 — 1분 미만은 초 */
export const leftLabel = (ms: number) => {
  if (ms <= 0) return '곧 마감'
  const m = Math.floor(ms / 60000)
  if (m >= 1) return `${m}분 남음`
  return `${Math.max(1, Math.floor(ms / 1000))}초 남음`
}
export const untilLabel = (ms: number) => {
  const m = Math.ceil(ms / 60000)
  if (m < 60) return `${Math.max(1, m)}분 뒤`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 ${m % 60 ? `${m % 60}분 ` : ''}뒤`
  return `${Math.floor(h / 24)}일 뒤`
}
export const hhmm = (iso: string) => {
  const d = parseApiDate(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export interface Finished {
  set: MannaSet
  mode: MannaMode
  result: MannaResult
  saved: MannaRunResult | null
  saveFailed: boolean
  rival: Rival | null
  liveKey: string | null
}
