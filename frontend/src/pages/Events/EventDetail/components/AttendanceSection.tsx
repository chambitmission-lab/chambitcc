import type { AttendanceStatus } from '../../../../types/event'

interface AttendanceSectionProps {
  userAttendanceStatus?: AttendanceStatus
  onAttend: (status: AttendanceStatus) => void
  onCancel: () => void
  t: any
}

export const AttendanceSection = ({
  userAttendanceStatus,
  onAttend,
  onCancel,
  t,
}: AttendanceSectionProps) => {
  return (
    <div className="attendance-section">
      <div className="section-badge">✋ {t.attend}</div>
      {userAttendanceStatus ? (
        <div className="attendance-current">
          <div className="current-status-card">
            <span className="status-icon">✓</span>
            <p>현재 상태: {t.attendanceStatus[userAttendanceStatus]}</p>
          </div>
          <button onClick={onCancel} className="cancel-btn">
            {t.cancelAttendance}
          </button>
        </div>
      ) : (
        <div className="attendance-buttons">
          <button
            onClick={() => onAttend('attending')}
            className="attend-btn attending"
          >
            <span className="btn-icon">✓</span>
            {t.attendanceStatus.attending}
          </button>
          <button onClick={() => onAttend('maybe')} className="attend-btn maybe">
            <span className="btn-icon">?</span>
            {t.attendanceStatus.maybe}
          </button>
          <button
            onClick={() => onAttend('not_attending')}
            className="attend-btn not-attending"
          >
            <span className="btn-icon">✗</span>
            {t.attendanceStatus.not_attending}
          </button>
        </div>
      )}
    </div>
  )
}
