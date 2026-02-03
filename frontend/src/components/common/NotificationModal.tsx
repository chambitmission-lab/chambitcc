import { useState, useEffect } from 'react'
import { getNotifications } from '../../api/notification'
import { useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications'
import { showToast } from '../../utils/toast'
import type { Notification } from '../../types/notification'
import './NotificationModal.css'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange: () => void
}

const NotificationModal = ({ isOpen, onClose, onUnreadCountChange }: NotificationModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [readingIds, setReadingIds] = useState<Set<number>>(new Set())
  const isLoggedIn = !!localStorage.getItem('access_token')
  
  // React Query mutations
  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      // 배열인지 확인하고 설정
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('공지사항 로드 에러:', error)
      showToast(error instanceof Error ? error.message : '공지사항을 불러오는데 실패했습니다', 'error')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // 로그인 상태이고 읽지 않은 알림이며, 현재 읽음 처리 중이 아닌 경우에만 처리
    if (isLoggedIn && !notification.is_read && !readingIds.has(notification.id)) {
      try {
        // 읽음 처리 중 표시
        setReadingIds(prev => new Set(prev).add(notification.id))
        
        await markAsReadMutation.mutateAsync(notification.id)
        
        // 읽음 상태 업데이트
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        onUnreadCountChange()
      } catch (error) {
        console.error('읽음 처리 실패:', error)
        // 실패 시 읽음 처리 중 상태 제거
        setReadingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(notification.id)
          return newSet
        })
      } finally {
        // 성공 시에도 읽음 처리 중 상태 제거 (이미 is_read가 true로 변경됨)
        setReadingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(notification.id)
          return newSet
        })
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!isLoggedIn) return
    
    try {
      await markAllAsReadMutation.mutateAsync()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      onUnreadCountChange()
      showToast('모든 알림을 읽음 처리했습니다', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '읽음 처리에 실패했습니다', 'error')
    }
  }

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter(n => !n.is_read).length 
    : 0

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="notification-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="notification-modal">
        {/* Header */}
        <div className="notification-modal-header">
          <h2>공지사항</h2>
          <div className="notification-modal-actions">
            {isLoggedIn && unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                모두 읽음
              </button>
            )}
            <button onClick={onClose} className="close-btn">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="notification-modal-content">
          {loading ? (
            <div className="notification-loading">
              <div className="spinner"></div>
              <p>로딩 중...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <span className="material-icons-outlined">notifications_none</span>
              <p>공지사항이 없습니다</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-header">
                    <h3>{notification.title}</h3>
                    {!notification.is_read && <span className="unread-badge"></span>}
                  </div>
                  <p className="notification-item-content">
                    {notification.content}
                  </p>
                  <span className="notification-item-date">
                    {new Date(notification.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationModal
