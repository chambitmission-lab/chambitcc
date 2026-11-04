// 이스라엘 열두 지파 카드 데이터 — /bible/genealogy?view=tribes
//
// 원칙
// - 축복 문구는 개역개정 직접 인용을 최소화하고(오인용 위험) 쉬운 요약 + 구절 위치로 준다.
//   따옴표 안 짧은 구절만 개역개정 표기 그대로.
// - 지파 이름 뜻은 창세기 본문이 붙인 풀이(29~30, 35, 41장)를 따른다.
// - 계 7장에서 단·에브라임이 빠진 이유처럼 성경이 직접 말하지 않는 것은 "견해"로만 적는다.
// - 성경 사전 칩(bibleGlossary entries 의 tribe 필드)이 이 id 로 카드를 연다.

export type TribeId =
  | 'reuben' | 'simeon' | 'levi' | 'judah' | 'dan' | 'naphtali'
  | 'gad' | 'asher' | 'issachar' | 'zebulun' | 'joseph' | 'benjamin'
  | 'ephraim' | 'manasseh'

export type MotherId = 'leah' | 'rachel' | 'bilhah' | 'zilpah'

export interface TribePerson {
  name: string
  note: string
  ref: string
}

export interface Tribe {
  id: TribeId
  name: string
  /** 야곱의 몇째 아들 (에브라임·므낫세는 요셉의 아들이라 없음) */
  order?: number
  mother: MotherId
  /** 에브라임·므낫세 — 요셉 대신 지파가 된 손자 */
  parent?: 'joseph'
  meaning: string
  meaningRef: string
  /** 카드 한 줄 — 이 지파를 한마디로 */
  tagline: string
  jacob?: { summary: string; ref: string }
  moses?: { summary: string; ref: string }
  land: { summary: string; ref: string }
  people: TribePerson[]
  /** 구속사에서 이 지파가 가리키는 것 — 있는 지파만 */
  redemptive?: { summary: string; ref: string }
}

export const MOTHERS: { id: MotherId; name: string; note: string }[] = [
  { id: 'leah', name: '레아', note: '야곱의 첫째 아내' },
  { id: 'rachel', name: '라헬', note: '야곱이 사랑한 아내' },
  { id: 'bilhah', name: '빌하', note: '라헬의 여종' },
  { id: 'zilpah', name: '실바', note: '레아의 여종' },
]

