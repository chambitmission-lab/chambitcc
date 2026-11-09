import { parseRef, type PassageRef } from '../crossRefs'
import type { MessiahPromise, PromiseKind, PromiseTheme } from './types'

export type { MessiahPromise, PromiseKind, PromiseTheme } from './types'

/** 절에 달린 약속 — 이 절이 구약 약속(ot) 쪽인지 신약 성취(nt) 쪽인지 */
export interface MessiahHit {
  promise: MessiahPromise
  side: 'ot' | 'nt'
  /** 이 절이 그 본문 범위의 첫 절인가 — 배지는 첫 절에만, 바탕 표시는 범위 전체에 */
  first: boolean
}

export const KIND_LABEL: Record<PromiseKind, string> = {
  prophecy: '직접 예언',
  reading: '신약의 해석',
  type: '상징과 모형',
}

/** 종류 칩 아래 한 줄 — 초보자가 "왜 이 둘이 이어지는지"의 성격을 먼저 알게 */
export const KIND_HINT: Record<PromiseKind, string> = {
  prophecy: '구약이 앞으로 오실 분을 미리 말하고, 신약이 그 말씀이 이루어졌다고 밝힌 곳이에요.',
  reading: '구약에서는 기도·고백으로 쓰였지만, 신약이 이 말씀을 예수님께 이어 읽은 곳이에요.',
  type: '구약의 인물·사건을 신약이 예수님을 미리 보여 준 그림으로 설명한 곳이에요.',
}

export const THEME_ORDER: readonly PromiseTheme[] = ['promise', 'coming', 'ministry', 'cross', 'risen', 'kingdom']

export const THEME_LABEL: Record<PromiseTheme, string> = {
  promise: '오래전 약속',
  coming: '오실 길',
  ministry: '하신 일',
  cross: '십자가의 길',
  risen: '부활과 승천',
  kingdom: '성령과 다시 오심',
}

export const THEME_HINT: Record<PromiseTheme, string> = {
  promise: '처음 사람 때부터 하나님이 품으신 약속',
  coming: '누구의 자손으로, 어디서, 누가 길을 닦고 오실지',
  ministry: '병을 고치고 기쁜 소식을 전하신 날들',
  cross: '예루살렘 입성부터 십자가까지',
  risen: '무덤을 이기고 하늘에 오르심',
  kingdom: '성령의 오심과 모든 것을 새롭게 하실 날',
}

/**
 * 처음 만나는 성경 특별편 '약속의 실'(Story/data/promise.ts)에서 같은 약속을 이야기로 풀어 둔 화.
 * 시트·지도에서 "이야기로 읽기"로 건너간다. 화 id 는 스토리 진행 저장 키라 바뀌지 않는다.
 */
export const STORY_EPISODE: Readonly<Record<string, string>> = {
  'woman-seed': 'promise-seed',
  'abraham-seed': 'promise-abraham',
  'isaac-offered': 'promise-moriah',
  'judah-scepter': 'promise-judah',
  'passover-lamb': 'promise-passover',
  'no-bone-broken': 'promise-passover',
  'bronze-serpent': 'promise-serpent',
  'prophet-like-moses': 'promise-prophet',
  'david-throne': 'promise-david',
  forsaken: 'promise-psalm22',
  'garments-lots': 'promise-psalm22',
  'sign-of-jonah': 'promise-jonah',
  immanuel: 'promise-immanuel',
  'child-born': 'promise-immanuel',
  bethlehem: 'promise-bethlehem',
  'by-his-wounds': 'promise-servant',
  'donkey-king': 'promise-donkey',
  messenger: 'promise-messenger',
  elijah: 'promise-messenger',
}

// "책:장" → 절 → 약속 목록. 58쌍(15KB 남짓)이라 한 번에 받아 색인한다
let list: readonly MessiahPromise[] | null = null
let index: Map<string, Map<number, MessiahHit[]>> | null = null
let loading: Promise<void> | null = null

const addRange = (r: PassageRef, promise: MessiahPromise, side: MessiahHit['side']) => {
  const key = `${r.b}:${r.c}`
  let chapter = index!.get(key)
  if (!chapter) index!.set(key, (chapter = new Map()))
  for (let v = r.v; v <= r.to; v++) {
    const hits = chapter.get(v) ?? []
    if (!hits.some((h) => h.promise.id === promise.id)) hits.push({ promise, side, first: v === r.v })
    chapter.set(v, hits)
  }
}

const build = (data: readonly MessiahPromise[]) => {
  list = data
  index = new Map()
  for (const p of data) {
    addRange(parseRef(p.ot), p, 'ot')
    for (const n of p.nt) addRange(parseRef(n), p, 'nt')
  }
}

export const isMessiahReady = () => index !== null

export const loadMessiah = (): Promise<void> => {
  if (index) return Promise.resolve()
  if (!loading) loading = import('./promises').then((m) => build(m.default))
  return loading
}

/** 이 절에 달린 약속 (색인 전이면 빈 배열) */
export const getMessiahHits = (bookNumber: number, chapter: number, verse: number): MessiahHit[] =>
  index?.get(`${bookNumber}:${chapter}`)?.get(verse) ?? []

/** 전체 목록 (색인 전이면 빈 배열) — 약속 지도 */
export const getMessiahPromises = (): readonly MessiahPromise[] => list ?? []

/** 연결 구절 칩과 겹치는지 — 같은 짝이면 연결 구절 칩은 숨긴다(약속 배지가 대신한다) */
export const coversPassage = (hits: readonly MessiahHit[], target: PassageRef): boolean =>
  hits.some(({ promise }) =>
    [promise.ot, ...promise.nt].some((s) => {
      const r = parseRef(s)
      return r.b === target.b && r.c === target.c && r.v <= target.to && target.v <= r.to
    }),
  )
