// 성경 지도여행 — 데이터 타입.
//
// 스토리 모드(storyTypes.ts)와 같은 규약을 따른다:
//   콘텐츠는 data/*.ts 정적 파일, 진행 상태만 서버 저장(atlasProgress.ts).
//   성경 본문은 하드코딩하지 않고 /bible 딥링크로 넘긴다(번역본 일치).

/** 성경 본문 딥링크 — /bible/{book}/{chapter}?verse= */
export interface AtlasRef {
  /** book_number 1~66 */
  book: number
  chapter: number
  verse?: number
  /** 표기 라벨 — 예: '사도행전 13:2' */
  label: string
}

/** 이 장소에서 일어난 일 — 핀 카드에 연대순으로 3개까지 */
export interface PlaceEvent {
  text: string
  ref: AtlasRef
}

export interface AtlasPlace {
  /** 전역 유일 슬러그 — 방문 진행 저장 키. 바꾸면 사용자 도장이 초기화되므로 불변 */
  id: string
  /** 개역개정 표기 */
  name: string
  /** 같은 이름이 여럿일 때 구분 표기 — 예: '수리아', '비시디아' */
  qualifier?: string
  /** 오늘의 그 자리 — 초보자가 "지금 어디?"에 답을 얻는 줄 */
  modern: string
  lat: number
  lng: number
  /** 한 줄 소개 */
  blurb: string
  /** 이곳에서 일어난 일 (연대순) */
  events?: PlaceEvent[]
  /** 관련 인물 — 가계도(/bible/genealogy) 검색어로 넘긴다 */
  figures?: string[]
  /** 라벨이 다른 핀과 겹칠 때 수동 보정 (지도 좌표 단위) */
  labelNudge?: { x: number; y: number }
}

/** 여정의 한 지점 */
export interface JourneyStop {
  /** AtlasPlace.id — 왕복 구간에선 같은 장소가 다시 나올 수 있다 */
  place: string
  /** 이 지점에서 일어난 일 제목 */
  title: string
  /** 걸어보기 자막 한 줄 — 읽지 않아도 흐름이 들어오게 */
  narration: string
  ref?: AtlasRef
  /** 직전 지점에서 여기까지가 바닷길인가 (선 스타일이 달라진다) */
  sea?: boolean
  /** 곡선 휨 보정 — 왕복 구간이 겹쳐 보일 때 부호를 뒤집는다 */
  bow?: number
}

/** 여정 묶음 — 화면 상단 트랙 선택 칩의 그룹 */
export type JourneyGroup = 'ot' | 'gospel' | 'acts'

export interface AtlasJourney {
  /** 불변 슬러그 — URL(?j=)과 완주 칭호 키 */
  id: string
  group: JourneyGroup
  title: string
  /** 트랙 선택 칩에 쓰는 짧은 이름 — 8개가 가로로 늘어서므로 긴 제목은 들어가지 않는다 */
  short: string
  /** 부제 — 한 줄 요약 */
  subtitle: string
  /** 시대 표기 — 예: 'BC 2000년경' */
  era: string
  /** 성경 범위 — 예: '사도행전 13–14장' */
  scripture: string
  /**
   * 트랙 색. 브랜드 블루가 기본이지만, 여러 여정이 한 지도에 겹칠 때는
   * 지하철 노선처럼 색이 곧 식별자라 여정마다 다른 색을 쓴다
   * (게임 시맨틱 색과 같은 성격의 의도된 예외).
   */
  color: string
  /** 초보자 훅 — 이 여정을 왜 걸어야 하는지 한 줄 */
  hook: string
  stops: JourneyStop[]
}
