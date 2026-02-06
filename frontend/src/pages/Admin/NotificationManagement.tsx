import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, createNotification, updateNotification, deleteNotification } from '../../api/notification'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import type { Notification, CreateNotificationRequest } from '../../types/notification'
import './NotificationManagement.css'

const NotificationManagement = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreateNotificationRequest>({
    title: '',
    content: '',
    is_active: true
  })

  useEffect(() => {
    // 관리자 권한 확인
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    
    loadNotifications()
  }, [navigate])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      // NotificationsResponse 형식으로 받음
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('공지사항 로드 에러:', error)
      showToast(error instanceof Error ? error.message : '공지사항을 불러오는데 실패했습니다', 'error')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('제목과 내용을 입력해주세요', 'error')
      return
    }

    try {
      if (editingId) {
        await updateNotification(editingId, formData)
        showToast('공지사항이 수정되었습니다', 'success')
      } else {
        await createNotification(formData)
        showToast('공지사항이 생성되었습니다', 'success')
      }
      
      setFormData({ title: '', content: '', is_active: true })
      setIsCreating(false)
      setEditingId(null)
      loadNotifications()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '작업에 실패했습니다', 'error')
    }
  }

  const handleEdit = (notification: Notification) => {
    setFormData({
      title: notification.title,
      content: notification.content,
      is_active: notification.is_active
    })
    setEditingId(notification.id)
    setIsCreating(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await deleteNotification(id)
      showToast('공지사항이 삭제되었습니다', 'success')
      loadNotifications()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleCancel = () => {
    setFormData({ title: '', content: '', is_active: true })
    setIsCreating(false)
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-container-inner">
          <div className="loading-spinner">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-container-inner">
        <div className="admin-header">
          <h1>공지사항 관리</h1>
          {!isCreating && (
            <button 
              className="btn-primary"
              onClick={() => setIsCreating(true)}
            >
              새 공지사항 작성
            </button>
          )}
        </div>

        {isCreating && (
          <div className="notification-form-card">
            <h2>{editingId ? '공지사항 수정' : '새 공지사항 작성'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">제목</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">내용</label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={6}
                  required
                />
              </div>

              <div className="form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>활성화</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? '수정' : '생성'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="notifications-list">
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <div className="list-empty">
              <p>등록된 공지사항이 없습니다</p>
              <p className="empty-subtitle">첫 번째 공지사항을 작성해주세요</p>
            </div>
          ) : (
            <div className="notifications-feed">
              {notifications.map((notification) => (
                <article key={notification.id} className="notification-card">
                  <div className="card-header">
                    <div className="card-avatar">📢</div>
                    <div className="card-meta">
                      <div className="card-author">공지사항</div>
                      <div className="card-time">
                        {new Date(notification.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <span className={`status-badge ${notification.is_active ? 'active' : 'inactive'}`}>
                      {notification.is_active ? '활성' : '비활성'}
                    </span>
                  </div>

                  <div className="card-content">
                    <h3 className="card-title">{notification.title}</h3>
                    <p className="card-text">{notification.content}</p>
                  </div>

                  <div className="card-footer">
                    <button 
                      className="action-button edit"
                      onClick={() => handleEdit(notification)}
                    >
                      <span className="action-icon">✏️</span>
                      <span>수정</span>
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <span className="action-icon">🗑️</span>
                      <span>삭제</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationManagement
