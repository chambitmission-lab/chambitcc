// 손글씨 필사대회 관리 데스크 규칙 — 실제 화면·작성 창·dev 미리보기가 같이 쓴다
import type { ContestPhase, ContestSummary, ContestWrite } from '../../../types/handwritingContest'

/** 목록 묶음 순서 — 지금 손볼 것(발표 기다림·진행 중)부터 */
export const CONTEST_GROUPS: { phase: ContestPhase; label: string }[] = [
  { phase: 'closed', label: '발표 기다림' },
  { phase: 'open', label: '진행 중' },
  { phase: 'upcoming', label: '시작 전' },
  { phase: 'announced', label: '발표 끝' },
]

export const filterContests = (items: ContestSummary[], q: string) => {
  const s = q.trim().toLowerCase()
  return s ? items.filter((c) => c.title.toLowerCase().includes(s) || (c.description?.toLowerCase().includes(s) ?? false)) : items
}

/** 묶음별로 나눈 뒤 위→아래 보이는 순서 그대로 펼친 목록 (서버 순서 = 진행 중→시작 전→지난 대회, 마감 늦은 것부터를 유지) */
export const groupContests = (items: ContestSummary[]) => {
  const groups = CONTEST_GROUPS.map((g) => ({ ...g, items: items.filter((c) => c.phase === g.phase) })).filter((g) => g.items.length > 0)
  return { groups, order: groups.flatMap((g) => g.items) }
}

/** 서버는 KST 벽시계를 +09:00 으로 내려준다 → 'YYYY-MM-DDTHH:mm' 값 */
export const toLocalInput = (iso: string) => iso.slice(0, 16)

/** 대회 요약 → 저장 본문(PUT 은 전체를 받는다 — 스위치 하나만 바꿀 때도 나머지를 그대로 실어 보낸다) */
export const contestToWrite = (c: ContestSummary, patch: Partial<ContestWrite> = {}): ContestWrite => ({
  title: c.title,
  description: c.description,
  starts_at: toLocalInput(c.starts_at),
  ends_at: toLocalInput(c.ends_at),
  votes_per_user: c.votes_per_user,
  show_ranking: c.show_ranking,
  is_active: c.is_active,
  ...patch,
})

/** 다음 달 1일 0시 ~ 말일 끝(다음다음 달 1일 0시) — 한 달 대회 기본값 */
export const nextMonthDefaults = (): Pick<ContestWrite, 'starts_at' | 'ends_at'> => {
  const now = new Date(Date.now() + 9 * 3_600_000)
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const fmt = (yy: number, mm: number) => {
    const d = new Date(Date.UTC(yy, mm, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01T00:00`
  }
  return { starts_at: fmt(y, m + 1), ends_at: fmt(y, m + 2) }
}
