import type { BookKeywords } from './types'

// 오바댜 — 이 장의 열쇠말
const keywords: BookKeywords = {
  1: [
    {
      word: '그 날에',
      match: ['날'],
      count: 13,
      meaning: '예루살렘이 무너지던 날, 에돔이 한 일을 하나하나 짚는 말이에요.',
      original: { lang: 'he', script: 'יוֹם', sound: '욤', gloss: '날' },
      why: '"형제의 날 곧 그 재앙의 날에"(12절)부터 ‘~하는 날에 ~할 것이 아니며’가 쉬지 않고 이어져요(11~14절). 형제가 넘어지던 날 구경하고 기뻐한 일을 이렇게 되짚은 뒤 "만국을 벌할 날"(15절)로 넘어갑니다.',
    },
  ],
}

export default keywords
