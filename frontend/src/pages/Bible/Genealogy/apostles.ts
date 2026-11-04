// 열두 제자(사도) 카드 데이터 — /bible/genealogy?view=apostles
//
// 원칙 (tribes.ts 와 같음)
// - 성경에 기록된 장면만 싣는다. 순교 방식 같은 교회 전승은 넣지 않는다(야고보의 순교 행 12:2 만 성경 기록).
// - 바돌로매=나다나엘, 알패오의 아들 야고보=작은 야고보처럼 성경이 직접 잇지 않는 동일시는 "견해"로만.
// - 성경 사전 칩(bibleGlossary entries 의 apostle 필드)이 이 id 로 카드를 연다.

export type ApostleId =
  | 'peter' | 'andrew' | 'james' | 'john'
  | 'philip' | 'bartholomew' | 'thomas' | 'matthew'
  | 'jamesAlphaeus' | 'thaddaeus' | 'simonZealot' | 'judas'
  | 'matthias'

export interface ApostleScene {
  title: string
  note: string
  ref: string
}

export interface Apostle {
  id: ApostleId
  name: string
  /** 성경에 나오는 다른 이름·표기 */
  otherNames?: string
  /** 카드 윗줄 작은 라벨 */
  badge: string
  /** 카드 한 줄 */
  tagline: string
  background: string
  calling?: { summary: string; ref: string }
  scenes: ApostleScene[]
  /** 이름 동일시처럼 견해가 갈리는 부분 — 화면에 "견해"로 표시 */
  view?: string
  /** 가룟 유다·맛디아 — 자리를 잃은 자와 채운 자 */
  special?: 'fallen' | 'replacement'
}

// 복음서·사도행전의 네 목록은 늘 네 명씩 세 묶음이고, 묶음의 첫 이름이 같다(베드로·빌립·알패오의 아들 야고보).
export const APOSTLE_GROUPS: { title: string; note: string; members: ApostleId[] }[] = [
  { title: '첫째 묶음', note: '목록마다 베드로가 맨 앞이에요', members: ['peter', 'andrew', 'james', 'john'] },
  { title: '둘째 묶음', note: '목록마다 빌립이 맨 앞이에요', members: ['philip', 'bartholomew', 'thomas', 'matthew'] },
  { title: '셋째 묶음', note: '목록마다 알패오의 아들 야고보가 맨 앞이에요', members: ['jamesAlphaeus', 'thaddaeus', 'simonZealot', 'judas'] },
  { title: '빈자리를 채운 사람', note: '가룟 유다의 자리', members: ['matthias'] },
]

