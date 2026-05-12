import { useState } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { showToast } from '../../../../utils/toast'
import { THANKS_EMOTIONS, type ThanksEmotion } from '../../../../types/thanks'

const MAX_LEN = 100

interface ThanksComposerProps {
  onClose: () => void
  onSubmit: (payload: { content: string; emotion?: ThanksEmotion | null }) => Promise<void>
}

const ThanksComposer = ({ onClose, onSubmit }: ThanksComposerProps) => {
  const { language } = useLanguage()
  const [content, setContent] = useState('')
  const [emotion, setEmotion] = useState<ThanksEmotion | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) {
      showToast(language === 'ko' ? '감사 내용을 입력해주세요' : 'Please enter your thanks', 'error')
      return
    }
    if (trimmed.length > MAX_LEN) {
      showToast(
        language === 'ko' ? `최대 ${MAX_LEN}자까지 입력 가능합니다` : `Max ${MAX_LEN} characters`,
        'error'
      )
      return
    }
    try {
      setSubmitting(true)
      await onSubmit({ content: trimmed, emotion })
      showToast(language === 'ko' ? '감사가 등록되었습니다' : 'Thanks shared', 'success')
      onClose()
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : (language === 'ko' ? '등록에 실패했습니다' : 'Failed to submit'),
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const remaining = MAX_LEN - content.length

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🙏</span>
            <span>{language === 'ko' ? '오늘의 감사 나누기' : 'Share Today’s Thanks'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={language === 'ko' ? '닫기' : 'Close'}
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 감정 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              {language === 'ko' ? '오늘의 마음 (선택)' : 'How does it feel? (optional)'}
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(THANKS_EMOTIONS) as ThanksEmotion[]).map((key) => {
                const meta = THANKS_EMOTIONS[key]
                const active = emotion === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEmotion(active ? null : key)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      active
                        ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-800 dark:text-amber-200'
                        : 'bg-gray-50 dark:bg-gray-800 border-transparent text-gray-700 dark:text-gray-300 hover:border-amber-300'
                    }`}
                  >
                    <span className="mr-1">{meta.emoji}</span>
                    {language === 'ko' ? meta.label : meta.labelEn}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 본문 */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              rows={4}
              maxLength={MAX_LEN}
              autoFocus
              placeholder={
                language === 'ko'
                  ? '예: 오늘 마신 커피 한 잔이 참 맛있었습니다 ☕'
                  : 'e.g., A simple coffee made my day brighter today ☕'
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  remaining < 10 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
                }`}
              >
                {content.length}/{MAX_LEN}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-light dark:border-border-dark flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {language === 'ko' ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50"
          >
            {submitting
              ? (language === 'ko' ? '등록 중…' : 'Sharing…')
              : (language === 'ko' ? '나누기' : 'Share')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ThanksComposer
