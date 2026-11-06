// 문항 종류 전략 — "이 종류는 어떻게 입력받고·저장하고·요약하고·집계하는가"를 한 객체에 모은다.
//
// 새 문항 종류를 추가할 때는 여기 계약에 맞는 전략 하나를 만들어 index.ts 레지스트리에
// 넣으면 끝이다. 응답 폼·관리자 빌더·통계 화면은 레지스트리만 보고 그리므로 손댈 곳이 없다.
import type { ComponentType } from 'react'
import type {
  SurveyAnswerValue,
  SurveyQuestion,
  SurveyQuestionSettings,
  SurveyQuestionStat,
} from '../../../types/survey'
import type { AnswerDraft } from './draft'

/** 응답 입력 UI */
export interface FieldProps {
  question: SurveyQuestion
  draft: AnswerDraft
  patch: (next: Partial<AnswerDraft>) => void
  disabled?: boolean
  /** PC(lg+)에서 크게 — 성도 응답 화면 전용 */
  large?: boolean
}

/** 제출한 답을 다시 볼 때의 읽기 전용 요약 */
export interface SummaryProps {
  question: SurveyQuestion
  draft: AnswerDraft
  large?: boolean
}

/** 관리자 빌더의 종류별 부가 설정 줄 */
export interface SettingsEditorProps {
  settings: SurveyQuestionSettings
  patchSettings: (next: Partial<SurveyQuestionSettings>) => void
}

/** 통계 카드 본문(머리말·응답 수는 카드가 그린다) */
export interface StatsProps {
  stat: SurveyQuestionStat
  showNames: boolean
}

export interface QuestionTypeStrategy {
  label: string
  /** 관리자 문항 추가 메뉴에 뜨는 한 줄 설명 */
  hint: string
  /** 보기 목록을 편집해야 하는 종류인가 */
  hasOptions: boolean
  /** 새 문항·종류 변경 시 비어 있으면 채워 주는 설정 */
  defaultSettings?: SurveyQuestionSettings
  /** 서버 답 → 폼 초안 */
  fromAnswer: (question: SurveyQuestion, answer: SurveyAnswerValue | undefined) => AnswerDraft
  /** 폼 초안 → 제출 payload. 빈 답이면 null (보내지 않는다) */
  toAnswer: (question: SurveyQuestion, draft: AnswerDraft) => SurveyAnswerValue | null
  /** 필수 문항 검사용 — 답이 채워졌는가 */
  isAnswered: (question: SurveyQuestion, draft: AnswerDraft) => boolean
  /** 제목 아래 안내 한 줄(예: "최대 2개까지 선택") */
  fieldNote?: (question: SurveyQuestion) => string | null
  Field: ComponentType<FieldProps>
  Summary: ComponentType<SummaryProps>
  SettingsEditor?: ComponentType<SettingsEditorProps>
  Stats: ComponentType<StatsProps>
}
