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
  /**
   * 특별편 '약속의 실' 전용 — 구약의 약속(verseRefs)과 신약의 성취를 한 쌍으로 보여 준다.
   * 있으면 원문 맛보기 자리가 '약속 → 성취' 카드로 바뀐다.
   */
  promise?: StoryPromise
}

export interface StoryPromise {
  /** 'prophecy' 말씀으로 미리 하신 약속 · 'type' 사람·사건·제도가 미리 보여 준 그림(예표) */
  kind: 'prophecy' | 'type'
  /** 신약이 직접 인용·연결한 성취 구절 */
  fulfillRefs: StoryVerseRef[]
  /** 성취를 한 줄로 */
  fulfillNote: string
}

export interface StoryAct {
  /** 본편 1~10. 특별편은 0 */
  act: number
  /** 막 번호 대신 보여 줄 표식 — 특별편 '특별편' */
  badge?: string
  title: string
  subtitle: string
  emoji: string
  /** 다루는 성경 범위 표기 — 예: '창세기 1–11장' */
  range: string
  episodes: StoryEpisode[]
}

/**
 * 목차 항목 — 지도(StoryMap)·완주 벽화·에피소드 히어로가 쓰는 가벼운 메타.
 * 본문(story·why·verseRefs…)은 막 단위 청크(data/actNN.ts)에 두고 읽을 때만 받는다.
 * data/toc.ts 는 생성 파일이다 — `npm run gen:story-toc` 로 다시 만든다.
 */
export type StoryEpisodeToc = Pick<StoryEpisode, 'id' | 'emoji' | 'title' | 'hook'> & {
  /** 특별편 화의 성격 — 지도 카드 라벨('예언'·'예표')에 쓴다 */
  promiseKind?: StoryPromise['kind']
}

export type StoryActToc = Omit<StoryAct, 'episodes'> & { episodes: StoryEpisodeToc[] }
