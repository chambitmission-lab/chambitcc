// 그룹장이 자기 방의 모임을 잡는 시트.
// 네이티브 datetime-local(브라우저 로케일·OS 달력)을 버리고 앱 공통 DatePicker/TimePicker를 쓴다.
// 종료·마감은 절대 일시가 아니라 "얼마나 / 언제까지"라는 상대값으로 받는다 —
// 그룹장이 실제로 아는 건 "몇 시에 모여서 두 시간"이지 "몇 시에 끝나는지"가 아니다.
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import DatePicker from '../common/DatePicker'
import TimePicker from '../common/TimePicker'
import {
  FieldGroup,
  QuickChip,
  ScopeChip,
  dateTriggerClass,
  subLabelClass,
  textInputClass,
} from '../common/ComposerFields'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../locales'
import { createEvent } from '../../api/event'
import { eventKeys } from '../../hooks/useEvents'
import { showToast } from '../../utils/toast'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { calendarDateKey, kstNow } from '../../utils/kstTime'
import { addMinutes, joinDT, splitDT, toLocalDatetimeInput } from '../../utils/datetimeParts'

interface CreateGroupMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: number
  groupName: string
}

/* 구역·셀 모임은 이름이 몇 가지로 반복된다 — 타이핑 대신 한 번 탭 */
const TITLE_PRESETS = ['구역예배', '셀 모임', '기도 모임', '친교 모임', '성경공부']

type EndMode = '1h' | '90m' | '2h' | 'custom'
const END_OPTIONS: { key: EndMode; label: string; minutes?: number }[] = [
  { key: '1h', label: '1시간', minutes: 60 },
  { key: '90m', label: '1시간 30분', minutes: 90 },
  { key: '2h', label: '2시간', minutes: 120 },
  { key: 'custom', label: '직접 설정' },
]

type RsvpMode = 'none' | 'atStart' | '1d' | '3d' | 'custom'
const RSVP_OPTIONS: { key: RsvpMode; label: string; minutesBefore?: number }[] = [
  { key: 'none', label: '마감 없음' },
  { key: 'atStart', label: '시작 전까지', minutesBefore: 0 },
  { key: '1d', label: '하루 전', minutesBefore: 60 * 24 },
  { key: '3d', label: '3일 전', minutesBefore: 60 * 24 * 3 },
  { key: 'custom', label: '직접 선택' },
]

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DDTHH:mm' → '8월 10일 (일) 오후 2:00' — 멤버에게 보일 모습 그대로 */
const humanize = (v: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v)
  if (!m) return ''
  const [, y, mo, d, hh, mm] = m
  const day = WEEKDAYS[new Date(+y, +mo - 1, +d).getDay()]
  const h = +hh
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${+mo}월 ${+d}일 (${day}) ${h < 12 ? '오전' : '오후'} ${h12}:${mm}`
}

/** 'HH:mm' 조각만 사람 표기로 (종료 시각은 날짜를 반복하지 않는다) */
const humanizeTime = (v: string): string => {
  const m = /T(\d{2}):(\d{2})$/.exec(v)
  if (!m) return ''
  const h = +m[1]
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h < 12 ? '오전' : '오후'} ${h12}:${m[2]}`
}

