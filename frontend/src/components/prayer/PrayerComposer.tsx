// 기도 작성 컴포넌트 (그룹 선택 기능 포함)
import { useState } from 'react'
import { useMyGroups } from '../../hooks/useGroups'
import type { CreatePrayerRequest } from '../../types/prayer'
import './PrayerComposer.css'

interface PrayerComposerProps {
  onSubmit: (data: CreatePrayerRequest) => Promise<void>
  isSubmitting?: boolean
}

const PrayerComposer = ({ onSubmit, isSubmitting = false }: PrayerComposerProps) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isFullyAnonymous, setIsFullyAnonymous] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  
  const { data: groupsData } = useMyGroups()
  const groups = groupsData?.data.items || []
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await onSubmit({
      title,
      content,
      display_name: displayName || undefined,
      is_fully_anonymous: isFullyAnonymous,
      group_id: selectedGroupId || undefined,
    })
    
    // 폼 초기화
    setTitle('')
    setContent('')
    setDisplayName('')
    setIsFullyAnonymous(false)
    setSelectedGroupId(null)
  }
  
  return (
    <form className="prayer-composer" onSubmit={handleSubmit}>
      <div className="composer-header">
        <h3>기도 요청하기</h3>
      </div>
      
      {/* 그룹 선택 */}
      <div className="form-group">
        <label className="form-label">공개 범위</label>
        <div className="group-selector">
          <button
            type="button"
            className={`group-option ${selectedGroupId === null ? 'selected' : ''}`}
            onClick={() => setSelectedGroupId(null)}
          >
            <span className="group-icon">🌍</span>
            <span>전체 공개</span>
          </button>
          
          {groups.map(group => (
            <button
              key={group.id}
              type="button"
              className={`group-option ${selectedGroupId === group.id ? 'selected' : ''}`}
              onClick={() => setSelectedGroupId(group.id)}
            >
              <span className="group-icon">{group.icon}</span>
              <span>{group.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* 제목 */}
      <div className="form-group">
        <label className="form-label">제목 *</label>
        <input
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="기도 제목을 입력하세요"
          required
          maxLength={100}
        />
      </div>
      
      {/* 내용 */}
      <div className="form-group">
        <label className="form-label">내용 *</label>
        <textarea
          className="form-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="기도 내용을 입력하세요"
          required
          rows={6}
        />
      </div>
      
      {/* 표시 이름 */}
      <div className="form-group">
        <label className="form-label">표시 이름</label>
        <input
          type="text"
          className="form-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="익명 (기본값)"
          maxLength={20}
        />
      </div>
      
      {/* 완전 익명 옵션 */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isFullyAnonymous}
            onChange={(e) => setIsFullyAnonymous(e.target.checked)}
          />
          <span>완전 익명으로 작성 (내 프로필에도 표시 안 함)</span>
        </label>
      </div>
      
      {/* 제출 버튼 */}
      <button 
        type="submit" 
        className="submit-button"
        disabled={isSubmitting || !title.trim() || !content.trim()}
      >
        {isSubmitting ? '등록 중...' : '기도 요청하기'}
      </button>
    </form>
  )
}

export default PrayerComposer
