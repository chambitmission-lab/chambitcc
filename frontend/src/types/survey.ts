// 설문조사 타입 — backend app/schemas/survey.py 와 1:1

export type SurveyStatus = 'draft' | 'open' | 'closed'

/** 문항 종류 — 새 종류는 여기와 백엔드 QUESTION_TYPES 를 함께 늘린다 */
export type SurveyQuestionType =
  | 'single' // 단일 선택 (라디오)
  | 'multi' // 복수 선택 (체크박스)
  | 'text' // 단답형
  | 'long' // 장문형 (제안·의견)
  | 'number' // 숫자 (인원 등)
  | 'rating' // 별점
  | 'time' // 시간
  | 'date' // 날짜

export interface SurveyOption {
  /** 라벨을 고쳐도 집계가 유지되도록 보기마다 고정 id 를 둔다 */
  id: string
  label: string
}

export interface SurveyQuestionSettings {
  unit?: string // 숫자 단위 (명, 개 …)
  min?: number
  max?: number // 숫자 상한 / 별점 만점
  max_select?: number // 복수 선택 최대 개수
  allow_other?: boolean // '기타' 직접입력 허용
  placeholder?: string
}

export interface SurveyQuestion {
  id: number
  type: SurveyQuestionType
  title: string
  description?: string | null
  is_required: boolean
  display_order: number
  options?: SurveyOption[] | null
  settings?: SurveyQuestionSettings | null
}

/** 관리자 편집용 — 새 문항은 id 가 없다 */
export interface SurveyQuestionDraft extends Omit<SurveyQuestion, 'id' | 'display_order'> {
  id?: number
  display_order?: number
}

export interface SurveySummary {
  id: number
  title: string
  description?: string | null
  status: SurveyStatus
  starts_at?: string | null
  ends_at?: string | null
  is_result_public: boolean
  allow_edit: boolean
  show_on_home: boolean
  display_order: number
  question_count: number
  response_count: number
  created_at?: string | null
  updated_at?: string | null
  my_response_id?: number | null
  my_responded_at?: string | null
}

export interface SurveyAnswerValue {
  question_id: number
  option_ids?: string[] | null
  value_text?: string | null
  value_number?: number | null
}

export interface SurveyDetail extends SurveySummary {
  thank_you_message?: string | null
  questions: SurveyQuestion[]
  my_answers: SurveyAnswerValue[]
}

export interface SurveyResponseResult {
  id: number
  survey_id: number
  user_id?: number | null
  user_name?: string | null
  created_at?: string | null
  updated_at?: string | null
  answers: SurveyAnswerValue[]
}

// ── 통계 ──────────────────────────────────────────────────────────────

export interface SurveyOptionStat {
  id: string
  label: string
  count: number
  percent: number
}

export interface SurveyNumberStat {
  count: number
  total: number
  average: number
  min: number
  max: number
}

export interface SurveyTextAnswer {
  response_id: number
  user_name?: string | null
  value: string
  created_at?: string | null
}

export interface SurveyQuestionStat {
  question_id: number
  type: SurveyQuestionType
  title: string
  is_required: boolean
  answered_count: number
  options: SurveyOptionStat[]
  number?: SurveyNumberStat | null
  texts: SurveyTextAnswer[]
  unit?: string | null
}

export interface SurveyStats {
  survey_id: number
  title: string
  status: SurveyStatus
  response_count: number
  questions: SurveyQuestionStat[]
}

// ── 요청 ──────────────────────────────────────────────────────────────

export interface CreateSurveyRequest {
  title: string
  description?: string | null
  status?: SurveyStatus
  starts_at?: string | null
  ends_at?: string | null
  is_result_public?: boolean
  allow_edit?: boolean
  show_on_home?: boolean
  thank_you_message?: string | null
  display_order?: number
  questions: SurveyQuestionDraft[]
}

export type UpdateSurveyRequest = Partial<CreateSurveyRequest>

export interface SubmitSurveyRequest {
  answers: SurveyAnswerValue[]
}
