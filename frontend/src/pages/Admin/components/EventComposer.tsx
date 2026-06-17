import { useEffect, useState, type ReactNode } from 'react'
import { createEvent, updateEvent } from '../../../api/event'
import { useAllGroups } from '../../../hooks/useGroups'
import type {
  CreateEventRequest,
  Event,
  RepeatType,
} from '../../../types/event'
import {
  ALL_CATEGORIES,
  CATEGORY_VISUAL,
} from '../../Events/utils/categoryConfig'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'

interface EventComposerProps {
  editingEvent: Event | null
  onClose: () => void
  onSuccess: () => void
}

const DEFAULT_FORM: CreateEventRequest = {
  title: '',
  description: '',
  category: 'worship',
  start_datetime: '',
  end_datetime: '',
  location: '',
  repeat_type: 'none',
  repeat_end_date: '',
  is_published: true,
  group_id: null,
  rsvp_deadline: '',
}

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'none', label: '반복 없음' },
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
]

const pad = (n: number) => n.toString().padStart(2, '0')

const toLocalDatetimeInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const addHours = (input: string, hours: number): string => {
  if (!input) return ''
  const d = new Date(input)
  d.setHours(d.getHours() + hours)
  return toLocalDatetimeInput(d)
}

const EventComposer = ({ editingEvent, onClose, onSuccess }: EventComposerProps) => {
  const { language } = useLanguage()
  const t = translations[language]
  const { data: groupsData } = useAllGroups()
  const groups = groupsData?.data.items ?? []

  const [form, setForm] = useState<CreateEventRequest>(DEFAULT_FORM)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        description: editingEvent.description || '',
        category: editingEvent.category,
        start_datetime: editingEvent.start_datetime.slice(0, 16),
        end_datetime: editingEvent.end_datetime.slice(0, 16),
        location: editingEvent.location || '',
        repeat_type: editingEvent.repeat_type,
        repeat_end_date: editingEvent.repeat_end_date || '',
        is_published: editingEvent.is_published,
        group_id: editingEvent.group_id ?? null,
        rsvp_deadline: editingEvent.rsvp_deadline ? editingEvent.rsvp_deadline.slice(0, 16) : '',
      })
    } else {
      setForm(DEFAULT_FORM)
    }
    setFile(null)
    setError(null)
  }, [editingEvent])

  const handleQuickDate = (mode: 'today' | 'tomorrow' | 'nextWeek') => {
    const base = new Date()
    base.setSeconds(0, 0)
    if (mode === 'tomorrow') base.setDate(base.getDate() + 1)
    if (mode === 'nextWeek') base.setDate(base.getDate() + 7)
    base.setHours(19, 0)
    const start = toLocalDatetimeInput(base)
    setForm(prev => ({ ...prev, start_datetime: start, end_datetime: addHours(start, 1) }))
  }

  const handleStartChange = (val: string) => {
    setForm(prev => {
      const next = { ...prev, start_datetime: val }
      // 종료 시간이 비어있거나 시작보다 이르면 +1시간 자동 채움
      if (!prev.end_datetime || new Date(prev.end_datetime) < new Date(val)) {
        next.end_datetime = addHours(val, 1)
      }
      return next
    })
  }

  const canSubmit =
    form.title.trim().length > 0 &&
    form.start_datetime !== '' &&
    form.end_datetime !== '' &&
    new Date(form.end_datetime) >= new Date(form.start_datetime) &&
    !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    const payload: CreateEventRequest = {
      ...form,
      rsvp_deadline: form.rsvp_deadline ? form.rsvp_deadline : null,
      repeat_end_date: form.repeat_end_date ? form.repeat_end_date : undefined,
    }
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload)
        showToast(t.updateSuccess, 'success')
      } else {
        await createEvent(payload, file || undefined)
        showToast(t.createSuccess, 'success')
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 표면 그라데이션 */}
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/15 absolute left-1/2 -translate-x-1/2 -top-3" />
          </div>
          <div>
            <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.12em] uppercase">
              ADMIN
            </p>
            <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
              {editingEvent ? '일정 수정' : '새 일정 등록'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-5">
            {/* 제목 */}
            <FieldGroup label="제목" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예) 청년부 봄 수련회"
                maxLength={120}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
              />
            </FieldGroup>

            {/* 카테고리 pill grid */}
            <FieldGroup label="카테고리" required>
              <div className="grid grid-cols-3 gap-2">
                {ALL_CATEGORIES.map(cat => {
                  const v = CATEGORY_VISUAL[cat]
                  const active = form.category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={[
                        'h-12 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all',
                        active
                          ? `bg-gradient-to-r ${v.gradient} text-white shadow-[0_4px_14px_-4px_rgba(168,85,247,0.5)]`
                          : 'bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      <span className="text-[16px]">{v.emoji}</span>
                      <span>{t.categories[cat]}</span>
                    </button>
                  )
                })}
              </div>
            </FieldGroup>

            {/* 빠른 날짜 선택 */}
            <FieldGroup label="언제 열리나요" required>
              <div className="flex gap-1.5 mb-2.5 flex-wrap">
                <QuickChip onClick={() => handleQuickDate('today')}>오늘 저녁 7시</QuickChip>
                <QuickChip onClick={() => handleQuickDate('tomorrow')}>내일 저녁 7시</QuickChip>
                <QuickChip onClick={() => handleQuickDate('nextWeek')}>다음 주 같은 요일</QuickChip>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <DateField
                  label="시작"
                  value={form.start_datetime}
                  onChange={handleStartChange}
                />
                <DateField
                  label="종료"
                  value={form.end_datetime}
                  onChange={(v) => setForm({ ...form, end_datetime: v })}
                  min={form.start_datetime || undefined}
                />
              </div>
            </FieldGroup>

            {/* 장소 */}
            <FieldGroup label="장소">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/35 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="예) 본당 / 청년부실"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
                />
              </div>
            </FieldGroup>

            {/* 소그룹 */}
            <FieldGroup label="공개 범위">
              <div className="flex gap-1.5 flex-wrap">
                <ScopeChip
                  active={form.group_id === null}
                  onClick={() => setForm({ ...form, group_id: null })}
                >
                  <span className="text-[13px]">🌐</span>
                  전체 공개
                </ScopeChip>
                {groups.map(g => (
                  <ScopeChip
                    key={g.id}
                    active={form.group_id === g.id}
                    onClick={() => setForm({ ...form, group_id: g.id })}
                  >
                    {g.icon && <span className="text-[13px]">{g.icon}</span>}
                    {g.name}
                  </ScopeChip>
                ))}
              </div>
            </FieldGroup>

            {/* 설명 */}
            <FieldGroup label="설명">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="모임 안내, 준비물, 참고사항 등을 자유롭게 적어주세요."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-none leading-[1.6]"
              />
            </FieldGroup>

            {/* 반복 */}
            <FieldGroup label="반복">
              <div className="flex gap-1.5 flex-wrap">
                {REPEAT_OPTIONS.map(o => (
                  <ScopeChip
                    key={o.value}
                    active={form.repeat_type === o.value}
                    onClick={() => setForm({ ...form, repeat_type: o.value })}
                  >
                    {o.label}
                  </ScopeChip>
                ))}
              </div>
              {form.repeat_type !== 'none' && (
                <div className="mt-2.5">
                  <DateField
                    label="반복 종료일"
                    type="date"
                    value={form.repeat_end_date ?? ''}
                    onChange={(v) => setForm({ ...form, repeat_end_date: v })}
                  />
                </div>
              )}
            </FieldGroup>

            {/* RSVP 마감 */}
            <FieldGroup label="RSVP 마감 (선택)">
              <DateField
                value={form.rsvp_deadline ?? ''}
                onChange={(v) => setForm({ ...form, rsvp_deadline: v })}
                max={form.start_datetime || undefined}
              />
            </FieldGroup>

            {/* 첨부 (등록 시만) */}
            {!editingEvent && (
              <FieldGroup label="첨부 (이미지·PDF)">
                <label className="block">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[12.5px] font-bold border border-purple-500/20 dark:border-purple-500/30 cursor-pointer hover:bg-purple-500/15 dark:hover:bg-purple-500/20 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    {file ? '파일 변경' : '파일 선택'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  {file && (
                    <span className="ml-2 text-[12px] text-gray-600 dark:text-white/65 truncate inline-block max-w-[60%] align-middle">
                      {file.name}
                    </span>
                  )}
                </label>
              </FieldGroup>
            )}

            {/* 공개 여부 */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08]">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-gray-900 dark:text-white">
                  공개하기
                </p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
                  끄면 임시 저장 (성도들에게 보이지 않음)
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_published}
                onClick={() => setForm({ ...form, is_published: !form.is_published })}
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                  form.is_published
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-gray-300 dark:bg-white/[0.1]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    form.is_published ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                {error}
              </div>
            )}
          </div>

          {/* 푸터 액션 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  저장 중...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {editingEvent ? '수정 저장' : '등록하기'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────
interface FieldGroupProps {
  label: string
  required?: boolean
  children: ReactNode
}

const FieldGroup = ({ label, required, children }: FieldGroupProps) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
        {label}
      </p>
      {required && <span className="text-pink-500 text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

const QuickChip = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center px-3 h-8 rounded-full bg-purple-500/8 dark:bg-purple-500/12 text-purple-700 dark:text-purple-300 text-[11.5px] font-bold border border-purple-500/20 dark:border-purple-500/25 hover:bg-purple-500/15 dark:hover:bg-purple-500/20 transition-colors"
  >
    {children}
  </button>
)

const ScopeChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[12.5px] font-bold transition-all',
      active
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_4px_14px_-4px_rgba(168,85,247,0.55)]'
        : 'bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
    ].join(' ')}
  >
    {children}
  </button>
)

interface DateFieldProps {
  label?: string
  type?: 'date' | 'datetime-local'
  value: string
  onChange: (v: string) => void
  min?: string
  max?: string
}

const DateField = ({ label, type = 'datetime-local', value, onChange, min, max }: DateFieldProps) => (
  <label className="block">
    {label && (
      <span className="block text-[10.5px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-white/45 mb-1">
        {label}
      </span>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
    />
  </label>
)

export default EventComposer
