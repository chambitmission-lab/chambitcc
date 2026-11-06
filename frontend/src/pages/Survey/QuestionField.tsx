// 설문 문항 하나 — 번호·제목·설명 틀을 그리고, 종류별 입력/요약은 레지스트리 전략에 맡긴다.
// 관리자 미리보기와 성도 응답 폼이 같은 컴포넌트를 쓴다(보이는 대로 답한다).
import type { SurveyQuestion } from '../../types/survey'
import { QUESTION_TYPES, type AnswerDraft, emptyDraft } from './questionTypes'

interface Props {
  question: SurveyQuestion
  value?: AnswerDraft
  onChange: (next: AnswerDraft) => void
  /** 입력은 그대로 두되 손댈 수 없게 (관리자 미리보기) */
  disabled?: boolean
  /** 제출한 답을 다시 볼 때 — 입력 대신 '내가 고른 답'만 보여준다 */
  view?: boolean
  index: number
  /** PC(lg+)에서 제목·보기·입력칸을 크게 — 성도 응답 화면 전용(관리자 미리보기는 그대로). 모바일 무변경 */
  large?: boolean
}

const QuestionField = ({ question, value, onChange, disabled, view, index, large = false }: Props) => {
  const draft = value ?? emptyDraft()
  const strategy = QUESTION_TYPES[question.type]
  const note = !view && strategy.fieldNote ? strategy.fieldNote(question) : null
  const patch = (next: Partial<AnswerDraft>) => onChange({ ...draft, ...next })

  return (
    <div>
      <div className={`flex items-start gap-2 mb-1 ${large ? 'lg:gap-3' : ''}`}>
        <span
          className={`mt-[3px] shrink-0 w-5 h-5 rounded-full bg-[var(--brand-soft)] text-brand text-[11px] font-bold flex items-center justify-center tabular-nums ${
            large ? 'lg:mt-0 lg:w-8 lg:h-8 lg:text-[15px]' : ''
          }`}
        >
          {index}
        </span>
        <div className="min-w-0">
          <p className={`text-[15px] font-semibold text-ink-strong leading-snug ${large ? 'lg:text-[20px] lg:font-bold lg:tracking-[-0.02em] lg:leading-[1.4]' : ''}`}>
            {question.title}
            {question.is_required ? (
              large ? (
                <span className="ml-1 text-red-500">
                  *<span className="hidden lg:inline ml-1 align-middle text-[13px] font-bold">필수</span>
                </span>
              ) : (
                <span className="ml-1 text-red-500">*</span>
              )
            ) : null}
          </p>
          {question.description ? (
            <p className={`mt-0.5 text-[12.5px] text-ink-muted leading-relaxed ${large ? 'lg:mt-1 lg:text-[15.5px]' : ''}`}>{question.description}</p>
          ) : null}
          {note ? (
            <p className={`mt-0.5 text-[12px] text-brand ${large ? 'lg:mt-1 lg:text-[15px] lg:font-semibold' : ''}`}>{note}</p>
          ) : null}
        </div>
      </div>

      <div className={`mt-2.5 pl-7 space-y-2 ${large ? 'lg:mt-4 lg:pl-11 lg:space-y-2.5' : ''}`}>
        {view ? (
          <strategy.Summary question={question} draft={draft} large={large} />
        ) : (
          <strategy.Field question={question} draft={draft} patch={patch} disabled={disabled} large={large} />
        )}
      </div>
    </div>
  )
}

export default QuestionField
