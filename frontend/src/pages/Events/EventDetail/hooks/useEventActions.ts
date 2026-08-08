import { useNavigate } from 'react-router-dom'
import { attendEvent, cancelAttendance } from '../../../../api/event'
import type { AttendanceStatus } from '../../../../types/event'
import type { Translation } from '../../../../locales'
import { showToast } from '../../../../utils/toast'

export const useEventActions = (eventId: number, refresh: () => void, t: Translation) => {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('access_token')

  const handleAttend = async (status: AttendanceStatus) => {
    if (!isLoggedIn) {
      showToast(t.loginRequired, 'error')
      navigate('/login')
      return
    }

    try {
      await attendEvent(eventId, { status })
      showToast(t.attendSuccess, 'success')
      refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.error, 'error')
    }
  }

  const handleCancelAttendance = async () => {
    if (!isLoggedIn) return

    try {
      await cancelAttendance(eventId)
      showToast(t.cancelSuccess, 'success')
      refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.error, 'error')
    }
  }

  return {
    isLoggedIn,
    handleAttend,
    handleCancelAttendance,
  }
}
