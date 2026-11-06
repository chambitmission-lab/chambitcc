// 선택형 전략 — 객관식(single)·체크박스(multi). '기타' 직접입력 가상 보기를 함께 다룬다.
import { ChoiceStats, ChoiceSummary, MultiField, MultiSettings, OtherToggle, SingleField } from './choiceParts'
import { OTHER_OPTION_ID, baseDraftFromAnswer } from './draft'
import type { QuestionTypeStrategy } from './types'

const choiceStrategy = (
  multi: boolean,
  meta: Pick<QuestionTypeStrategy, 'label' | 'hint'>
): QuestionTypeStrategy => ({
  ...meta,
  hasOptions: true,
  fromAnswer: (question, answer) => {
    const draft = baseDraftFromAnswer(answer)
    // '기타' 직접입력이 있으면 가상 보기를 다시 켜 준다
    if (question.settings?.allow_other && draft.text) draft.optionIds = [...draft.optionIds, OTHER_OPTION_ID]
    return draft
  },
  toAnswer: (question, draft) => {
    const text = draft.text.trim()
    // '기타'는 화면에서만 쓰는 가상 보기 — 서버에는 직접입력 텍스트로만 보낸다
    const picked = draft.optionIds.filter((id) => id !== OTHER_OPTION_ID)
    if (!picked.length && !text) return null
    return { question_id: question.id, option_ids: picked, value_text: text || null, value_number: null }
  },
  // '기타'만 켜고 비워 둔 것은 빈 답이다
  isAnswered: (_question, draft) =>
    draft.optionIds.some((id) => id !== OTHER_OPTION_ID) || draft.text.trim().length > 0,
  fieldNote: multi
    ? (question) => {
        const max = question.settings?.max_select
        return max ? `최대 ${max}개까지 선택` : null
      }
    : undefined,
  Field: multi ? MultiField : SingleField,
  Summary: ChoiceSummary,
  SettingsEditor: multi ? MultiSettings : OtherToggle,
  Stats: ChoiceStats,
})

export const singleType = choiceStrategy(false, {
  label: '객관식 (하나 선택)',
  hint: '예 / 아니요, 2부 / 3부 예배처럼 하나만 고르는 문항',
})

export const multiType = choiceStrategy(true, {
  label: '체크박스 (여러 개)',
  hint: '해당하는 것을 모두 고르는 문항',
})
