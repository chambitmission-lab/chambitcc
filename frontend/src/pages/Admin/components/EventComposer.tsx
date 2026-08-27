import { useEffect, useState } from 'react'
import DatePicker from '../../../components/common/DatePicker'
import TimePicker from '../../../components/common/TimePicker'
import {
  FieldGroup,
  QuickChip,
  ScopeChip,
  dateTriggerClass,
  subLabelClass,
} from '../../../components/common/ComposerFields'
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
import { calendarDateKey, formatKstDateTime, kstNow } from '../../../utils/kstTime'
import {
  addMinutes,
  diffMinutes,
  joinDT,
  splitDT,
  toLocalDatetimeInput,
} from '../../../utils/datetimeParts'
import { CategoryIcon } from '../../Events/components/CategoryIcons'

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

/* 종료 시각은 직접 고르게 하지 않고 "얼마나 하는지"로 받는다.
 * 수련회처럼 며칠에 걸치는 일정만 '직접 설정'으로 연다. */
type EndMode = '1h' | '90m' | '2h' | '3h' | 'custom'
const END_OPTIONS: { key: EndMode; label: string; minutes?: number }[] = [
  { key: '1h', label: '1시간', minutes: 60 },
  { key: '90m', label: '1시간 30분', minutes: 90 },
  { key: '2h', label: '2시간', minutes: 120 },
  { key: '3h', label: '3시간', minutes: 180 },
  { key: 'custom', label: '직접 설정' },
]

/* RSVP 마감도 정확한 일시를 입력받는 대신 시작 기준 상대값으로 받는다.
 * 시작 시각을 바꾸면 마감도 따라 움직인다. */
type RsvpMode = 'none' | 'atStart' | '1d' | '3d' | '7d' | 'custom'
const RSVP_OPTIONS: { key: RsvpMode; label: string; minutesBefore?: number }[] = [
  { key: 'none', label: '마감 없음' },
  { key: 'atStart', label: '시작 전까지', minutesBefore: 0 },
  { key: '1d', label: '하루 전', minutesBefore: 60 * 24 },
  { key: '3d', label: '3일 전', minutesBefore: 60 * 24 * 3 },
  { key: '7d', label: '일주일 전', minutesBefore: 60 * 24 * 7 },
  { key: 'custom', label: '직접 선택' },
]

