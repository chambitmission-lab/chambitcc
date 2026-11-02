import type { BookKeywords } from './types'

// 요한이서 — 이 장의 열쇠말
const keywords: BookKeywords = {
  1: [
    {
      word: '진리',
      match: ['진리'],
      count: 4,
      meaning: '사랑의 바탕이자 교회가 지켜야 할 참된 가르침이에요.',
      original: { lang: 'gr', script: 'ἀλήθεια', sound: '알레테이아', gloss: '진리, 참됨' },
      why: '첫 네 절에 한 번씩 꼬박꼬박 나와요. "진리와 사랑 가운데서"(3절) 둘이 짝지어 다니죠. 요한은 사랑하라고 하면서도(5절), 진리를 버린 미혹하는 자는 집에 들이지 말라고(10절) 해요.',
    },
  ],
}

export default keywords
