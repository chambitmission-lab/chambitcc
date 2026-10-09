// 상황별 카드 — "누구에게 보내요?" 한 탭에 말씀 · 인사말 · 배경 · 스타일이 함께 채워진다.
// 성도들이 카드를 만드는 순간은 대개 누군가에게 마음을 보낼 때다(생일·병문안·주일 인사).
// 도구를 고르게 하기보다 상황을 고르게 하는 Canva 상황별 템플릿의 문법.
//
// 말씀은 개역개정 하드코딩(recommendedVerses.ts 와 같은 방식) — 상황마다 2~3절을 돌려 쓴다.
// bgId 는 canvas/backgrounds.ts, presetId 는 cardPresets.ts 의 id.

import type { PickedVerse } from './recommendedVerses'

export interface CardOccasion {
  id: string
  icon: string
  nameKo: string
  nameEn: string
  /** 카드 맨 위에 손글씨로 얹는 인사말 — 사용자가 이름을 붙여 고칠 수 있다 */
  greetingKo: string
  greetingEn: string
  bgId: string
  presetId: string
  verses: PickedVerse[]
}

export const OCCASIONS: CardOccasion[] = [
  {
    id: 'sunday',
    icon: 'church',
    nameKo: '주일 인사',
    nameEn: 'Sunday',
    greetingKo: '평안한 주일 보내세요',
    greetingEn: 'Have a blessed Sunday',
    bgId: 'dawn',
    presetId: 'postcard',
    verses: [
      { refLabel: '시편 118:24', text: '이 날은 여호와께서 정하신 것이라 이 날에 우리가 즐거워하고 기뻐하리로다' },
      { refLabel: '시편 122:1', text: '사람이 내게 말하기를 여호와의 집에 올라가자 할 때에 내가 기뻐하였도다' },
    ],
  },
  {
    id: 'morning',
    icon: 'wb_sunny',
    nameKo: '아침 인사',
    nameEn: 'Morning',
    greetingKo: '좋은 아침이에요',
    greetingEn: 'Good morning',
    bgId: 'sea',
    presetId: 'classic',
    verses: [
      {
        refLabel: '예레미야애가 3:22-23',
        text: '여호와의 인자와 긍휼이 무궁하시므로 우리가 진멸되지 아니함이니이다 이것들이 아침마다 새로우니 주의 성실하심이 크시도소이다',
      },
      { refLabel: '시편 5:3', text: '여호와여 아침에 주께서 나의 소리를 들으시리니 아침에 내가 주께 기도하고 바라리이다' },
      { refLabel: '시편 90:14', text: '아침에 주의 인자하심으로 우리를 만족하게 하사 우리를 일생 동안 즐겁고 기쁘게 하소서' },
    ],
  },
  {
    id: 'birthday',
    icon: 'cake',
    nameKo: '생일 축복',
    nameEn: 'Birthday',
    greetingKo: '생일을 축하하고 축복해요',
    greetingEn: 'Happy birthday, be blessed',
    bgId: 'rose',
    presetId: 'postcard',
    verses: [
      {
        refLabel: '민수기 6:24-26',
        text: '여호와는 네게 복을 주시고 너를 지키시기를 원하며 여호와는 그의 얼굴을 네게 비추사 은혜 베푸시기를 원하며 여호와는 그 얼굴을 네게로 향하여 드사 평강 주시기를 원하노라',
      },
      {
        refLabel: '시편 139:14',
        text: '내가 주께 감사하옴은 나를 지으심이 심히 기묘하심이라 주께서 하시는 일이 기이함을 내 영혼이 잘 아나이다',
      },
      {
        refLabel: '예레미야 29:11',
        text: '여호와의 말씀이니라 너희를 향한 나의 생각을 내가 아나니 평안이요 재앙이 아니니라 너희에게 미래와 희망을 주는 것이니라',
      },
    ],
  },
  {
    id: 'comfort',
    icon: 'volunteer_activism',
    nameKo: '위로·병문안',
    nameEn: 'Comfort',
    greetingKo: '당신을 위해 기도하고 있어요',
    greetingEn: "I'm praying for you",
    bgId: 'midnight',
    presetId: 'dawn',
    verses: [
      { refLabel: '마태복음 11:28', text: '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라' },
      { refLabel: '시편 34:18', text: '여호와는 마음이 상한 자를 가까이 하시고 충심으로 통회하는 자를 구원하시는도다' },
      {
        refLabel: '이사야 41:10',
        text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와주리라 참으로 나의 의로운 오른손으로 너를 붙들리라',
      },
    ],
  },
  {
    id: 'celebrate',
    icon: 'celebration',
    nameKo: '축하',
    nameEn: 'Congrats',
    greetingKo: '진심으로 축하해요',
    greetingEn: 'Congratulations',
    bgId: 'bokeh',
    presetId: 'classic',
    verses: [
      { refLabel: '시편 37:5', text: '너의 길을 여호와께 맡기라 그를 의지하면 그가 이루시고' },
      { refLabel: '잠언 16:9', text: '사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라' },
      { refLabel: '빌립보서 4:4', text: '주 안에서 항상 기뻐하라 내가 다시 말하노니 기뻐하라' },
    ],
  },
  {
    id: 'welcome',
    icon: 'waving_hand',
    nameKo: '새가족 환영',
    nameEn: 'Welcome',
    greetingKo: '우리 교회에 오신 것을 환영해요',
    greetingEn: 'Welcome to our church',
    bgId: 'sage',
    presetId: 'classic',
    verses: [
      { refLabel: '시편 133:1', text: '보라 형제가 연합하여 동거함이 어찌 그리 선하고 아름다운고' },
      {
        refLabel: '로마서 15:7',
        text: '그러므로 그리스도께서 우리를 받아 하나님께 영광을 돌리심과 같이 너희도 서로 받으라',
      },
    ],
  },
  {
    id: 'thanks',
    icon: 'favorite',
    nameKo: '감사 인사',
    nameEn: 'Thanks',
    greetingKo: '마음 깊이 감사드려요',
    greetingEn: 'Thank you from my heart',
    bgId: 'cream',
    presetId: 'polaroid',
    verses: [
      { refLabel: '빌립보서 1:3', text: '내가 너희를 생각할 때마다 나의 하나님께 감사하며' },
      {
        refLabel: '데살로니가전서 5:16-18',
        text: '항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라',
      },
    ],
  },
]

/** 인사말 최대 길이 — 카드 맨 위 한 줄에 손글씨로 들어가는 정도 */
export const GREETING_MAX = 24

export const findOccasion = (id: string | null | undefined): CardOccasion | undefined =>
  id ? OCCASIONS.find((o) => o.id === id) : undefined
