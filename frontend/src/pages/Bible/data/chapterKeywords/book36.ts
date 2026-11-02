import type { BookKeywords } from './types'

// 스바냐 — 이 장의 열쇠말
const keywords: BookKeywords = {
  1: [
    {
      word: '여호와의 날',
      match: ['날'],
      count: 14,
      meaning: '하나님이 몸소 심판하러 오시는 날이에요.',
      original: { lang: 'he', script: 'יוֹם', sound: '욤', gloss: '날' },
      why: '"여호와의 큰 날이 가깝도다"(14절) 뒤에 "분노의 날이요 환난과 고통의 날이요…"(15절)가 종소리처럼 이어져요. 한 절에 ‘날’이 여섯 번 울립니다. 그만큼 피할 수 없는 날이라는 거예요.',
      alsoIn: [{ ref: '요엘 2:11', note: '여호와의 날이 크고 심히 두렵도다' }],
    },
  ],
  2: [
    {
      word: '남은 자',
      match: ['남은'],
      count: 3,
      meaning: '심판 뒤에도 하나님이 남겨 두시는 백성이에요.',
      original: { lang: 'he', script: 'שְׁאֵרִית', sound: '셰에리트', gloss: '남은 자, 살아남은 무리' },
      why: '주변 나라들이 황폐해지는 이야기 사이로 "유다 족속의 남은 자"(7절), "내 백성의 남은 자들"(9절)이 끼어들어요. 하나님이 그들을 보살피사 사로잡힘을 돌이키시겠다고 합니다.',
    },
  ],
  3: [
    {
      word: '네 가운데',
      match: ['가운데'],
      count: 7,
      meaning: '하나님이 백성 한가운데 계신다는 말이에요.',
      original: { lang: 'he', script: 'קֶרֶב', sound: '케레브', gloss: '속, 한가운데' },
      why: '부패한 성읍 "그 가운데에 계시는 여호와"(5절)가 끝내는 "네 가운데 계시니"(15절), "너의 가운데에 계시니"(17절)로 바뀌어요. 그 하나님이 "너를 잠잠히 사랑하시며… 기뻐하시리라"(17절) 하십니다.',
    },
  ],
}

export default keywords
