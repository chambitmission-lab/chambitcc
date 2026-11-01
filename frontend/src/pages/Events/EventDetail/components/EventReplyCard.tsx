import { useEffect, useMemo, useState } from 'react'
import type { AttendanceStatus } from '../../../../types/event'
import { formatKstDateTime, formatRemaining, parseKstDate } from '../../../../utils/kstTime'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'
import { confirmDialog } from '../../../../utils/confirmDialog'
import { RsvpGlyph } from './EventDetailIcons'

interface EventReplyCardProps {
  userAttendanceStatus?: AttendanceStatus
  onAttend: (status: AttendanceStatus) => void
  onCancel: () => void
  rsvpDeadline?: string | null
  t: Translation
}

/* 응답별 시맨틱 색(초록/앰버/로즈)은 RSVP 전용 — 브랜드 색과 구분 */
const FACES: { value: AttendanceStatus; tone: 'ok' | 'maybe' | 'no' }[] = [
  { value: 'attending', tone: 'ok' },
  { value: 'maybe', tone: 'maybe' },
  { value: 'not_attending', tone: 'no' },
]

/** "함께하실 수 있나요?" — 선화 아이콘 세 개로 응답·변경, 마감 규칙은 그대로 */
export const EventReplyCard = ({ userAttendanceStatus, onAttend, onCancel, rsvpDeadline, t }: EventReplyCardProps) => {
  const { language } = useLanguage()

  // 서버 값은 오프셋 없는 KST 벽시계 → KST로 못 박아 파싱 (기기 타임존 영향 제거)
  const deadlineAt = useMemo(() => {
    if (!rsvpDeadline) return null
    const time = parseKstDate(rsvpDeadline).getTime()
    return Number.isNaN(time) ? null : time
  }, [rsvpDeadline])

  // 화면을 열어둔 채 마감을 넘겨도 잠기도록 현재 시각을 주기적으로 갱신
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (deadlineAt === null) return
    const tick = () => setNow(Date.now())
    const interval = window.setInterval(tick, 15000)
    const untilDeadline = deadlineAt - Date.now()
    // 마감 순간에 정확히 한 번 더 (setTimeout 최대치를 넘는 먼 미래는 interval 이 처리)
    const timer =
      untilDeadline > 0 && untilDeadline < 2 ** 31 - 1 ? window.setTimeout(tick, untilDeadline + 500) : undefined
    const onVisibility = () => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      if (timer !== undefined) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [deadlineAt])

  const isClosed = deadlineAt !== null && now >= deadlineAt
  const deadlineLabel = rsvpDeadline ? formatKstDateTime(rsvpDeadline, language) : null
  const remaining = deadlineAt !== null ? formatRemaining(deadlineAt - now, language) : null
  // 마감 임박(24시간 이내)일 때만 남은 시간을 붙인다
  const showRemaining =
    !isClosed && remaining !== null && deadlineAt !== null && deadlineAt - now < 24 * 60 * 60 * 1000
  // 마감 후 새 응답은 막고, 이미 응답한 사람은 변경·취소할 수 있다
  const locked = isClosed && !userAttendanceStatus

  const faceLabel: Record<AttendanceStatus, string> = {
    attending: t.faceAttending,
    maybe: t.faceMaybe,
    not_attending: t.faceNotAttending,
  }

  const handleCancel = async () => {
    // 마감 후 취소는 허용하되, 다시 등록할 수 없다는 점을 반드시 알린다
    if (
      isClosed &&
      !(await confirmDialog({
        title: t.rsvpCancelAfterCloseTitle,
        message: t.rsvpCancelAfterCloseConfirm,
        confirmText: t.rsvpCancelAfterCloseAction,
        cancelText: t.close,
        tone: 'warning',
        icon: 'event_busy',
      }))
    )
      return
    onCancel()
  }

  return (
    <section className="mt-3.5 rounded-[22px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-[18px] lg:p-5">
      <div className="text-center">
        <h2 className="text-ink-strong text-[16.5px] lg:text-[17.5px] font-extrabold tracking-[-0.02em]">
          {t.replyQuestion}
        </h2>
        <p
          className={`mt-2 text-[13.5px] lg:text-[14.5px] font-semibold leading-[1.5] ${
            isClosed ? 'text-rose-500 dark:text-rose-400' : 'text-gray-500 dark:text-white/55'
          }`}
        >
          {isClosed ? (
            <>
              {t.rsvpClosed}
              <span className="block text-[12.5px] lg:text-[13.5px] text-gray-400 dark:text-white/45">
                {userAttendanceStatus ? t.rsvpClosedForResponder : t.rsvpClosedForNewcomer}
              </span>
            </>
          ) : deadlineLabel ? (
            <>
              {t.replyUntil.replace('{date}', deadlineLabel)}
              {showRemaining && (
                <span className="ml-1.5 inline-flex items-center h-5 px-2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11.5px] font-bold align-[1px]">
                  {t.rsvpRemaining.replace('{time}', remaining as string)}
                </span>
              )}
            </>
          ) : (
            t.replyAnytime
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3.5" role="group" aria-label={t.replyQuestion}>
        {FACES.map(f => {
          const selected = userAttendanceStatus === f.value
          return (
            <button
              key={f.value}
              type="button"
              data-tone={f.tone}
              data-sel={selected}
              aria-pressed={selected}
              disabled={locked}
              onClick={() => {
                if (!selected) onAttend(f.value)
              }}
              className="evd-face bg-[var(--app-canvas)] text-gray-600 dark:text-white/70 text-[15px] lg:text-[16px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RsvpGlyph status={f.value} size={30} className="evd-face-emoji" />
              {faceLabel[f.value]}
              {selected && <span className="text-[11.5px] font-bold -mt-1">✓ {t.replyMine}</span>}
            </button>
          )
        })}
      </div>

      {userAttendanceStatus && (
        <button
          type="button"
          onClick={handleCancel}
          className="block w-full mt-2.5 h-9 rounded-xl text-gray-400 dark:text-white/45 text-[13px] lg:text-[14px] font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-600 dark:hover:text-white/70 transition-colors"
        >
          {t.cancelAttendance}
        </button>
      )}
    </section>
  )
}
