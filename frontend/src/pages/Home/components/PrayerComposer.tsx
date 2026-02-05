import { useState } from 'react'
import { usePrayersInfinite } from '../../../hooks/usePrayersQuery'
import { validation } from '../../../utils/validation'
import type { RecommendedVerses, SortType } from '../../../types/prayer'
import BibleVersesModal from './BibleVersesModal'

interface PrayerComposerProps {
  onClose: () => void
  onSuccess?: () => void
  sort?: SortType
}

const PrayerComposer = ({ onClose, onSuccess, sort = 'popular' }: PrayerComposerProps) => {
  const { createPrayer, isCreating } = usePrayersInfinite(sort)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [error, setError] = useState('')
  const [recommendedVerses, setRecommendedVerses] = useState<RecommendedVerses | null>(null)
  const [showVersesModal, setShowVersesModal] = useState(false)
  
  const isLoggedIn = !!localStorage.getItem('access_token')
  
  // Get username from localStorage
  const getUserName = (): string => {
    if (!isLoggedIn || isAnonymous) return '익명'
    
    // 우선순위: full_name > username
    const fullName = localStorage.getItem('user_full_name')
    const username = localStorage.getItem('user_username')
    
    return fullName || username || '익명'
  }
  
  const displayName = getUserName()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 검증
    const titleValidation = validation.validateTitle(title)
    if (!titleValidation.valid) {
      setError(titleValidation.error!)
      return
    }

    const contentValidation = validation.validateContent(content)
    if (!contentValidation.valid) {
      setError(contentValidation.error!)
      return
    }

    const nameValidation = validation.validateDisplayName(displayName)
    if (!nameValidation.valid) {
      setError(nameValidation.error!)
      return
    }

    setError('')

    try {
      const response = await createPrayer({
        title: title.trim(),
        content: content.trim(),
        display_name: displayName,
        is_fully_anonymous: isAnonymous,
      })

      // 기도 객체 추출 (data에 바로 있음)
      const prayer = response.data
      
      // 즉시 성공 처리
      onSuccess?.()
      
      // 성경 구절이 있으면 모달 표시
      if (prayer.recommended_verses && prayer.recommended_verses.verses.length > 0) {
        setRecommendedVerses(prayer.recommended_verses)
        setShowVersesModal(true)
        // 성경 구절 모달이 닫힐 때 onClose 호출됨
      } else {
        // 성경 구절이 없으면 바로 닫기
        // processing이 true면 백그라운드에서 처리 중
        if (response.processing) {
          console.log('성경 구절이 백그라운드에서 처리 중입니다')
        }
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다')
    }
  }

  const handleVersesModalClose = () => {
    setShowVersesModal(false)
    onClose()
  }

  return (
    <>
      {/* 성경 구절 모달 */}
      {showVersesModal && recommendedVerses && (
        <BibleVersesModal
          verses={recommendedVerses}
          onClose={handleVersesModalClose}
        />
      )}

      {/* 기도 작성 모달 */}
      <div 
        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
      <div 
        className="bg-background-light dark:bg-background-dark rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="relative group w-10 h-10 flex items-center justify-center"
          >
            {/* 가장 바깥 빛 확산 (크고 은은하게) */}
            <div className="absolute inset-0 rounded-full bg-purple-500/20 dark:bg-yellow-400/20 blur-2xl scale-150 group-hover:scale-[2] animate-pulse transition-transform duration-500"></div>
            
            {/* 중간 빛 레이어 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-purple-500/50 dark:from-yellow-300/50 dark:via-orange-300/50 dark:to-yellow-400/50 blur-xl scale-125 group-hover:scale-150 animate-pulse transition-transform duration-300"></div>
            
            {/* 강한 빛 레이어 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/70 to-pink-500/70 dark:from-yellow-400/70 dark:to-orange-400/70 blur-lg group-hover:blur-xl animate-pulse"></div>
            
            {/* 내부 빛나는 원 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 via-pink-300 to-purple-400 dark:from-yellow-300 dark:via-orange-300 dark:to-yellow-400 opacity-60 blur-md group-hover:opacity-80 animate-pulse"></div>
            
            {/* 반짝이는 효과 */}
            <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/50 blur-sm animate-ping"></div>
            
            {/* X 아이콘 배경 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 dark:from-yellow-400 dark:to-orange-400 opacity-80 group-hover:opacity-100 shadow-[0_0_30px_rgba(168,85,247,0.8)] dark:shadow-[0_0_40px_rgba(250,204,21,0.9)] group-hover:shadow-[0_0_50px_rgba(168,85,247,1)] dark:group-hover:shadow-[0_0_60px_rgba(250,204,21,1)] transition-all"></div>
            
            {/* X 아이콘 */}
            <span className="material-icons-outlined relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)] transition-all group-hover:scale-110 group-hover:rotate-90 duration-300 font-bold">
              close
            </span>
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            새 기도 요청
          </h2>
          <button
            onClick={handleSubmit}
            disabled={isCreating || !title.trim() || !content.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-bold text-sm rounded-full shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-900/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isCreating ? '작성중...' : '작성'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Display Name */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                {/* 하늘에서 내려오는 빛 효과 - 테마별 색상 */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[3px] h-10 bg-gradient-to-b from-transparent via-purple-400/60 to-purple-500/80 dark:via-white/60 dark:to-white/80 blur-[2px]"></div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[1px] h-10 bg-gradient-to-b from-transparent via-purple-500/80 to-purple-600 dark:via-white/80 dark:to-white"></div>
                {/* 주변 빛 확산 효과 */}
                <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
                <div className="w-10 h-10 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </span>
              </div>
            </div>
            
            {/* Anonymous Toggle - Only show for logged in users */}
            {isLoggedIn && (
              <div className="flex items-center gap-2 px-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-primary bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    익명으로 작성
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/30 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse"></span>
              기도 요청
            </span>
          </div>

          {/* Content Card */}
          <div className="relative mb-4">
            {/* 위에서 내려오는 빛 효과 - 테마별 색상 */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
            
            {/* 기도 카드 - 글래스모피즘 */}
            <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              {/* 내부 빛 효과 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
              
              {/* Title */}
              <div className="mb-3 relative z-10">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목 (예: 가족의 건강, 진로 인도)"
                  maxLength={100}
                  required
                  className="w-full bg-transparent border-none text-base font-extrabold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] uppercase"
                />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="기도 제목을 나눠주세요... 구체적으로 어떤 기도가 필요한지 알려주세요."
                  rows={8}
                  maxLength={1000}
                  required
                  className="w-full bg-transparent border-none text-[15px] text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none leading-[1.7] drop-shadow-[0_0_6px_rgba(168,85,247,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
                />
                <div className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">
                  {content.length}/1000
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-3 border border-border-light dark:border-border-dark">
            <div className="flex items-start gap-2">
              <span className="material-icons-outlined text-gray-500 text-lg">
                {isAnonymous ? 'lock' : 'visibility'}
              </span>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {isAnonymous 
                    ? '기도 요청은 익명으로 게시됩니다. 표시 이름만 다른 사람에게 보입니다.'
                    : '기도 요청이 실명으로 게시됩니다. 다른 사람들이 작성자를 확인할 수 있습니다.'}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default PrayerComposer
