import type { BookKeywords } from './types'

// 유다서 — 이 장의 열쇠말
const keywords: BookKeywords = {
  1: [
    {
      word: '경건하지 아니한',
      match: ['경건하지'],
      count: 6,
      meaning: '교회에 몰래 들어온 사람들을 그리는 말이에요.',
      original: { lang: 'gr', script: 'ἀσεβής', sound: '아세베스', gloss: '경건하지 않은, 불경한' },
      why: '15절 한 절에만 네 번 몰려 있어요. "경건하지 않은 자가 경건하지 않게 행한 모든 경건하지 않은 일과". 유다는 은혜를 방탕으로 바꾼 이들(4절)을 이 말로 거듭 짚어요.',
    },
    {
      word: '지키다',
      match: ['지키'],
      count: 3,
      meaning: '하나님이 지키시고, 우리도 자신을 지키는 일이에요.',
      original: { lang: 'gr', script: 'τηρέω', sound: '테레오', gloss: '지키다, 간직하다' },
      why: '성도는 "지키심을 받은 자들"(1절)이고, 천사들은 자기 지위를 "지키지 아니하고"(6절) 떠났어요. 그래서 "하나님의 사랑 안에서 자신을 지키며"(21절). 같은 말이 편지의 처음과 끝을 감싸요.',
    },
  ],
}

export default keywords
