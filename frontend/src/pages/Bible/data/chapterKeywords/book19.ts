import type { BookKeywords } from './types'
import part1 from './book19a'
import part2 from './book19b'

// 시편 — 이 장의 열쇠말. 150편이라 두 조각(1~75·76~150)으로 나눠 쓰고 여기서 합친다.
const keywords: BookKeywords = { ...part1, ...part2 }

export default keywords
