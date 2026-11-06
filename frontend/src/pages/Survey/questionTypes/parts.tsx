// 문항 종류 전략이 함께 쓰는 입력 조각 — 선택지 한 칸·숫자 스테퍼·별점·빈 답 표시
import { inputCls } from '../surveyStyles'
import { LARGE_INPUT, STAR_PATH } from './fieldStyles'

export const EmptyAnswer = () => (
  <p className="text-[13px] text-gray-400 dark:text-white/40">답하지 않음</p>
)

/* 선택지 한 칸 — 라디오/체크박스 모두 카드 전체가 터치 타깃이다 */
export const ChoiceRow = ({
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
export const NumberInput = ({
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
export const RatingInput = ({
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
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
      {current > 0 ? (
        <span className={`ml-1 text-[13px] font-semibold text-ink-muted tabular-nums ${large ? 'lg:ml-2 lg:text-[17px]' : ''}`}>{current}점</span>
      ) : null}
    </div>
  )
}
