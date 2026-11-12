// 책 줄거리 지도(막 구분) 데이터 타입.
// 초심자가 50장을 한 장씩 따로 읽다 길을 잃지 않도록, 책 한 권을 4~6개의 "막"으로 묶어
// 읽는 내내 "지금 어디쯤인지"를 보여 준다. 권 개관(책 소개 글)·오늘의 길잡이(장별 3줄)와
// 달리 이건 책 전체의 뼈대다.
// 콘텐츠는 bookNN.ts 정적 파일(책별 lazy import)이며 백엔드·AI 를 쓰지 않는다.
// 문체: 따뜻한 존댓말, 초·중등 수준의 쉬운 말. 인명·지명은 개역개정 표기.

export interface StoryScene {
  /** 이 장면이 시작되는 장 — 누르면 그 장으로 간다 */
  ch: number
  label: string
}

export interface StoryAct {
  /** 시작 장(포함) */
  from: number
  /** 끝 장(포함) — 다음 막의 from 은 반드시 to + 1 */
  to: number
  /** 막대 아래에 쓰는 짧은 이름 (4자 이내) */
  name: string
  /** 막 제목 — 이 막에서 하나님이 하시는 일 */
  title: string
  /** 한 줄 줄거리 */
  line: string
  /** 꼭 기억할 장면 — 보통 4~5개, 짧은 책은 1~3개. ch 는 이 막의 범위 안 */
  scenes: StoryScene[]
  /** 막을 다 읽었을 때 보여 주는 정리 (3줄) */
  wrap: [string, string, string]
  /** 다음 막 예고 — 마지막 막은 비운다(다음 책 다리는 bridge 가 맡는다) */
  next?: string
}

export interface BookStoryline {
  /** 묶음 단위 이름 — 이야기 책은 '막'(기본), 편지·시가·예언처럼 줄거리가 없는 책은 '부' */
  unit?: '막' | '부'
  /** 띠 머리에 쓰는 말 — 이야기 책은 '줄거리'(기본), 줄거리가 없는 책은 '흐름' */
  label?: '줄거리' | '흐름'
  /** christ 줄의 머리말 — 기본 '예수님께로 이어지는 선'. 복음서처럼 예수님이 주인공인 책은 바꿔 쓴다 */
  christLabel?: string
  /** 이 책이 답하는 질문 */
  question: string
  /** 책 전체를 꿰는 한 문장 */
  thread: string
  /** 예수님께로 이어지는 선 한 줄 */
  christ: string
  /** 다음 책으로 넘어가는 다리 (요한계시록은 성경 전체를 맺는 말) */
  bridge: string
  /** 장 수가 1인 책은 한 묶음만 둔다 */
  acts: StoryAct[]
}