export const TRIBES: Tribe[] = [
  {
    id: 'reuben', name: '르우벤', order: 1, mother: 'leah',
    meaning: '"보라, 아들이라" — 여호와께서 내 괴로움을 돌보셨다', meaningRef: '창세기 29:32',
    tagline: '장자였지만 장자의 몫을 잃은 지파',
    jacob: { summary: '맏아들이지만 물이 끓어 넘치듯 불안정해 으뜸이 되지 못하리라 — 아버지의 침상을 더럽힌 죄 때문이었어요.', ref: '창세기 49:3' },
    moses: { summary: '르우벤은 살고 죽지 않으며, 그 사람 수가 적지 않기를 빌었어요.', ref: '신명기 33:6' },
    land: { summary: '요단강 동쪽 남부(사해 동편)의 목초지 — 가나안에 들어가기 전에 먼저 받았어요.', ref: '여호수아 13:15' },
    people: [
      { name: '르우벤', note: '형제들이 요셉을 죽이려 할 때 구덩이에 넣자고 해 살리려 했어요.', ref: '창세기 37:21' },
    ],
  },
  {
    id: 'simeon', name: '시므온', order: 2, mother: 'leah',
    meaning: '"들으심" — 여호와께서 내가 사랑받지 못함을 들으셨다', meaningRef: '창세기 29:33',
    tagline: '유다 땅 안에 흩어져 살게 된 지파',
    jacob: { summary: '레위와 함께 세겜에서 칼을 휘두른 분노 때문에 "이스라엘 중에 흩으리로다"는 말을 들었어요.', ref: '창세기 49:5' },
    land: { summary: '따로 땅을 받지 못하고 유다 지파의 땅 남쪽(브엘세바 일대) 안에서 기업을 얻었어요.', ref: '여호수아 19:1' },
    people: [
      { name: '시므온', note: '애굽에서 요셉이 형제들을 시험할 때 볼모로 남았어요.', ref: '창세기 42:24' },
    ],
  },
  {
    id: 'levi', name: '레위', order: 3, mother: 'leah',
    meaning: '"연합함" — 이제 남편이 나와 연합하리라', meaningRef: '창세기 29:34',
    tagline: '땅 대신 하나님을 기업으로 받은 지파',
    jacob: { summary: '시므온과 함께 흩어지리라는 말을 들었지만, 그 흩어짐이 온 땅에 퍼져 섬기는 복으로 바뀌었어요.', ref: '창세기 49:5' },
    moses: { summary: '둠밈과 우림을 맡기고, 주의 법도를 야곱에게 가르치며 분향하는 지파로 축복했어요.', ref: '신명기 33:8' },
    land: { summary: '땅 몫이 없어요. 대신 각 지파 안에 흩어진 마흔여덟 성읍과 들을 받았어요 — "여호와가 그들의 기업"이에요.', ref: '여호수아 13:14' },
    people: [
      { name: '모세·아론·미리암', note: '레위의 손자 고핫 집안에서 났어요.', ref: '출애굽기 6:16' },
      { name: '에스라', note: '대제사장 아론의 자손인 학자예요.', ref: '에스라 7:1' },
      { name: '바나바', note: '구브로에서 난 레위족 사람 — 바울의 동역자예요.', ref: '사도행전 4:36' },
    ],
    redemptive: { summary: '레위 제사장은 그림자였어요. 예수님은 레위가 아니라 멜기세덱의 반차를 따라 영원한 대제사장이 되셨어요.', ref: '히브리서 7:11' },
  },
  {
    id: 'judah', name: '유다', order: 4, mother: 'leah',
    meaning: '"찬송" — 내가 이제는 여호와를 찬송하리로다', meaningRef: '창세기 29:35',
    tagline: '왕과 메시아가 나온 지파',
    jacob: { summary: '사자 새끼 같은 유다 — "규가 유다를 떠나지 아니하며" 실로가 오시기까지 다스림이 이어지리라 했어요.', ref: '창세기 49:8' },
    moses: { summary: '유다의 소리를 들으시고 그 백성에게 돌아오게 하시며, 대적을 치는 도움이 되어 주시길 빌었어요.', ref: '신명기 33:7' },
    land: { summary: '가나안 남부의 넓은 산지와 광야 — 베들레헴과 헤브론이 이 땅에 있어요.', ref: '여호수아 15:1' },
    people: [
      { name: '갈렙', note: '가나안을 정탐하고 믿음으로 보고한 두 사람 중 하나예요.', ref: '민수기 13:6' },
      { name: '보아스', note: '룻을 맞아 다윗의 증조부가 됐어요.', ref: '룻기 4:21' },
      { name: '다윗·솔로몬', note: '이스라엘의 왕 — 다윗 언약의 주인공이에요.', ref: '사무엘하 7:12' },
    ],
    redemptive: { summary: '예수님은 유다 지파에서 나셨어요. 요한계시록은 그분을 "유다 지파의 사자, 다윗의 뿌리"라 불러요.', ref: '요한계시록 5:5' },
  },
  {
    id: 'dan', name: '단', order: 5, mother: 'bilhah',
    meaning: '"억울함을 푸심" — 하나님이 내 억울함을 푸셨다', meaningRef: '창세기 30:6',
    tagline: '땅을 떠나 북쪽 끝으로 옮겨 간 지파',
    jacob: { summary: '단은 자기 백성을 심판하리라, 길섶의 뱀 같으리라 — 그리고 "여호와여 나는 주의 구원을 기다리나이다"라고 고백했어요.', ref: '창세기 49:16' },
    moses: { summary: '바산에서 뛰어나오는 사자 새끼 같다고 했어요.', ref: '신명기 33:22' },
    land: { summary: '처음엔 지중해 해안(욥바 근처)을 받았지만 지키지 못하고, 북쪽 끝 라이스로 옮겨 가 "단"이라 불렀어요.', ref: '여호수아 19:40' },
    people: [
      { name: '오홀리압', note: '성막을 지은 솜씨 좋은 장인이에요.', ref: '출애굽기 31:6' },
      { name: '삼손', note: '나실인으로 블레셋과 싸운 사사예요.', ref: '사사기 13:2' },
    ],
  },
  {
    id: 'naphtali', name: '납달리', order: 6, mother: 'bilhah',
    meaning: '"경쟁함" — 내가 언니와 크게 경쟁하여 이겼다', meaningRef: '창세기 30:8',
    tagline: '예수님 사역의 무대가 된 갈릴리의 지파',
    jacob: { summary: '놓인 암사슴처럼 아름다운 소리를 내리라 했어요.', ref: '창세기 49:21' },
    moses: { summary: '은혜가 풍성하고 여호와의 복이 가득하리라 했어요.', ref: '신명기 33:23' },
    land: { summary: '갈릴리 호수 서쪽과 북쪽의 산지 — 가버나움 일대가 이 땅이에요.', ref: '여호수아 19:32' },
    people: [
      { name: '바락', note: '드보라와 함께 가나안 군대를 물리쳤어요.', ref: '사사기 4:6' },
    ],
    redemptive: { summary: '"스불론과 납달리 땅" 흑암에 앉은 백성에게 큰 빛이 비친다는 예언이 예수님의 갈릴리 사역으로 이루어졌어요.', ref: '마태복음 4:15' },
  },
  {
    id: 'gad', name: '갓', order: 7, mother: 'zilpah',
    meaning: '"복됨" — 복되도다', meaningRef: '창세기 30:11',
    tagline: '쫓기다가 도리어 뒤쫓는 용사의 지파',
    jacob: { summary: '군대의 추격을 받으나 도리어 그 뒤를 추격하리로다 — 밀려도 다시 일어서는 지파예요.', ref: '창세기 49:19' },
    moses: { summary: '암사자처럼 엎드리고, 여호와의 공의를 행했다고 했어요.', ref: '신명기 33:20' },
    land: { summary: '요단강 동쪽 길르앗 지방 — 르우벤과 므낫세 반 지파 사이예요.', ref: '여호수아 13:24' },
    people: [
      { name: '갓의 용사들', note: '얼굴은 사자 같고 빠르기는 산의 사슴 같다고 한, 다윗에게 온 용사들이에요.', ref: '역대상 12:8' },
    ],
  },
  {
    id: 'asher', name: '아셀', order: 8, mother: 'zilpah',
    meaning: '"기쁨" — 기쁘도다, 모든 딸들이 나를 기쁜 자라 하리로다', meaningRef: '창세기 30:13',
    tagline: '기름진 땅의 복을 받은 지파',
    jacob: { summary: '먹을 것이 기름져 왕의 수라상을 차리리라 했어요.', ref: '창세기 49:20' },
    moses: { summary: '형제에게 기쁨이 되고 발이 기름에 잠기며, 사는 날을 따라 능력이 있으리라 했어요.', ref: '신명기 33:24' },
    land: { summary: '지중해 북쪽 해안(갈멜산에서 두로·시돈 방향)의 비옥한 땅이에요.', ref: '여호수아 19:24' },
    people: [
      { name: '안나', note: '성전에서 아기 예수님을 맞은 여선지자 — 아셀 지파 사람이에요.', ref: '누가복음 2:36' },
    ],
  },
  {
    id: 'issachar', name: '잇사갈', order: 9, mother: 'leah',
    meaning: '"값" — 하나님이 내게 그 값을 주셨다', meaningRef: '창세기 30:18',
    tagline: '시세를 알고 마땅히 할 일을 안 지파',
    jacob: { summary: '양의 우리 사이에 꿇어앉은 건장한 나귀 — 좋은 땅에서 묵묵히 짐을 지리라 했어요.', ref: '창세기 49:14' },
    moses: { summary: '스불론과 함께, 장막에 있음을 즐거워하고 의로운 제사를 드리리라 했어요.', ref: '신명기 33:18' },
    land: { summary: '이스르엘 평야 — 이스라엘에서 가장 기름진 들판이에요.', ref: '여호수아 19:17' },
    people: [
      { name: '잇사갈의 우두머리들', note: '"시세를 알고 이스라엘이 마땅히 행할 것을 아는" 사람들이에요.', ref: '역대상 12:32' },
      { name: '돌라', note: '이스라엘을 이십삼 년 다스린 사사예요.', ref: '사사기 10:1' },
    ],
  },
  {
    id: 'zebulun', name: '스불론', order: 10, mother: 'leah',
    meaning: '"거함" — 이제는 남편이 나와 함께 살리라', meaningRef: '창세기 30:20',
    tagline: '바다 쪽으로 열린 갈릴리의 지파',
    jacob: { summary: '해변에 거주하며 배를 매는 해변이 되리라 했어요.', ref: '창세기 49:13' },
    moses: { summary: '밖으로 나감을 기뻐하고, 바다의 풍부한 것을 누리리라 했어요.', ref: '신명기 33:18' },
    land: { summary: '갈릴리 남쪽 산지 — 예수님이 자라신 나사렛이 이 땅 근처예요.', ref: '여호수아 19:10' },
    people: [
      { name: '엘론', note: '이스라엘을 십 년 다스린 사사예요.', ref: '사사기 12:11' },
    ],
    redemptive: { summary: '납달리와 함께 "이방의 갈릴리"에 큰 빛이 비친다는 예언의 땅이에요.', ref: '이사야 9:1' },
  },
  {
    id: 'joseph', name: '요셉', order: 11, mother: 'rachel',
    meaning: '"더함" — 여호와는 다른 아들을 내게 더하시기를 원하노라', meaningRef: '창세기 30:24',
    tagline: '두 아들로 나뉘어 장자의 두 몫을 받은 지파',
    jacob: { summary: '샘 곁의 무성한 가지, 그 가지가 담을 넘었도다 — 열두 아들 가운데 가장 긴 축복을 받았어요.', ref: '창세기 49:22' },
    moses: { summary: '땅의 보물과 하늘의 복을 빌고, 에브라임은 만만이요 므낫세는 천천이라 했어요.', ref: '신명기 33:13' },
    land: { summary: '요셉이라는 이름의 땅은 없어요. 두 아들 에브라임과 므낫세가 각각 지파가 되어 가나안 중심부를 받았어요.', ref: '여호수아 16:1' },
    people: [
      { name: '요셉', note: '형들에게 팔려 갔다가 애굽의 총리가 되어 가족을 살렸어요.', ref: '창세기 45:5' },
    ],
    redemptive: { summary: '야곱이 요셉의 두 아들을 자기 아들로 삼아(창 48:5) 장자권이 요셉에게 갔고, 다스림은 유다에게서 났어요.', ref: '역대상 5:1' },
  },
  {
    id: 'benjamin', name: '베냐민', order: 12, mother: 'rachel',
    meaning: '"오른손의 아들" — 라헬은 "베노니(슬픔의 아들)"라 했으나 야곱이 바꿔 불렀어요', meaningRef: '창세기 35:18',
    tagline: '작지만 첫 왕과 사도 바울을 낸 지파',
    jacob: { summary: '물어뜯는 이리 같아 아침에는 빼앗은 것을 먹고 저녁에는 나누리라 했어요.', ref: '창세기 49:27' },
    moses: { summary: '"여호와의 사랑을 입은 자" — 그분 곁에 안전히 살리라 했어요.', ref: '신명기 33:12' },
    land: { summary: '유다와 에브라임 사이의 작은 땅 — 예루살렘이 그 경계에 있어요. 나라가 갈라질 때 유다 편에 남았어요.', ref: '여호수아 18:11' },
    people: [
      { name: '에훗', note: '왼손잡이 사사 — 모압 왕 에글론을 물리쳤어요.', ref: '사사기 3:15' },
      { name: '사울', note: '이스라엘의 첫 왕이에요.', ref: '사무엘상 9:1' },
      { name: '모르드개·에스더', note: '페르시아에서 민족을 구한 사촌 남매예요.', ref: '에스더 2:5' },
      { name: '사도 바울', note: '"베냐민 지파요 히브리인 중의 히브리인"이라고 스스로 소개했어요.', ref: '빌립보서 3:5' },
    ],
  },
  {
    id: 'ephraim', name: '에브라임', mother: 'rachel', parent: 'joseph',
    meaning: '"창성함" — 하나님이 나를 수고한 땅에서 번성하게 하셨다', meaningRef: '창세기 41:52',
    tagline: '북왕국 전체를 부르는 이름이 된 지파',
    jacob: { summary: '야곱이 손을 엇바꿔 동생 에브라임에게 오른손을 얹고 형보다 크게 되리라 축복했어요.', ref: '창세기 48:14' },
    land: { summary: '가나안 중앙 산지 — 성막이 있던 실로가 이 땅에 있어요.', ref: '여호수아 16:5' },
    people: [
      { name: '여호수아', note: '모세의 뒤를 이어 가나안 정복을 이끌었어요.', ref: '민수기 13:8' },
      { name: '여로보암', note: '나라를 갈라 북이스라엘의 첫 왕이 됐어요.', ref: '열왕기상 11:26' },
    ],
  },
  {
    id: 'manasseh', name: '므낫세', mother: 'rachel', parent: 'joseph',
    meaning: '"잊어버림" — 하나님이 내 모든 고난과 아버지의 온 집 일을 잊어버리게 하셨다', meaningRef: '창세기 41:51',
    tagline: '요단 양쪽에 나뉘어 산 지파',
    jacob: { summary: '요셉의 맏아들이지만 야곱은 동생 에브라임을 앞세웠어요. 그래도 므낫세도 큰 민족이 되리라 했어요.', ref: '창세기 48:19' },
    land: { summary: '반 지파는 요단 동쪽 바산·길르앗을, 나머지 반은 요단 서쪽 에브라임 북쪽을 받았어요.', ref: '여호수아 17:1' },
    people: [
      { name: '슬로브핫의 딸들', note: '아들이 없는 집 딸들도 기업을 이을 수 있게 해 달라고 간구했어요.', ref: '민수기 27:1' },
      { name: '기드온', note: '삼백 용사로 미디안을 물리친 사사예요.', ref: '사사기 6:15' },
    ],
  },
]

