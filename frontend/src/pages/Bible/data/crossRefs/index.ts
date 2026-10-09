import { canonicalBookName } from '../../../Sermon/utils/sermonMeta'
import type { ParallelGroup, QuoteRow } from './types'

export type { ParallelGroup, QuoteRow } from './types'

/** 본문 위치 — 같은 장 안의 절 범위 */
export interface PassageRef {
  b: number
  c: number
  v: number
  to: number
}

/**
 * 절 하나에 달리는 연결.
 *  - quotes: 이 절(신약)이 구약 target 을 인용
 *  - quotedBy: 이 절(구약)을 신약 target 이 인용
 *  - parallel: 같은 이야기를 담은 다른 복음서 본문
 */
export interface CrossLink {
  kind: 'quotes' | 'quotedBy' | 'parallel'
  target: PassageRef
  /** 인용이면 인용 문구, 평행이면 사건 제목 */
  label?: string
}

export const parseRef = (s: string): PassageRef => {
  const [b, c, vs] = s.split(':')
  const [v, to = v] = vs.split('-')
  return { b: Number(b), c: Number(c), v: Number(v), to: Number(to) }
}

/** "이사야 7:14" / "마가복음 4:35-41" */
export const formatRef = (r: PassageRef): string =>
  `${canonicalBookName(r.b)} ${r.c}:${r.v}${r.to > r.v ? `-${r.to}` : ''}`

// "책:장" → 절 → 연결 목록. 인용·평행 데이터는 합쳐 30KB 남짓이라 한 번에 받아 색인한다
// (구약 쪽 역방향 인용 칩도 같은 색인에서 나오므로 책별로 나눌 수 없다).
let index: Map<string, Map<number, CrossLink[]>> | null = null
let loading: Promise<void> | null = null

const add = (anchor: PassageRef, link: CrossLink) => {
  const key = `${anchor.b}:${anchor.c}`
  let chapter = index!.get(key)
  if (!chapter) index!.set(key, (chapter = new Map()))
  const list = chapter.get(anchor.v) ?? []
  // 같은 대상이 겹치면(한 절이 같은 구약을 두 번 인용 등) 하나만
  if (!list.some((l) => l.kind === link.kind && formatRef(l.target) === formatRef(link.target))) list.push(link)
  chapter.set(anchor.v, list)
}

const build = (quotes: readonly QuoteRow[], parallels: readonly ParallelGroup[]) => {
  index = new Map()
  for (const [from, to, note] of quotes) {
    const nt = parseRef(from)
    const ot = parseRef(to)
    add(nt, { kind: 'quotes', target: ot, label: note })
    add(ot, { kind: 'quotedBy', target: nt, label: note })
  }
  for (const [title, ...refs] of parallels) {
    const parsed = refs.map(parseRef)
    for (const anchor of parsed) {
      for (const other of parsed) {
        if (other !== anchor) add(anchor, { kind: 'parallel', target: other, label: title })
      }
    }
  }
}

export const isCrossRefsReady = () => index !== null

export const loadCrossRefs = (): Promise<void> => {
  if (index) return Promise.resolve()
  if (!loading) {
    loading = Promise.all([import('./quotes'), import('./parallels')]).then(([q, p]) => {
      build(q.default, p.default)
    })
  }
  return loading
}

/** 이 절에서 시작하는 연결 (색인 전이면 빈 배열) */
export const getCrossLinks = (bookNumber: number, chapter: number, verse: number): CrossLink[] =>
  index?.get(`${bookNumber}:${chapter}`)?.get(verse) ?? []
