// 그룹 생성/가입 모달 컴포넌트
import { useState } from 'react'
import { useCreateGroup, useJoinGroup } from '../../hooks/useGroups'
import './GroupModals.css'

const ICON_OPTIONS = ['🙏', '⛪', '✝️', '🎵', '📖', '💒', '👥', '🕊️', '🌟', '❤️']

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🙏')
  const [createdGroup, setCreatedGroup] = useState<any>(null)
  
  const createMutation = useCreateGroup()
  
  if (!isOpen) return null
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const result = await createMutation.mutateAsync({
        name,
        description,
        icon,
      })
      
      setCreatedGroup(result.data)
    } catch (error) {
      console.error('그룹 생성 실패:', error)
    }
  }
  
  const handleCopyCode = () => {
    if (createdGroup?.invite_code) {
      navigator.clipboard.writeText(createdGroup.invite_code)
      alert('초대 코드가 복사되었습니다!')
    }
  }
  
  const handleClose = () => {
    setName('')
    setDescription('')
    setIcon('🙏')
    setCreatedGroup(null)
    onClose()
  }
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {createdGroup ? '그룹 생성 완료' : '새 그룹 만들기'}
          </h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        {createdGroup ? (
          <div>
            <p style={{ marginBottom: '1rem' }}>
              그룹이 생성되었습니다! 아래 초대 코드를 공유하여 멤버를 초대하세요.
            </p>
            
            <div className="invite-code-display">
              <div>초대 코드</div>
              <div className="invite-code">{createdGroup.invite_code}</div>
              <div className="invite-code-hint">
                이 코드를 공유하면 다른 사람들이 그룹에 가입할 수 있습니다
              </div>
              <button className="copy-button" onClick={handleCopyCode}>
                코드 복사하기
              </button>
            </div>
            
            <div className="modal-actions">
              <button className="btn-submit" onClick={handleClose}>
                확인
              </button>
            </div>
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">그룹 이름 *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 청년부, 찬양팀, 셀 모임 A"
                required
                maxLength={50}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">그룹 설명</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="그룹에 대한 간단한 설명을 입력하세요"
                maxLength={200}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">그룹 아이콘</label>
              <div className="icon-selector">
                {ICON_OPTIONS.map((iconOption) => (
                  <button
                    key={iconOption}
                    type="button"
                    className={`icon-option ${icon === iconOption ? 'selected' : ''}`}
                    onClick={() => setIcon(iconOption)}
                  >
                    {iconOption}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={handleClose}>
                취소
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={!name.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? '생성 중...' : '그룹 만들기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

interface JoinGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const JoinGroupModal = ({ isOpen, onClose }: JoinGroupModalProps) => {
  const [inviteCode, setInviteCode] = useState('')
  
  const joinMutation = useJoinGroup()
  
  if (!isOpen) return null
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await joinMutation.mutateAsync({ invite_code: inviteCode })
      setInviteCode('')
      onClose()
    } catch (error) {
      console.error('그룹 가입 실패:', error)
    }
  }
  
  const handleClose = () => {
    setInviteCode('')
    onClose()
  }
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">그룹 가입하기</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">초대 코드 *</label>
            <input
              type="text"
              className="form-input"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="초대 코드를 입력하세요"
              required
              style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
            />
            <small style={{ color: '#666' }}>
              그룹 관리자로부터 받은 초대 코드를 입력하세요
            </small>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              취소
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={!inviteCode.trim() || joinMutation.isPending}
            >
              {joinMutation.isPending ? '가입 중...' : '가입하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
