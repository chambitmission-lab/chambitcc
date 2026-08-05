import { useEffect, useMemo, useState } from 'react'
import type { AttendanceStatus } from '../../../../types/event'
import { formatKstDateTime, formatRemaining, parseKstDate } from '../../../../utils/kstTime'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'

interface AttendanceSectionProps {
  userAttendanceStatus?: AttendanceStatus
  onAttend: (status: AttendanceStatus) => void
  onCancel: () => void
  rsvpDeadline?: string | null
  t: Translation
}

/* 참석 상태별 시맨틱 색(초록/앰버/로즈)은 RSVP 응답 전용 — 브랜드 색과 구분해 유지 */
const STATUS_OPTIONS: {
  value: AttendanceStatus
  emoji: string
  idle: string
}[] = [
  {
    value: 'attending',
    emoji: '🙋',
    idle: 'border-emerald-500/35 text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.06] hover:bg-emerald-500/15',
  },
  {
    value: 'maybe',
    emoji: '🤔',
    idle: 'border-amber-500/35 text-amber-600 dark:text-amber-400 bg-amber-500/[0.06] hover:bg-amber-500/15',
  },
  {
    value: 'not_attending',
    emoji: '🙏',
    idle: 'border-rose-500/35 text-rose-500 dark:text-rose-400 bg-rose-500/[0.06] hover:bg-rose-500/15',
  },
]

export const AttendanceSection = ({
  userAttendanceStatus,
  onAttend,
  onCancel,
  rsvpDeadline,
  t,
}: AttendanceSectionProps) => {
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
      untilDeadline > 0 && untilDeadline < 2 ** 31 - 1
        ? window.setTimeout(tick, untilDeadline + 500)
        : undefined
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

  const handleCancel = () => {
    // 마감 후 취소는 허용하되, 다시 등록할 수 없다는 점을 반드시 알린다
    if (isClosed && !window.confirm(t.rsvpCancelAfterCloseConfirm)) return
    onCancel()
  }

  return (
    <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-ink-strong text-[15px] font-bold tracking-[-0.01em]">
          ✋ {t.attend}
        </h2>
        {rsvpDeadline && isClosed && (
          <span className="inline-flex items-center px-2 h-5 rounded-full bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/55 text-[10.5px] font-bold shrink-0">
            {t.rsvpClosedBadge}
          </span>
        )}
        {rsvpDeadline && !isClosed && showRemaining && (
          <span className="inline-flex items-center px-2 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10.5px] font-bold shrink-0">
            {t.rsvpRemaining.replace('{time}', remaining as string)}
          </span>
        )}
      </div>

      {rsvpDeadline && (
        <p
          className={`text-[12.5px] leading-[1.55] mb-3 ${
            isClosed ? 'text-rose-500 dark:text-rose-400' : 'text-gray-500 dark:text-white/55'
          }`}
        >
          {isClosed ? (
            <>
              {t.rsvpClosed}
              <br />
              <span className="text-[11.5px] text-gray-400 dark:text-white/45">
                {userAttendanceStatus ? t.rsvpClosedForResponder : t.rsvpClosedForNewcomer}
              </span>
            </>
          ) : (
            <>
              {t.rsvpDeadline}: {deadlineLabel}
            </>
          )}
        </p>
      )}

      {userAttendanceStatus ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]">
            <span className="text-[20px]" aria-hidden="true">
              {STATUS_OPTIONS.find(o => o.value === userAttendanceStatus)?.emoji ?? '✓'}
            </span>
            <p className="text-ink-strong text-[13.5px] font-semibold">
              {t.currentStatus}:{' '}
              <span className="text-brand font-bold">
                {t.attendanceStatus[userAttendanceStatus]}
              </span>
            </p>
          </div>

          {/* 마감 후에도 이미 응답한 사람은 상태를 바꿀 수 있다 */}
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.filter(o => o.value !== userAttendanceStatus).map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => onAttend(o.value)}
                className={`inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border text-[12.5px] font-bold transition-colors ${o.idle}`}
              >
                <span aria-hidden="true">{o.emoji}</span>
                {t.changeTo.replace('{status}', t.attendanceStatus[o.value])}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="h-9 rounded-xl text-gray-400 dark:text-white/45 text-[12.5px] font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-600 dark:hover:text-white/70 transition-colors"
          >
            {t.cancelAttendance}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => onAttend(o.value)}
              disabled={isClosed}
              aria-disabled={isClosed}
              className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border text-[13px] font-bold transition-colors active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${o.idle}`}
            >
              <span className="text-[20px]" aria-hidden="true">{o.emoji}</span>
              {t.attendanceStatus[o.value]}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
