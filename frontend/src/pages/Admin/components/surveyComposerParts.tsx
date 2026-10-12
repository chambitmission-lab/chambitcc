// 설문 빌더(SurveyComposer)의 부분 컴포넌트 — 토글 줄·문항 편집 카드·아이콘 버튼.
// 모달 파일이 길어 자리만 옮겼다(동작 변경 없음).
import { memo } from 'react'
import QuestionField from '../../Survey/QuestionField'
import { QUESTION_TYPE_META, QUESTION_TYPE_ORDER, inputCls, newOptionId } from '../../Survey/surveyShared'
import type { SurveyOption, SurveyQuestionSettings, SurveyQuestionType } from '../../../types/survey'

/** 편집 중 문항 — 신규 문항도 안정적인 key 를 갖도록 화면 전용 key 를 붙인다 */
export interface DraftQuestion {
  key: string
  id?: number
  type: SurveyQuestionType
  title: string
  description: string
  is_required: boolean
  options: SurveyOption[]
  settings: SurveyQuestionSettings
}

/* 켜고 끄는 한 줄 */
export const ToggleRow = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (next: boolean) => void
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center gap-3 text-left"
  >
    <span className="min-w-0 flex-1">
      <span className="block text-[13.5px] font-semibold text-ink-strong">{label}</span>
      <span className="block text-[11.5px] text-ink-muted leading-snug">{hint}</span>
    </span>
    <span
      className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${
        checked ? 'bg-brand' : 'bg-gray-200 dark:bg-white/[0.14]'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-[left] ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </span>
  </button>
)

