// 설문 문항 하나 — 종류에 따라 알맞은 입력을 그린다.
// 관리자 미리보기와 성도 응답 폼이 같은 컴포넌트를 쓴다(보이는 대로 답한다).
import DatePicker from '../../components/common/DatePicker'
import TimePicker from '../../components/common/TimePicker'
import type { SurveyQuestion } from '../../types/survey'
import { OTHER_OPTION_ID, type AnswerDraft, emptyDraft, inputCls } from './surveyShared'

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

/* large 일 때 입력칸에 덧붙이는 PC 크기 */
const LARGE_INPUT = 'lg:px-4 lg:py-3.5 lg:rounded-2xl lg:text-[17px]'

/* 선택지 한 칸 — 라디오/체크박스 모두 카드 전체가 터치 타깃이다 */
const ChoiceRow = ({
  label,
  checked,
  multi,
  disabled,
  large,
  onToggle,
}: {
  label: string
  checked: boolean
  multi: boolean
  disabled?: boolean
  large?: boolean
  onToggle: () => void
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onToggle}
    className={`
      w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors
      ${large ? 'lg:gap-4 lg:px-5 lg:py-4 lg:rounded-2xl lg:border-2' : ''}
      ${checked
        ? 'border-brand bg-[var(--brand-soft)]'
        : `border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] ${large ? 'hover:border-brand' : 'hover:border-brand/40'}`}
      ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    `}
  >
    <span
      className={`
        shrink-0 w-[18px] h-[18px] flex items-center justify-center border-2 transition-colors
        ${large ? 'lg:w-6 lg:h-6' : ''}
        ${multi ? 'rounded-[6px]' : 'rounded-full'}
        ${checked ? 'border-brand bg-brand text-white' : 'border-gray-300 dark:border-white/25'}
      `}
    >
      {checked ? (
        multi ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" className={large ? 'lg:w-[15px] lg:h-[15px]' : ''}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className={`w-[7px] h-[7px] rounded-full bg-white ${large ? 'lg:w-[9px] lg:h-[9px]' : ''}`} />
        )
      ) : null}
    </span>
    <span className={`text-[14.5px] ${large ? 'lg:text-[17px] lg:leading-snug' : ''} ${checked ? 'text-brand font-semibold' : 'text-ink-strong'}`}>
      {label}
    </span>
  </button>
)

