// "처음 만나는 성경" 스토리 모드 — 데이터 타입.
// 콘텐츠는 data/act01~10.ts 정적 파일, 진행 상태는 서버 저장(storyProgress.ts).
// 절 본문은 하드코딩하지 않고 기존 /bible/verse API로 런타임에 가져온다(번역본 일치).

export interface StoryVerseRef {
  /** book_number 1~66 */
  book: number
  chapter: number
  /** 보여줄 절 번호들 (1~3개 권장) */
  verses: number[]
  /** 표기 라벨 — 예: '창세기 1:1, 31' */
  label: string
}

export interface StoryEpisode {
  /** 전역 유일 슬러그 — URL(/bible/story/:id)과 진행 저장 키로 쓰인다. 바꾸면 사용자 진행이 초기화되므로 불변 */
  id: string
  emoji: string
  title: string
  /** 도입 한 줄 질문/카피 — 여정 맵 노드와 카드 상단에 노출 */
  hook: string
  /** 이야기 본문 문단들. {{용어}} 또는 {{표시어|용어}} 마크업은 glossary.ts 풋노트로 렌더 */
  story: string[]
  /** "왜 중요할까" 한 문단 */
  why: string
  /** 원문 맛보기 — 실제 성경 절 인용 */
  verseRefs: StoryVerseRef[]
  /** '성경에서 직접 읽기' 딥링크 */
  readLink: { book: number; chapter: number; verse?: number; label: string }
  /** 다음 화 예고 한 줄 (마지막 화는 생략) */
  teaser?: string
}

export interface StoryAct {
  act: number
  title: string
  subtitle: string
  emoji: string
  /** 다루는 성경 범위 표기 — 예: '창세기 1–11장' */
  range: string
  episodes: StoryEpisode[]
}
