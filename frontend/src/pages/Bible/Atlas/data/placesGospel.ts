import type { AtlasPlace } from '../atlasTypes'

// 지도여행 장소 — 복음서 (예수님의 길).
//
// 베들레헴·예루살렘·애굽은 구약 여정과 같은 장소를 그대로 쓴다(placesOT.ts).
// 한 장소가 여러 시대에 걸쳐 다시 나오는 것이 이 지도의 핵심이라, 중복해서
// 정의하지 않고 하나의 슬러그를 공유한다.

export const PLACES_GOSPEL: Record<string, AtlasPlace> = {
  nazareth: {
    id: 'nazareth',
    name: '나사렛',
    modern: '이스라엘 나차렛',
    lat: 32.7,
    lng: 35.3,
    blurb:
      '지도에도 잘 나오지 않던 갈릴리의 작은 마을. "나사렛에서 무슨 선한 것이 날 수 있느냐"는 말이 돌 정도였습니다. 예수님은 여기서 삼십 년을 사셨습니다.',
    events: [
      {
        text: '나사렛이란 동네에 가서 사시니',
        ref: { book: 40, chapter: 2, verse: 23, label: '마태복음 2:23' },
      },
      {
        text: '회당에서 이사야를 읽으시고 "이 글이 오늘 너희 귀에 응하였느니라"',
        ref: { book: 42, chapter: 4, verse: 21, label: '누가복음 4:21' },
      },
    ],
    figures: ['예수', '마리아', '요셉'],
  },

  jordan: {
    id: 'jordan',
    name: '요단강',
    qualifier: '베다니',
    modern: '요르단 알마그타스 (요단강 동편)',
    lat: 31.84,
    lng: 35.55,
    blurb: '세례 요한이 사람들에게 세례를 주던 강가. 예수님의 공생애가 여기서 시작됩니다.',
    events: [
      {
        text: '"이는 내 사랑하는 아들이요 내 기뻐하는 자라"',
        ref: { book: 40, chapter: 3, verse: 17, label: '마태복음 3:17' },
      },
    ],
    figures: ['세례 요한'],
  },

  wilderness: {
    id: 'wilderness',
    name: '유대 광야',
    modern: '예루살렘 동쪽, 사해까지 이어지는 황무지',
    lat: 31.68,
    lng: 35.42,
    blurb: '비가 거의 오지 않는 돌투성이 땅. 사십 일 금식과 시험이 이곳에서 있었습니다.',
    events: [
      {
        text: '"사람이 떡으로만 살 것이 아니요 하나님의 입으로부터 나오는 모든 말씀으로 살 것이라"',
        ref: { book: 40, chapter: 4, verse: 4, label: '마태복음 4:4' },
      },
    ],
  },

  cana: {
    id: 'cana',
    name: '가나',
    modern: '이스라엘 카프르 칸나 (전승지)',
    lat: 32.75,
    lng: 35.34,
    blurb: '나사렛에서 걸어서 반나절 거리의 마을. 첫 표적이 성전이 아니라 잔칫집에서 일어납니다.',
    events: [
      {
        text: '물로 포도주를 만드시니 — 그 영광을 나타내시매',
        ref: { book: 43, chapter: 2, verse: 11, label: '요한복음 2:11' },
      },
    ],
  },

  capernaum: {
    id: 'capernaum',
    name: '가버나움',
    modern: '이스라엘 갈릴리 호숫가 크파르 나훔 유적',
    lat: 32.88,
    lng: 35.57,
    blurb:
      '갈릴리 호숫가의 어촌이자 세관이 있던 길목. 예수님이 사역의 본거지로 삼으셔서, 성경은 이곳을 "본 동네"라고 부릅니다.',
    events: [
      {
        text: '나사렛을 떠나 가버나움에 가서 사시니',
        ref: { book: 40, chapter: 4, verse: 13, label: '마태복음 4:13' },
      },
      {
        text: '지붕을 뜯고 중풍병자를 달아 내리다',
        ref: { book: 41, chapter: 2, verse: 4, label: '마가복음 2:4' },
      },
      {
        text: '세관에 앉은 마태를 부르시다',
        ref: { book: 40, chapter: 9, verse: 9, label: '마태복음 9:9' },
      },
    ],
    figures: ['베드로', '마태', '야이로'],
  },

  'caesarea-philippi': {
    id: 'caesarea-philippi',
    name: '가이사랴 빌립보',
    modern: '이스라엘 북부 바니아스 (헤르몬산 기슭)',
    lat: 33.25,
    lng: 35.69,
    blurb:
      '이방 신들의 신전이 늘어서 있던 국경 도시. 하필 그 앞에서 "너희는 나를 누구라 하느냐" 물으십니다.',
    events: [
      {
        text: '"주는 그리스도시요 살아 계신 하나님의 아들이시니이다"',
        ref: { book: 40, chapter: 16, verse: 16, label: '마태복음 16:16' },
      },
    ],
    figures: ['베드로'],
  },

  olivet: {
    id: 'olivet',
    name: '감람산',
    modern: '예루살렘 동쪽 올리브산',
    lat: 31.78,
    lng: 35.26,
    blurb:
      '예루살렘 성전이 마주 보이는 능선. 겟세마네가 그 기슭에 있고, 승천과 "땅 끝까지" 약속이 여기서 있었습니다.',
    events: [
      {
        text: '"예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라"',
        ref: { book: 44, chapter: 1, verse: 8, label: '사도행전 1:8' },
      },
    ],
  },
}
