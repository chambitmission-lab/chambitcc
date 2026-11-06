// 문항 종류 레지스트리 — 종류별 전략은 여기 한 곳에서만 찾는다.
//
// 새 종류를 늘리려면 ① types/survey.ts 의 SurveyQuestionType(백엔드 QUESTION_TYPES 와 함께),
// ② 전략 파일 하나, ③ 아래 두 표. Record 타입이라 ③을 빠뜨리면 컴파일 에러로 잡힌다.
import type { SurveyQuestionSettings, SurveyQuestionType } from '../../../types/survey'
import { multiType, singleType } from './choice'
import { numberType, ratingType } from './numeric'
import { dateType, longType, textType, timeType } from './textual'
import type { QuestionTypeStrategy } from './types'

export type { QuestionTypeStrategy, FieldProps, SummaryProps, SettingsEditorProps, StatsProps } from './types'
export { OTHER_OPTION_ID, emptyDraft, type AnswerDraft } from './draft'

export const QUESTION_TYPES: Record<SurveyQuestionType, QuestionTypeStrategy> = {
  single: singleType,
  multi: multiType,
  text: textType,
  long: longType,
  number: numberType,
  rating: ratingType,
  time: timeType,
  date: dateType,
}

/** 관리자 문항 추가 메뉴·종류 선택 순서 */
export const QUESTION_TYPE_ORDER: SurveyQuestionType[] = [
  'single',
  'multi',
  'text',
  'long',
  'number',
  'rating',
  'time',
  'date',
]

/** 종류 기본 설정을 비어 있는 키에만 채운다(이미 적힌 값은 그대로) */
export const withDefaultSettings = (
  type: SurveyQuestionType,
  settings: SurveyQuestionSettings
): SurveyQuestionSettings => {
  const defaults = QUESTION_TYPES[type].defaultSettings
  if (!defaults) return settings
  const next = { ...settings }
  for (const key of Object.keys(defaults) as (keyof SurveyQuestionSettings)[]) {
    if (next[key] == null) (next as Record<string, unknown>)[key] = defaults[key]
  }
  return next
}
