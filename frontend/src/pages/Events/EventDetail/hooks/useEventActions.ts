import { useNavigate } from 'react-router-dom'
import { attendEvent, cancelAttendance } from '../../../../api/event'
import type { AttendanceStatus } from '../../../../types/event'

export const useEventActions = (eventId: number, refresh: () => void, t: any) => {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('access_token')

  const handleAttend = async (status: AttendanceStatus) => {
    if (!isLoggedIn) {
      alert(t.loginRequired)
      navigate('/login')
      return
    }

    try {
      await attendEvent(eventId, { status })
      alert(t.attendSuccess)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    }
  }

  const handleCancelAttendance = async () => {
    if (!isLoggedIn) return

    try {
      await cancelAttendance(eventId)
      alert(t.cancelSuccess)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    }
  }

  return {
    isLoggedIn,
    handleAttend,
    handleCancelAttendance,
  }
}
