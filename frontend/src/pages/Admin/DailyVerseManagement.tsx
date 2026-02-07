import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllDailyVerses, createDailyVerse, updateDailyVerse, deleteDailyVerse } from '../../api/dailyVerse'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import type { DailyVerse, CreateDailyVerseRequest } from '../../types/dailyVerse'
import './NotificationManagement.css'

const DailyVerseManagement = () => {
  const navigate = useNavigate()
  const [verses, setVerses] = useState<DailyVerse[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreateDailyVerseRequest>({
    verse_text: '',
    verse_reference: ''
  })

  useEffect(() => {
    // 관리자 권한 확인
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    
    loadVerses()
  }, [navigate])

  const loadVerses = async () => {
    try {
      setLoading(true)
      const data = await getAllDailyVerses()
      setVerses(data)
    } catch (error) {
      console.error('오늘의 말씀 로드 에러:', error)
      showToast(error instanceof Error ? error.message : '오늘의 말씀을 불러오는데 실패했습니다', 'error')
      setVerses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.verse_text.trim() || !formData.verse_reference.trim()) {
      showToast('말씀 내용과 성경 구절을 입력해주세요', 'error')
      return
    }

    try {
      if (editingId) {
        await updateDailyVerse(editingId, {
          verse_text: formData.verse_text,
          verse_reference: formData.verse_reference
        })
        showToast('오늘의 말씀이 수정되었습니다', 'success')
      } else {
        await createDailyVerse(formData)
        showToast('오늘의 말씀이 등록되었습니다', 'success')
      }
      
      setFormData({ verse_text: '', verse_reference: '' })
      setIsCreating(false)
      setEditingId(null)
      loadVerses()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '작업에 실패했습니다', 'error')
    }
  }

  const handleEdit = (verse: DailyVerse) => {
    setFormData({
      verse_text: verse.verse_text,
      verse_reference: verse.verse_reference
    })
    setEditingId(verse.id)
    setIsCreating(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await deleteDailyVerse(id)
      showToast('오늘의 말씀이 삭제되었습니다', 'success')
      loadVerses()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleCancel = () => {
    setFormData({ verse_text: '', verse_reference: '' })
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
          <h1>오늘의 말씀 관리</h1>
          {!isCreating && (
            <button 
              className="btn-primary"
              onClick={() => setIsCreating(true)}
            >
              새 말씀 등록
            </button>
          )}
        </div>

        {isCreating && (
          <div className="notification-form-card">
            <h2>{editingId ? '오늘의 말씀 수정' : '새 말씀 등록'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="verse_text">말씀 내용</label>
                <textarea
                  id="verse_text"
                  value={formData.verse_text}
                  onChange={(e) => setFormData({ ...formData, verse_text: e.target.value })}
                  placeholder="말씀 내용을 입력하세요"
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="verse_reference">성경 구절</label>
                <input
                  id="verse_reference"
                  type="text"
                  value={formData.verse_reference}
                  onChange={(e) => setFormData({ ...formData, verse_reference: e.target.value })}
                  placeholder="예: 에스겔 37:5, 10"
                  required
                />
              </div>

              <div className="form-info">
                <p>💡 날짜는 자동으로 오늘로 설정됩니다</p>
                <p>💡 오늘 날짜에 이미 말씀이 있으면 자동으로 수정됩니다</p>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? '수정' : '등록'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="notifications-list">
          {!Array.isArray(verses) || verses.length === 0 ? (
            <div className="list-empty">
              <p>등록된 말씀이 없습니다</p>
              <p className="empty-subtitle">첫 번째 말씀을 등록해주세요</p>
            </div>
          ) : (
            <div className="notifications-feed">
              {verses.map((verse) => (
                <article key={verse.id} className="notification-card">
                  <div className="card-header">
                    <div className="card-avatar">📖</div>
                    <div className="card-meta">
                      <div className="card-author">오늘의 말씀</div>
                      <div className="card-time">
                        {new Date(verse.verse_date).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>

                  <div className="card-content">
                    <h3 className="card-title">{verse.verse_reference}</h3>
                    <p className="card-text">"{verse.verse_text}"</p>
                  </div>

                  <div className="card-footer">
                    <button 
                      className="action-button edit"
                      onClick={() => handleEdit(verse)}
                    >
                      <span className="action-icon">✏️</span>
                      <span>수정</span>
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => handleDelete(verse.id)}
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

export default DailyVerseManagement
