// 선택형(객관식·체크박스) 화면 조각 — 입력·요약·관리자 설정·통계. 전략 객체는 choice.ts
import { inputCls } from '../surveyStyles'
import { OTHER_OPTION_ID } from './draft'
import { bigInputCls, settingLabelCls, settingInputCls } from './fieldStyles'
import { ChoiceRow, EmptyAnswer } from './parts'
import { OptionBars, TextAnswers } from './statsParts'
import type { FieldProps, SettingsEditorProps, StatsProps, SummaryProps } from './types'

const ChoiceField = ({ question, draft, patch, disabled, large, multi }: FieldProps & { multi: boolean }) => {
  const settings = question.settings ?? {}
  const options = question.options ?? []
  const allowOther = settings.allow_other === true
  const otherChecked = draft.optionIds.includes(OTHER_OPTION_ID)

  const toggleOption = (optionId: string) => {
    if (!multi) {
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
    <>
      {options.map((option) => (
        <ChoiceRow
          key={option.id}
          label={option.label}
          multi={multi}
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
            multi={multi}
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
              className={`${inputCls} ${bigInputCls(large)}`}
            />
          ) : null}
        </>
      ) : null}
    </>
  )
}

export const SingleField = (props: FieldProps) => <ChoiceField {...props} multi={false} />
export const MultiField = (props: FieldProps) => <ChoiceField {...props} multi />

/* 읽기 전용 — 고르지 않은 보기까지 회색으로 늘어놓지 않고, 낸 답만 칩으로 */
export const ChoiceSummary = ({ question, draft, large }: SummaryProps) => {
  const labels = (question.options ?? [])
    .filter((o) => draft.optionIds.includes(o.id))
    .map((o) => o.label)
  const otherText = draft.text.trim()
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

/* 관리자 설정 — '기타 직접입력' 토글(객관식) */
export const OtherToggle = ({ settings, patchSettings }: SettingsEditorProps) => (
  <label className={settingLabelCls}>
    <input
      type="checkbox"
      checked={settings.allow_other === true}
      onChange={(e) => patchSettings({ allow_other: e.target.checked || undefined })}
      className="accent-[var(--brand)]"
    />
    기타 직접입력
  </label>
)

/* 관리자 설정 — 토글 + 최대 선택 수(체크박스) */
export const MultiSettings = (props: SettingsEditorProps) => (
  <>
    <OtherToggle {...props} />
    <label className={settingLabelCls}>
      최대 선택
      <input
        type="number"
        min={1}
        value={props.settings.max_select ?? ''}
        onChange={(e) =>
          props.patchSettings({ max_select: e.target.value ? Number(e.target.value) : undefined })
        }
        placeholder="제한 없음"
        className={`w-20 ${settingInputCls}`}
      />
    </label>
  </>
)

/* 통계 — 보기별 막대, 그 아래 '기타' 직접입력 목록 */
export const ChoiceStats = ({ stat, showNames }: StatsProps) => (
  <>
    {stat.options.length > 0 ? <OptionBars stat={stat} /> : null}
    {stat.texts.length > 0 ? (
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[11.5px] font-semibold text-ink-muted mb-2">기타 직접 입력</p>
        <TextAnswers stat={stat} showNames={showNames} />
      </div>
    ) : null}
  </>
)
