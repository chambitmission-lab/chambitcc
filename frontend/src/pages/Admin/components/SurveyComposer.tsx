// 설문 만들기/고치기 — 문항을 자유롭게 조립하는 빌더 모달.
//
// 문항 id 를 살려서 보내는 게 핵심이다(백엔드 _sync_questions). 이미 응답이 들어온
// 설문에서 문항을 지우면 그 문항의 답변도 함께 사라지므로 삭제 시 경고한다.
import { useMemo, useState } from 'react'
import DatePicker from '../../../components/common/DatePicker'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useCreateSurvey, useUpdateSurvey } from '../../../hooks/useSurvey'
import { confirmDialog } from '../../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../../utils/toast'
import QuestionField from '../../Survey/QuestionField'
import {
  QUESTION_TYPE_META,
  QUESTION_TYPE_ORDER,
  inputCls,
  labelCls,
  newOptionId,
} from '../../Survey/surveyShared'
import type {
  SurveyDetail,
  SurveyOption,
  SurveyQuestionSettings,
  SurveyQuestionType,
  SurveyStatus,
} from '../../../types/survey'

/** 편집 중 문항 — 신규 문항도 안정적인 key 를 갖도록 화면 전용 key 를 붙인다 */
interface DraftQuestion {
  key: string
  id?: number
  type: SurveyQuestionType
  title: string
  description: string
  is_required: boolean
  options: SurveyOption[]
  settings: SurveyQuestionSettings
}

