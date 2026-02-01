// 기도 요청 작성 모달
import { useState, FormEvent } from 'react'
import { createPrayer } from '../../../api/prayer'
import { validation } from '../../../utils/validation'
import type { Prayer } from '../../../types/prayer'
import '../styles/PrayerComposer.css'

interface PrayerComposerProps {
  onClose: () => void
  onSuccess: (prayer: Prayer) => void
  fingerprint: string
}

const PrayerComposer = ({ onClose, onSuccess, fingerprint }: PrayerComposerProps) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [displayName, setDisplayName] = useState('익명')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
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

    if (!fingerprint) {
      setError('잠시 후 다시 시도해주세요')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await createPrayer({
        title: title.trim(),
        content: content.trim(),
        display_name: displayName.trim() || '익명',
        is_fully_anonymous: true,
        fingerprint,
      })

      if (response.success) {
        onSuccess(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="prayer-composer-overlay" onClick={onClose}>
      <div className="prayer-composer" onClick={(e) => e.stopPropagation()}>
        <button className="composer-close" onClick={onClose}>
          ✕
        </button>

        <div className="composer-header">
          <h2 className="composer-title">기도 요청</h2>
          <p className="composer-subtitle">익명으로 안전하게 나눠주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="composer-form">
          <div className="form-group">
            <label htmlFor="displayName" className="form-label">
              표시 이름
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="익명"
              maxLength={20}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              제목 *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="간단한 제목을 입력하세요"
              maxLength={100}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              내용 *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="함께 기도하고 싶은 내용을 나눠주세요"
              rows={6}
              maxLength={1000}
              required
              className="form-textarea"
            />
            <div className="char-count">{content.length}/1000</div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="form-submit"
          >
            {isSubmitting ? '등록 중...' : '기도 요청하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default PrayerComposer
