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
  const canSubmit = content.trim().length > 0 && !submitting

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative bg-background-light dark:bg-[#1c1c26] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto overflow-x-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(168,85,247,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 다크모드 카드 표면 미세 그라데이션 */}
        <div className="hidden dark:block sticky top-0 left-0 right-0 -z-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>

        {/* 보랏빛 글로우 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 sticky top-0 backdrop-blur-xl bg-background-light/85 dark:bg-[#1c1c26]/90 border-b border-black/[0.04] dark:border-white/[0.08] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-[20px] bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
              volunteer_activism
            </span>
            <h2 className="text-[18px] font-bold tracking-[-0.015em] text-gray-900 dark:text-white">
              {language === 'ko' ? '오늘의 감사 나누기' : 'Share Today’s Thanks'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'ko' ? '닫기' : 'Close'}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
          >
            <span className="material-icons-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="relative z-10 p-5 space-y-5">
          {/* 감정 선택 — pill grid, active 그라데이션 purple→pink */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-600 dark:text-white/60 mb-2.5 tracking-[-0.01em]">
              {language === 'ko' ? '오늘의 마음 (선택)' : 'How does it feel? (optional)'}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(THANKS_EMOTIONS) as ThanksEmotion[]).map((key) => {
                const meta = THANKS_EMOTIONS[key]
                const active = emotion === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEmotion(active ? null : key)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all ${
                      active
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white shadow-md shadow-purple-500/30'
                        : 'bg-surface-light dark:bg-[#14141c] border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-white/70 hover:border-purple-400/40 dark:hover:border-purple-400/40 hover:text-purple-600 dark:hover:text-purple-300'
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
            <label className="flex items-center justify-between text-[13px] font-semibold text-gray-600 dark:text-white/60 mb-2 tracking-[-0.01em]">
              <span>
                {language === 'ko' ? '감사 내용' : 'Your thanks'}{' '}
                <span className="text-pink-500 dark:text-pink-400">*</span>
              </span>
              <span
                className={`text-[11px] font-normal tabular-nums ${
                  remaining < 10
                    ? 'text-pink-500 dark:text-pink-400'
                    : 'text-gray-400 dark:text-white/40'
                }`}
              >
                {content.length}/{MAX_LEN}
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              rows={4}
              maxLength={MAX_LEN}
              autoFocus
              placeholder={
                language === 'ko'
                  ? '예: 오늘 마신 커피 한 잔이 참 맛있었습니다'
                  : 'e.g., A simple coffee made my day brighter today'
              }
              className="w-full px-3.5 py-3 bg-surface-light dark:bg-[#14141c] border border-black/[0.05] dark:border-white/[0.06] rounded-xl text-[14px] leading-[1.6] text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400/60 dark:focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-500/25 resize-none transition-colors"
            />
          </div>

          {/* 액션 */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-transparent text-gray-700 dark:text-white/70 font-semibold text-[14px] rounded-full border border-black/[0.08] dark:border-white/[0.10] hover:text-purple-600 dark:hover:text-purple-300 hover:border-purple-400/40 dark:hover:border-purple-400/40 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors disabled:opacity-50"
            >
              {language === 'ko' ? '취소' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-bold text-[14px] rounded-full shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-1.5"
            >
              <span className="material-icons-round text-[16px]">volunteer_activism</span>
              {submitting
                ? (language === 'ko' ? '등록 중…' : 'Sharing…')
                : (language === 'ko' ? '나누기' : 'Share')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThanksComposer
