import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getAllDailyVerses, createDailyVerse, updateDailyVerse, deleteDailyVerse } from '../../api/dailyVerse'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import type { DailyVerse, CreateDailyVerseRequest } from '../../types/dailyVerse'
import './NotificationManagement.css'
import './DailyVerseManagement.css'

const DailyVerseManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
      
      // 오늘의 말씀 캐시 무효화 (기도 목록 화면에서 자동 갱신)
      queryClient.invalidateQueries({ queryKey: ['dailyVerse', 'today'] })
      
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
      
      // 오늘의 말씀 캐시 무효화 (기도 목록 화면에서 자동 갱신)
      queryClient.invalidateQueries({ queryKey: ['dailyVerse', 'today'] })
      
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
                <label htmlFor="verse_reference">📖 성경 구절</label>
                <input
                  id="verse_reference"
                  type="text"
                  value={formData.verse_reference}
                  onChange={(e) => setFormData({ ...formData, verse_reference: e.target.value })}
                  placeholder="예: 에스겔 37:5, 10"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="verse_text">✨ 말씀 내용</label>
                <textarea
                  id="verse_text"
                  value={formData.verse_text}
                  onChange={(e) => setFormData({ ...formData, verse_text: e.target.value })}
                  placeholder="말씀 내용을 입력하세요"
                  rows={4}
                  required
                />
              </div>

              <div className="form-info-box">
                <div className="info-item">
                  <span className="info-icon">📅</span>
                  <span>날짜는 자동으로 오늘로 설정됩니다</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🔄</span>
                  <span>오늘 날짜에 이미 말씀이 있으면 자동으로 수정됩니다</span>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? '✅ 수정 완료' : '✨ 등록하기'}
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
              <div className="empty-icon">📖</div>
              <p>등록된 말씀이 없습니다</p>
              <p className="empty-subtitle">첫 번째 말씀을 등록해주세요</p>
            </div>
          ) : (
            <div className="notifications-feed">
              {verses.map((verse) => {
                const verseDate = new Date(verse.verse_date)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                verseDate.setHours(0, 0, 0, 0)
                const isToday = verseDate.getTime() === today.getTime()
                
                return (
                  <article key={verse.id} className="notification-card verse-card">
                    <div className="card-header">
                      <div className="card-avatar verse-avatar">📖</div>
                      <div className="card-meta">
                        <div className="card-author">오늘의 말씀</div>
                        <div className="card-time">
                          {new Date(verse.verse_date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      {isToday && (
                        <span className="today-badge">오늘</span>
                      )}
                    </div>

                    <div className="card-content verse-content">
                      <h3 className="admin-verse-reference">{verse.verse_reference}</h3>
                      <p className="admin-verse-text">"{verse.verse_text}"</p>
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
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DailyVerseManagement
