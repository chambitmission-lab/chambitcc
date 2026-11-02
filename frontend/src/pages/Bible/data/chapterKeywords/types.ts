// 이 장의 열쇠말 — 장마다 "반복해서 강조하는 말" 1~2개.
// 단순 빈도(여호와·이르되·그들이…)가 아니라, 본문이 일부러 되풀이하는 말을 사람이 골라 둔다.
// 콘텐츠는 bookNN.ts 정적 파일(책별 lazy import), 백엔드에 저장하지 않는다.
// 반복이 뚜렷하지 않은 장은 억지로 넣지 않고 비워 둔다(카드에서 줄이 빠진다).
//
// 문체: 따뜻한 해요체, 개역개정 표기. meaning ~45자, why ~100자 내외.
// count 는 손으로 세지 말고 scripts/check-chapter-keywords.mjs 로 검증한다
// (match 의 각 글자가 이 장 개역개정 본문에 나오는 횟수의 합).

export interface KeywordOriginal {
  /** he = 히브리어, gr = 헬라어 */
  lang: 'he' | 'gr'
  /** 원어 글자 */
  script: string
  /** 한글 발음 */
  sound: string
  /** 원어의 결 — 한 줄 */
  gloss: string
}

export interface KeywordLink {
  /** "출애굽기 2:24" — parseBibleReference 로 이동 버튼이 된다 */
  ref: string
  note: string
}

export interface ChapterKeyword {
  /** 칩·시트 제목에 보이는 말 */
  word: string
  /** 본문에서 찾아 밝힐 글자들 (활용형 공통 부분) */
  match: string[]
  /** 이 장에서 match 가 나오는 횟수 — 검증 스크립트로 확인 */
  count: number
  /** 뜻 한 줄 */
  meaning: string
  original?: KeywordOriginal
  /** 왜 이 장이 이 말을 되풀이하는지 — 읽을 때 붙잡을 포인트 */
  why: string
  /** 같은 말이 의미 있게 다시 나오는 곳 (0~3개) */
  alsoIn?: KeywordLink[]
}

/** 장 번호 → 열쇠말 (1~2개) */
export type BookKeywords = Record<number, ChapterKeyword[]>
