import { useState, useEffect } from 'react'
import type { WorshipService } from '../../types/worship'
import './WorshipEditModal.css'

interface WorshipEditModalProps {
  service: WorshipService
  onClose: () => void
  onSave: (updatedService: WorshipService) => void
}

const WorshipEditModal = ({ service, onClose, onSave }: WorshipEditModalProps) => {
  const [formData, setFormData] = useState<WorshipService>(service)

  useEffect(() => {
    setFormData(service)
  }, [service])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: keyof WorshipService, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="worship-edit-modal-overlay" onClick={onClose}>
      <div className="worship-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="worship-edit-modal-header">
          <h2>예배 시간 수정</h2>
          <button className="worship-edit-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="worship-edit-modal-body">
            <div className="worship-edit-form">
              <div className="form-group">
                <label htmlFor="order">순서</label>
                <input
                  id="order"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.order}
                  onChange={(e) => handleChange('order', parseInt(e.target.value))}
                  required
                />
                <span className="form-group-hint">1부, 2부, 3부 등의 순서</span>
              </div>

              <div className="form-group">
                <label htmlFor="name">예배 이름</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="예: 주일낮예배 1부"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subtitle">부제목 (선택)</label>
                <input
                  id="subtitle"
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="예: (이른예배)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">시간</label>
                <input
                  id="time"
                  type="text"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  placeholder="예: 오전 7시 30분"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">장소 (선택)</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="예: 오렌엘 홀"
                />
              </div>

              <div className="form-group">
                <label htmlFor="is_active">활성화 상태</label>
                <select
                  id="is_active"
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => handleChange('is_active', e.target.value === 'true')}
                >
                  <option value="true">활성화</option>
                  <option value="false">비활성화</option>
                </select>
                <span className="form-group-hint">비활성화하면 화면에 표시되지 않습니다</span>
              </div>
            </div>
          </div>

          <div className="worship-edit-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-save">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorshipEditModal
