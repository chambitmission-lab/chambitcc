// 여러 장으로 나누기 — 긴 말씀을 인스타 캐러셀처럼 2~4장에 나눠 담는다.
// 절 정보가 있으면 절 경계에서, 없으면(애송 성구·올해의 말씀) 문장 끝에서 자른다.

import type { PickedVerse } from './recommendedVerses'

export interface CardSlide {
  text: string
  refLabel: string
}

export const MAX_SLIDES = 4

/** 이 말씀을 나눠 볼 만한가 — 짧은 한 절은 한 장이 가장 좋다 */
export const canSplit = (verse: PickedVerse): boolean =>
  (verse.parts?.length ?? 0) >= 2 || verse.text.replace(/\s/g, '').length >= 60

/** 글자 수로 권하는 장 수 — 한 장에 공백 뺀 45자 안팎 */
export const suggestedSlideCount = (verse: PickedVerse): number => {
  const len = verse.text.replace(/\s/g, '').length
  const byLen = Math.ceil(len / 45)
  const max = verse.parts && verse.parts.length >= 2 ? Math.min(MAX_SLIDES, verse.parts.length) : MAX_SLIDES
  return Math.max(2, Math.min(max, byLen))
}

/** 길이를 고르게 — 누적 길이가 k/n 지점을 처음 넘는 곳에서 자른다 */
const groupBalanced = <T>(items: T[], lenOf: (t: T) => number, count: number): T[][] => {
  const total = items.reduce((n, it) => n + lenOf(it), 0)
  const groups: T[][] = []
  let cur: T[] = []
  let acc = 0
  items.forEach((it, i) => {
    cur.push(it)
    acc += lenOf(it)
    const remainingItems = items.length - i - 1
    const remainingGroups = count - groups.length - 1
    const target = (total * (groups.length + 1)) / count
    // 남은 항목으로 남은 장을 채울 수 있어야 자르고, 딱 남은 장 수만큼 남았으면 무조건 자른다
    if (remainingGroups > 0 && remainingItems >= remainingGroups && (acc >= target || remainingItems === remainingGroups)) {
      groups.push(cur)
      cur = []
    }
  })
  if (cur.length) groups.push(cur)
  return groups
}

// 문장이 끝나거나 숨을 고르는 어미 — 여기서 자르면 한 장 한 장이 말이 된다
const BREATH = /(다|라|니|요|라|며|고|서|여|되|나|까|[.,!?;:])$/

/** "시편 121:1-2" → { book: "시편", chapter: 121 } */
const parseRef = (refLabel: string) => {
  const m = refLabel.match(/^(.*\S)\s+(\d+):/)
  return m ? { book: m[1], chapter: Number(m[2]) } : null
}

export const splitIntoSlides = (verse: PickedVerse, count: number): CardSlide[] => {
  if (count <= 1) return [{ text: verse.text, refLabel: verse.refLabel }]

  const ref = parseRef(verse.refLabel)
  // 문구를 다듬었으면 절 본문과 달라져 절 경계를 쓸 수 없다
  const parts = verse.originalText ? undefined : verse.parts
  // 절 경계 — 장마다 그 장에 담긴 절 범위를 출처로 단다 (시 121:1 · 시 121:2)
  if (parts && parts.length >= count && ref) {
    return groupBalanced(parts, (p) => p.text.length, count).map((g) => {
      const a = g[0].verse
      const b = g[g.length - 1].verse
      return {
        text: g.map((p) => p.text.trim()).join(' '),
        refLabel: `${ref.book} ${ref.chapter}:${a === b ? a : `${a}-${b}`}`,
      }
    })
  }

  // 문장 경계 — 숨 고르는 어미에서 끊은 구절을 길이 균형으로 묶는다
  const words = verse.text.replace(/\n+/g, ' ').split(/\s+/).filter(Boolean)
  const phrases: string[] = []
  let cur: string[] = []
  words.forEach((w, i) => {
    cur.push(w)
    if (BREATH.test(w) || i === words.length - 1) {
      phrases.push(cur.join(' '))
      cur = []
    }
  })
  const n = Math.min(count, phrases.length)
  if (n <= 1) return [{ text: verse.text, refLabel: verse.refLabel }]
  return groupBalanced(phrases, (p) => p.length, n).map((g, i, all) => ({
    text: g.join(' '),
    refLabel: `${verse.refLabel} · ${i + 1}/${all.length}`,
  }))
}
