// 답 초안 — 폼이 들고 있는 한 문항의 입력 상태.
// 문항 종류 전략(questionTypes)과 surveyShared 양쪽이 쓰므로 둘 다에서 떼어 둔다(순환 import 방지).
import type { SurveyAnswerValue } from '../../../types/survey'

/** 숫자도 입력 중엔 문자열로 둔다(지우는 중 0 이 되지 않게) */
export interface AnswerDraft {
  optionIds: string[]
  text: string
  number: string
}

export const emptyDraft = (): AnswerDraft => ({ optionIds: [], text: '', number: '' })

/** '기타' 직접입력이 켜진 선택형에서 쓰는 가상 보기 id (화면 전용 — 서버로 보내지 않는다) */
export const OTHER_OPTION_ID = '__other__'

/** 서버 답 → 초안의 공통 변환. 종류별 보정(예: '기타' 복원)은 각 전략이 이 위에 얹는다 */
export const baseDraftFromAnswer = (a?: SurveyAnswerValue): AnswerDraft => ({
  optionIds: a?.option_ids ?? [],
  text: a?.value_text ?? '',
  number: a?.value_number === null || a?.value_number === undefined ? '' : String(a.value_number),
})
