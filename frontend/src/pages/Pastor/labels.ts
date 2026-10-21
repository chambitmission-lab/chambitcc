// 목회자 화면 라벨·아이콘 — API 모듈(api/pastor)에서 분리한 표시용 상수.
// 종류(kind) 타입은 API 가 정하고, 사람 말과 Material 아이콘 이름은 여기서 붙인다.
import type { NoteKind, SituationKind, VisitKind } from '../../api/pastor'

export const VISIT_KIND_LABEL: Record<VisitKind, string> = {
  visit: '가정 심방',
  call: '전화',
  hospital: '병문안',
  counsel: '상담',
  message: '문자·메시지',
  other: '기타',
}

export const VISIT_KIND_ICON: Record<VisitKind, string> = {
  visit: 'home',
  call: 'call',
  hospital: 'local_hospital',
  counsel: 'forum',
  message: 'sms',
  other: 'more_horiz',
}

export const SITUATION_KIND_LABEL: Record<SituationKind, string> = {
  illness: '투병·입원',
  bereavement: '사별',
  birth: '출산',
  move: '이사',
  job: '실직·구직',
  family: '가정의 어려움',
  other: '기타',
}

export const SITUATION_KIND_ICON: Record<SituationKind, string> = {
  illness: 'local_hospital',
  bereavement: 'local_florist',
  birth: 'child_friendly',
  move: 'local_shipping',
  job: 'work_outline',
  family: 'home',
  other: 'more_horiz',
}

/** 시작일을 무엇이라 부를지 — 입력 칸 이름 */
export const SITUATION_START_LABEL: Record<SituationKind, string> = {
  illness: '입원·진단한 날',
  bereavement: '장례일',
  birth: '출산일',
  move: '이사한 날',
  job: '일을 놓은 날',
  family: '알게 된 날',
  other: '시작한 날',
}

/** 목회 비서가 언제 짚어 드리는지 — 고를 때 한 줄로 알려 준다 (서버 SITUATION_RULES 와 같은 내용) */
export const SITUATION_RULE_HINT: Record<SituationKind, string> = {
  illness: '겪는 동안 2주마다 심방이 없으면 알려 드려요',
  bereavement: '장례 후 한 주 · 한 달 · 1주기에 알려 드려요',
  birth: '출산 2주 · 아기 백일에 알려 드려요',
  move: '이사 직후 이사 심방 때를 알려 드려요',
  job: '겪는 동안 3주마다 심방이 없으면 알려 드려요',
  family: '겪는 동안 3주마다 심방이 없으면 알려 드려요',
  other: '겪는 동안 한 달마다 심방이 없으면 알려 드려요',
}

export const NOTE_KIND_LABEL: Record<NoteKind, string> = {
  idea: '아이디어',
  illustration: '예화',
  life: '삶의 이야기',
  quote: '인용·책',
  question: '질문',
}

export const NOTE_KIND_ICON: Record<NoteKind, string> = {
  idea: 'lightbulb',
  illustration: 'auto_stories',
  life: 'favorite_border',
  quote: 'format_quote',
  question: 'help_outline',
}
