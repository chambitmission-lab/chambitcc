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
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/80 to-purple-600/60 dark:from-purple-500/55 dark:to-purple-700/35 border border-purple-400/40 dark:border-purple-400/25 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isLoggedIn ? "함께 기도하는 마음을 전해주세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
            className="w-full px-4 py-3 border border-border-light dark:border-border-dark rounded-xl bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  className="w-4 h-4 text-purple-500 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  익명으로 작성 (
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {isAnonymous ? '익명' : displayName}
                  </span>
                  )
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={!content.trim() || isSubmitting || !isLoggedIn}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-md shadow-purple-500/20 dark:shadow-purple-900/30 hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-md"
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
