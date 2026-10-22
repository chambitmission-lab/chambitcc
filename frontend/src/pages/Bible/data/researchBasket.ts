// 연구 모드(목회자) "말씀 바구니" — 설교 준비용으로 고른 절 목록.
// 기기(localStorage)에만 둔다. 서버로 가는 건 [설교 메모로 저장]을 눌렀을 때뿐이며,
// 그때는 기존 설교 메모장 API(createNote)를 그대로 쓴다.
import { safeStorage } from '../../../utils/safeStorage'

export interface BasketVerse {
  /** `${book}:${chapter}:${verse}` — 같은 절을 두 번 담지 않는 열쇠 */
  key: string
  bookNumber: number
  chapter: number
  verse: number
  /** 화면에 찍는 절 번호 — 병합 절이면 '18-19' */
  label: string
  /** '롬 11:4' 처럼 바로 읽히는 출처 */
  ref: string
  text: string
}

const KEY = 'bible-research-basket'
/** 바구니가 끝없이 불어나지 않게 — 설교 한 편 분량이면 충분하다 */
const MAX_ITEMS = 60

const isBasketVerse = (v: unknown): v is BasketVerse => {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.key === 'string' &&
    typeof o.bookNumber === 'number' &&
    typeof o.chapter === 'number' &&
    typeof o.verse === 'number' &&
    typeof o.label === 'string' &&
    typeof o.ref === 'string' &&
    typeof o.text === 'string'
  )
}

const read = (): BasketVerse[] => {
  const raw = safeStorage.getJson(KEY)
  return Array.isArray(raw) ? raw.filter(isBasketVerse) : []
}

let items: BasketVerse[] = read()
const listeners = new Set<() => void>()

const commit = (next: BasketVerse[]) => {
  items = next.slice(0, MAX_ITEMS)
  safeStorage.setJson(KEY, items)
  listeners.forEach((l) => l())
}

export const getBasket = (): BasketVerse[] => items

export const subscribeBasket = (onChange: () => void) => {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

export const basketKey = (bookNumber: number, chapter: number, verse: number) =>
  `${bookNumber}:${chapter}:${verse}`

/** 담겨 있으면 빼고, 없으면 맨 뒤에 담는다 */
export const toggleBasket = (v: BasketVerse) => {
  commit(items.some((i) => i.key === v.key) ? items.filter((i) => i.key !== v.key) : [...items, v])
}

export const removeFromBasket = (key: string) => {
  commit(items.filter((i) => i.key !== key))
}

/** 한 칸 위(-1)·아래(+1)로 옮긴다 */
export const moveInBasket = (key: string, dir: -1 | 1) => {
  const from = items.findIndex((i) => i.key === key)
  const to = from + dir
  if (from < 0 || to < 0 || to >= items.length) return
  const next = [...items]
  ;[next[from], next[to]] = [next[to], next[from]]
  commit(next)
}

export const clearBasket = () => commit([])

/** 메모·복사용 본문 — 한 줄에 한 절, '롬 11:4 본문' */
export const basketToText = (list: BasketVerse[]) => list.map((v) => `${v.ref} ${v.text}`).join('\n')

/**
 * 메모의 '본문' 칸 — 같은 장의 이어진 절이면 '롬 11:4-6', 아니면 앞 세 개를 쉼표로 잇고 '외 N'.
 * 메모장은 이 값으로 같은 본문 메모를 묶어 보여 준다.
 */
export const basketPassage = (list: BasketVerse[]): string | null => {
  if (list.length === 0) return null
  const first = list[0]
  const sameChapter = list.every((v) => v.bookNumber === first.bookNumber && v.chapter === first.chapter)
  if (sameChapter) {
    const nums = list.map((v) => v.verse).sort((a, b) => a - b)
    const contiguous = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1)
    if (contiguous) {
      const head = first.ref.slice(0, first.ref.lastIndexOf(':') + 1)
      return nums.length === 1 ? `${head}${nums[0]}` : `${head}${nums[0]}-${nums[nums.length - 1]}`
    }
  }
  const shown = list.slice(0, 3).map((v) => v.ref).join(', ')
  return list.length > 3 ? `${shown} 외 ${list.length - 3}` : shown
}
