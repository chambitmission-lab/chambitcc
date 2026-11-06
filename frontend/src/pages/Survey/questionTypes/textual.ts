// 글자값 전략 — 단답(text)·장문(long)·시간(time)·날짜(date). 넷 다 value_text 한 칸에 저장한다.
import { baseDraftFromAnswer } from './draft'
import {
  DateField,
  FrequencyStats,
  LongField,
  PlaceholderSettings,
  TextField,
  TextStats,
  TextSummary,
  TimeField,
} from './textualParts'
import type { QuestionTypeStrategy } from './types'

const textualStrategy = (
  meta: Pick<QuestionTypeStrategy, 'label' | 'hint' | 'Field' | 'SettingsEditor' | 'Stats'>
): QuestionTypeStrategy => ({
  ...meta,
  hasOptions: false,
  fromAnswer: (_question, answer) => baseDraftFromAnswer(answer),
  toAnswer: (question, draft) => {
    const text = draft.text.trim()
    if (!text) return null
    return { question_id: question.id, option_ids: null, value_text: text, value_number: null }
  },
  isAnswered: (_question, draft) => draft.text.trim().length > 0,
  Summary: TextSummary,
})

export const textType = textualStrategy({
  label: '단답형',
  hint: '출발 장소처럼 짧게 적는 문항',
  Field: TextField,
  SettingsEditor: PlaceholderSettings,
  Stats: TextStats,
})

export const longType = textualStrategy({
  label: '장문형 (제안)',
  hint: '주차 제안처럼 자유롭게 길게 적는 문항',
  Field: LongField,
  SettingsEditor: PlaceholderSettings,
  Stats: TextStats,
})

export const timeType = textualStrategy({
  label: '시간',
  hint: '희망 출발 시간처럼 시각을 고르는 문항',
  Field: TimeField,
  Stats: FrequencyStats,
})

export const dateType = textualStrategy({
  label: '날짜',
  hint: '희망 날짜를 고르는 문항',
  Field: DateField,
  Stats: FrequencyStats,
})
