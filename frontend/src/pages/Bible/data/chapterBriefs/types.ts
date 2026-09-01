// 오늘의 길잡이(장 브리핑) 데이터 타입.
// 초심자가 "무작정 읽기"에 빠지지 않도록, 장을 열자마자 보이는 아주 짧은 지도다.
// 콘텐츠는 book01~66.ts 정적 파일(책별 lazy import)이며 백엔드에 저장하지 않는다.
// 문체: 따뜻한 존댓말, 각 줄 한 문장(recap·now ~55자, watch ~65자 내외).
// 인명·지명은 개역개정 표기를 따른다.

export interface ChapterBrief {
  /** ① 지금까지 — 이 장 직전까지의 흐름 한 줄 (1장은 책의 문을 여는 말) */
  recap: string
  /** ② 이 장에서 — 벌어지는 일 한 줄 */
  now: string
  /** ③ 눈여겨보기 — 읽으며 붙잡을 포인트 하나 */
  watch: string
}

/** 장 번호 → 브리핑 */
export type BookBriefs = Record<number, ChapterBrief>
