import type { AttendanceStatus } from '../../../../types/event'

interface AttendanceSectionProps {
  userAttendanceStatus?: AttendanceStatus
  onAttend: (status: AttendanceStatus) => void
  onCancel: () => void
  rsvpDeadline?: string | null
  t: any
}

export const AttendanceSection = ({
  userAttendanceStatus,
  onAttend,
  onCancel,
  rsvpDeadline,
  t,
}: AttendanceSectionProps) => {
  const isClosed = !!rsvpDeadline && new Date(rsvpDeadline).getTime() < Date.now()
  const deadlineLabel = rsvpDeadline
    ? new Date(rsvpDeadline).toLocaleString()
    : null

  return (
    <div className="attendance-section">
      <div className="section-badge">✋ {t.attend}</div>

      {rsvpDeadline && (
        <div
          className={`rsvp-deadline-note ${isClosed ? 'closed' : ''}`}
          style={{
            fontSize: '0.85rem',
            color: isClosed ? '#b91c1c' : '#6b7280',
            margin: '0.5rem 0',
          }}
        >
          {isClosed ? t.rsvpClosed : `${t.rsvpDeadline}: ${deadlineLabel}`}
        </div>
      )}

      {userAttendanceStatus ? (
        <div className="attendance-current">
          <div className="current-status-card">
            <span className="status-icon">✓</span>
            <p>현재 상태: {t.attendanceStatus[userAttendanceStatus]}</p>
          </div>
          <button
            onClick={onCancel}
            className="cancel-btn"
            disabled={isClosed}
            aria-disabled={isClosed}
          >
            {t.cancelAttendance}
          </button>
        </div>
      ) : (
        <div className="attendance-buttons">
          <button
            onClick={() => onAttend('attending')}
            className="attend-btn attending"
            disabled={isClosed}
            aria-disabled={isClosed}
          >
            <span className="btn-icon">✓</span>
            {t.attendanceStatus.attending}
          </button>
          <button
            onClick={() => onAttend('maybe')}
            className="attend-btn maybe"
            disabled={isClosed}
            aria-disabled={isClosed}
          >
            <span className="btn-icon">?</span>
            {t.attendanceStatus.maybe}
          </button>
          <button
            onClick={() => onAttend('not_attending')}
            className="attend-btn not-attending"
            disabled={isClosed}
            aria-disabled={isClosed}
          >
            <span className="btn-icon">✗</span>
            {t.attendanceStatus.not_attending}
          </button>
        </div>
      )}
    </div>
  )
}