/* 숫자 — 인원 입력이 많아 −/+ 스테퍼를 붙인다 */
const NumberInput = ({
  value,
  unit,
  min,
  max,
  disabled,
  large,
  onChange,
}: {
  value: string
  unit?: string
  min?: number
  max?: number
  disabled?: boolean
  large?: boolean
  onChange: (next: string) => void
}) => {
  const stepCls = `w-10 h-10 shrink-0 rounded-xl border border-gray-200 dark:border-white/[0.08] text-ink-muted hover:border-brand hover:text-brand transition-colors disabled:opacity-50 ${
    large ? 'lg:w-14 lg:h-14 lg:rounded-2xl lg:text-[24px]' : ''
  }`
  const step = (delta: number) => {
    const base = value === '' ? 0 : Number(value)
    if (Number.isNaN(base)) return
    let next = base + delta
    if (typeof min === 'number') next = Math.max(min, next)
    if (typeof max === 'number') next = Math.min(max, next)
    onChange(String(next))
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => step(-1)}
        className={stepCls}
        aria-label="1 줄이기"
      >
        −
      </button>
      <div className="relative flex-1">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={`${inputCls} text-center tabular-nums ${unit ? 'pr-10' : ''} ${large ? `${LARGE_INPUT} lg:h-14 lg:text-[20px]` : ''}`}
        />
        {unit ? (
          <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-muted pointer-events-none ${large ? 'lg:text-[16px] lg:right-4' : ''}`}>
            {unit}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => step(1)}
        className={stepCls}
        aria-label="1 늘리기"
      >
        +
      </button>
    </div>
  )
}

/* 별점 */
const RatingInput = ({
  value,
  max,
  disabled,
  large,
  onChange,
}: {
  value: string
  max: number
  disabled?: boolean
  large?: boolean
  onChange: (next: string) => void
}) => {
  const current = value === '' ? 0 : Number(value)
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(current === n ? '' : String(n))}
          className={`p-1 transition-transform active:scale-90 ${current >= n ? 'text-[#f4b400]' : 'text-gray-300 dark:text-white/20'} disabled:opacity-60`}
          aria-label={`${n}점`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill={current >= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={large ? 'lg:w-10 lg:h-10' : ''}>
            <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
          </svg>
        </button>
      ))}
      {current > 0 ? (
        <span className={`ml-1 text-[13px] font-semibold text-ink-muted tabular-nums ${large ? 'lg:ml-2 lg:text-[17px]' : ''}`}>{current}점</span>
      ) : null}
    </div>
  )
}


/* 읽기 전용 — 고르지 않은 보기까지 회색으로 늘어놓지 않고, 낸 답만 보여준다 */
const AnswerView = ({ question, draft, large }: { question: SurveyQuestion; draft: AnswerDraft; large?: boolean }) => {
  const settings = question.settings ?? {}
  const labels = (question.options ?? [])
    .filter((o) => draft.optionIds.includes(o.id))
    .map((o) => o.label)
  const otherText = draft.text.trim()

  if (question.type === 'single' || question.type === 'multi') {
    const chips = [...labels, ...(otherText ? [otherText] : [])]
    if (!chips.length) return <EmptyAnswer />
    return (
      <div className="flex flex-wrap gap-1.5">
        {chips.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-[13.5px] font-semibold text-brand ${
              large ? 'lg:gap-1.5 lg:px-4 lg:py-2 lg:text-[16.5px]' : ''
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {label}
          </span>
        ))}
      </div>
    )
  }

  if (question.type === 'rating') {
    const current = draft.number === '' ? 0 : Number(draft.number)
    if (!current) return <EmptyAnswer />
    const max = typeof settings.max === 'number' && settings.max > 0 ? settings.max : 5
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-0.5 text-[#f4b400]">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <svg key={n} width="20" height="20" viewBox="0 0 24 24" fill={current >= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={current >= n ? '' : 'text-gray-300 dark:text-white/20'}>
              <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
            </svg>
          ))}
        </span>
        <span className={`text-[13.5px] font-bold text-ink-strong tabular-nums ${large ? 'lg:text-[17px]' : ''}`}>{current}점</span>
      </div>
    )
  }

  if (question.type === 'number') {
    if (draft.number === '') return <EmptyAnswer />
    return (
      <p className={`text-[15px] font-bold text-ink-strong tabular-nums ${large ? 'lg:text-[19px]' : ''}`}>
        {draft.number}
        {settings.unit ? <span className="ml-0.5 text-[13px] font-semibold text-ink-muted">{settings.unit}</span> : null}
      </p>
    )
  }

  if (!otherText) return <EmptyAnswer />
  return (
    <p className={`text-[14px] text-ink-strong leading-relaxed whitespace-pre-wrap break-words ${large ? 'lg:text-[17px] lg:leading-[1.75]' : ''}`}>
      {otherText}
    </p>
  )
}

const EmptyAnswer = () => (
  <p className="text-[13px] text-gray-400 dark:text-white/40">답하지 않음</p>
)

const QuestionField = ({ question, value, onChange, disabled, view, index, large = false }: Props) => {
  const bigInput = large ? LARGE_INPUT : ''
  const draft = value ?? emptyDraft()
  const settings = question.settings ?? {}
  const options = question.options ?? []
  const allowOther = settings.allow_other === true
  const otherChecked = draft.optionIds.includes(OTHER_OPTION_ID)

  const patch = (next: Partial<AnswerDraft>) => onChange({ ...draft, ...next })

  const toggleOption = (optionId: string) => {
    if (question.type === 'single') {
      const selected = draft.optionIds[0] === optionId ? [] : [optionId]
      // 다른 보기를 고르면 '기타' 입력은 비운다
      patch({ optionIds: selected, text: optionId === OTHER_OPTION_ID ? draft.text : '' })
      return
    }
    const has = draft.optionIds.includes(optionId)
    const nextIds = has
      ? draft.optionIds.filter((id) => id !== optionId)
      : [...draft.optionIds, optionId]
    const maxSelect = settings.max_select
    if (!has && typeof maxSelect === 'number' && maxSelect > 0 && nextIds.length > maxSelect) return
    patch({
      optionIds: nextIds,
      text: optionId === OTHER_OPTION_ID && has ? '' : draft.text,
    })
  }

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
          {!view && question.type === 'multi' && settings.max_select ? (
            <p className={`mt-0.5 text-[12px] text-brand ${large ? 'lg:mt-1 lg:text-[15px] lg:font-semibold' : ''}`}>최대 {settings.max_select}개까지 선택</p>
          ) : null}
        </div>
      </div>

      <div className={`mt-2.5 pl-7 space-y-2 ${large ? 'lg:mt-4 lg:pl-11 lg:space-y-2.5' : ''}`}>
        {view ? <AnswerView question={question} draft={draft} large={large} /> : null}

        {!view && (question.type === 'single' || question.type === 'multi') && (
          <>
            {options.map((option) => (
              <ChoiceRow
                key={option.id}
                label={option.label}
                multi={question.type === 'multi'}
                checked={draft.optionIds.includes(option.id)}
                disabled={disabled}
                large={large}
                onToggle={() => toggleOption(option.id)}
              />
            ))}
            {allowOther ? (
              <>
                <ChoiceRow
                  label="기타 (직접 입력)"
                  multi={question.type === 'multi'}
                  checked={otherChecked}
                  disabled={disabled}
                  large={large}
                  onToggle={() => toggleOption(OTHER_OPTION_ID)}
                />
                {otherChecked ? (
                  <input
                    type="text"
                    value={draft.text}
                    disabled={disabled}
                    onChange={(e) => patch({ text: e.target.value })}
                    placeholder="직접 입력해주세요"
                    className={`${inputCls} ${bigInput}`}
                  />
                ) : null}
              </>
            ) : null}
          </>
        )}

        {!view && question.type === 'text' && (
          <input
            type="text"
            value={draft.text}
            disabled={disabled}
            onChange={(e) => patch({ text: e.target.value })}
            placeholder={settings.placeholder ?? '답변을 입력해주세요'}
            className={`${inputCls} ${bigInput}`}
          />
        )}

        {!view && question.type === 'long' && (
          <textarea
            value={draft.text}
            disabled={disabled}
            onChange={(e) => patch({ text: e.target.value })}
            placeholder={settings.placeholder ?? '자유롭게 적어주세요'}
            rows={4}
            className={`${inputCls} resize-none leading-relaxed ${bigInput} ${large ? 'lg:leading-[1.75]' : ''}`}
          />
        )}

        {!view && question.type === 'number' && (
          <NumberInput
            value={draft.number}
            unit={settings.unit}
            min={settings.min}
            max={settings.max}
            disabled={disabled}
            large={large}
            onChange={(next) => patch({ number: next })}
          />
        )}

        {!view && question.type === 'rating' && (
          <RatingInput
            value={draft.number}
            max={typeof settings.max === 'number' && settings.max > 0 ? settings.max : 5}
            disabled={disabled}
            large={large}
            onChange={(next) => patch({ number: next })}
          />
        )}

        {!view && question.type === 'time' && (
          <TimePicker
            value={draft.text}
            onChange={(next) => patch({ text: next })}
            disabled={disabled}
            placeholder={settings.placeholder ?? '시간 선택'}
            large={large}
            className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand ${bigInput}`}
          />
        )}

        {!view && question.type === 'date' && (
          <DatePicker
            value={draft.text}
            onChange={(next) => patch({ text: next })}
            placeholder={settings.placeholder ?? '날짜 선택'}
            large={large}
            className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand ${bigInput}`}
          />
        )}
      </div>
    </div>
  )
}

export default QuestionField
