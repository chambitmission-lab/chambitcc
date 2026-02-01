import { useState, type FormEvent } from 'react'
import { createPrayer } from '../../../api/prayer'
import { validation } from '../../../utils/validation'
import type { Prayer } from '../../../types/prayer'

interface PrayerComposerProps {
  onClose: () => void
  onSuccess: (prayer: Prayer) => void
  fingerprint: string
}

const PrayerComposer = ({ onClose, onSuccess, fingerprint }: PrayerComposerProps) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [displayName, setDisplayName] = useState('Anonymous')
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
        display_name: displayName.trim() || 'Anonymous',
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
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <span className="material-icons-outlined">close</span>
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            New Prayer Request
          </h2>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="text-primary font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Display Name */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                maxLength={20}
                className="flex-1 bg-transparent border-none text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Badge */}
          <div className="mb-3">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
              Prayer Request
            </span>
          </div>

          {/* Title */}
          <div className="mb-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g., Family Health, Career Guidance)"
              maxLength={100}
              required
              className="w-full bg-transparent border-none text-base font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your prayer request... Be specific about what you need prayer for."
              rows={8}
              maxLength={1000}
              required
              className="w-full bg-transparent border-none text-base text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {content.length}/1000
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
              <span className="material-icons-outlined text-gray-500 text-lg">lock</span>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your prayer request will be posted anonymously. Only your display name will be visible to others.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PrayerComposer
