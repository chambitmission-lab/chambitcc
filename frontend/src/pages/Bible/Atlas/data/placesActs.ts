import type { AtlasPlace } from '../atlasTypes'

// 지도여행 장소 — 사도행전 (바울의 1·2·3차 전도여행과 로마로 가는 길).
//
// 예루살렘·가이사랴처럼 구약·복음서와 겹치는 곳은 여기서 다시 정의하지 않고
// placesOT.ts 의 같은 슬러그를 공유한다 (한 장소가 시대를 건너 다시 나오는 것이
// 이 지도의 핵심이라 슬러그는 하나여야 한다).

export const PLACES_ACTS: Record<string, AtlasPlace> = {
  'antioch-syria': {
    id: 'antioch-syria',
    name: '안디옥',
    qualifier: '수리아',
    modern: '지금의 튀르키예 안타키아',
    lat: 36.2,
    lng: 36.16,
    blurb:
      '로마 제국 세 번째 도시. 예루살렘 밖에서 처음으로 이방인 교회가 세워진 곳이고, "그리스도인"이라는 이름이 여기서 처음 생겼습니다.',
    events: [
      {
        text: '제자들이 처음으로 "그리스도인"이라 불리다',
        ref: { book: 44, chapter: 11, verse: 26, label: '사도행전 11:26' },
      },
      {
        text: '교회가 금식하며 바나바와 사울을 파송하다',
        ref: { book: 44, chapter: 13, verse: 3, label: '사도행전 13:3' },
      },
      {
        text: '여행에서 돌아와 "믿음의 문"이 열린 일을 보고하다',
        ref: { book: 44, chapter: 14, verse: 27, label: '사도행전 14:27' },
      },
    ],
    figures: ['바울', '바나바'],
  },

  seleucia: {
    id: 'seleucia',
    name: '실루기아',
    modern: '안디옥의 외항, 지금의 사만다으 부근 유적',
    lat: 36.12,
    lng: 35.93,
    blurb: '안디옥에서 배를 타려면 반드시 거치던 항구. 복음이 처음으로 바다를 건넌 출발점입니다.',
    events: [
      {
        text: '바나바와 사울이 여기서 배를 타고 구브로로 떠나다',
        ref: { book: 44, chapter: 13, verse: 4, label: '사도행전 13:4' },
      },
    ],
  },

  salamis: {
    id: 'salamis',
    name: '살라미',
    modern: '키프로스 동쪽 해안, 지금의 파마구스타 근처 유적',
    lat: 35.18,
    lng: 33.91,
    blurb:
      '구브로(키프로스) 섬의 큰 항구 도시. 바나바의 고향 섬이라, 첫 여행은 아는 땅에서 시작됩니다.',
    events: [
      {
        text: '유대인의 여러 회당에서 하나님의 말씀을 전하다',
        ref: { book: 44, chapter: 13, verse: 5, label: '사도행전 13:5' },
      },
    ],
    figures: ['바나바', '마가'],
  },

  paphos: {
    id: 'paphos',
    name: '바보',
    modern: '키프로스 서쪽 파포스',
    lat: 34.76,
    lng: 32.42,
    blurb: '구브로 섬의 총독이 머물던 도시. 여기서부터 성경은 "사울"을 "바울"로 부르기 시작합니다.',
    events: [
      {
        text: '총독 서기오 바울이 말씀을 듣고자 부르다',
        ref: { book: 44, chapter: 13, verse: 7, label: '사도행전 13:7' },
      },
      {
        text: '마술사 엘루마가 눈이 어두워지고, 총독이 믿다',
        ref: { book: 44, chapter: 13, verse: 12, label: '사도행전 13:12' },
      },
    ],
    figures: ['바울'],
  },

  perga: {
    id: 'perga',
    name: '버가',
    qualifier: '밤빌리아',
    modern: '튀르키예 안탈리아 근교 페르게 유적',
    lat: 36.96,
    lng: 30.85,
    blurb:
      '소아시아 본토에 처음 발을 디딘 항구 도시. 마가라 하는 요한이 여기서 일행을 떠나 예루살렘으로 돌아갔습니다.',
    events: [
      {
        text: '요한은 그들에게서 떠나 예루살렘으로 돌아가다',
        ref: { book: 44, chapter: 13, verse: 13, label: '사도행전 13:13' },
      },
      {
        text: '돌아오는 길에 이곳에서 다시 말씀을 전하다',
        ref: { book: 44, chapter: 14, verse: 25, label: '사도행전 14:25' },
      },
    ],
    figures: ['마가'],
  },

  'antioch-pisidia': {
    id: 'antioch-pisidia',
    name: '안디옥',
    qualifier: '비시디아',
    modern: '튀르키예 얄바치 부근 고원 유적',
    lat: 38.31,
    lng: 31.19,
    blurb:
      '해발 1,100m 고원의 도시. 수리아 안디옥과 이름만 같은 다른 곳입니다. 바울의 설교가 성경에 처음으로 길게 기록된 자리입니다.',
    events: [
      {
        text: '안식일에 회당에서 이스라엘의 역사를 설교하다',
        ref: { book: 44, chapter: 13, verse: 16, label: '사도행전 13:16' },
      },
      {
        text: '"우리가 이방인에게로 향하노라" — 방향이 바뀌다',
        ref: { book: 44, chapter: 13, verse: 46, label: '사도행전 13:46' },
      },
      {
        text: '박해로 쫓겨나면서도 제자들은 기쁨과 성령이 충만하다',
        ref: { book: 44, chapter: 13, verse: 52, label: '사도행전 13:52' },
      },
    ],
    figures: ['바울'],
  },

  iconium: {
    id: 'iconium',
    name: '이고니온',
    modern: '튀르키예 콘야',
    lat: 37.87,
    lng: 32.49,
    blurb: '고원 길목의 큰 도시. 오래 머물며 담대히 말했지만, 결국 성 전체가 둘로 갈라졌습니다.',
    events: [
      {
        text: '오래 있어 주를 힘입어 담대히 말하다',
        ref: { book: 44, chapter: 14, verse: 3, label: '사도행전 14:3' },
      },
      {
        text: '시내의 무리가 나뉘어, 돌로 치려는 계획을 피해 떠나다',
        ref: { book: 44, chapter: 14, verse: 5, label: '사도행전 14:5' },
      },
    ],
  },

  lystra: {
    id: 'lystra',
    name: '루스드라',
    modern: '튀르키예 하튼사라이 부근 언덕 유적',
    lat: 37.58,
    lng: 32.45,
    blurb:
      '작은 시골 마을. 여기서 바울은 신으로 떠받들렸다가 곧 돌에 맞아 죽은 줄로 버려집니다. 훗날의 동역자 디모데의 고향이기도 합니다.',
    events: [
      {
        text: '나면서부터 걷지 못하던 사람이 뛰어 걷다',
        ref: { book: 44, chapter: 14, verse: 10, label: '사도행전 14:10' },
      },
      {
        text: '무리가 바나바를 제우스, 바울을 헤르메스라 부르며 제사하려 하다',
        ref: { book: 44, chapter: 14, verse: 12, label: '사도행전 14:12' },
      },
      {
        text: '바울이 돌에 맞아 성 밖에 끌려 나가다',
        ref: { book: 44, chapter: 14, verse: 19, label: '사도행전 14:19' },
      },
    ],
    figures: ['디모데', '바울'],
  },

  derbe: {
    id: 'derbe',
    name: '더베',
    modern: '튀르키예 케르티회위크 언덕 유적',
    lat: 37.35,
    lng: 33.35,
    blurb: '첫 전도여행이 닿은 가장 먼 지점. 여기서 발길을 돌려, 왔던 길을 그대로 되짚어 갑니다.',
    events: [
      {
        text: '복음을 전하여 많은 사람을 제자로 삼다',
        ref: { book: 44, chapter: 14, verse: 21, label: '사도행전 14:21' },
      },
    ],
  },

  attalia: {
    id: 'attalia',
    name: '앗달리아',
    modern: '튀르키예 안탈리아',
    lat: 36.88,
    lng: 30.7,
    blurb: '밤빌리아의 항구. 여기서 배를 타고 출발지 안디옥으로 돌아갑니다.',
    events: [
      {
        text: '배 타고 안디옥으로 돌아가다',
        ref: { book: 44, chapter: 14, verse: 26, label: '사도행전 14:26' },
      },
    ],
  },

  // ── 2차 전도여행에서 더해지는 곳 ──────────────────────────
  tarsus: {
    id: 'tarsus',
    name: '다소',
    modern: '튀르키예 타르수스',
    lat: 36.92,
    lng: 34.9,
    blurb: '바울의 고향. 철학 학교로 이름난 도시였고, 그는 여기서 나면서부터 로마 시민이었습니다.',
    events: [
      {
        text: '"나는 유대인이라 길리기아 다소에서 났고"',
        ref: { book: 44, chapter: 22, verse: 3, label: '사도행전 22:3' },
      },
    ],
    figures: ['바울'],
  },

  troas: {
    id: 'troas',
    name: '드로아',
    modern: '튀르키예 북서 해안 알렉산드리아 트로아스 유적',
    lat: 39.8,
    lng: 26.16,
    blurb:
      '아시아의 서쪽 끝 항구. 더 갈 데가 없어 멈춘 이곳에서, 바다 건너 유럽으로 부르는 환상을 봅니다.',
    events: [
      {
        text: '"마게도냐로 건너와서 우리를 도우라" — 밤에 본 환상',
        ref: { book: 44, chapter: 16, verse: 9, label: '사도행전 16:9' },
      },
      {
        text: '유두고가 삼층에서 떨어졌다가 살아나다',
        ref: { book: 44, chapter: 20, verse: 9, label: '사도행전 20:9' },
      },
    ],
    figures: ['누가', '유두고'],
  },

  neapolis: {
    id: 'neapolis',
    name: '네압볼리',
    modern: '그리스 카발라',
    lat: 40.94,
    lng: 24.41,
    blurb: '복음이 유럽 땅에 처음 닿은 항구. 지도 위에서 방향이 바뀌는 지점입니다.',
    events: [
      {
        text: '드로아에서 배로 떠나 이튿날 네압볼리로 가고',
        ref: { book: 44, chapter: 16, verse: 11, label: '사도행전 16:11' },
      },
    ],
  },

  philippi: {
    id: 'philippi',
    name: '빌립보',
    modern: '그리스 북부 필리피 유적',
    lat: 41.01,
    lng: 24.29,
    blurb:
      '로마의 퇴역 군인들이 모여 살던 식민 도시. 유럽의 첫 교회가 강가 기도처에서, 자색 옷감 장수 루디아의 집에서 시작됩니다.',
    events: [
      {
        text: '루디아가 말씀을 듣고 마음을 열어 온 집이 세례를 받다',
        ref: { book: 44, chapter: 16, verse: 14, label: '사도행전 16:14' },
      },
      {
        text: '한밤중 감옥에서 기도하고 찬송하매 옥터가 흔들리다',
        ref: { book: 44, chapter: 16, verse: 25, label: '사도행전 16:25' },
      },
    ],
    figures: ['루디아', '실라'],
  },

  thessalonica: {
    id: 'thessalonica',
    name: '데살로니가',
    modern: '그리스 테살로니키',
    lat: 40.64,
    lng: 22.94,
    blurb: '마게도냐의 수도이자 큰 항구. 세 안식일 만에 쫓겨났지만, 그 짧은 사이에 교회가 남습니다.',
    events: [
      {
        text: '세 안식일에 성경을 가지고 강론하다',
        ref: { book: 44, chapter: 17, verse: 2, label: '사도행전 17:2' },
      },
    ],
  },

  berea: {
    id: 'berea',
    name: '베뢰아',
    modern: '그리스 베리아',
    lat: 40.52,
    lng: 22.2,
    blurb: '"더 너그러워서" 칭찬받은 사람들이 살던 도시. 말씀을 받고 날마다 성경을 상고했습니다.',
    events: [
      {
        text: '간절한 마음으로 말씀을 받고 날마다 성경을 상고하므로',
        ref: { book: 44, chapter: 17, verse: 11, label: '사도행전 17:11' },
      },
    ],
  },

  athens: {
    id: 'athens',
    name: '아덴',
    modern: '그리스 아테네',
    lat: 37.98,
    lng: 23.73,
    blurb:
      '철학과 우상이 함께 가득했던 도시. 바울은 여기서 성경이 아니라 그들의 시인을 인용하며 말을 겁니다.',
    events: [
      {
        text: '"알지 못하는 신에게" — 내가 너희에게 알게 하리라',
        ref: { book: 44, chapter: 17, verse: 23, label: '사도행전 17:23' },
      },
    ],
  },

  corinth: {
    id: 'corinth',
    name: '고린도',
    modern: '그리스 코린토스 유적',
    lat: 37.94,
    lng: 22.93,
    blurb:
      '두 바다를 잇는 길목의 무역 도시이자 소문난 향락 도시. 바울은 여기서 천막을 만들며 일 년 육 개월을 머뭅니다.',
    events: [
      {
        text: '아굴라와 브리스길라를 만나 함께 천막을 만들다',
        ref: { book: 44, chapter: 18, verse: 3, label: '사도행전 18:3' },
      },
      {
        text: '"두려워하지 말며 침묵하지 말고 말하라 이 성중에 내 백성이 많음이라"',
        ref: { book: 44, chapter: 18, verse: 10, label: '사도행전 18:10' },
      },
    ],
    figures: ['아굴라', '브리스길라'],
  },

  ephesus: {
    id: 'ephesus',
    name: '에베소',
    modern: '튀르키예 셀추크 에페소스 유적',
    lat: 37.95,
    lng: 27.34,
    blurb:
      '아데미 신전이 있던 아시아의 중심 도시. 바울이 가장 오래(약 3년) 머문 곳이고, 요한계시록 일곱 교회 중 첫 번째 교회가 있던 곳입니다.',
    events: [
      {
        text: '두란노 서원에서 두 해 동안 강론하니 아시아에 사는 자가 다 듣더라',
        ref: { book: 44, chapter: 19, verse: 10, label: '사도행전 19:10' },
      },
      {
        text: '은장색 데메드리오의 소동으로 온 시내가 요란해지다',
        ref: { book: 44, chapter: 19, verse: 29, label: '사도행전 19:29' },
      },
    ],
  },

  // ── 3차 전도여행에서 더해지는 곳 ──────────────────────────
  assos: {
    id: 'assos',
    name: '앗소',
    modern: '튀르키예 베흐람칼레',
    lat: 39.49,
    lng: 26.34,
    blurb: '드로아에서 하룻길. 바울은 배를 먼저 보내고 이 구간만은 혼자 걸어서 갑니다.',
    events: [
      {
        text: '바울이 걸어서 가고자 하여 그렇게 정한 것이라',
        ref: { book: 44, chapter: 20, verse: 13, label: '사도행전 20:13' },
      },
    ],
  },

  mitylene: {
    id: 'mitylene',
    name: '미둘레네',
    modern: '그리스 레스보스섬 미틸리니',
    lat: 39.11,
    lng: 26.55,
    blurb: '레스보스 섬의 항구. 예루살렘으로 내려가는 배가 하루씩 머물던 기항지입니다.',
  },

  miletus: {
    id: 'miletus',
    name: '밀레도',
    modern: '튀르키예 밀레트 유적',
    lat: 37.5,
    lng: 27.28,
    blurb:
      '에베소 남쪽의 항구. 시간이 없어 에베소에 들르지 못하고, 장로들을 이곳까지 불러 마지막 인사를 합니다.',
    events: [
      {
        text: '"다시 내 얼굴을 보지 못하리라" — 다 크게 울며 목을 안고 입을 맞추다',
        ref: { book: 44, chapter: 20, verse: 37, label: '사도행전 20:37' },
      },
    ],
  },

  tyre: {
    id: 'tyre',
    name: '두로',
    modern: '레바논 남부 티레',
    lat: 33.27,
    lng: 35.2,
    blurb:
      '지중해 동안의 오래된 항구 도시. 제자들이 성령의 감동으로 예루살렘에 가지 말라 만류합니다.',
    events: [
      {
        text: '제자들을 찾아 거기서 이레를 머무니라',
        ref: { book: 44, chapter: 21, verse: 4, label: '사도행전 21:4' },
      },
    ],
  },

  caesarea: {
    id: 'caesarea',
    name: '가이사랴',
    modern: '이스라엘 카이사리아 마리티마 유적',
    lat: 32.5,
    lng: 34.89,
    blurb:
      '헤롯이 지은 인공 항구이자 로마 총독이 머물던 행정 도시. 고넬료의 집이 여기 있었고, 바울은 여기서 이 년을 갇혔다가 로마로 떠납니다.',
    events: [
      {
        text: '백부장 고넬료의 집에 성령이 임하다 — 이방인에게 열린 문',
        ref: { book: 44, chapter: 10, verse: 44, label: '사도행전 10:44' },
      },
      {
        text: '아가보가 바울의 띠로 자기 수족을 잡아매며 예언하다',
        ref: { book: 44, chapter: 21, verse: 11, label: '사도행전 21:11' },
      },
    ],
    figures: ['고넬료', '빌립'],
  },

  // ── 로마로 가는 길 ────────────────────────────────────────
  sidon: {
    id: 'sidon',
    name: '시돈',
    modern: '레바논 사이다',
    lat: 33.56,
    lng: 35.37,
    blurb: '가이사랴를 떠난 배가 처음 닿은 항구. 백부장이 죄수 바울에게 뜻밖의 호의를 베풉니다.',
    events: [
      {
        text: '율리오가 바울을 친절히 대하여 친구들에게 가서 대접받기를 허락하다',
        ref: { book: 44, chapter: 27, verse: 3, label: '사도행전 27:3' },
      },
    ],
  },

  myra: {
    id: 'myra',
    name: '무라',
    modern: '튀르키예 데므레',
    lat: 36.25,
    lng: 29.98,
    blurb: '애굽의 곡물선이 로마로 가기 전 들르던 항구. 여기서 배를 갈아탑니다.',
    events: [
      {
        text: '이탈리야로 가려 하는 알렉산드리아 배를 만나 태우다',
        ref: { book: 44, chapter: 27, verse: 6, label: '사도행전 27:6' },
      },
    ],
  },

  'fair-havens': {
    id: 'fair-havens',
    name: '미항',
    modern: '그리스 크레타섬 남안 칼리리메네스',
    lat: 34.93,
    lng: 24.8,
    blurb:
      '이름은 "아름다운 항구"인데 겨울을 나기에는 불편했던 곳. 바울의 만류를 뒤로하고 배는 다시 떠납니다.',
    events: [
      {
        text: '"이번 항해가 하물과 배만 아니라 우리 생명에도 타격과 많은 손해가 있으리라"',
        ref: { book: 44, chapter: 27, verse: 10, label: '사도행전 27:10' },
      },
    ],
  },

  malta: {
    id: 'malta',
    name: '멜리데',
    modern: '몰타섬',
    lat: 35.9,
    lng: 14.51,
    blurb:
      '열나흘을 표류한 끝에 배가 부서진 섬. 276명이 한 사람도 잃지 않고 살아납니다. 원주민들의 특별한 친절이 성경에 기록된 곳입니다.',
    events: [
      {
        text: '다 상륙하여 구조되니라 — 한 사람도 잃지 않다',
        ref: { book: 44, chapter: 27, verse: 44, label: '사도행전 27:44' },
      },
      {
        text: '독사가 손을 물었으나 아무 이상이 없더라',
        ref: { book: 44, chapter: 28, verse: 5, label: '사도행전 28:5' },
      },
    ],
  },

  syracuse: {
    id: 'syracuse',
    name: '수라구사',
    modern: '이탈리아 시칠리아섬 시라쿠사',
    lat: 37.06,
    lng: 15.29,
    blurb: '시칠리아의 오래된 항구 도시. 겨울을 난 뒤 다시 떠난 배가 사흘 머문 곳입니다.',
  },

  rhegium: {
    id: 'rhegium',
    name: '레기온',
    modern: '이탈리아 레조디칼라브리아',
    lat: 38.11,
    lng: 15.65,
    blurb: '이탈리아 반도의 발끝. 남풍이 불어 하루 만에 다음 항구까지 갑니다.',
  },

  puteoli: {
    id: 'puteoli',
    name: '보디올',
    modern: '이탈리아 나폴리 근교 포추올리',
    lat: 40.82,
    lng: 14.12,
    blurb: '로마로 들어가는 관문 항구. 여기서 이미 믿는 형제들을 만나 이레를 함께 지냅니다.',
    events: [
      {
        text: '거기서 형제들을 만나 그들의 청함을 받아 이레를 함께 머무니라',
        ref: { book: 44, chapter: 28, verse: 14, label: '사도행전 28:14' },
      },
    ],
  },

  'appii-forum': {
    id: 'appii-forum',
    name: '압비오 광장',
    modern: '이탈리아 로마 남쪽 아피아 가도변',
    lat: 41.51,
    lng: 12.99,
    blurb:
      '로마에서 60km 떨어진 길가 마을. 소식을 들은 로마의 형제들이 여기까지 마중을 나옵니다. 죄수 신분으로 끌려가던 바울에게 이 장면이 큰 힘이 됩니다.',
    events: [
      {
        text: '바울이 그들을 보고 하나님께 감사하고 담대한 마음을 얻으니라',
        ref: { book: 44, chapter: 28, verse: 15, label: '사도행전 28:15' },
      },
    ],
  },

  rome: {
    id: 'rome',
    name: '로마',
    modern: '이탈리아 로마',
    lat: 41.9,
    lng: 12.5,
    blurb:
      '당시 세계의 중심. 바울은 자유인이 아니라 죄수로 도착했지만, 셋집에서 아무도 막는 사람 없이 복음을 전합니다. 사도행전은 여기서 이야기를 마무리하지 않은 채 멈춥니다.',
    events: [
      {
        text: '담대하게 하나님의 나라를 전파하며 거침없이 가르치더라',
        ref: { book: 44, chapter: 28, verse: 31, label: '사도행전 28:31' },
      },
    ],
    figures: ['바울'],
  },
}
