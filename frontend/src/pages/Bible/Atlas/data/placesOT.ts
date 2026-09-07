import type { AtlasPlace } from '../atlasTypes'

// 지도여행 장소 — 구약 (아브라함의 길 · 출애굽의 길 · 다윗의 도피로).
//
// 좌표는 통용되는 비정 위치(현대 유적지)를 쓴다. 위치가 확정되지 않은 곳
// (시내산·홍해 도하 지점·시글락 등)은 가장 널리 받아들여지는 전승지를 쓰고
// blurb 에 "전승지/위치 미상"임을 밝힌다 — 지도가 확정되지 않은 것을
// 확정된 것처럼 보이게 만들면 안 된다.

export const PLACES_OT: Record<string, AtlasPlace> = {
  // ── 아브라함의 길 ─────────────────────────────────────────
  ur: {
    id: 'ur',
    name: '우르',
    qualifier: '갈대아',
    modern: '이라크 남부 텔 엘무카야르 유적',
    lat: 30.96,
    lng: 46.1,
    blurb:
      '당시 세계에서 가장 앞선 도시 중 하나. 수로와 신전과 학교가 있던 곳입니다. 아브라함은 이 문명을 등지고 길을 떠납니다.',
    events: [
      {
        text: '데라가 아들 아브람과 손자 롯을 데리고 우르를 떠나다',
        ref: { book: 1, chapter: 11, verse: 31, label: '창세기 11:31' },
      },
    ],
    figures: ['아브라함', '롯'],
  },

  haran: {
    id: 'haran',
    name: '하란',
    modern: '튀르키예 남동부 하란',
    lat: 36.86,
    lng: 39.03,
    blurb:
      '우르에서 북서쪽으로 한참 올라간 교역 도시. 아버지가 이곳에서 죽은 뒤, 일흔다섯의 아브라함에게 부르심이 임합니다.',
    events: [
      {
        text: '"너는 너의 고향과 친척과 아버지의 집을 떠나 내가 네게 보여 줄 땅으로 가라"',
        ref: { book: 1, chapter: 12, verse: 1, label: '창세기 12:1' },
      },
    ],
    figures: ['아브라함'],
  },

  shechem: {
    id: 'shechem',
    name: '세겜',
    modern: '팔레스타인 나블루스',
    lat: 32.21,
    lng: 35.28,
    blurb: '가나안 땅에서 처음 발을 멈춘 곳. 남의 땅 한가운데서 처음으로 제단을 쌓습니다.',
    events: [
      {
        text: '"내가 이 땅을 네 자손에게 주리라" — 첫 약속과 첫 제단',
        ref: { book: 1, chapter: 12, verse: 7, label: '창세기 12:7' },
      },
    ],
    figures: ['아브라함', '야곱'],
  },

  bethel: {
    id: 'bethel',
    name: '벧엘',
    modern: '팔레스타인 베이틴 마을',
    lat: 31.93,
    lng: 35.22,
    blurb:
      '"하나님의 집"이라는 뜻. 아브라함이 장막을 치고 여호와의 이름을 부른 곳이고, 훗날 야곱이 사닥다리 꿈을 꾼 곳입니다.',
    events: [
      {
        text: '장막을 치고 여호와의 이름을 부르다',
        ref: { book: 1, chapter: 12, verse: 8, label: '창세기 12:8' },
      },
      {
        text: '애굽에서 돌아와 처음 쌓았던 그 제단으로 돌아오다',
        ref: { book: 1, chapter: 13, verse: 4, label: '창세기 13:4' },
      },
    ],
    figures: ['아브라함', '야곱'],
  },

  egypt: {
    id: 'egypt',
    name: '애굽',
    modern: '이집트 나일 삼각주 일대',
    lat: 30.8,
    lng: 31.9,
    blurb:
      '나일강이 해마다 땅을 적셔 주는 곡창 지대. 가나안에 기근이 들 때마다 사람들이 내려가던 곳이고, 훗날 이스라엘이 사백 년을 종으로 산 곳입니다.',
    events: [
      {
        text: '기근을 피해 아브라함이 내려가다',
        ref: { book: 1, chapter: 12, verse: 10, label: '창세기 12:10' },
      },
      {
        text: '요셉이 총리가 되어 야곱의 온 가족을 맞이하다',
        ref: { book: 1, chapter: 47, verse: 11, label: '창세기 47:11' },
      },
      {
        text: '헤롯을 피해 아기 예수의 가족이 피난하다',
        ref: { book: 40, chapter: 2, verse: 14, label: '마태복음 2:14' },
      },
    ],
    figures: ['요셉', '모세'],
  },

  hebron: {
    id: 'hebron',
    name: '헤브론',
    modern: '팔레스타인 헤브론 (알칼릴)',
    lat: 31.53,
    lng: 35.1,
    blurb:
      '마므레의 상수리 수풀이 있던 고지대 도시. 아브라함이 가장 오래 머문 곳이자, 그가 가나안에서 유일하게 값을 치르고 산 땅(막벨라 굴)이 있는 곳입니다.',
    events: [
      {
        text: '마므레 상수리 수풀에 거주하며 제단을 쌓다',
        ref: { book: 1, chapter: 13, verse: 18, label: '창세기 13:18' },
      },
      {
        text: '사라를 막벨라 굴에 장사하다 — 약속의 땅에서 손에 쥔 첫 한 조각',
        ref: { book: 1, chapter: 23, verse: 19, label: '창세기 23:19' },
      },
      {
        text: '다윗이 유다의 왕으로 기름 부음을 받다',
        ref: { book: 10, chapter: 2, verse: 4, label: '사무엘하 2:4' },
      },
    ],
    figures: ['아브라함', '사라', '다윗'],
  },

  beersheba: {
    id: 'beersheba',
    name: '브엘세바',
    modern: '이스라엘 남부 브엘셰바',
    lat: 31.25,
    lng: 34.79,
    blurb:
      '"맹세의 우물"이라는 뜻. 광야가 시작되는 남쪽 끝 마을로, 훗날 이스라엘 땅의 남쪽 경계를 가리키는 이름이 됩니다.',
    events: [
      {
        text: '우물을 두고 언약을 맺고, 에셀 나무를 심고 여호와의 이름을 부르다',
        ref: { book: 1, chapter: 21, verse: 33, label: '창세기 21:33' },
      },
    ],
    figures: ['아브라함', '이삭', '하갈'],
  },

  jerusalem: {
    id: 'jerusalem',
    name: '예루살렘',
    modern: '이스라엘 예루살렘 구시가',
    lat: 31.78,
    lng: 35.22,
    blurb:
      '성경 전체가 향하는 도시. 아브라함이 이삭을 드리려 한 모리아 산이 여기이고, 훗날 성전이 서고, 십자가가 서고, 교회가 시작된 곳입니다.',
    events: [
      {
        text: '아브라함이 모리아 산에서 이삭을 드리려 하다',
        ref: { book: 1, chapter: 22, verse: 2, label: '창세기 22:2' },
      },
      {
        text: '예수님이 십자가에 못 박히시고 사흘 만에 살아나시다',
        ref: { book: 42, chapter: 24, verse: 6, label: '누가복음 24:6' },
      },
      {
        text: '오순절, 성령이 임하고 하루에 삼천 명이 더해지다',
        ref: { book: 44, chapter: 2, verse: 41, label: '사도행전 2:41' },
      },
    ],
    figures: ['다윗', '솔로몬', '예수'],
  },

  // ── 출애굽의 길 ───────────────────────────────────────────
  rameses: {
    id: 'rameses',
    name: '라암셋',
    modern: '이집트 동부 삼각주 콴티르 일대',
    lat: 30.8,
    lng: 31.75,
    blurb: '이스라엘 백성이 벽돌을 구우며 국고성을 짓던 곳. 출애굽이 시작된 자리입니다.',
    events: [
      {
        text: '보행하는 장정이 육십만 가량, 유월절 밤에 떠나다',
        ref: { book: 2, chapter: 12, verse: 37, label: '출애굽기 12:37' },
      },
    ],
    figures: ['모세', '아론'],
  },

  succoth: {
    id: 'succoth',
    name: '숙곳',
    modern: '이집트 텔 엘마스쿠타 부근',
    lat: 30.55,
    lng: 32.1,
    blurb: '첫 번째로 진 친 곳. 반죽이 부풀 새도 없이 떠나 무교병을 구워 먹습니다.',
    events: [
      {
        text: '누룩 없는 떡을 구우니, 급히 나오느라 지체하지 못한 까닭이라',
        ref: { book: 2, chapter: 12, verse: 39, label: '출애굽기 12:39' },
      },
    ],
  },

  'red-sea': {
    id: 'red-sea',
    name: '홍해',
    modern: '수에즈만 북쪽 일대 (정확한 도하 지점은 미상)',
    lat: 30.0,
    lng: 32.55,
    blurb:
      '앞은 바다, 뒤는 병거. 성경이 말하는 구원의 원형이 되는 장면이 여기서 일어납니다. 정확한 지점은 확인되지 않았습니다.',
    events: [
      {
        text: '"여호와께서 너희를 위하여 싸우시리니 너희는 가만히 있을지니라"',
        ref: { book: 2, chapter: 14, verse: 14, label: '출애굽기 14:14' },
      },
      {
        text: '바다가 갈라지고 이스라엘이 마른 땅으로 건너다',
        ref: { book: 2, chapter: 14, verse: 22, label: '출애굽기 14:22' },
      },
    ],
    figures: ['모세'],
  },

  marah: {
    id: 'marah',
    name: '마라',
    modern: '시내 반도 서안 (전승지 아인 하와라)',
    lat: 29.6,
    lng: 32.92,
    blurb: '사흘 길을 걸어 겨우 만난 물이 써서 마실 수 없던 곳. "마라"는 쓰다는 뜻입니다.',
    events: [
      {
        text: '나무 한 조각을 물에 던지니 물이 달게 되다',
        ref: { book: 2, chapter: 15, verse: 25, label: '출애굽기 15:25' },
      },
    ],
  },

  elim: {
    id: 'elim',
    name: '엘림',
    modern: '시내 반도 서안 (전승지 와디 가란델)',
    lat: 29.15,
    lng: 33.0,
    blurb: '쓴 물 다음에 만난 오아시스. 물 샘 열둘과 종려나무 일흔 그루가 있었습니다.',
    events: [
      {
        text: '거기 물 샘 열둘과 종려나무 일흔 그루가 있는지라',
        ref: { book: 2, chapter: 15, verse: 27, label: '출애굽기 15:27' },
      },
    ],
  },

  rephidim: {
    id: 'rephidim',
    name: '르비딤',
    modern: '시내 반도 남부 (전승지 와디 페이란)',
    lat: 28.72,
    lng: 33.75,
    blurb: '마실 물이 없어 원망이 터진 곳이자, 이스라엘이 처음으로 전쟁을 치른 곳입니다.',
    events: [
      {
        text: '반석을 치니 물이 나오다',
        ref: { book: 2, chapter: 17, verse: 6, label: '출애굽기 17:6' },
      },
      {
        text: '모세가 손을 들면 이기고 내리면 지더라 — 아론과 훌이 손을 받치다',
        ref: { book: 2, chapter: 17, verse: 12, label: '출애굽기 17:12' },
      },
    ],
    figures: ['여호수아', '아론'],
  },

  sinai: {
    id: 'sinai',
    name: '시내산',
    modern: '시내 반도 남부 (전승지 제벨 무사)',
    lat: 28.54,
    lng: 33.97,
    blurb:
      '이스라엘이 거의 일 년을 머문 산. 여기서 십계명과 언약을 받고, 노예 무리가 한 백성이 됩니다. 위치는 전승지이며 확정되지 않았습니다.',
    events: [
      {
        text: '"너희가 내게 대하여 제사장 나라가 되며 거룩한 백성이 되리라"',
        ref: { book: 2, chapter: 19, verse: 6, label: '출애굽기 19:6' },
      },
      {
        text: '하나님이 이 모든 말씀으로 말씀하여 이르시되 — 십계명',
        ref: { book: 2, chapter: 20, verse: 1, label: '출애굽기 20:1' },
      },
    ],
    figures: ['모세'],
  },

  'kadesh-barnea': {
    id: 'kadesh-barnea',
    name: '가데스 바네아',
    modern: '이스라엘·이집트 국경 지대 (전승지 아인 엘쿠데이라트)',
    lat: 30.68,
    lng: 34.5,
    blurb:
      '약속의 땅 문턱. 정탐꾼 열둘이 여기서 떠났고, 열 사람의 보고에 백성이 무너져 광야로 되돌아갑니다. 지도로 보면 목적지를 코앞에 두고 돌아선 자리입니다.',
    events: [
      {
        text: '정탐꾼이 사십 일 만에 돌아와 그 땅을 악평하다',
        ref: { book: 4, chapter: 13, verse: 32, label: '민수기 13:32' },
      },
      {
        text: '갈렙과 여호수아만 "능히 이기리라" 하다',
        ref: { book: 4, chapter: 14, verse: 9, label: '민수기 14:9' },
      },
    ],
    figures: ['갈렙', '여호수아'],
  },

  nebo: {
    id: 'nebo',
    name: '느보산',
    modern: '요르단 마다바 서쪽 느보산',
    lat: 31.77,
    lng: 35.72,
    blurb:
      '요단 동편에서 가나안 전체가 내려다보이는 산. 사십 년을 이끌어 온 모세는 여기까지만 갑니다.',
    events: [
      {
        text: '"내가 네 눈으로 보게 하였거니와 너는 그리로 건너가지 못하리라"',
        ref: { book: 5, chapter: 34, verse: 4, label: '신명기 34:4' },
      },
    ],
    figures: ['모세'],
  },

  jericho: {
    id: 'jericho',
    name: '여리고',
    modern: '팔레스타인 예리코',
    lat: 31.87,
    lng: 35.44,
    blurb:
      '세상에서 가장 오래된 도시 중 하나이자, 요단을 건넌 이스라엘이 처음 만난 성. 해수면보다 250m 낮은 곳에 있습니다.',
    events: [
      {
        text: '요단 물이 끊어지고 백성이 마른 땅으로 건너다',
        ref: { book: 6, chapter: 3, verse: 17, label: '여호수아 3:17' },
      },
      {
        text: '이레째 성을 일곱 번 돌고 외치니 성벽이 무너지다',
        ref: { book: 6, chapter: 6, verse: 20, label: '여호수아 6:20' },
      },
    ],
    figures: ['여호수아', '라합'],
  },

  // ── 다윗의 도피로 ─────────────────────────────────────────
  bethlehem: {
    id: 'bethlehem',
    name: '베들레헴',
    modern: '팔레스타인 베들레헴',
    lat: 31.7,
    lng: 35.2,
    blurb:
      '"떡집"이라는 뜻의 작은 마을. 룻이 이삭을 줍던 밭이 있고, 다윗이 양을 치던 들이 있고, 훗날 예수님이 태어나신 곳입니다.',
    events: [
      {
        text: '사무엘이 막내 다윗에게 기름을 붓다',
        ref: { book: 9, chapter: 16, verse: 13, label: '사무엘상 16:13' },
      },
      {
        text: '"베들레헴 에브라다야 너는 유다 족속 중에 작을지라도"',
        ref: { book: 33, chapter: 5, verse: 2, label: '미가 5:2' },
      },
      {
        text: '여관에 있을 곳이 없어 구유에 뉘시니라',
        ref: { book: 42, chapter: 2, verse: 7, label: '누가복음 2:7' },
      },
    ],
    figures: ['다윗', '룻', '예수'],
  },

  gibeah: {
    id: 'gibeah',
    name: '기브아',
    modern: '예루살렘 북쪽 텔 엘풀 언덕',
    lat: 31.83,
    lng: 35.23,
    blurb: '사울 왕의 고향이자 왕궁이 있던 곳. 다윗이 수금을 타던 자리이자, 창이 날아온 자리입니다.',
    events: [
      {
        text: '사울이 창을 던졌으나 다윗이 그 앞에서 두 번 피하다',
        ref: { book: 9, chapter: 18, verse: 11, label: '사무엘상 18:11' },
      },
    ],
    figures: ['사울', '요나단'],
  },

  nob: {
    id: 'nob',
    name: '놉',
    modern: '예루살렘 북쪽 (정확한 위치 미상)',
    lat: 31.8,
    lng: 35.26,
    blurb: '제사장들이 모여 살던 성읍. 쫓기던 다윗이 먹을 것과 무기를 얻은 곳입니다.',
    events: [
      {
        text: '제사장이 거룩한 떡을 주다 — 훗날 예수님이 이 일을 인용하시다',
        ref: { book: 9, chapter: 21, verse: 6, label: '사무엘상 21:6' },
      },
      {
        text: '골리앗의 칼을 다시 손에 쥐다',
        ref: { book: 9, chapter: 21, verse: 9, label: '사무엘상 21:9' },
      },
    ],
  },

  gath: {
    id: 'gath',
    name: '가드',
    modern: '이스라엘 텔 차피 유적',
    lat: 31.61,
    lng: 34.85,
    blurb: '골리앗의 고향, 곧 원수의 도시. 갈 곳이 없어진 다윗이 하필 이곳으로 숨어듭니다.',
    events: [
      {
        text: '심히 두려워하여 그들 앞에서 미친 체하다',
        ref: { book: 9, chapter: 21, verse: 13, label: '사무엘상 21:13' },
      },
    ],
    figures: ['골리앗'],
  },

  adullam: {
    id: 'adullam',
    name: '아둘람',
    modern: '이스라엘 유대 구릉지의 동굴 지대',
    lat: 31.65,
    lng: 34.98,
    blurb:
      '환난 당한 자, 빚진 자, 마음이 원통한 자 사백 명이 모여든 굴. 다윗의 군대는 이렇게 시작됩니다.',
    events: [
      {
        text: '환난 당한 모든 자와 빚진 자와 마음이 원통한 자가 다 그에게로 모이다',
        ref: { book: 9, chapter: 22, verse: 2, label: '사무엘상 22:2' },
      },
    ],
    figures: ['다윗'],
  },

  ziph: {
    id: 'ziph',
    name: '십 광야',
    modern: '헤브론 남동쪽 광야',
    lat: 31.45,
    lng: 35.13,
    blurb: '주민들이 다윗의 위치를 사울에게 밀고한 광야. 그 위험한 곳으로 친구가 찾아옵니다.',
    events: [
      {
        text: '요나단이 다윗에게 이르러 하나님을 힘있게 의지하게 하다',
        ref: { book: 9, chapter: 23, verse: 16, label: '사무엘상 23:16' },
      },
    ],
    figures: ['요나단'],
  },

  engedi: {
    id: 'engedi',
    name: '엔게디',
    modern: '이스라엘 사해 서안 엔게디',
    lat: 31.46,
    lng: 35.39,
    blurb: '사해 절벽의 오아시스. 죽일 수 있었지만 죽이지 않은 선택이 이곳에서 일어납니다.',
    events: [
      {
        text: '사울의 겉옷 자락만 가만히 베고, 그것마저 마음에 찔리다',
        ref: { book: 9, chapter: 24, verse: 5, label: '사무엘상 24:5' },
      },
    ],
    figures: ['사울'],
  },

  ziklag: {
    id: 'ziklag',
    name: '시글락',
    modern: '이스라엘 남부 네게브 (위치 미상)',
    lat: 31.4,
    lng: 34.6,
    blurb:
      '블레셋 왕에게 얻어 일 년 사 개월을 산 성읍. 가장 낮은 자리에서 왕이 되기 직전까지 갑니다.',
    events: [
      {
        text: '다윗이 크게 다급하였으나 그의 하나님 여호와를 힘입고 용기를 얻다',
        ref: { book: 9, chapter: 30, verse: 6, label: '사무엘상 30:6' },
      },
    ],
  },
}
