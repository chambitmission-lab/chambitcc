// 그룹 생성/가입 모달 컴포넌트
import { useState } from 'react'
import { useCreateGroup, useJoinGroup } from '../../hooks/useGroups'
import { useLanguage } from '../../contexts/LanguageContext'

const ICON_OPTIONS = ['🙏', '⛪', '✝️', '🎵', '📖', '💒', '👥', '🕊️', '🌟', '❤️']

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🙏')
  const [createdGroup, setCreatedGroup] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const createMutation = useCreateGroup()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('') // 에러 메시지 초기화

    try {
      const result = await createMutation.mutateAsync({
        name,
        description,
        icon,
      })

      setCreatedGroup(result.data)
    } catch (error: any) {
      console.error('그룹 생성 실패:', error)
      // 백엔드에서 온 에러 메시지 표시
      if (error.message?.includes('이미 존재하는 그룹 이름')) {
        setErrorMessage(t('groupExistsError'))
      } else {
        setErrorMessage(error.message || t('groupCreateFailed'))
      }
    }
  }

  const handleCopyCode = () => {
    if (createdGroup?.invite_code) {
      navigator.clipboard.writeText(createdGroup.invite_code)
      alert(t('inviteCodeCopied'))
    }
  }
  
  const handleClose = () => {
    setName('')
    setDescription('')
    setIcon('🙏')
    setCreatedGroup(null)
    setErrorMessage('')
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
            {createdGroup ? t('groupCreatedTitle') : t('createGroupTitle')}
          </h2>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full relative group transition-all"
            onClick={handleClose}
          >
            {/* 빛나는 효과 */}
            <div className="absolute inset-0 rounded-full bg-purple-500/20 dark:bg-yellow-400/20 blur-2xl scale-150 group-hover:scale-[2] animate-pulse transition-transform duration-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-purple-500/50 dark:from-yellow-300/50 dark:via-orange-300/50 dark:to-yellow-400/50 blur-xl scale-125 group-hover:scale-150 animate-pulse transition-transform duration-300"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/70 to-pink-500/70 dark:from-yellow-400/70 dark:to-orange-400/70 blur-lg group-hover:blur-xl animate-pulse"></div>
            <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/50 blur-sm animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 dark:from-yellow-400 dark:to-orange-400 opacity-80 group-hover:opacity-100 shadow-[0_0_30px_rgba(168,85,247,0.8)] dark:shadow-[0_0_40px_rgba(250,204,21,0.9)] group-hover:shadow-[0_0_50px_rgba(168,85,247,1)] dark:group-hover:shadow-[0_0_60px_rgba(250,204,21,1)] transition-all"></div>
            
            <span className="material-icons-outlined relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)] transition-all group-hover:scale-110 group-hover:rotate-90 duration-300 font-bold">
              close
            </span>
          </button>
        </div>
        
        {createdGroup ? (
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('groupCreatedMessage')}
            </p>

            <div className="p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-center">
              <div className="text-sm text-gray-500 mb-2">{t('inviteCode')}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-widest font-mono mb-2">
                {createdGroup.invite_code}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {t('shareInviteCode')}
              </div>
              <button
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all"
                onClick={handleCopyCode}
              >
                {t('copyCode')}
              </button>
            </div>

            <button
              className="w-full mt-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm rounded-full hover:opacity-80 transition-all"
              onClick={handleClose}
            >
              {t('confirm')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* 에러 메시지 표시 */}
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <p className="text-sm text-red-700 dark:text-red-300 flex-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('groupName')} *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrorMessage('') // 입력 시 에러 메시지 제거
                }}
                placeholder={t('groupNamePlaceholder')}
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('groupDescription')}
              </label>
              <textarea
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('groupDescriptionPlaceholder')}
                maxLength={200}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('groupIcon')}
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
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!name.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? t('creatingGroup') : t('createGroup')}
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
  const { t } = useLanguage()
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('joinGroup')}</h2>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full relative group transition-all"
            onClick={handleClose}
          >
            {/* 빛나는 효과 */}
            <div className="absolute inset-0 rounded-full bg-purple-500/20 dark:bg-yellow-400/20 blur-2xl scale-150 group-hover:scale-[2] animate-pulse transition-transform duration-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-purple-500/50 dark:from-yellow-300/50 dark:via-orange-300/50 dark:to-yellow-400/50 blur-xl scale-125 group-hover:scale-150 animate-pulse transition-transform duration-300"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/70 to-pink-500/70 dark:from-yellow-400/70 dark:to-orange-400/70 blur-lg group-hover:blur-xl animate-pulse"></div>
            <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/50 blur-sm animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 dark:from-yellow-400 dark:to-orange-400 opacity-80 group-hover:opacity-100 shadow-[0_0_30px_rgba(168,85,247,0.8)] dark:shadow-[0_0_40px_rgba(250,204,21,0.9)] group-hover:shadow-[0_0_50px_rgba(168,85,247,1)] dark:group-hover:shadow-[0_0_60px_rgba(250,204,21,1)] transition-all"></div>
            
            <span className="material-icons-outlined relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)] transition-all group-hover:scale-110 group-hover:rotate-90 duration-300 font-bold">
              close
            </span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('inviteCode')} *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase tracking-widest font-mono text-center"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder={t('enterInviteCode')}
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              {t('inviteCodeAdminHint')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 font-bold text-sm rounded-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              onClick={handleClose}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inviteCode.trim() || joinMutation.isPending}
            >
              {joinMutation.isPending ? t('joiningGroup') : t('joinGroupShort')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