const EventComposer = ({ editingEvent, onClose, onSuccess }: EventComposerProps) => {
  const { language } = useLanguage()
  const t = translations[language]
  const { data: groupsData } = useAllGroups()
  const groups = groupsData?.data.items ?? []

  const [form, setForm] = useState<CreateEventRequest>(DEFAULT_FORM)
  const [endMode, setEndMode] = useState<EndMode>('1h')
  const [rsvpMode, setRsvpMode] = useState<RsvpMode>('none')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  useEffect(() => {
    if (editingEvent) {
      const start = editingEvent.start_datetime.slice(0, 16)
      const end = editingEvent.end_datetime.slice(0, 16)
      const deadline = editingEvent.rsvp_deadline
        ? editingEvent.rsvp_deadline.slice(0, 16)
        : ''
      setForm({
        title: editingEvent.title,
        description: editingEvent.description || '',
        category: editingEvent.category,
        start_datetime: start,
        end_datetime: end,
        location: editingEvent.location || '',
        repeat_type: editingEvent.repeat_type,
        repeat_end_date: editingEvent.repeat_end_date || '',
        is_published: editingEvent.is_published,
        group_id: editingEvent.group_id ?? null,
        rsvp_deadline: deadline,
      })
      // 저장된 값에서 진행 시간·마감 프리셋을 역산 — 안 맞으면 '직접'으로 연다
      const dur = diffMinutes(end, start)
      setEndMode(END_OPTIONS.find(o => o.minutes === dur)?.key ?? 'custom')
      if (!deadline) {
        setRsvpMode('none')
      } else {
        const before = diffMinutes(start, deadline)
        setRsvpMode(RSVP_OPTIONS.find(o => o.minutesBefore === before)?.key ?? 'custom')
      }
    } else {
      setForm(DEFAULT_FORM)
      setEndMode('1h')
      setRsvpMode('none')
    }
    setFile(null)
    setError(null)
  }, [editingEvent])

  /* 시작 시각이 정해지거나 바뀔 때 한 곳에서 종료·마감을 같이 굴린다 */
  const applyStart = (start: string, nextEndMode = endMode, nextRsvpMode = rsvpMode) => {
    setForm(prev => {
      const next = { ...prev, start_datetime: start }
      const dur = END_OPTIONS.find(o => o.key === nextEndMode)?.minutes
      if (dur != null) {
        next.end_datetime = start ? addMinutes(start, dur) : ''
      } else if (start && (!prev.end_datetime || prev.end_datetime < start)) {
        // 직접 설정 중이라도 종료가 시작보다 앞서게 두지는 않는다
        next.end_datetime = addMinutes(start, 60)
      }
      if (nextRsvpMode === 'none') {
        next.rsvp_deadline = ''
      } else {
        const before = RSVP_OPTIONS.find(o => o.key === nextRsvpMode)?.minutesBefore
        if (before != null) next.rsvp_deadline = start ? addMinutes(start, -before) : ''
      }
      return next
    })
  }

  const startParts = splitDT(form.start_datetime)
  const endParts = splitDT(form.end_datetime)
  const deadlineParts = splitDT(form.rsvp_deadline ?? '')

  const handleQuickDate = (mode: 'today' | 'tomorrow' | 'sunday' | 'nextWeek') => {
    // 입력값은 서울 벽시계 그대로 서버에 저장되므로, 기준일도 서울 '오늘'로 잡는다
    const base = kstNow()
    base.setSeconds(0, 0)
    if (mode === 'tomorrow') base.setDate(base.getDate() + 1)
    if (mode === 'nextWeek') base.setDate(base.getDate() + 7)
    if (mode === 'sunday') {
      // 다가오는 주일(오늘이 일요일이면 오늘) 오전 11시
      base.setDate(base.getDate() + ((7 - base.getDay()) % 7))
      base.setHours(11, 0)
    } else {
      base.setHours(19, 0)
    }
    applyStart(toLocalDatetimeInput(base))
  }

  const handleStartDate = (date: string) =>
    applyStart(joinDT(date, startParts.time || '19:00'))
  const handleStartTime = (time: string) =>
    applyStart(joinDT(startParts.date || calendarDateKey(kstNow()), time))

  const handleEndMode = (mode: EndMode) => {
    setEndMode(mode)
    applyStart(form.start_datetime, mode)
  }
  const handleEndDate = (date: string) =>
    setForm(prev => ({
      ...prev,
      end_datetime: joinDT(date, endParts.time || startParts.time || '20:00'),
    }))
  const handleEndTime = (time: string) =>
    setForm(prev => ({
      ...prev,
      end_datetime: joinDT(endParts.date || startParts.date, time),
    }))

  const handleRsvpMode = (mode: RsvpMode) => {
    setRsvpMode(mode)
    if (mode === 'custom') {
      // 직접 선택으로 들어올 때 빈칸 대신 시작 시각을 출발점으로 깔아 준다
      setForm(prev => ({
        ...prev,
        rsvp_deadline: prev.rsvp_deadline || prev.start_datetime,
      }))
    } else {
      applyStart(form.start_datetime, endMode, mode)
    }
  }
  const handleDeadlineDate = (date: string) =>
    setForm(prev => ({
      ...prev,
      rsvp_deadline: joinDT(date, deadlineParts.time || startParts.time || '23:30'),
    }))
  const handleDeadlineTime = (time: string) =>
    setForm(prev => ({
      ...prev,
      rsvp_deadline: joinDT(deadlineParts.date || startParts.date, time),
    }))

  // 반복 일정은 회차별로 펼쳐지지 않아 마감을 걸면 이후 전 회차가 잠긴다 → 아예 못 넣게 막는다
  const isRepeating = form.repeat_type !== 'none'

  const handleRepeatChange = (value: RepeatType) => {
    if (value !== 'none') setRsvpMode('none')
    setForm(prev => ({
      ...prev,
      repeat_type: value,
      rsvp_deadline: value === 'none' ? prev.rsvp_deadline : '',
    }))
  }

  // 두 값 모두 'YYYY-MM-DDTHH:mm' 같은 형식이라 문자열 비교로 시각 순서를 그대로 판정할 수 있다
  const rsvpAfterStart =
    !!form.rsvp_deadline &&
    !!form.start_datetime &&
    form.rsvp_deadline > form.start_datetime

  const endBeforeStart =
    !!form.start_datetime &&
    !!form.end_datetime &&
    form.end_datetime < form.start_datetime

  const canSubmit =
    form.title.trim().length > 0 &&
    form.start_datetime !== '' &&
    form.end_datetime !== '' &&
    !endBeforeStart &&
    !rsvpAfterStart &&
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
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 표면 그라데이션 */}
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/15 absolute left-1/2 -translate-x-1/2 -top-3" />
          </div>
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">
              ADMIN
            </p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {editingEvent ? '일정 수정' : '새 일정 등록'}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
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
                          ? `bg-gradient-to-r ${v.gradient} text-white shadow-[0_4px_14px_-4px_var(--brand-glow)]`
                          : 'bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      <CategoryIcon category={cat} width={16} height={16} className="shrink-0" />
                      <span>{t.categories[cat]}</span>
                    </button>
                  )
                })}
              </div>
            </FieldGroup>

            {/* 언제 — 날짜(커스텀 달력) + 시간(30분 간격 목록) */}
            <FieldGroup label="언제 열리나요" required>
              <div className="flex gap-1.5 mb-2.5 flex-wrap">
                <QuickChip onClick={() => handleQuickDate('sunday')}>이번 주일 오전 11시</QuickChip>
                <QuickChip onClick={() => handleQuickDate('today')}>오늘 저녁 7시</QuickChip>
                <QuickChip onClick={() => handleQuickDate('tomorrow')}>내일 저녁 7시</QuickChip>
                <QuickChip onClick={() => handleQuickDate('nextWeek')}>다음 주 같은 요일</QuickChip>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_108px] gap-2">
                <div>
                  <span className={subLabelClass}>날짜</span>
                  <DatePicker
                    value={startParts.date}
                    onChange={handleStartDate}
                    className={dateTriggerClass}
                  />
                </div>
                <div>
                  <span className={subLabelClass}>시작 시간</span>
                  <TimePicker
                    value={startParts.time}
                    onChange={handleStartTime}
                    className={dateTriggerClass}
                  />
                </div>
              </div>

              {/* 종료는 "얼마나 하는지"로 — 며칠짜리 일정만 직접 설정 */}
              <div className="mt-3">
                <span className={subLabelClass}>얼마나 하나요</span>
                <div className="flex gap-1.5 flex-wrap">
                  {END_OPTIONS.map(o => (
                    <ScopeChip
                      key={o.key}
                      active={endMode === o.key}
                      onClick={() => handleEndMode(o.key)}
                    >
                      {o.label}
                    </ScopeChip>
                  ))}
                </div>
                {endMode === 'custom' && (
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_108px] gap-2">
                    <div>
                      <span className={subLabelClass}>종료 날짜</span>
                      <DatePicker
                        value={endParts.date}
                        onChange={handleEndDate}
                        minDate={startParts.date || undefined}
                        className={dateTriggerClass}
                      />
                    </div>
                    <div>
                      <span className={subLabelClass}>종료 시간</span>
                      <TimePicker
                        value={endParts.time}
                        onChange={handleEndTime}
                        className={dateTriggerClass}
                      />
                    </div>
                  </div>
                )}
                {endBeforeStart ? (
                  <p className="mt-1.5 text-[11.5px] font-semibold leading-[1.5] text-red-500 dark:text-red-400">
                    종료가 시작보다 앞설 수 없어요.
                  </p>
                ) : form.start_datetime && form.end_datetime ? (
                  <p className="mt-1.5 text-[11.5px] leading-[1.5] text-gray-500 dark:text-white/45 tabular-nums">
                    {formatKstDateTime(form.start_datetime)} ~ {formatKstDateTime(form.end_datetime)}
                  </p>
                ) : null}
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none leading-[1.6]"
              />
            </FieldGroup>

            {/* 반복 */}
            <FieldGroup label="반복">
              <div className="flex gap-1.5 flex-wrap">
                {REPEAT_OPTIONS.map(o => (
                  <ScopeChip
                    key={o.value}
                    active={form.repeat_type === o.value}
                    onClick={() => handleRepeatChange(o.value)}
                  >
                    {o.label}
                  </ScopeChip>
                ))}
              </div>
              {form.repeat_type !== 'none' && (
                <div className="mt-2.5">
                  <span className={subLabelClass}>반복 종료일</span>
                  <DatePicker
                    value={form.repeat_end_date ?? ''}
                    onChange={(v) => setForm({ ...form, repeat_end_date: v })}
                    minDate={startParts.date || undefined}
                    className={dateTriggerClass}
                  />
                </div>
              )}
            </FieldGroup>

            {/* RSVP 마감 — 정확한 일시 대신 시작 기준 프리셋으로 */}
            <FieldGroup label="참석(RSVP) 마감">
              <div className="flex gap-1.5 flex-wrap">
                {RSVP_OPTIONS.map(o => (
                  <ScopeChip
                    key={o.key}
                    active={rsvpMode === o.key}
                    disabled={isRepeating}
                    onClick={() => handleRsvpMode(o.key)}
                  >
                    {o.label}
                  </ScopeChip>
                ))}
              </div>
              {rsvpMode === 'custom' && !isRepeating && (
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_108px] gap-2">
                  <div>
                    <span className={subLabelClass}>마감 날짜</span>
                    <DatePicker
                      value={deadlineParts.date}
                      onChange={handleDeadlineDate}
                      maxDate={startParts.date || undefined}
                      className={dateTriggerClass}
                    />
                  </div>
                  <div>
                    <span className={subLabelClass}>마감 시간</span>
                    <TimePicker
                      value={deadlineParts.time}
                      onChange={handleDeadlineTime}
                      className={dateTriggerClass}
                    />
                  </div>
                </div>
              )}
              {isRepeating ? (
                <p className="mt-1.5 text-[11.5px] leading-[1.5] text-gray-500 dark:text-white/50">
                  반복 일정에는 RSVP 마감을 걸 수 없어요. 마감은 회차별로 적용되지 않아서,
                  한 번 지나면 이후 모든 회차가 잠깁니다.
                </p>
              ) : rsvpAfterStart ? (
                <p className="mt-1.5 text-[11.5px] font-semibold leading-[1.5] text-red-500 dark:text-red-400">
                  마감은 일정 시작 시각보다 늦을 수 없어요.
                </p>
              ) : rsvpMode !== 'none' && !form.start_datetime ? (
                <p className="mt-1.5 text-[11.5px] leading-[1.5] text-gray-500 dark:text-white/45">
                  시작 시각을 정하면 마감이 자동으로 계산돼요.
                </p>
              ) : rsvpMode !== 'none' && form.rsvp_deadline ? (
                <p className="mt-1.5 text-[11.5px] leading-[1.5] text-gray-500 dark:text-white/45 tabular-nums">
                  {formatKstDateTime(form.rsvp_deadline)}까지 참석 등록을 받아요. 마감 후에는
                  새 등록만 막히고 기존 응답의 변경·취소는 계속 가능합니다.
                </p>
              ) : (
                <p className="mt-1.5 text-[11.5px] leading-[1.5] text-gray-500 dark:text-white/45">
                  마감 없이 시작 전까지 언제든 참석 등록을 받아요.
                </p>
              )}
            </FieldGroup>

            {/* 첨부 (등록 시만) */}
            {!editingEvent && (
              <FieldGroup label="첨부 (이미지·PDF)">
                <label className="block">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-bold border border-[var(--brand-glow)] cursor-pointer hover:bg-[var(--brand-soft-strong)] transition-colors">
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
                <p className="text-[13.5px] font-bold text-ink-strong">
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
                    ? 'bg-brand shadow-[0_0_16px_var(--brand-glow)]'
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
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
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

export default EventComposer
