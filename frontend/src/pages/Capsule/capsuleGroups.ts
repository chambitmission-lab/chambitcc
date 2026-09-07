// 캡슐함 날짜 그룹 — 편지가 쌓일수록 한 줄씩 흐르는 목록은 읽히지 않는다.
// 도착한 캡슐은 '도착한 달'로, 봉인 중인 캡슐은 '열리는 달'로 묶는다
// (둘 다 open_at 이 기준이라 같은 함수를 쓴다).
import type { CapsuleSummary } from '../../types/timeCapsule'

export interface CapsuleGroup {
  key: string // '2026-09'
  label: string // '2026년 9월'
  hint: string | null // '이번 달' · '지난 달' · '다음 달' — 가까운 달에만 붙는다
  items: CapsuleSummary[]
  unread: number // 아직 열어보지 않고 받은 편지 수 (도착함에서만 의미가 있다)
}

/** 내가 받은 편지 중 아직 열지 않은 것.
    내가 보낸 캡슐의 opened_at은 '상대가 읽었는가'라서 미열람으로 세면 안 된다. */
export const isUnread = (c: CapsuleSummary): boolean => c.role !== 'sender' && !c.opened_at

const monthKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

/** 지금 달로부터 몇 달 전인지 (같은 달 0, 지난달 1) */
const monthsAgo = (d: Date, now: Date): number =>
  (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())

/**
 * open_at 기준 월별 묶음. 입력 순서(도착함=최신순, 봉인함=개봉 임박순)를 그대로 지킨다.
 */
export const groupByMonth = (list: CapsuleSummary[], now = new Date()): CapsuleGroup[] => {
  const groups: CapsuleGroup[] = []
  const index = new Map<string, CapsuleGroup>()

  list.forEach((c) => {
    const date = new Date(c.open_at)
    const valid = !Number.isNaN(date.getTime())
    const key = valid ? monthKey(date) : 'unknown'
    let group = index.get(key)
    if (!group) {
      const ago = valid ? monthsAgo(date, now) : null
      group = {
        key,
        label: valid ? `${date.getFullYear()}년 ${date.getMonth() + 1}월` : '날짜 미상',
        hint:
          ago === 0 ? '이번 달' : ago === 1 ? '지난 달' : ago === -1 ? '다음 달' : null,
        items: [],
        unread: 0,
      }
      index.set(key, group)
      groups.push(group)
    }
    group.items.push(c)
    if (isUnread(c)) group.unread += 1
  })

  return groups
}

/**
 * 처음에 펼쳐 둘 그룹.
 * - 맨 위 그룹은 언제나 (빈 화면처럼 보이면 안 된다)
 * - 안 읽은 편지가 있는 그룹은 접어두면 영영 못 본다
 * - 그 아래로는 다섯 통쯤 보일 때까지만 — 나머지는 헤더만 남기고 접는다
 */
export const defaultOpenKeys = (groups: CapsuleGroup[], visibleTarget = 5): string[] => {
  const open: string[] = []
  let shown = 0
  groups.forEach((g, i) => {
    if (i === 0 || g.unread > 0 || shown < visibleTarget) {
      open.push(g.key)
      shown += g.items.length
    }
  })
  return open
}

export interface HighlightPart {
  text: string
  hit: boolean
}

/** 검색어가 걸린 자리를 표시하기 위한 분할 (대소문자 무시) */
export const splitHighlight = (text: string, keyword: string): HighlightPart[] => {
  const q = keyword.trim()
  if (!q) return [{ text, hit: false }]
  const parts: HighlightPart[] = []
  const haystack = text.toLowerCase()
  const needle = q.toLowerCase()
  let from = 0
  for (;;) {
    const at = haystack.indexOf(needle, from)
    if (at < 0) break
    if (at > from) parts.push({ text: text.slice(from, at), hit: false })
    parts.push({ text: text.slice(at, at + needle.length), hit: true })
    from = at + needle.length
  }
  if (from < text.length) parts.push({ text: text.slice(from), hit: false })
  return parts.length ? parts : [{ text, hit: false }]
}
