// 숫자값 전략 — 숫자(number)·별점(rating). 둘 다 value_number 한 칸에 저장한다.
import { baseDraftFromAnswer } from './draft'
import {
  NumberField,
  NumberSettings,
  NumberStats,
  NumberSummaryView,
  RatingField,
  RatingSettings,
  RatingStats,
  RatingSummaryView,
} from './numericParts'
import type { QuestionTypeStrategy } from './types'

const numericStrategy = (
  meta: Pick<QuestionTypeStrategy, 'label' | 'hint' | 'defaultSettings' | 'Field' | 'Summary' | 'SettingsEditor' | 'Stats'>
): QuestionTypeStrategy => ({
  ...meta,
  hasOptions: false,
  fromAnswer: (_question, answer) => baseDraftFromAnswer(answer),
  toAnswer: (question, draft) => {
    if (draft.number === '') return null
    const n = Number(draft.number)
    if (Number.isNaN(n)) return null
    return { question_id: question.id, option_ids: null, value_text: null, value_number: n }
  },
  isAnswered: (_question, draft) => draft.number !== '',
})

export const numberType = numericStrategy({
  label: '숫자 (인원 등)',
  hint: '성인 ( )명 처럼 합계·평균이 필요한 문항',
  Field: NumberField,
  Summary: NumberSummaryView,
  SettingsEditor: NumberSettings,
  Stats: NumberStats,
})

export const ratingType = numericStrategy({
  label: '별점',
  hint: '만족도를 1~5로 받는 문항',
  defaultSettings: { max: 5 },
  Field: RatingField,
  Summary: RatingSummaryView,
  SettingsEditor: RatingSettings,
  Stats: RatingStats,
})
