// 장 개요(단락 소제목) 데이터 타입.
// 콘텐츠는 book01~66.ts 정적 파일(책별 lazy import)이며 백엔드에 저장하지 않는다.
// 단락 구분은 개역개정 문단 구조를 기준으로 하되, 3~6개 내외로 큼직하게 나눈다.

export interface OutlineSection {
  /** 절 범위 [시작, 끝] (포함) */
  v: [number, number]
  /** 단락 소제목 — 12자 내외 */
  title: string
}

/** 장 번호 → 단락 목록 */
export type BookOutline = Record<number, OutlineSection[]>
