import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBulletins, createBulletin, deleteBulletin } from '../../api/bulletin'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import type { Bulletin } from '../../types/bulletin'
import './NotificationManagement.css'
import './BulletinManagement.css'

const BulletinManagement = () => {
  const navigate = useNavigate()
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bulletin_date: new Date().toISOString().split('T')[0]
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    
    loadBulletins()
  }, [navigate])

  const loadBulletins = async () => {
    try {
      setLoading(true)
      const data = await getBulletins(0, 100) // 관리자는 전체 목록 조회
      setBulletins(data)
    } catch (error) {
      console.error('주보 로드 에러:', error)
      showToast(error instanceof Error ? error.message : '주보를 불러오는데 실패했습니다', 'error')
      setBulletins([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name}은(는) 이미지 파일이 아닙니다`, 'error')
        continue
      }

      newFiles.push(file)
      
      // 미리보기용 URL 생성
      const previewUrl = URL.createObjectURL(file)
      newPreviews.push(previewUrl)
    }

    setImageFiles([...imageFiles, ...newFiles])
    setImagePreviews([...imagePreviews, ...newPreviews])
    showToast(`${newFiles.length}개의 이미지가 추가되었습니다`, 'success')
  }

  const handleRemovePage = (index: number) => {
    // 미리보기 URL 해제
    URL.revokeObjectURL(imagePreviews[index])
    
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      showToast('제목을 입력해주세요', 'error')
      return
    }

    if (imageFiles.length === 0) {
      showToast('최소 1개 이상의 이미지를 추가해주세요', 'error')
      return
    }

    try {
      setUploading(true)
      
      // ISO 형식으로 날짜 변환
      const bulletinDate = new Date(formData.bulletin_date).toISOString()
      
      await createBulletin(
        formData.title,
        bulletinDate,
        formData.description,
        imageFiles
      )
      
      showToast('주보가 등록되었습니다', 'success')
      
      // 미리보기 URL 정리
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      
      setFormData({ title: '', description: '', bulletin_date: new Date().toISOString().split('T')[0] })
      setImageFiles([])
      setImagePreviews([])
      setIsCreating(false)
      loadBulletins()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '주보 등록에 실패했습니다', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await deleteBulletin(id)
      showToast('주보가 삭제되었습니다', 'success')
      loadBulletins()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleCancel = () => {
    // 미리보기 URL 정리
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    
    setFormData({ title: '', description: '', bulletin_date: new Date().toISOString().split('T')[0] })
    setImageFiles([])
    setImagePreviews([])
    setIsCreating(false)
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
          <h1>주보 관리</h1>
          {!isCreating && (
            <button 
              className="btn-primary"
              onClick={() => setIsCreating(true)}
            >
              새 주보 등록
            </button>
          )}
        </div>

        {isCreating && (
          <div className="notification-form-card">
            <h2>새 주보 등록</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">제목</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 2024년 2월 첫째주 주보"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">설명</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="주보에 대한 간단한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bulletin_date">주보 날짜</label>
                <input
                  id="bulletin_date"
                  type="date"
                  value={formData.bulletin_date}
                  onChange={(e) => setFormData({ ...formData, bulletin_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="images">주보 이미지</label>
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <p className="form-help">여러 이미지를 선택할 수 있습니다. 선택한 순서대로 페이지가 구성됩니다.</p>
              </div>

              {imageFiles.length > 0 && (
                <div className="pages-preview">
                  <h3>등록된 페이지 ({imageFiles.length}개)</h3>
                  <div className="pages-grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="page-item">
                        <img src={preview} alt={`페이지 ${index + 1}`} />
                        <div className="page-overlay">
                          <span className="page-number">페이지 {index + 1}</span>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => handleRemovePage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? '처리 중...' : '등록하기'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancel} disabled={uploading}>
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="notifications-list">
          {bulletins.length === 0 ? (
            <div className="list-empty">
              <div className="empty-icon">📰</div>
              <p>등록된 주보가 없습니다</p>
              <p className="empty-subtitle">첫 번째 주보를 등록해주세요</p>
            </div>
          ) : (
            <div className="notifications-feed">
              {bulletins.map((bulletin) => (
                <article key={bulletin.id} className="notification-card bulletin-card">
                  <div className="card-header">
                    <div className="card-avatar">📰</div>
                    <div className="card-meta">
                      <div className="card-author">주보</div>
                      <div className="card-time">
                        {new Date(bulletin.bulletin_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {bulletin.thumbnail_url && (
                    <div className="bulletin-thumbnail-preview">
                      <img src={bulletin.thumbnail_url} alt={bulletin.title} />
                    </div>
                  )}

                  <div className="card-content">
                    <h3 className="card-title">{bulletin.title}</h3>
                    {bulletin.description && (
                      <p className="card-text">{bulletin.description}</p>
                    )}
                    <div className="bulletin-info">
                      <span className="page-count">📄 {bulletin.page_count}페이지</span>
                      <span className="view-count">👁️ {bulletin.views}회</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button 
                      className="action-button delete"
                      onClick={() => handleDelete(bulletin.id)}
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

export default BulletinManagement
