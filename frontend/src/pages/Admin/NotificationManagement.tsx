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
        <div className="loading-spinner">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
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
        <h2>공지사항 목록</h2>
        {!Array.isArray(notifications) || notifications.length === 0 ? (
          <p className="empty-message">등록된 공지사항이 없습니다</p>
        ) : (
          <div className="notifications-grid">
            {notifications.map((notification) => (
              <div key={notification.id} className="notification-card">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  <span className={`status-badge ${notification.is_active ? 'active' : 'inactive'}`}>
                    {notification.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                <p className="notification-content">{notification.content}</p>
                <div className="notification-meta">
                  <span className="date">
                    {new Date(notification.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="notification-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(notification)}
                  >
                    수정
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(notification.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationManagement
