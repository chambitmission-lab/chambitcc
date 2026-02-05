// 댓글 작성 컴포넌트 (Single Responsibility: 댓글 입력만 담당)
import { useState, useEffect } from 'react'

interface ReplyComposerProps {
  onSubmit: (content: string, displayName: string) => void
  isSubmitting: boolean
}

const ReplyComposer = ({ onSubmit, isSubmitting }: ReplyComposerProps) => {
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const isLoggedIn = !!localStorage.getItem('access_token')

  // 로그인한 사용자 이름 가져오기
  const getUserName = (): string => {
    if (!isLoggedIn || isAnonymous) return '익명'
    
    // 우선순위: full_name > username
    const fullName = localStorage.getItem('user_full_name')
    const username = localStorage.getItem('user_username')
    
    return fullName || username || '익명'
  }

  const displayName = getUserName()

  // 로그인 상태가 아니면 항상 익명
  useEffect(() => {
    if (!isLoggedIn) {
      setIsAnonymous(true)
    }
  }, [isLoggedIn])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    if (!isLoggedIn) {
      alert('로그인이 필요합니다')
      return
    }

    onSubmit(content.trim(), displayName)

    // 폼 초기화
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="reply-composer">
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {/* 하늘에서 내려오는 빛 효과 */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[3px] h-8 bg-gradient-to-b from-transparent via-purple-400/60 to-purple-500/80 dark:via-white/60 dark:to-white/80 blur-[2px]"></div>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[1px] h-8 bg-gradient-to-b from-transparent via-purple-500/80 to-purple-600 dark:via-white/80 dark:to-white"></div>
          {/* 주변 빛 확산 효과 */}
          <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
          <div className="w-10 h-10 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isLoggedIn ? "함께 기도하는 마음을 전해주세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
            className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-white/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            rows={3}
            disabled={isSubmitting || !isLoggedIn}
          />
          
          <div className="flex flex-col gap-3 mt-3">
            {isLoggedIn && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-purple-500 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-white"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  익명으로 작성 (
                  <span className="relative inline-block">
                    <span className="relative z-10 font-bold text-amber-600 dark:text-amber-400">
                      {isAnonymous ? '익명' : displayName}
                    </span>
                    {!isAnonymous && (
                      <>
                        {/* 황금빛 후광 */}
                        <span className="absolute inset-0 blur-md bg-amber-300 dark:bg-amber-400 opacity-40 animate-pulse"></span>
                        <span className="absolute inset-0 blur-sm bg-yellow-200 dark:bg-yellow-300 opacity-30"></span>
                        {/* 빛나는 언더라인 */}
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                      </>
                    )}
                  </span>
                  )
                </span>
              </label>
            )}
            
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting || !isLoggedIn}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-lg"
            >
              {isSubmitting ? '작성중...' : isLoggedIn ? '댓글 작성' : '로그인이 필요합니다'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default ReplyComposer