export const TRIBE_BY_ID = new Map<TribeId, Tribe>(TRIBES.map((t) => [t.id, t]))

export const isTribeId = (v: string | null | undefined): v is TribeId =>
  !!v && TRIBE_BY_ID.has(v as TribeId)

// ── "열두"는 어느 목록의 열둘일까 ─────────────────────────────────
// 성경에 나오는 열두 지파 목록은 서로 조금씩 달라서, 그 차이를 모르면 헷갈린다.
export type TribeListId = 'sons' | 'camp' | 'land' | 'sealed'

export interface TribeList {
  id: TribeListId
  label: string
  ref: string
  members: TribeId[]
  note: string
}

export const TRIBE_LISTS: TribeList[] = [
  {
    id: 'sons', label: '야곱의 아들', ref: '창세기 49:1',
    members: ['reuben', 'simeon', 'levi', 'judah', 'dan', 'naphtali', 'gad', 'asher', 'issachar', 'zebulun', 'joseph', 'benjamin'],
    note: '열두 지파의 뿌리 — 야곱이 죽기 전 열두 아들을 하나씩 불러 축복했어요.',
  },
  {
    id: 'camp', label: '광야 진영', ref: '민수기 1:47',
    members: ['reuben', 'simeon', 'judah', 'dan', 'naphtali', 'gad', 'asher', 'issachar', 'zebulun', 'ephraim', 'manasseh', 'benjamin'],
    note: '레위는 회막을 섬기려고 인구조사에서 빠지고, 요셉은 에브라임·므낫세 둘로 세어 열둘이 돼요.',
  },
  {
    id: 'land', label: '땅 분배', ref: '여호수아 14:3',
    members: ['reuben', 'simeon', 'judah', 'dan', 'naphtali', 'gad', 'asher', 'issachar', 'zebulun', 'ephraim', 'manasseh', 'benjamin'],
    note: '레위는 땅 대신 성읍을 받고, 요셉의 몫은 두 아들에게 갔어요. 장자의 두 몫이 요셉에게 간 거예요.',
  },
  {
    id: 'sealed', label: '인 맞은 자', ref: '요한계시록 7:4',
    members: ['judah', 'reuben', 'gad', 'asher', 'naphtali', 'manasseh', 'simeon', 'levi', 'issachar', 'zebulun', 'joseph', 'benjamin'],
    note: '레위와 요셉이 다시 들어오고 단과 에브라임이 빠져요. 성경은 이유를 말하지 않아요 — 단의 우상숭배(삿 18:30)와 관련된다는 견해가 있어요.',
  },
]
