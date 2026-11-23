import { useEffect, useSyncExternalStore } from 'react'
import type { Parable } from '../data/parables'
import { PARABLE_CHAPTERS } from '../data/parables/chapters'

// 읽기 화면 비유 카드 — 비유 데이터(34편 풀이)는 비유가 있는 장(PARABLE_CHAPTERS)을 열었을 때만 받는다.
// 장('책:장') → 카드를 끼울 절(핵심 절 quote 의 첫 절) → 그 절의 비유들.
const GOSPELS = new Set([40, 41, 42, 43])

let index: Map<string, Map<number, Parable[]>> | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

const load = () => {
  if (index || loading) return
  loading = import('../data/parables').then(({ PARABLES }) => {
    const next = new Map<string, Map<number, Parable[]>>()
    for (const p of PARABLES) {
      const [b, c, vs] = p.quote.split(':')
      const v = Number(vs.split('-')[0])
      const key = `${b}:${c}`
      const byVerse = next.get(key) ?? new Map<number, Parable[]>()
      byVerse.set(v, [...(byVerse.get(v) ?? []), p])
      next.set(key, byVerse)
    }
    index = next
    listeners.forEach((fn) => fn())
  })
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const getIndex = () => index

/** 이 장에서 비유 카드를 끼울 절 → 비유들. 복음서가 아니거나 꺼져 있으면 null */
export const useChapterParables = (book: number, chapter: number, enabled: boolean): Map<number, Parable[]> | null => {
  const active = enabled && GOSPELS.has(book) && PARABLE_CHAPTERS.has(`${book}:${chapter}`)
  useEffect(() => {
    if (active) load()
  }, [active])
  const idx = useSyncExternalStore(subscribe, getIndex, getIndex)
  return active ? (idx?.get(`${book}:${chapter}`) ?? null) : null
}
