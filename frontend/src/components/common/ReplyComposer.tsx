// 댓글 작성 컴포넌트 (Single Responsibility: 댓글 입력만 담당)
import { useState } from 'react'
import { getOrCreateFingerprint } from '../../utils/fingerprint'

interface ReplyComposerProps {
  onSubmit: (content: string, displayName: string, fingerprint: string) => void
  isSubmitting: boolean
}

const ReplyComposer = ({ onSubmit, isSubmitting }: ReplyComposerProps) => {
  const [content, setContent] = useState('')
  const [displayName, setDisplayName] = useState('익명')
  const [isAnonymous, setIsAnonymous] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    const fingerprint = await getOrCreateFingerprint()
    const finalDisplayName = isAnonymous ? '익명' : displayName.trim() || '익명'

    onSubmit(content.trim(), finalDisplayName, fingerprint)

    // 폼 초기화
    setContent('')
    setDisplayName('익명')
    setIsAnonymous(true)
  }

  return (
    <form onSubmit={handleSubmit} className="reply-composer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {(isAnonymous ? '익명' : displayName).charAt(0).toUpperCase()}
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
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">익명으로 작성</span>
              </label>
              
              {!isAnonymous && (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="이름"
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={20}
                  disabled={isSubmitting}
                />
              )}
            </div>
            
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
