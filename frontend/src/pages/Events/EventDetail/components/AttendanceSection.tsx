import { useEffect, useMemo, useState } from 'react'
import type { AttendanceStatus } from '../../../../types/event'
import { formatKstDateTime, formatRemaining, parseKstDate } from '../../../../utils/kstTime'
import { useLanguage } from '../../../../contexts/LanguageContext'

interface AttendanceSectionProps {
  userAttendanceStatus?: AttendanceStatus
  onAttend: (status: AttendanceStatus) => void
  onCancel: () => void
  rsvpDeadline?: string | null
  t: any
}

const STATUS_OPTIONS: { value: AttendanceStatus; icon: string; className: string }[] = [
  { value: 'attending', icon: '✓', className: 'attending' },
  { value: 'maybe', icon: '?', className: 'maybe' },
  { value: 'not_attending', icon: '✗', className: 'not-attending' },
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
    <div className="attendance-section">
      <div className="section-badge">✋ {t.attend}</div>

      {rsvpDeadline && (
        <div
          className={`rsvp-deadline-note ${isClosed ? 'closed' : ''}`}
          style={{
            fontSize: '0.85rem',
            color: isClosed ? '#b91c1c' : showRemaining ? '#b45309' : '#6b7280',
            margin: '0.5rem 0',
            lineHeight: 1.5,
          }}
        >
          {isClosed ? (
            <>
              {t.rsvpClosed}
              <br />
              <span style={{ fontSize: '0.8rem' }}>
                {userAttendanceStatus ? t.rsvpClosedForResponder : t.rsvpClosedForNewcomer}
              </span>
            </>
          ) : (
            <>
              {t.rsvpDeadline}: {deadlineLabel}
              {showRemaining && ` · ${t.rsvpRemaining.replace('{time}', remaining as string)}`}
            </>
          )}
        </div>
      )}

      {userAttendanceStatus ? (
        <div className="attendance-current">
          <div className="current-status-card">
            <span className="status-icon">✓</span>
            <p>
              {t.currentStatus}: {t.attendanceStatus[userAttendanceStatus]}
            </p>
          </div>

          {/* 마감 후에도 이미 응답한 사람은 상태를 바꿀 수 있다 */}
          <div className="attendance-buttons">
            {STATUS_OPTIONS.filter(o => o.value !== userAttendanceStatus).map(o => (
              <button
                key={o.value}
                onClick={() => onAttend(o.value)}
                className={`attend-btn ${o.className}`}
              >
                <span className="btn-icon">{o.icon}</span>
                {t.changeTo.replace('{status}', t.attendanceStatus[o.value])}
              </button>
            ))}
          </div>

          <button onClick={handleCancel} className="cancel-btn">
            {t.cancelAttendance}
          </button>
        </div>
      ) : (
        <div className="attendance-buttons">
          {STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => onAttend(o.value)}
              className={`attend-btn ${o.className}`}
              disabled={isClosed}
              aria-disabled={isClosed}
            >
              <span className="btn-icon">{o.icon}</span>
              {t.attendanceStatus[o.value]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