const newKey = () => `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const blankQuestion = (type: SurveyQuestionType): DraftQuestion => ({
  key: newKey(),
  type,
  title: '',
  description: '',
  is_required: false,
  options:
    type === 'single' || type === 'multi'
      ? [
          { id: newOptionId(), label: '' },
          { id: newOptionId(), label: '' },
        ]
      : [],
  settings: type === 'rating' ? { max: 5 } : {},
})

/** 사진으로 받아 보던 셔틀버스 설문 — 문항 종류를 한 번에 보여주는 예시 */
const shuttleTemplate = (): { title: string; description: string; questions: DraftQuestion[] } => ({
  title: '주일 셔틀버스 운행을 위한 설문조사',
  description:
    '주일 차량 주차 불편을 다소나마 해소하고자 부천시청 지하주차장을 이용하며 셔틀 운행을 위한 설문조사를 실시하고자 합니다.\n운행예정: 부천시청 ↔ 참빛교회',
  questions: [
    {
      ...blankQuestion('single'),
      title: '부천시청 ↔ 참빛교회 셔틀 운행 시 이용하시겠습니까?',
      description: '주일 부천시청 지하주차장은 무료개방입니다',
      is_required: true,
      options: [
        { id: newOptionId(), label: '예' },
        { id: newOptionId(), label: '아니요' },
      ],
    },
    {
      ...blankQuestion('single'),
      title: '현재 예배 참석은 언제 하시나요?',
      is_required: true,
      options: [
        { id: newOptionId(), label: '2부 예배' },
        { id: newOptionId(), label: '3부 예배' },
      ],
    },
    { ...blankQuestion('number'), title: '셔틀 이용 인원 — 성인', settings: { unit: '명', min: 0 } },
    { ...blankQuestion('number'), title: '셔틀 이용 인원 — 교회학교', settings: { unit: '명', min: 0 } },
    { ...blankQuestion('number'), title: '셔틀 이용 인원 — 미취학아동', settings: { unit: '명', min: 0 } },
    { ...blankQuestion('time'), title: '부천시청 출발 희망 시간' },
    { ...blankQuestion('text'), title: '부천시청 출발 희망 장소', settings: { placeholder: '예: 시청 정문' } },
    { ...blankQuestion('time'), title: '교회 출발 희망 시간 (교회 출발은 정문)' },
    {
      ...blankQuestion('long'),
      title: '교회 주차에 대한 제안',
      description: '자유롭게 적어주시면 검토하겠습니다',
    },
  ],
})

const toDrafts = (survey?: SurveyDetail | null): DraftQuestion[] =>
  (survey?.questions ?? []).map((q) => ({
    key: `saved-${q.id}`,
    id: q.id,
    type: q.type,
    title: q.title,
    description: q.description ?? '',
    is_required: q.is_required,
    options: q.options ?? [],
    settings: q.settings ?? {},
  }))

/** DatePicker 는 YYYY-MM-DD 만 다루므로 저장 시각을 하루의 끝/시작으로 채운다 */
const toDateInput = (iso?: string | null): string => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (value: string, edge: 'start' | 'end'): string | null =>
  value ? `${value}T${edge === 'start' ? '00:00:00' : '23:59:59'}` : null

interface Props {
  survey?: SurveyDetail | null
  onClose: () => void
  onSaved: () => void
}

const SurveyComposer = ({ survey, onClose, onSaved }: Props) => {
  useModalBackButton(onClose)

  const [title, setTitle] = useState(survey?.title ?? '')
  const [description, setDescription] = useState(survey?.description ?? '')
  const [thankYou, setThankYou] = useState(survey?.thank_you_message ?? '')
  const [startsAt, setStartsAt] = useState(toDateInput(survey?.starts_at))
  const [endsAt, setEndsAt] = useState(toDateInput(survey?.ends_at))
  const [status, setStatus] = useState<SurveyStatus>(survey?.status ?? 'draft')
  const [resultPublic, setResultPublic] = useState(survey?.is_result_public ?? false)
  const [allowEdit, setAllowEdit] = useState(survey?.allow_edit ?? true)
  const [showOnHome, setShowOnHome] = useState(survey?.show_on_home ?? true)
  const [questions, setQuestions] = useState<DraftQuestion[]>(toDrafts(survey))
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [previewKey, setPreviewKey] = useState<string | null>(null)

  const hasResponses = (survey?.response_count ?? 0) > 0

  const create = useCreateSurvey(toastFeedback({ success: '설문을 만들었습니다' }))
  const update = useUpdateSurvey(toastFeedback({ success: '설문을 저장했습니다' }))
  const saving = create.isPending || update.isPending

  const patchQuestion = (key: string, patch: Partial<DraftQuestion>) =>
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)))

  const move = (index: number, delta: number) =>
    setQuestions((prev) => {
      const next = [...prev]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const removeQuestion = async (question: DraftQuestion) => {
    if (question.id && hasResponses) {
      const ok = await confirmDialog({
        title: '문항을 삭제할까요?',
        message: '이미 들어온 이 문항의 응답도 함께 사라집니다.',
        confirmText: '삭제',
        tone: 'danger',
      })
      if (!ok) return
    }
    setQuestions((prev) => prev.filter((q) => q.key !== question.key))
  }

  const duplicate = (question: DraftQuestion) =>
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.key === question.key)
      const copy: DraftQuestion = {
        ...question,
        key: newKey(),
        id: undefined, // 새 문항으로 저장된다
        options: question.options.map((o) => ({ ...o, id: newOptionId() })),
      }
      const next = [...prev]
      next.splice(index + 1, 0, copy)
      return next
    })

  const loadTemplate = () => {
    const template = shuttleTemplate()
    if (!title.trim()) setTitle(template.title)
    if (!description.trim()) setDescription(template.description)
    setQuestions((prev) => [...prev, ...template.questions])
  }

  const payloadQuestions = useMemo(
    () =>
      questions.map((q, order) => ({
        id: q.id,
        type: q.type,
        title: q.title.trim(),
        description: q.description.trim() || null,
        is_required: q.is_required,
        display_order: order,
        options: QUESTION_TYPE_META[q.type].hasOptions
          ? q.options.filter((o) => o.label.trim()).map((o) => ({ id: o.id, label: o.label.trim() }))
          : null,
        settings: Object.keys(q.settings).length ? q.settings : null,
      })),
    [questions]
  )

  const handleSave = () => {
    if (!title.trim()) {
      showToast('설문 제목을 입력해주세요', 'error')
      return
    }
    if (!questions.length) {
      showToast('문항을 한 개 이상 추가해주세요', 'error')
      return
    }
    const blank = questions.find((q) => !q.title.trim())
    if (blank) {
      showToast('내용이 비어 있는 문항이 있습니다', 'error')
      return
    }
    const emptyOptions = questions.find(
      (q) => QUESTION_TYPE_META[q.type].hasOptions && q.options.filter((o) => o.label.trim()).length < 2
    )
    if (emptyOptions) {
      showToast(`'${emptyOptions.title}' 의 보기를 2개 이상 입력해주세요`, 'error')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      thank_you_message: thankYou.trim() || null,
      status,
      starts_at: fromDateInput(startsAt, 'start'),
      ends_at: fromDateInput(endsAt, 'end'),
      is_result_public: resultPublic,
      allow_edit: allowEdit,
      show_on_home: showOnHome,
      questions: payloadQuestions,
    }

    if (survey) {
      update.mutate({ id: survey.id, data: payload }, { onSuccess: onSaved })
    } else {
      create.mutate(payload, { onSuccess: onSaved })
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {survey ? '설문 수정' : '새 설문 만들기'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 기본 정보 */}
          <section className="space-y-3">
            <div>
              <label className={labelCls}>설문 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 주일 셔틀버스 운행을 위한 설문조사"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>안내문 (선택)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="설문 취지와 배경을 적어주세요"
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>시작일 (선택)</label>
                <DatePicker
                  value={startsAt}
                  onChange={setStartsAt}
                  placeholder="바로 시작"
                  className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand`}
                />
              </div>
              <div>
                <label className={labelCls}>마감일 (선택)</label>
                <DatePicker
                  value={endsAt}
                  onChange={setEndsAt}
                  placeholder="수동 마감"
                  className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand`}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>제출 완료 문구 (선택)</label>
              <input
                type="text"
                value={thankYou}
                onChange={(e) => setThankYou(e.target.value)}
                placeholder="참여해 주셔서 감사합니다"
                className={inputCls}
              />
            </div>
          </section>

          {/* 공개 설정 */}
          <section className="rounded-2xl border border-gray-200 dark:border-white/[0.08] p-3.5 space-y-2.5">
            <div>
              <label className={labelCls}>상태</label>
              <div className="flex gap-1.5">
                {(['draft', 'open', 'closed'] as SurveyStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${
                      status === s
                        ? 'bg-brand text-white border-transparent'
                        : 'border-gray-200 dark:border-white/[0.08] text-ink hover:border-brand'
                    }`}
                  >
                    {s === 'draft' ? '작성 중' : s === 'open' ? '진행' : '마감'}
                  </button>
                ))}
              </div>
            </div>
            <ToggleRow
              label="홈 배너에 노출"
              hint="아직 참여하지 않은 성도의 홈에 카드로 뜹니다"
              checked={showOnHome}
              onChange={setShowOnHome}
            />
            <ToggleRow
              label="응답 수정 허용"
              hint="제출 후에도 성도가 답을 고칠 수 있습니다"
              checked={allowEdit}
              onChange={setAllowEdit}
            />
            <ToggleRow
              label="결과 공개"
              hint="참여한 성도도 통계 요약을 볼 수 있습니다 (주관식 작성자 이름은 가려집니다)"
              checked={resultPublic}
              onChange={setResultPublic}
            />
          </section>

          {/* 문항 */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-ink-strong">문항 {questions.length}개</p>
              {questions.length === 0 ? (
                <button
                  type="button"
                  onClick={loadTemplate}
                  className="text-[12.5px] font-semibold text-brand"
                >
                  셔틀버스 예시 불러오기
                </button>
              ) : null}
            </div>

            {questions.map((question, index) => (
              <QuestionEditor
                key={question.key}
                question={question}
                index={index}
                total={questions.length}
                preview={previewKey === question.key}
                onTogglePreview={() =>
                  setPreviewKey(previewKey === question.key ? null : question.key)
                }
                onPatch={(patch) => patchQuestion(question.key, patch)}
                onMove={(delta) => move(index, delta)}
                onDuplicate={() => duplicate(question)}
                onRemove={() => void removeQuestion(question)}
              />
            ))}

            {/* 문항 추가 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setTypeMenuOpen((v) => !v)}
                className="w-full py-3 rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.14] text-[13.5px] font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors"
              >
                + 문항 추가
              </button>
              {typeMenuOpen ? (
                <div className="mt-2 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-card-dark overflow-hidden">
                  {QUESTION_TYPE_ORDER.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setQuestions((prev) => [...prev, blankQuestion(type)])
                        setTypeMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[var(--brand-soft)] transition-colors border-b border-gray-100 dark:border-white/[0.05] last:border-0"
                    >
                      <p className="text-[13.5px] font-semibold text-ink-strong">
                        {QUESTION_TYPE_META[type].label}
                      </p>
                      <p className="text-[11.5px] text-ink-muted">{QUESTION_TYPE_META[type].hint}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="px-5 py-3.5 border-t border-black/[0.04] dark:border-white/[0.06] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[14px] font-semibold text-ink"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-brand text-white text-[14.5px] font-bold disabled:opacity-60"
          >
            {saving ? '저장 중…' : survey ? '저장' : '설문 만들기'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* 켜고 끄는 한 줄 */
const ToggleRow = ({
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

/* 문항 하나 편집 */
const QuestionEditor = ({
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
  onTogglePreview: () => void
  onPatch: (patch: Partial<DraftQuestion>) => void
  onMove: (delta: number) => void
  onDuplicate: () => void
  onRemove: () => void
}) => {
  const meta = QUESTION_TYPE_META[question.type]
  const settings = question.settings

  const patchSettings = (patch: Partial<SurveyQuestionSettings>) =>
    onPatch({ settings: { ...settings, ...patch } })

  const changeType = (type: SurveyQuestionType) => {
    const needsOptions = QUESTION_TYPE_META[type].hasOptions
    onPatch({
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
          <IconButton label="위로" disabled={index === 0} onClick={() => onMove(-1)}>
            <polyline points="18 15 12 9 6 15" />
          </IconButton>
          <IconButton label="아래로" disabled={index === total - 1} onClick={() => onMove(1)}>
            <polyline points="6 9 12 15 18 9" />
          </IconButton>
          <IconButton label="복제" onClick={onDuplicate}>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
          </IconButton>
          <IconButton label="삭제" onClick={onRemove} danger>
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
        onChange={(e) => onPatch({ title: e.target.value })}
        placeholder="질문을 입력하세요"
        className={`${inputCls} mb-2`}
      />
      <input
        type="text"
        value={question.description}
        onChange={(e) => onPatch({ description: e.target.value })}
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
                  onPatch({
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
                  onPatch({ options: question.options.filter((o) => o.id !== option.id) })
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
              onPatch({ options: [...question.options, { id: newOptionId(), label: '' }] })
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
            onChange={(e) => onPatch({ is_required: e.target.checked })}
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
          onClick={onTogglePreview}
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
}

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

export default SurveyComposer
