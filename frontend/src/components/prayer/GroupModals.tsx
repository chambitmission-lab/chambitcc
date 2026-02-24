// 그룹 생성/가입 모달 컴포넌트
import { useState } from 'react'
import { useCreateGroup, useJoinGroup } from '../../hooks/useGroups'

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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-background-light dark:bg-background-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border-light dark:border-border-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {createdGroup ? '그룹 생성 완료' : '새 그룹 만들기'}
          </h2>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all"
            onClick={handleClose}
          >
            ×
          </button>
        </div>
        
        {createdGroup ? (
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              그룹이 생성되었습니다! 아래 초대 코드를 공유하여 멤버를 초대하세요.
            </p>
            
            <div className="p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-center">
              <div className="text-sm text-gray-500 mb-2">초대 코드</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-widest font-mono mb-2">
                {createdGroup.invite_code}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                이 코드를 공유하면 다른 사람들이 그룹에 가입할 수 있습니다
              </div>
              <button 
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all"
                onClick={handleCopyCode}
              >
                코드 복사하기
              </button>
            </div>
            
            <button 
              className="w-full mt-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm rounded-full hover:opacity-80 transition-all"
              onClick={handleClose}
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                그룹 이름 *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 청년부, 찬양팀, 셀 모임 A"
                required
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                그룹 설명
              </label>
              <textarea
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="그룹에 대한 간단한 설명을 입력하세요"
                maxLength={200}
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                그룹 아이콘
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map((iconOption) => (
                  <button
                    key={iconOption}
                    type="button"
                    className={`
                      aspect-square flex items-center justify-center text-2xl rounded-lg border transition-all
                      ${icon === iconOption
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 ring-2 ring-purple-300'
                        : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                    onClick={() => setIcon(iconOption)}
                  >
                    {iconOption}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 font-bold text-sm rounded-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                onClick={handleClose}
              >
                취소
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-background-light dark:bg-background-dark rounded-2xl max-w-md w-full shadow-2xl border border-border-light dark:border-border-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">그룹 가입하기</h2>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all"
            onClick={handleClose}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              초대 코드 *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase tracking-widest font-mono text-center"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="초대 코드를 입력하세요"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              그룹 관리자로부터 받은 초대 코드를 입력하세요
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              type="button"
              className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 font-bold text-sm rounded-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              onClick={handleClose}
            >
              취소
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
