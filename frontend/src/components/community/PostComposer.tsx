import { useState, type FormEvent } from 'react'
import { createPost, type Post } from '../../api/community'
import './PostComposer.css'

interface PostComposerProps {
  onPostCreated: (post: Post) => void
}

/**
 * 게시물 작성 컴포넌트
 */
export const PostComposer = ({ onPostCreated }: PostComposerProps) => {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    if (content.length > 500) {
      alert('게시물은 최대 500자까지 작성할 수 있습니다.')
      return
    }

    try {
      setIsPosting(true)
      const response = await createPost(content)
      
      if (response.success) {
        onPostCreated(response.data)
        setContent('')
        alert('게시물이 작성되었습니다!')
      }
    } catch (err: any) {
      console.error('게시물 작성 실패:', err)
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.')
      } else {
        alert('게시물 작성에 실패했습니다.')
      }
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="post-composer">
      <form onSubmit={handleSubmit}>
        <div className="composer-header">
          <div className="composer-avatar">
            <span className="avatar-emoji">✍️</span>
          </div>
          <textarea
            className="composer-textarea"
            placeholder="무엇을 나누고 싶으신가요? (간증, 기도제목, 감사 등)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={3}
            disabled={isPosting}
          />
        </div>
        <div className="composer-footer">
          <span className="char-count">
            {content.length} / 500
          </span>
          <button 
            type="submit" 
            className="btn-post btn-gradient"
            disabled={isPosting || !content.trim()}
          >
            {isPosting ? '작성 중...' : '게시하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