export const APOSTLES: Apostle[] = [
  {
    id: 'peter', badge: '갈릴리 어부', name: '베드로', otherNames: '시몬, 게바(아람어로 "반석")',
    tagline: '넘어졌다가 다시 세워진 수제자',
    background: '갈릴리 벳새다 출신의 어부 — 동생 안드레와 함께 고기를 잡았어요.',
    calling: { summary: '"나를 따라오라 내가 너희를 사람을 낚는 어부가 되게 하리라" — 곧 그물을 버려두고 따랐어요.', ref: '마태복음 4:18' },
    scenes: [
      { title: '반석이라는 새 이름', note: '예수님이 시몬에게 "게바"(베드로)라는 이름을 주셨어요.', ref: '요한복음 1:42' },
      { title: '신앙 고백', note: '"주는 그리스도시요 살아 계신 하나님의 아들이시니이다"', ref: '마태복음 16:16' },
      { title: '세 번 부인', note: '닭 울기 전에 주님을 세 번 모른다 하고, 밖에 나가 심히 통곡했어요.', ref: '누가복음 22:61' },
      { title: '"내 양을 먹이라"', note: '부활하신 주님이 세 번 물으시고 다시 맡기셨어요.', ref: '요한복음 21:17' },
      { title: '오순절 설교', note: '성령을 받고 담대히 전해 그날 삼천 명이 세례를 받았어요.', ref: '사도행전 2:41' },
    ],
  },
  {
    id: 'andrew', badge: '갈릴리 어부', name: '안드레',
    tagline: '사람을 예수님께 데려온 제자',
    background: '베드로의 형제, 벳새다 출신 어부 — 처음엔 세례 요한의 제자였어요.',
    calling: { summary: '세례 요한이 "보라 하나님의 어린 양"이라 할 때 예수님을 따라갔어요.', ref: '요한복음 1:40' },
    scenes: [
      { title: '형을 데려옴', note: '"우리가 메시야를 만났다" 하고 형 시몬을 예수님께 데려왔어요.', ref: '요한복음 1:41' },
      { title: '오병이어의 아이', note: '보리떡 다섯 개와 물고기 두 마리를 가진 아이를 데려왔어요.', ref: '요한복음 6:8' },
      { title: '헬라인을 데려옴', note: '예수님을 뵙고자 한 헬라인들을 빌립과 함께 전했어요.', ref: '요한복음 12:22' },
    ],
  },
  {
    id: 'james', badge: '세베대의 아들', name: '야고보', otherNames: '세베대의 아들, 보아너게("우레의 아들")',
    tagline: '열두 제자 중 처음 순교한 사도',
    background: '세베대의 아들, 요한의 형 — 아버지와 배에서 그물을 깁던 어부예요.',
    calling: { summary: '부르심을 듣고 곧 배와 아버지를 버려두고 따랐어요.', ref: '마태복음 4:21' },
    scenes: [
      { title: '"우레의 아들"', note: '예수님이 요한과 함께 보아너게라는 이름을 붙여 주셨어요.', ref: '마가복음 3:17' },
      { title: '변화산', note: '베드로·요한과 함께 예수님의 변화된 모습을 보았어요.', ref: '마태복음 17:1' },
      { title: '첫 순교', note: '헤롯 왕이 칼로 죽였어요 — 열두 제자 중 성경에 기록된 첫 순교예요.', ref: '사도행전 12:2' },
    ],
  },
  {
    id: 'john', badge: '세베대의 아들', name: '요한', otherNames: '세베대의 아들, 보아너게',
    tagline: '사랑을 가장 많이 말한 제자',
    background: '야고보의 동생, 갈릴리 어부 — 베드로·야고보와 함께 가장 가까이에서 예수님을 따랐어요.',
    calling: { summary: '형 야고보와 함께 배와 아버지를 두고 따랐어요.', ref: '마가복음 1:19' },
    scenes: [
      { title: '십자가 아래', note: '예수님이 어머니 마리아를 사랑하시는 제자에게 맡기셨어요.', ref: '요한복음 19:26' },
      { title: '빈 무덤으로 달려감', note: '베드로보다 먼저 무덤에 이르러 보고 믿었어요.', ref: '요한복음 20:4' },
      { title: '밧모 섬의 환상', note: '"나 요한은 너희 형제요" — 요한계시록을 기록했어요.', ref: '요한계시록 1:9' },
    ],
    view: '요한복음의 "예수께서 사랑하시는 그 제자"를 교회는 사도 요한으로 받아 왔어요.',
  },
  {
    id: 'philip', badge: '벳새다 사람', name: '빌립',
    tagline: '"와서 보라"고 초대한 제자',
    background: '베드로·안드레와 같은 동네인 벳새다 출신이에요. (사도행전 8장의 집사 빌립은 다른 인물)',
    calling: { summary: '예수님이 갈릴리로 가시다 빌립을 만나 "나를 따르라" 하셨어요.', ref: '요한복음 1:43' },
    scenes: [
      { title: '"와서 보라"', note: '의심하는 나다나엘에게 따지지 않고 와서 보라고 했어요.', ref: '요한복음 1:46' },
      { title: '오천 명 앞에서', note: '예수님이 "어디서 떡을 사서" 하고 시험하실 때 셈부터 했어요.', ref: '요한복음 6:5' },
      { title: '"아버지를 보여 주옵소서"', note: '"나를 본 자는 아버지를 보았거늘" 하는 대답을 들었어요.', ref: '요한복음 14:8' },
    ],
  },
  {
    id: 'bartholomew', badge: '빌립의 짝', name: '바돌로매',
    tagline: '목록에 이름만 남은, 그러나 빠짐없는 제자',
    background: '네 목록 모두에 이름이 있지만 복음서에 따로 나오는 장면은 없어요.',
    scenes: [
      { title: '나다나엘과의 만남(견해)', note: '"참으로 이스라엘 사람이라 그 속에 간사한 것이 없도다"', ref: '요한복음 1:47' },
    ],
    view: '목록에서 늘 빌립과 짝지어 나와서, 빌립이 데려온 요한복음의 나다나엘과 같은 사람으로 보는 견해가 많아요.',
  },
  {
    id: 'thomas', badge: '디두모', name: '도마', otherNames: '디두모("쌍둥이")',
    tagline: '의심 끝에 가장 깊이 고백한 제자',
    background: '성경은 그의 직업을 말하지 않아요. 요한복음에서 세 번 목소리를 내요.',
    scenes: [
      { title: '"우리도 주와 함께 죽으러 가자"', note: '위험한 유대로 가실 때 앞장서 말했어요.', ref: '요한복음 11:16' },
      { title: '"길을 어찌 알겠사옵나이까"', note: '그 물음에 "내가 곧 길이요 진리요 생명이니"라는 대답이 왔어요.', ref: '요한복음 14:5' },
      { title: '"나의 주님이시요 나의 하나님이시니이다"', note: '부활을 의심했다가 못 자국을 보고 고백했어요.', ref: '요한복음 20:28' },
    ],
  },
  {
    id: 'matthew', badge: '세리', name: '마태', otherNames: '레위(마가·누가복음)',
    tagline: '세관에서 부름받은 세리',
    background: '로마를 대신해 세금을 걷던 세리 — 동족에게 미움받던 직업이었어요.',
    calling: { summary: '세관에 앉아 있을 때 "나를 따르라" 하시자 일어나 따랐어요.', ref: '마태복음 9:9' },
    scenes: [
      { title: '큰 잔치', note: '자기 집에서 세리와 죄인들과 함께 예수님을 위해 잔치를 열었어요.', ref: '누가복음 5:29' },
      { title: '"의사가 쓸 데 있느니라"', note: '"내가 의인을 부르러 온 것이 아니요 죄인을 부르러 왔노라"', ref: '마태복음 9:12' },
    ],
    view: '교회는 마태복음을 그가 기록했다고 받아 왔어요.',
  },
  {
    id: 'jamesAlphaeus', badge: '알패오의 아들', name: '야고보', otherNames: '알패오의 아들',
    tagline: '셋째 묶음을 늘 이끈 조용한 제자',
    background: '네 목록 모두에서 셋째 묶음 맨 앞에 나오지만 따로 기록된 장면은 없어요.',
    scenes: [
      { title: '다락방의 기도', note: '부활 후 다른 제자들과 함께 마음을 같이하여 기도했어요.', ref: '사도행전 1:13' },
    ],
    view: '십자가 곁 여인들 중 "작은 야고보의 어머니 마리아"의 그 야고보로 보는 견해가 있어요(막 15:40).',
  },
  {
    id: 'thaddaeus', badge: '야고보의 아들 유다', name: '다대오', otherNames: '야고보의 아들 유다(누가복음·사도행전), "가룟인 아닌 유다"',
    tagline: '마지막 만찬에서 질문한 또 하나의 유다',
    background: '마태·마가복음은 다대오, 누가복음·사도행전은 "야고보의 아들 유다"라 불러요.',
    scenes: [
      { title: '만찬 자리의 질문', note: '"어찌하여 자기를 우리에게는 나타내시고 세상에는 아니하려 하시나이까"', ref: '요한복음 14:22' },
    ],
  },
  {
    id: 'simonZealot', badge: '셀롯인', name: '시몬', otherNames: '셀롯인(열심당원), 가나나인',
    tagline: '세리 마태와 한 공동체가 된 열심당원',
    background: '셀롯(열심당)은 로마에 맞서 싸우려던 무리예요. 로마의 세금을 걷던 마태와는 원수 같은 사이였어요.',
    scenes: [
      { title: '한 목록 안의 두 사람', note: '열심당원과 세리가 예수님 안에서 같은 제자가 됐어요.', ref: '누가복음 6:15' },
    ],
  },
  {
    id: 'judas', badge: '주님을 판 제자', name: '가룟 유다', special: 'fallen',
    tagline: '곁에 있었지만 끝내 돌아서지 못한 제자',
    background: '열두 제자의 돈궤를 맡았지만 그 돈을 훔쳐 가곤 했어요.',
    scenes: [
      { title: '은 삼십', note: '대제사장들에게 은 삼십을 받고 예수님을 넘겨주기로 했어요.', ref: '마태복음 26:15' },
      { title: '입맞춤', note: '"랍비여 안녕하시옵니까" 하고 입을 맞춰 예수님을 넘겨주었어요.', ref: '마태복음 26:49' },
      { title: '돌아오지 못한 뉘우침', note: '뉘우쳤지만 주님께 돌아가지 못하고 비참한 최후를 맞았어요. 같은 밤 넘어진 베드로와 갈린 길이에요.', ref: '마태복음 27:3' },
    ],
  },
  {
    id: 'matthias', badge: '나중에 세워진 사도', name: '맛디아', special: 'replacement',
    tagline: '유다의 빈자리를 채운 증인',
    background: '세례 요한 때부터 예수님이 승천하실 때까지 늘 함께 다닌 사람 중 하나예요.',
    calling: { summary: '제자들이 기도하고 제비를 뽑아 열한 사도와 함께 세웠어요.', ref: '사도행전 1:26' },
    scenes: [
      { title: '부활의 증인', note: '사도의 조건은 "주의 부활하심을 증언할" 사람이었어요.', ref: '사도행전 1:22' },
    ],
  },
]