const CreateGroupMeetingModal = ({
  isOpen,
  onClose,
  groupId,
  groupName,
}: CreateGroupMeetingModalProps) => {
  const { language } = useLanguage()
  const t = translations[language]
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDt, setStartDt] = useState('')
  const [endDt, setEndDt] = useState('')
  const [location, setLocation] = useState('')
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [endMode, setEndMode] = useState<EndMode>('90m')
  const [rsvpMode, setRsvpMode] = useState<RsvpMode>('none')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const startParts = splitDT(startDt)
  const endParts = splitDT(endDt)
  const deadlineParts = splitDT(rsvpDeadline)

  // 같은 'YYYY-MM-DDTHH:mm' 형식이라 문자열 비교로 시각 순서를 판정할 수 있다
  const rsvpAfterStart = !!rsvpDeadline && !!startDt && rsvpDeadline > startDt
  const endBeforeStart = !!startDt && !!endDt && endDt < startDt

  const handleClose = () => {
    if (submitting) return
    setTitle('')
    setDescription('')
    setStartDt('')
    setEndDt('')
    setLocation('')
    setRsvpDeadline('')
    setEndMode('90m')
    setRsvpMode('none')
    setErrorMsg('')
    onClose()
  }

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(handleClose, isOpen)

  /* 시작이 정해지거나 바뀌면 종료·마감을 한 곳에서 같이 굴린다 */
  const applyStart = (start: string, nextEndMode = endMode, nextRsvpMode = rsvpMode) => {
    setStartDt(start)

    const dur = END_OPTIONS.find((o) => o.key === nextEndMode)?.minutes
    if (dur != null) {
      setEndDt(start ? addMinutes(start, dur) : '')
    } else if (start) {
      // 직접 설정 중이라도 종료가 시작보다 앞서게 두지는 않는다
      setEndDt((prev) => (!prev || prev < start ? addMinutes(start, 90) : prev))
    }

    if (nextRsvpMode === 'none') {
      setRsvpDeadline('')
    } else {
      const before = RSVP_OPTIONS.find((o) => o.key === nextRsvpMode)?.minutesBefore
      if (before != null) setRsvpDeadline(start ? addMinutes(start, -before) : '')
    }
  }

  /* 구역 모임의 현실적인 기본값 — 주일 오후 2시(예배 후), 평일은 저녁 7시 30분 */
  const handleQuickDate = (mode: 'sunday' | 'today' | 'tomorrow' | 'nextWeek') => {
    const base = kstNow()
    base.setSeconds(0, 0)
    if (mode === 'tomorrow') base.setDate(base.getDate() + 1)
    if (mode === 'nextWeek') base.setDate(base.getDate() + 7)
    if (mode === 'sunday') {
      // 다가오는 주일 (오늘이 일요일이면 오늘)
      base.setDate(base.getDate() + ((7 - base.getDay()) % 7))
      base.setHours(14, 0)
    } else {
      base.setHours(19, 30)
    }
    applyStart(toLocalDatetimeInput(base))
  }

  const handleEndMode = (mode: EndMode) => {
    setEndMode(mode)
    applyStart(startDt, mode)
  }

  const handleRsvpMode = (mode: RsvpMode) => {
    setRsvpMode(mode)
    if (mode === 'custom') {
      // 직접 선택으로 들어올 때 빈칸 대신 시작 시각을 출발점으로 깔아 준다
      setRsvpDeadline((prev) => prev || startDt)
    } else {
      applyStart(startDt, endMode, mode)
    }
  }

  // 멤버에게 보일 한 줄 — 값이 흩어져 있어도 결과가 한눈에 확인된다
  const preview = useMemo(() => {
    if (!startDt) return ''
    const head = humanize(startDt)
    const tail = endDt && !endBeforeStart ? ` ~ ${humanizeTime(endDt)}` : ''
    return `${head}${tail}`
  }, [startDt, endDt, endBeforeStart])

  const canSubmit =
    !!title.trim() && !!startDt && !!endDt && !endBeforeStart && !rsvpAfterStart && !submitting

  // 시트를 연 시점 기준 — 렌더마다 시간을 다시 읽지 않는다
  const todayStillOpen = useMemo(() => {
    const now = kstNow()
    return now.getHours() * 60 + now.getMinutes() < 19 * 60 + 30
  }, [])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!canSubmit) return

    setSubmitting(true)
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        category: 'meeting',
        start_datetime: startDt,
        end_datetime: endDt,
        location: location.trim() || undefined,
        repeat_type: 'none',
        is_published: true,
        group_id: groupId,
        rsvp_deadline: rsvpDeadline || null,
      })
      showToast(t.createSuccess, 'success')
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      handleClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={handleClose}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="min-w-0">
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase truncate">
              {groupName}
            </p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              모임 만들기
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-5">
            {errorMsg && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                {errorMsg}
              </div>
            )}

            {/* 무슨 모임 — 자주 쓰는 이름은 칩으로 */}
            <FieldGroup label="무슨 모임인가요" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 8월 구역예배"
                required
                maxLength={200}
                className={textInputClass}
              />
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {TITLE_PRESETS.map((p) => (
                  <QuickChip key={p} onClick={() => setTitle(p)}>
                    {p}
                  </QuickChip>
                ))}
              </div>
            </FieldGroup>

            {/* 언제 — 앱 공통 달력 + 30분 간격 시간 목록 */}
            <FieldGroup label="언제 모이나요" required>
              <div className="flex gap-1.5 mb-2.5 flex-wrap">
                <QuickChip onClick={() => handleQuickDate('sunday')}>이번 주일 오후 2시</QuickChip>
                {/* 이미 저녁 7시 반이 지난 시각이라면 '오늘' 칩은 과거 모임을 만들 뿐이다 */}
                {todayStillOpen && (
                  <QuickChip onClick={() => handleQuickDate('today')}>오늘 저녁 7시 반</QuickChip>
                )}
                <QuickChip onClick={() => handleQuickDate('tomorrow')}>내일 저녁 7시 반</QuickChip>
                <QuickChip onClick={() => handleQuickDate('nextWeek')}>다음 주 같은 요일</QuickChip>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_108px] gap-2">
                <div>
                  <span className={subLabelClass}>날짜</span>
                  <DatePicker
                    value={startParts.date}
                    onChange={(date) => applyStart(joinDT(date, startParts.time || '19:30'))}
                    minDate={calendarDateKey(kstNow())}
                    className={dateTriggerClass}
                  />
                </div>
                <div>
                  <span className={subLabelClass}>시작 시간</span>
                  <TimePicker
                    value={startParts.time}
                    onChange={(time) =>
                      applyStart(joinDT(startParts.date || calendarDateKey(kstNow()), time))
                    }
                    className={dateTriggerClass}
                  />
                </div>
              </div>
            </FieldGroup>

            {/* 얼마나 — 종료 "시각"이 아니라 "길이"로 받는다 */}
            <FieldGroup label="얼마나 모이나요">
              <div className="flex gap-1.5 flex-wrap">
                {END_OPTIONS.map((o) => (
                  <ScopeChip key={o.key} active={endMode === o.key} onClick={() => handleEndMode(o.key)}>
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
                      onChange={(date) =>
                        setEndDt(joinDT(date, endParts.time || startParts.time || '21:00'))
                      }
                      minDate={startParts.date || undefined}
                      className={dateTriggerClass}
                    />
                  </div>
                  <div>
                    <span className={subLabelClass}>종료 시간</span>
                    <TimePicker
                      value={endParts.time}
                      onChange={(time) => setEndDt(joinDT(endParts.date || startParts.date, time))}
                      className={dateTriggerClass}
                    />
                  </div>
                </div>
              )}
              {endBeforeStart && (
                <p className="mt-1.5 text-[11.5px] font-semibold leading-[1.5] text-red-500 dark:text-red-400">
                  종료가 시작보다 앞설 수 없어요.
                </p>
              )}
            </FieldGroup>

            {/* 어디서 */}
            <FieldGroup label="어디서 모이나요">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/35 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예) 김집사님 댁 · 교회 소예배실"
                  maxLength={200}
                  className={`${textInputClass} pl-10`}
                />
              </div>
            </FieldGroup>

            {/* 참석 마감 — 절대 일시 대신 시작 기준 상대값 */}
            <FieldGroup label="참석 마감">
              <div className="flex gap-1.5 flex-wrap">
                {RSVP_OPTIONS.map((o) => (
                  <ScopeChip key={o.key} active={rsvpMode === o.key} onClick={() => handleRsvpMode(o.key)}>
                    {o.label}
                  </ScopeChip>
                ))}
              </div>
              {rsvpMode === 'custom' && (
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_108px] gap-2">
                  <div>
                    <span className={subLabelClass}>마감 날짜</span>
                    <DatePicker
                      value={deadlineParts.date}
                      onChange={(date) =>
                        setRsvpDeadline(
                          joinDT(date, deadlineParts.time || startParts.time || '23:30'),
                        )
                      }
                      maxDate={startParts.date || undefined}
                      className={dateTriggerClass}
                    />
                  </div>
                  <div>
                    <span className={subLabelClass}>마감 시간</span>
                    <TimePicker
                      value={deadlineParts.time}
                      onChange={(time) =>
                        setRsvpDeadline(joinDT(deadlineParts.date || startParts.date, time))
                      }
                      className={dateTriggerClass}
                    />
                  </div>
                </div>
              )}
              {rsvpAfterStart ? (
                <p className="mt-1.5 text-[11.5px] font-semibold leading-[1.5] text-red-500 dark:text-red-400">
                  {t.rsvpDeadlineAfterStart}
                </p>
              ) : rsvpMode !== 'none' && !startDt ? (
                <p className="mt-1.5 text-[11.5px] leading-[1.5] text-gray-500 dark:text-white/45">
                  모이는 시각을 정하면 마감이 자동으로 계산돼요.
                </p>
              ) : rsvpMode !== 'none' && rsvpDeadline ? (
                <p className="mt-1.5 text-[11.5px] leading-[1.5] text-gray-500 dark:text-white/45">
                  {humanize(rsvpDeadline)}까지 참석을 받아요. 마감 후에도 이미 응답한 멤버는
                  변경·취소할 수 있어요.
                </p>
              ) : (
                <p className="mt-1.5 text-[11.5px] leading-[1.5] text-gray-500 dark:text-white/45">
                  마감 없이 시작 전까지 언제든 참석을 받아요.
                </p>
              )}
            </FieldGroup>

            {/* 안내 메시지 */}
            <FieldGroup label="멤버에게 남길 말">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="준비물, 오시는 길, 나눌 본문 등을 적어주세요"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] leading-[1.6] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none"
              />
            </FieldGroup>
          </div>

          {/* 푸터 — 만들기 직전에 멤버가 볼 한 줄을 그대로 보여준다 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3">
            {preview && (
              <div className="mb-2.5 flex items-start gap-2 px-3 py-2 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-glow)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-brand shrink-0 mt-[2px]">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <p className="text-[12px] font-bold text-brand leading-[1.5] tabular-nums">
                  {preview}
                  {location.trim() && (
                    <span className="font-medium"> · {location.trim()}</span>
                  )}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              >
                {t.cancel}
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
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    모임 만들기
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroupMeetingModal
