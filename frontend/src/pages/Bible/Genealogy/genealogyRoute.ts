import type { BibleFigureSummary, GenealogyLink } from '../../../types/bibleFigure'
import { SKY_ERA_START, SKY_GAP_AFTER, type GenGap, type SkyEra } from './genealogyStory'

/**
 * 메시아 직계 노선 계산 — 가계도 본문(GenealogyTree)과 상단 노선 카드(GenealogyHeader)가 같이 쓴다.
 * 데이터는 가지 없는 한 줄기라 아담에서 예수까지 slot 배열 하나로 편다.
 */

export const DONE = 0.999

/** 계보 한 칸 — 인물이거나, 성경이 건너뛴 세대 묶음 */
export type Slot =
  | {
      kind: 'fig'
      id: string
      figure: BibleFigureSummary
      spouses: BibleFigureSummary[]
      /** 계보에서 갈라진 자녀(현재 데이터엔 없음 — 생기면 이름 칩으로만) */
      branches: BibleFigureSummary[]
      gen: number
      viaMother: boolean
      era: number
    }
  | { kind: 'gap'; id: string; gap: GenGap; gen: number; era: number }

export interface Route {
  slots: Slot[]
  eras: SkyEra[]
}

export interface Train {
  /** 아담역부터 끊기지 않고 다 읽은 마지막 slot (-1 = 출발 전) */
  at: number
  /** 다음에 읽을 역 slot (-1 = 종착) */
  next: number
  doneCount: number
  figCount: number
}

export const buildRoute = (nodes: BibleFigureSummary[], links: GenealogyLink[]): Route => {
  const bySlug = new Map<string, BibleFigureSummary>(nodes.map((n) => [n.slug, n]))
  const parentOf = new Map<string, string>()
  const viaMother = new Set<string>()
  for (const link of links) {
    if (link.type === 'father') parentOf.set(link.target, link.source)
  }
  for (const link of links) {
    if (link.type === 'mother' && !parentOf.has(link.target)) {
      parentOf.set(link.target, link.source)
      viaMother.add(link.target)
    }
  }

  const spousesOf = new Map<string, BibleFigureSummary[]>()
  const addSpouse = (a: string, b: string) => {
    const bFig = bySlug.get(b)
    if (!bySlug.has(a) || !bFig) return
    const list = spousesOf.get(a) || []
    if (!list.find((f) => f.slug === b)) list.push(bFig)
    spousesOf.set(a, list)
  }
  for (const link of links) {
    if (link.type === 'spouse') {
      addSpouse(link.source, link.target)
      addSpouse(link.target, link.source)
    }
  }

  const childrenOf = new Map<string, BibleFigureSummary[]>()
  for (const [child, parent] of parentOf) {
    const fig = bySlug.get(child)
    if (!fig) continue
    childrenOf.set(parent, [...(childrenOf.get(parent) || []), fig])
  }

  const rootSlug =
    nodes.find((n) => !parentOf.has(n.slug) && n.is_messianic_line)?.slug ||
    nodes.find((n) => !parentOf.has(n.slug))?.slug ||
    nodes[0]?.slug

  const out: Slot[] = []
  const eraList: SkyEra[] = []
  const startEra = (id: string) => {
    const e = SKY_ERA_START[id]
    if (e) eraList.push(e)
  }
  const seen = new Set<string>()
  let gen = 1
  let cur = rootSlug
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    const figure = bySlug.get(cur)
    if (!figure) break
    startEra(cur)
    if (eraList.length === 0) eraList.push({ label: '계보의 시작', short: '시작', meta: '', color: '#12b886' })
    const kids = (childrenOf.get(cur) || []).slice().sort((a, b) => a.sort_order - b.sort_order)
    const next = kids.find((k) => k.is_messianic_line) ?? kids[0]
    out.push({
      kind: 'fig',
      id: cur,
      figure,
      spouses: (spousesOf.get(cur) || []).filter((s) => !parentOf.has(s.slug)),
      branches: kids.filter((k) => k !== next),
      gen,
      viaMother: viaMother.has(cur),
      era: eraList.length - 1,
    })
    gen += 1
    const gap = SKY_GAP_AFTER[cur]
    if (gap && next?.slug === gap.until) {
      const id = `gap:${cur}`
      startEra(id)
      out.push({ kind: 'gap', id, gap, gen, era: eraList.length - 1 })
      gen += gap.count
    }
    cur = next?.slug
  }
  return { slots: out, eras: eraList }
}

/** 열차 위치 — 아담역부터 끊기지 않고 다 읽은 마지막 역 (건너뛴 세대 구간은 통과). 비로그인은 null */
export const computeTrain = (
  slots: Slot[],
  readingProgress: Record<string, number>,
  isLoggedIn: boolean,
): Train | null => {
  if (!isLoggedIn) return null
  let at = -1
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    if (s.kind === 'gap') continue
    if ((readingProgress[s.id] ?? 0) >= DONE) at = i
    else break
  }
  const next = slots.findIndex((s, i) => i > at && s.kind === 'fig' && (readingProgress[s.id] ?? 0) < DONE)
  const doneCount = slots.filter((s) => s.kind === 'fig' && (readingProgress[s.id] ?? 0) >= DONE).length
  const figCount = slots.filter((s) => s.kind === 'fig').length
  return { at, next, doneCount, figCount }
}

/** 노선의 마지막 세대 번호(건너뛴 세대 포함) */
export const totalGenOf = (slots: Slot[]) => {
  const last = slots[slots.length - 1]
  if (!last) return 0
  return last.kind === 'gap' ? last.gen + last.gap.count - 1 : last.gen
}
