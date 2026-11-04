// 열두 지파·열두 제자의 id 와 판별 — 가계도 화면(Genealogy.tsx)이 주소(?tribe=, ?apostle=)를 읽을 때 쓴다.
// 카드 데이터(tribes.ts, apostles.ts)는 지파·제자 보기 청크(TwelveView)에만 들어가야 하므로
// 가계도 본체가 필요로 하는 id 목록만 여기 따로 둔다. 데이터 파일은 이 타입을 가져다 쓴다.

export type TribeId =
  | 'reuben' | 'simeon' | 'levi' | 'judah' | 'dan' | 'naphtali'
  | 'gad' | 'asher' | 'issachar' | 'zebulun' | 'joseph' | 'benjamin'
  | 'ephraim' | 'manasseh'

export type ApostleId =
  | 'peter' | 'andrew' | 'james' | 'john'
  | 'philip' | 'bartholomew' | 'thomas' | 'matthew'
  | 'jamesAlphaeus' | 'thaddaeus' | 'simonZealot' | 'judas'
  | 'matthias'

const TRIBE_IDS: ReadonlySet<string> = new Set<TribeId>([
  'reuben', 'simeon', 'levi', 'judah', 'dan', 'naphtali',
  'gad', 'asher', 'issachar', 'zebulun', 'joseph', 'benjamin',
  'ephraim', 'manasseh',
])

const APOSTLE_IDS: ReadonlySet<string> = new Set<ApostleId>([
  'peter', 'andrew', 'james', 'john',
  'philip', 'bartholomew', 'thomas', 'matthew',
  'jamesAlphaeus', 'thaddaeus', 'simonZealot', 'judas',
  'matthias',
])

export const isTribeId = (v: string | null | undefined): v is TribeId => !!v && TRIBE_IDS.has(v)
export const isApostleId = (v: string | null | undefined): v is ApostleId => !!v && APOSTLE_IDS.has(v)
