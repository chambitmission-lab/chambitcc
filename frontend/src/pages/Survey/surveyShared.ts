// 설문 화면 공통 — 문항 종류 표, 상태 배지, 폼 클래스, 답 초안 변환
//
// 성도용(SurveyDetail)·관리자용(SurveyManagement) 두 화면이 같은 문항 정의를 다루므로
// "문항 종류가 무엇을 뜻하는가"는 여기 한 곳에만 둔다.
import type {
  SurveyAnswerValue,
  SurveyQuestion,
  SurveyQuestionType,
  SurveyStatus,
  SurveySummary,
} from '../../types/survey'

export interface QuestionTypeMeta {
  label: string
  /** 관리자 문항 추가 메뉴에 뜨는 한 줄 설명 */
  hint: string
  /** 보기 목록을 편집해야 하는 종류인가 */
  hasOptions: boolean
}

export const QUESTION_TYPE_META: Record<SurveyQuestionType, QuestionTypeMeta> = {
  single: { label: '객관식 (하나 선택)', hint: '예 / 아니요, 2부 / 3부 예배처럼 하나만 고르는 문항', hasOptions: true },
  multi: { label: '체크박스 (여러 개)', hint: '해당하는 것을 모두 고르는 문항', hasOptions: true },
  text: { label: '단답형', hint: '출발 장소처럼 짧게 적는 문항', hasOptions: false },
  long: { label: '장문형 (제안)', hint: '주차 제안처럼 자유롭게 길게 적는 문항', hasOptions: false },
  number: { label: '숫자 (인원 등)', hint: '성인 ( )명 처럼 합계·평균이 필요한 문항', hasOptions: false },
  rating: { label: '별점', hint: '만족도를 1~5로 받는 문항', hasOptions: false },
  time: { label: '시간', hint: '희망 출발 시간처럼 시각을 고르는 문항', hasOptions: false },
  date: { label: '날짜', hint: '희망 날짜를 고르는 문항', hasOptions: false },
}

/** '기타' 직접입력이 켜진 선택형에서 쓰는 가상 보기 id (화면 전용 — 서버로 보내지 않는다) */
export const OTHER_OPTION_ID = '__other__'

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

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

export const labelCls =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

export const cardCls =
  'rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm'

/** 보기 id — 라벨을 고쳐도 집계가 유지되도록 새로 만들 때 한 번만 부여한다 */
export const newOptionId = (): string =>
  `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const formatDate = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 마감일까지 남은 날 — 오늘 마감이면 0, 이미 지났으면 음수 */
export const daysLeft = (endsAt?: string | null): number | null => {
  if (!endsAt) return null
  const end = new Date(endsAt)
  if (Number.isNaN(end.getTime())) return null
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((startOfDay(end) - startOfDay(new Date())) / 86400000)
}

/** 지금 응답을 받을 수 있는 설문인가 (마감일이 지났으면 상태와 무관하게 닫힘) */
export const isAcceptingResponses = (survey: SurveySummary): boolean => {
  if (survey.status !== 'open') return false
  if (survey.ends_at && new Date(survey.ends_at).getTime() < Date.now()) return false
  if (survey.starts_at && new Date(survey.starts_at).getTime() > Date.now()) return false
  return true
}

// ── 답 초안 ───────────────────────────────────────────────────────────

/** 폼이 들고 있는 한 문항의 입력 상태. 숫자도 입력 중엔 문자열로 둔다(지우는 중 0 이 되지 않게) */
export interface AnswerDraft {
  optionIds: string[]
  text: string
  number: string
}

export const emptyDraft = (): AnswerDraft => ({ optionIds: [], text: '', number: '' })

export const draftsFromAnswers = (
  questions: SurveyQuestion[],
  answers: SurveyAnswerValue[]
): Record<number, AnswerDraft> => {
  const byQuestion = new Map(answers.map((a) => [a.question_id, a]))
  const drafts: Record<number, AnswerDraft> = {}
  for (const q of questions) {
    const a = byQuestion.get(q.id)
    drafts[q.id] = {
      optionIds: a?.option_ids ?? [],
      text: a?.value_text ?? '',
      number: a?.value_number === null || a?.value_number === undefined ? '' : String(a.value_number),
    }
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
    const text = draft.text.trim()

    if (q.type === 'single' || q.type === 'multi') {
      // '기타'는 화면에서만 쓰는 가상 보기 — 서버에는 직접입력 텍스트로만 보낸다
      const picked = draft.optionIds.filter((id) => id !== OTHER_OPTION_ID)
      if (!picked.length && !text) continue
      out.push({
        question_id: q.id,
        option_ids: picked,
        value_text: text || null,
        value_number: null,
      })
      continue
    }

    if (q.type === 'number' || q.type === 'rating') {
      if (draft.number === '') continue
      const n = Number(draft.number)
      if (Number.isNaN(n)) continue
      out.push({ question_id: q.id, option_ids: null, value_text: null, value_number: n })
      continue
    }

    if (!text) continue
    out.push({ question_id: q.id, option_ids: null, value_text: text, value_number: null })
  }
  return out
}

/** 제출 전 필수 문항 검사 — 비어 있는 첫 문항의 안내 문구를 돌려준다 */
export const findMissingRequired = (
  questions: SurveyQuestion[],
  drafts: Record<number, AnswerDraft>
): { question: SurveyQuestion; message: string } | null => {
  for (const q of questions) {
    if (!q.is_required) continue
    const draft = drafts[q.id] ?? emptyDraft()
    const filled =
      q.type === 'single' || q.type === 'multi'
        ? draft.optionIds.some((id) => id !== OTHER_OPTION_ID) || draft.text.trim().length > 0
        : q.type === 'number' || q.type === 'rating'
          ? draft.number !== ''
          : draft.text.trim().length > 0
    if (!filled) {
      return { question: q, message: `'${q.title}' 에 답해주세요` }
    }
  }
  return null
}
