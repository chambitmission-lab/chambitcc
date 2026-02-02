import { useState, useEffect } from 'react'
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notification'
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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const isLoggedIn = !!localStorage.getItem('access_token')

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
    setSelectedNotification(notification)
    
    // 로그인 상태이고 읽지 않은 알림이면 읽음 처리
    if (isLoggedIn && !notification.is_read) {
      try {
        await markAsRead(notification.id)
        // 읽음 상태 업데이트
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        onUnreadCountChange()
      } catch (error) {
        console.error('읽음 처리 실패:', error)
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!isLoggedIn) return
    
    try {
      await markAllAsRead()
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
                  <p className="notification-item-preview">
                    {notification.content.length > 60
                      ? notification.content.substring(0, 60) + '...'
                      : notification.content}
                  </p>
                  <span className="notification-item-date">
                    {new Date(notification.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <>
          <div className="notification-backdrop" onClick={() => setSelectedNotification(null)} />
          <div className="notification-detail-modal">
            <div className="notification-detail-header">
              <h2>{selectedNotification.title}</h2>
              <button onClick={() => setSelectedNotification(null)} className="close-btn">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="notification-detail-content">
              <p className="notification-detail-date">
                {new Date(selectedNotification.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <div className="notification-detail-body">
                {selectedNotification.content}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default NotificationModal
