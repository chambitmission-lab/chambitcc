// 숫자값(숫자·별점) 화면 조각 — 입력·요약·관리자 설정·통계. 전략 객체는 numeric.ts
import { STAR_PATH, ratingMax, settingLabelCls, settingInputCls } from './fieldStyles'
import { EmptyAnswer, NumberInput, RatingInput } from './parts'
import { NumberSummary, RatingSummary } from './statsParts'
import { FrequencyStats } from './textualParts'
import type { FieldProps, SettingsEditorProps, StatsProps, SummaryProps } from './types'

export const NumberField = ({ question, draft, patch, disabled, large }: FieldProps) => {
  const settings = question.settings ?? {}
  return (
    <NumberInput
      value={draft.number}
      unit={settings.unit}
      min={settings.min}
      max={settings.max}
      disabled={disabled}
      large={large}
      onChange={(next) => patch({ number: next })}
    />
  )
}

export const RatingField = ({ question, draft, patch, disabled, large }: FieldProps) => (
  <RatingInput
    value={draft.number}
    max={ratingMax(question.settings?.max)}
    disabled={disabled}
    large={large}
    onChange={(next) => patch({ number: next })}
  />
)

export const NumberSummaryView = ({ question, draft, large }: SummaryProps) => {
  if (draft.number === '') return <EmptyAnswer />
  const unit = question.settings?.unit
  return (
    <p className={`text-[15px] font-bold text-ink-strong tabular-nums ${large ? 'lg:text-[19px]' : ''}`}>
      {draft.number}
      {unit ? <span className="ml-0.5 text-[13px] font-semibold text-ink-muted">{unit}</span> : null}
    </p>
  )
}

export const RatingSummaryView = ({ question, draft, large }: SummaryProps) => {
  const current = draft.number === '' ? 0 : Number(draft.number)
  if (!current) return <EmptyAnswer />
  const max = ratingMax(question.settings?.max)
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5 text-[#f4b400]">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <svg key={n} width="20" height="20" viewBox="0 0 24 24" fill={current >= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={current >= n ? '' : 'text-gray-300 dark:text-white/20'}>
            <path d={STAR_PATH} />
          </svg>
        ))}
      </span>
      <span className={`text-[13.5px] font-bold text-ink-strong tabular-nums ${large ? 'lg:text-[17px]' : ''}`}>{current}점</span>
    </div>
  )
}

/* 관리자 설정 — 단위·최소·최대(숫자) */
export const NumberSettings = ({ settings, patchSettings }: SettingsEditorProps) => (
  <>
    <label className={settingLabelCls}>
      단위
      <input
        type="text"
        value={settings.unit ?? ''}
        onChange={(e) => patchSettings({ unit: e.target.value || undefined })}
        placeholder="명"
        className={`w-16 ${settingInputCls}`}
      />
    </label>
    <label className={settingLabelCls}>
      최소
      <input
        type="number"
        value={settings.min ?? ''}
        onChange={(e) => patchSettings({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
        className={`w-16 ${settingInputCls}`}
      />
    </label>
    <label className={settingLabelCls}>
      최대
      <input
        type="number"
        value={settings.max ?? ''}
        onChange={(e) => patchSettings({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
        className={`w-16 ${settingInputCls}`}
      />
    </label>
  </>
)

/* 관리자 설정 — 만점(별점) */
export const RatingSettings = ({ settings, patchSettings }: SettingsEditorProps) => (
  <label className={settingLabelCls}>
    만점
    <input
      type="number"
      min={3}
      max={10}
      value={settings.max ?? 5}
      onChange={(e) => patchSettings({ max: Number(e.target.value) || 5 })}
      className={`w-16 ${settingInputCls}`}
    />
  </label>
)

export const NumberStats = (props: StatsProps) => (
  <>
    <div className="mb-3">
      <NumberSummary stat={props.stat} />
    </div>
    <FrequencyStats {...props} />
  </>
)

export const RatingStats = (props: StatsProps) => (
  <>
    <RatingSummary stat={props.stat} />
    <FrequencyStats {...props} />
  </>
)
