// 쉽게 풀어 읽기 데이터 타입.
// 개역개정 문체("~하였느니라", "~할지니")에서 막히는 초심자를 위해, 장 개요의 단락마다
// 오늘의 말로 풀어 쓴 2~3문장을 붙인다. 번역이 아니라 "풀이"다 — 새 해석·교리 주장은 넣지 않는다.
// 콘텐츠는 book01~66.ts 정적 파일(책별 lazy import)이며 백엔드에 저장하지 않는다.
// 키는 chapterOutlines 의 단락 시작 절(OutlineSection.v[0]) — 개요 범위를 바꾸면 여기 키도 같이 옮길 것.
// 문체: 따뜻한 해요체, 단락당 2~3문장(80~160자), 인명·지명은 개역개정 표기.

/** 단락 시작 절 → 풀이 */
export type ChapterParaphrase = Record<number, string>

/** 장 번호 → 단락별 풀이 */
export type BookParaphrase = Record<number, ChapterParaphrase>