export const APOSTLE_BY_ID = new Map<ApostleId, Apostle>(APOSTLES.map((a) => [a.id, a]))

export const isApostleId = (v: string | null | undefined): v is ApostleId =>
  !!v && APOSTLE_BY_ID.has(v as ApostleId)

/** 가장 가까이에서 따른 세 제자 — 야이로의 딸·변화산·겟세마네 */
export const INNER_THREE: ApostleId[] = ['peter', 'james', 'john']
export const INNER_THREE_REF = '마가복음 5:37'

// ── 네 목록 — 이름과 순서가 조금씩 다르다 ─────────────────────────
export type ApostleListId = 'mt' | 'mk' | 'lk' | 'acts'

export interface ApostleList {
  id: ApostleListId
  label: string
  ref: string
  members: ApostleId[]
  note: string
}

export const APOSTLE_LISTS: ApostleList[] = [
  {
    id: 'mt', label: '마태복음 10장', ref: '마태복음 10:2',
    members: ['peter', 'andrew', 'james', 'john', 'philip', 'bartholomew', 'thomas', 'matthew', 'jamesAlphaeus', 'thaddaeus', 'simonZealot', 'judas'],
    note: '형제끼리 둘씩 짝지어 불러요. 마태는 자기 이름 앞에 "세리"를 붙였어요.',
  },
  {
    id: 'mk', label: '마가복음 3장', ref: '마가복음 3:16',
    members: ['peter', 'james', 'john', 'andrew', 'philip', 'bartholomew', 'matthew', 'thomas', 'jamesAlphaeus', 'thaddaeus', 'simonZealot', 'judas'],
    note: '가장 가까운 세 제자(베드로·야고보·요한)를 먼저 부르고 새 이름을 함께 적었어요.',
  },
  {
    id: 'lk', label: '누가복음 6장', ref: '누가복음 6:14',
    members: ['peter', 'andrew', 'james', 'john', 'philip', 'bartholomew', 'matthew', 'thomas', 'jamesAlphaeus', 'simonZealot', 'thaddaeus', 'judas'],
    note: '다대오 대신 "야고보의 아들 유다", 가나나인 대신 "셀롯이라는 시몬"이라 불러요. 밤새 기도하신 뒤 택하셨어요.',
  },
  {
    id: 'acts', label: '사도행전 1장', ref: '사도행전 1:13',
    members: ['peter', 'john', 'james', 'andrew', 'philip', 'thomas', 'bartholomew', 'matthew', 'jamesAlphaeus', 'simonZealot', 'thaddaeus', 'matthias'],
    note: '가룟 유다가 빠진 열한 명에, 제비 뽑아 세운 맛디아가 더해져 다시 열둘이 돼요.',
  },
]
