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
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          지금 마음은 어떠세요? <span className="text-xs font-normal text-gray-400">(선택)</span>
        </label>
        {selected && (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-md scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
      <p className="mt-1.5 text-xs text-gray-400">
        주간 기도 스토리에서 마음의 변화를 보여드려요
      </p>
    </div>
  )
}

export default EmotionSelector
