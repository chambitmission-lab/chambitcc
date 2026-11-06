// 글자값(단답·장문·시간·날짜) 화면 조각 — 입력·요약·관리자 설정·통계. 전략 객체는 textual.ts
import DatePicker from '../../../components/common/DatePicker'
import TimePicker from '../../../components/common/TimePicker'
import { inputCls } from '../surveyStyles'
import { bigInputCls, settingLabelCls, settingInputCls } from './fieldStyles'
import { EmptyAnswer } from './parts'
import { OptionBars, TextAnswers } from './statsParts'
import type { FieldProps, SettingsEditorProps, StatsProps, SummaryProps } from './types'

export const TextField = ({ question, draft, patch, disabled, large }: FieldProps) => (
  <input
    type="text"
    value={draft.text}
    disabled={disabled}
    onChange={(e) => patch({ text: e.target.value })}
    placeholder={question.settings?.placeholder ?? '답변을 입력해주세요'}
    className={`${inputCls} ${bigInputCls(large)}`}
  />
)

export const LongField = ({ question, draft, patch, disabled, large }: FieldProps) => (
  <textarea
    value={draft.text}
    disabled={disabled}
    onChange={(e) => patch({ text: e.target.value })}
    placeholder={question.settings?.placeholder ?? '자유롭게 적어주세요'}
    rows={4}
    className={`${inputCls} resize-none leading-relaxed ${bigInputCls(large)} ${large ? 'lg:leading-[1.75]' : ''}`}
  />
)

const pickerCls = (large?: boolean) =>
  `${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand ${bigInputCls(large)}`

export const TimeField = ({ question, draft, patch, disabled, large }: FieldProps) => (
  <TimePicker
    value={draft.text}
    onChange={(next) => patch({ text: next })}
    disabled={disabled}
    placeholder={question.settings?.placeholder ?? '시간 선택'}
    large={large}
    className={pickerCls(large)}
  />
)

export const DateField = ({ question, draft, patch, large }: FieldProps) => (
  <DatePicker
    value={draft.text}
    onChange={(next) => patch({ text: next })}
    placeholder={question.settings?.placeholder ?? '날짜 선택'}
    large={large}
    className={pickerCls(large)}
  />
)

export const TextSummary = ({ draft, large }: SummaryProps) => {
  const text = draft.text.trim()
  if (!text) return <EmptyAnswer />
  return (
    <p className={`text-[14px] text-ink-strong leading-relaxed whitespace-pre-wrap break-words ${large ? 'lg:text-[17px] lg:leading-[1.75]' : ''}`}>
      {text}
    </p>
  )
}

/* 관리자 설정 — 입력칸 안내문구(단답·장문) */
export const PlaceholderSettings = ({ settings, patchSettings }: SettingsEditorProps) => (
  <label className={`${settingLabelCls} flex-1 min-w-[140px]`}>
    안내문구
    <input
      type="text"
      value={settings.placeholder ?? ''}
      onChange={(e) => patchSettings({ placeholder: e.target.value || undefined })}
      placeholder="예: 시청 정문"
      className={`flex-1 ${settingInputCls}`}
    />
  </label>
)

/* 통계 — 주관식은 답변 목록만 */
export const TextStats = ({ stat, showNames }: StatsProps) => <TextAnswers stat={stat} showNames={showNames} />

/* 통계 — 시간·날짜·숫자처럼 같은 값끼리 묶은 빈도 막대 + 답변 목록 */
export const FrequencyStats = ({ stat, showNames }: StatsProps) => (
  <>
    {stat.options.length > 0 ? <OptionBars stat={stat} /> : null}
    {stat.texts.length > 0 ? <TextAnswers stat={stat} showNames={showNames} /> : null}
  </>
)
