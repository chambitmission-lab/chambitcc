// 기도 작성 시 감정 태그 선택 (주간 기도 스토리용 — 선택사항)
import type { PrayerEmotion } from '../../../../types/prayer'

interface EmotionSelectorProps {
  selected: PrayerEmotion | null
  onChange: (emotion: PrayerEmotion | null) => void
  disabled?: boolean
}

const EMOTIONS: Array<{ key: PrayerEmotion; label: string; emoji: string }> = [
  { key: 'anxious', label: '불안', emoji: '😟' },
  { key: 'tired', label: '지침', emoji: '😮‍💨' },
  { key: 'sad', label: '슬픔', emoji: '😢' },
  { key: 'lonely', label: '외로움', emoji: '🥺' },
  { key: 'angry', label: '분노', emoji: '😠' },
  { key: 'confused', label: '혼란', emoji: '😵‍💫' },
  { key: 'hopeful', label: '소망', emoji: '🌱' },
  { key: 'grateful', label: '감사', emoji: '🙏' },
]

const EmotionSelector = ({ selected, onChange, disabled }: EmotionSelectorProps) => {
  const handleClick = (key: PrayerEmotion) => {
    if (disabled) return
    onChange(selected === key ? null : key)
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <label className="block text-[13px] font-bold tracking-[-0.015em] text-gray-700 dark:text-gray-300">
          지금 마음은 어떠세요? <span className="text-[11px] font-medium text-gray-400">(선택)</span>
        </label>
        {selected && (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="text-[11px] font-medium text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200"
          >
            지우기
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {EMOTIONS.map((e) => {
          const isActive = selected === e.key
          return (
            <button
              key={e.key}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(e.key)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_2px_8px_rgba(168,85,247,0.35)]'
                    : 'bg-purple-500/[0.06] dark:bg-purple-500/10 text-gray-600 dark:text-gray-300 hover:bg-purple-500/[0.12] dark:hover:bg-purple-500/15 hover:text-purple-700 dark:hover:text-purple-300'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <span>{e.emoji}</span>
              <span>{e.label}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
        주간 기도 스토리에서 마음의 변화를 보여드려요
      </p>
    </div>
  )
}

export default EmotionSelector
