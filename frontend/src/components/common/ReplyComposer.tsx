// 댓글 작성 컴포넌트 (Single Responsibility: 댓글 입력만 담당)
import { useState, useEffect } from 'react'
import { getOrCreateFingerprint } from '../../utils/fingerprint'

interface ReplyComposerProps {
  onSubmit: (content: string, displayName: string, fingerprint: string) => void
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

    const fingerprint = await getOrCreateFingerprint()

    onSubmit(content.trim(), displayName, fingerprint)

    // 폼 초기화
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="reply-composer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="함께 기도하는 마음을 전해주세요..."
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          
          <div className="flex flex-col gap-3 mt-3">
            <div className="flex items-center justify-between">
              {isLoggedIn ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    익명으로 작성 ({isAnonymous ? '익명' : displayName})
                  </span>
                </label>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  익명으로 작성됩니다
                </span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="w-full px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? '작성중...' : '댓글 작성'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default ReplyComposer
