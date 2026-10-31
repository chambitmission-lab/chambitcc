// 책 이름 입력 보정 — 초성("ㄱㄹㄷㅈㅅ" → 고린도전서)과 한 글자 오타("요한복은" → 요한복음).
// 대상이 66권 이름뿐이라 서버 없이 로컬에서 바로 계산한다.

import type { BibleBook } from '../../../../types/bible'

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'

/** 한글 음절을 초성으로 — 음절이 아닌 글자는 그대로 둔다 */
export const toChoseong = (s: string): string =>
  [...s]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00
      return code >= 0 && code < 11172 ? CHO[Math.floor(code / 588)] : ch
    })
    .join('')

/** 초성만 두 글자 이상 — "ㅊㅅㄱ" */
export const isChoseongQuery = (s: string): boolean => /^[ㄱ-ㅎ]{2,}$/.test(s.replace(/\s/g, ''))

/** 초성 앞글자 일치하는 책들 — 성경 순서 그대로 */
export const matchBooksByChoseong = (books: BibleBook[], query: string): BibleBook[] => {
  const q = query.replace(/\s/g, '')
  return books.filter((b) => toChoseong(b.book_name_ko.replace(/\s/g, '')).startsWith(q))
}

const editDistance = (a: string, b: string): number => {
  const A = [...a]
  const B = [...b]
  let prev = Array.from({ length: B.length + 1 }, (_, j) => j)
  for (let i = 1; i <= A.length; i++) {
    const cur = [i]
    for (let j = 1; j <= B.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[B.length]
}

/**
 * 오타로 보이는 책 이름 — 세 글자 이상에서 한 글자(다섯 글자 이상은 두 글자)까지만 고친다.
 * 더 너그러우면 본문 낱말("사무엘"이 아닌 "사무")까지 책으로 끌려가 오탐이 난다.
 * 가장 가까운 책이 둘 이상이면 고르지 않는다.
 */
export const findFuzzyBook = (books: BibleBook[], query: string): BibleBook | null => {
  const q = query.replace(/\s/g, '')
  const len = [...q].length
  if (len < 3 || !/^[가-힣]+$/.test(q)) return null
  const limit = len >= 5 ? 2 : 1
  let best: BibleBook | null = null
  let bestDist = Infinity
  let tie = false
  for (const b of books) {
    const d = editDistance(q, b.book_name_ko.replace(/\s/g, ''))
    if (d < bestDist) {
      best = b
      bestDist = d
      tie = false
    } else if (d === bestDist) {
      tie = true
    }
  }
  return best && bestDist > 0 && bestDist <= limit && !tie ? best : null
}