/* 문항 하나 편집 — memo: 다른 문항의 키 입력에 이 카드가 다시 그려지지 않는다(콜백은 전부 key 기반·안정 참조) */
export const QuestionEditor = memo(function QuestionEditor({
  question,
  index,
  total,
  preview,
  onTogglePreview,
  onPatch,
  onMove,
  onDuplicate,
  onRemove,
}: {
  question: DraftQuestion
  index: number
  total: number
  preview: boolean
  onTogglePreview: (key: string) => void
  onPatch: (key: string, patch: Partial<DraftQuestion>) => void
  onMove: (key: string, delta: number) => void
  onDuplicate: (question: DraftQuestion) => void
  onRemove: (question: DraftQuestion) => void
}) {
  const meta = QUESTION_TYPE_META[question.type]
  const settings = question.settings

  const patch = (next: Partial<DraftQuestion>) => onPatch(question.key, next)
  const patchSettings = (next: Partial<SurveyQuestionSettings>) =>
    patch({ settings: { ...settings, ...next } })

  const changeType = (type: SurveyQuestionType) => {
    const needsOptions = QUESTION_TYPE_META[type].hasOptions
    patch({
      type,
      options:
        needsOptions && question.options.length === 0
          ? [
              { id: newOptionId(), label: '' },
              { id: newOptionId(), label: '' },
            ]
          : question.options,
      settings: type === 'rating' && !settings.max ? { ...settings, max: 5 } : settings,
    })
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-card-dark p-3.5">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11.5px] font-bold text-brand tabular-nums">문항 {index + 1}</span>
        <div className="flex items-center gap-0.5 text-ink-muted">
          <IconButton label="위로" disabled={index === 0} onClick={() => onMove(question.key, -1)}>
            <polyline points="18 15 12 9 6 15" />
          </IconButton>
          <IconButton label="아래로" disabled={index === total - 1} onClick={() => onMove(question.key, 1)}>
            <polyline points="6 9 12 15 18 9" />
          </IconButton>
          <IconButton label="복제" onClick={() => onDuplicate(question)}>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
          </IconButton>
          <IconButton label="삭제" onClick={() => void onRemove(question)} danger>
            <polyline points="3 6 5 6 21 6" />
            <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
            <path d="M6.5 6l1 14h9l1-14" />
          </IconButton>
        </div>
      </div>

      <select
        value={question.type}
        onChange={(e) => changeType(e.target.value as SurveyQuestionType)}
        className={`${inputCls} mb-2 appearance-none`}
      >
        {QUESTION_TYPE_ORDER.map((type) => (
          <option key={type} value={type}>
            {QUESTION_TYPE_META[type].label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={question.title}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder="질문을 입력하세요"
        className={`${inputCls} mb-2`}
      />
      <input
        type="text"
        value={question.description}
        onChange={(e) => patch({ description: e.target.value })}
        placeholder="보조 설명 (선택)"
        className={`${inputCls} mb-2`}
      />

      {/* 보기 편집 */}
      {meta.hasOptions ? (
        <div className="space-y-1.5 mb-2">
          {question.options.map((option, i) => (
            <div key={option.id} className="flex items-center gap-1.5">
              <span className="shrink-0 w-5 text-center text-[12px] text-ink-muted tabular-nums">
                {i + 1}
              </span>
              <input
                type="text"
                value={option.label}
                onChange={(e) =>
                  patch({
                    options: question.options.map((o) =>
                      o.id === option.id ? { ...o, label: e.target.value } : o
                    ),
                  })
                }
                placeholder={`보기 ${i + 1}`}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() =>
                  patch({ options: question.options.filter((o) => o.id !== option.id) })
                }
                className="shrink-0 w-8 h-8 rounded-lg text-ink-muted hover:text-red-500 transition-colors"
                aria-label="보기 삭제"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch({ options: [...question.options, { id: newOptionId(), label: '' }] })
            }
            className="ml-6 text-[12.5px] font-semibold text-brand"
          >
            + 보기 추가
          </button>
        </div>
      ) : null}

      {/* 종류별 부가 설정 */}
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <label className="flex items-center gap-1.5 text-ink">
          <input
            type="checkbox"
            checked={question.is_required}
            onChange={(e) => patch({ is_required: e.target.checked })}
            className="accent-[var(--brand)]"
          />
          필수 응답
        </label>

        {meta.hasOptions ? (
          <label className="flex items-center gap-1.5 text-ink">
            <input
              type="checkbox"
              checked={settings.allow_other === true}
              onChange={(e) => patchSettings({ allow_other: e.target.checked || undefined })}
              className="accent-[var(--brand)]"
            />
            기타 직접입력
          </label>
        ) : null}

        {question.type === 'multi' ? (
          <label className="flex items-center gap-1.5 text-ink">
            최대 선택
            <input
              type="number"
              min={1}
              value={settings.max_select ?? ''}
              onChange={(e) =>
                patchSettings({ max_select: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="제한 없음"
              className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px]"
            />
          </label>
        ) : null}

        {question.type === 'number' ? (
          <>
            <label className="flex items-center gap-1.5 text-ink">
              단위
              <input
                type="text"
                value={settings.unit ?? ''}
                onChange={(e) => patchSettings({ unit: e.target.value || undefined })}
                placeholder="명"
                className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px]"
              />
            </label>
            <label className="flex items-center gap-1.5 text-ink">
              최소
              <input
                type="number"
                value={settings.min ?? ''}
                onChange={(e) =>
                  patchSettings({ min: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px]"
              />
            </label>
            <label className="flex items-center gap-1.5 text-ink">
              최대
              <input
                type="number"
                value={settings.max ?? ''}
                onChange={(e) =>
                  patchSettings({ max: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px]"
              />
            </label>
          </>
        ) : null}

        {question.type === 'rating' ? (
          <label className="flex items-center gap-1.5 text-ink">
            만점
            <input
              type="number"
              min={3}
              max={10}
              value={settings.max ?? 5}
              onChange={(e) => patchSettings({ max: Number(e.target.value) || 5 })}
              className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px]"
            />
          </label>
        ) : null}

        {question.type === 'text' || question.type === 'long' ? (
          <label className="flex items-center gap-1.5 text-ink flex-1 min-w-[140px]">
            안내문구
            <input
              type="text"
              value={settings.placeholder ?? ''}
              onChange={(e) => patchSettings({ placeholder: e.target.value || undefined })}
              placeholder="예: 시청 정문"
              className="flex-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px]"
            />
          </label>
        ) : null}

        <button
          type="button"
          onClick={() => onTogglePreview(question.key)}
          className="ml-auto text-[12px] font-semibold text-brand"
        >
          {preview ? '미리보기 닫기' : '미리보기'}
        </button>
      </div>

      {/* 성도에게 보이는 모습 그대로 미리본다 */}
      {preview ? (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
          <QuestionField
            question={{
              id: -1,
              type: question.type,
              title: question.title || '(질문을 입력하세요)',
              description: question.description || null,
              is_required: question.is_required,
              display_order: index,
              options: question.options,
              settings: question.settings,
            }}
            index={index + 1}
            onChange={() => undefined}
            disabled
          />
        </div>
      ) : null}
    </div>
  )
})

const IconButton = ({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 ${
      danger ? 'hover:text-red-500' : 'hover:text-brand'
    }`}
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </button>
)
