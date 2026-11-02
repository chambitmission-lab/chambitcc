import type { BookKeywords } from './types'

// 요한삼서 — 이 장의 열쇠말
const keywords: BookKeywords = {
  1: [
    {
      word: '진리',
      match: ['진리'],
      count: 5,
      meaning: '가이오의 삶을 칭찬하는 기준이에요.',
      original: { lang: 'gr', script: 'ἀλήθεια', sound: '알레테이아', gloss: '진리, 참됨' },
      why: '"네가 진리 안에서 행한다"(3절), "내 자녀들이 진리 안에서 행한다 함을 듣는 것보다 더 기쁜 일이 없도다"(4절). 요한은 나그네를 대접하는 일도 "진리를 위하여 함께 일하는" 것이라 말해요(8절).',
    },
  ],
}

export default keywords
