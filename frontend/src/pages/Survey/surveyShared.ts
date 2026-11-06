// 설문 화면 공통 — 상태 배지, 폼 클래스, 날짜 표기, 답 초안 변환
//
// 문항 종류별 동작(입력·저장·요약·집계)은 questionTypes/ 레지스트리가 가진다.
// 여기 변환 함수들은 문항마다 알맞은 전략을 찾아 넘길 뿐 종류를 직접 분기하지 않는다.
import type { SurveyAnswerValue, SurveyQuestion, SurveyStatus, SurveySummary } from '../../types/survey'
import { QUESTION_TYPES, emptyDraft, type AnswerDraft } from './questionTypes'

export { QUESTION_TYPES, QUESTION_TYPE_ORDER, OTHER_OPTION_ID, emptyDraft, type AnswerDraft } from './questionTypes'
export { inputCls, labelCls, cardCls } from './surveyStyles'
export { formatDate, formatDateTime } from './surveyFormat'

export const STATUS_META: Record<SurveyStatus, { label: string; badge: string }> = {
  draft: {
    label: '작성 중',
    badge:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/45 dark:border-white/[0.08]',
  },
  open: {
    label: '진행 중',
    badge: 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]',
  },
  closed: {
    label: '마감',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  },
}

/** 보기 id — 라벨을 고쳐도 집계가 유지되도록 새로 만들 때 한 번만 부여한다 */
export const newOptionId = (): string =>
  `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** 마감일 계산은 surveyDates.ts — 홈 배너가 이 파일 전체를 끌지 않도록 떼어 두고 여기서 재수출 */
export { daysLeft } from './surveyDates'

/**
 * 화면에 보여줄 상태 — 마감일이 지나면 서버 status 가 아직 open 이어도 '마감'이 사실이다.
 * (본문은 '마감된 설문입니다'라고 하는데 배지만 '진행 중'이면 서로 어긋나 보인다)
 */
export const displayStatus = (survey: SurveySummary): SurveyStatus => {
  if (survey.status === 'open' && survey.ends_at && new Date(survey.ends_at).getTime() < Date.now()) {
    return 'closed'
  }
  return survey.status
}

/** 지금 응답을 받을 수 있는 설문인가 (마감일이 지났으면 상태와 무관하게 닫힘) */
export const isAcceptingResponses = (survey: SurveySummary): boolean => {
  if (survey.status !== 'open') return false
  if (survey.ends_at && new Date(survey.ends_at).getTime() < Date.now()) return false
  if (survey.starts_at && new Date(survey.starts_at).getTime() > Date.now()) return false
  return true
}

// ── 답 초안 ───────────────────────────────────────────────────────────

/** 서버가 내려준 내 답 → 폼 초안('기타' 가상 보기 복원까지 전략이 맡는다) */
export const draftsFromAnswers = (
  questions: SurveyQuestion[],
  answers: SurveyAnswerValue[]
): Record<number, AnswerDraft> => {
  const byQuestion = new Map(answers.map((a) => [a.question_id, a]))
  const drafts: Record<number, AnswerDraft> = {}
  for (const q of questions) {
    drafts[q.id] = QUESTION_TYPES[q.type].fromAnswer(q, byQuestion.get(q.id))
  }
  return drafts
}

/** 폼 상태 → 제출 payload. 빈 답은 보내지 않는다 */
export const draftsToAnswers = (
  questions: SurveyQuestion[],
  drafts: Record<number, AnswerDraft>
): SurveyAnswerValue[] => {
  const out: SurveyAnswerValue[] = []
  for (const q of questions) {
    const draft = drafts[q.id]
    if (!draft) continue
    const answer = QUESTION_TYPES[q.type].toAnswer(q, draft)
    if (answer) out.push(answer)
  }
  return out
}

/** 아직 답하지 않은 필수 문항 전부 — PC 레일이 "빠진 문항" 목록으로 보여 준다 */
export const findAllMissingRequired = (
  questions: SurveyQuestion[],
  drafts: Record<number, AnswerDraft>
): SurveyQuestion[] =>
  questions.filter((q) => q.is_required && !QUESTION_TYPES[q.type].isAnswered(q, drafts[q.id] ?? emptyDraft()))

/** 제출 전 필수 문항 검사 — 비어 있는 첫 문항의 안내 문구를 돌려준다 */
export const findMissingRequired = (
  questions: SurveyQuestion[],
  drafts: Record<number, AnswerDraft>
): { question: SurveyQuestion; message: string } | null => {
  const [first] = findAllMissingRequired(questions, drafts)
  return first ? { question: first, message: `'${first.title}' 에 답해주세요` } : null
}

/** 목록 카드·배너의 액션 문구 — 상태별로 말투가 흩어지지 않게 한곳에서 정한다 */
export const surveyActionLabel = (survey: SurveySummary): string => {
  if (isAcceptingResponses(survey)) return survey.my_response_id ? '응답 수정' : '참여하기'
  if (survey.my_response_id) return '내 응답 보기'
  return survey.is_result_public ? '결과 보기' : '자세히 보기'
}
