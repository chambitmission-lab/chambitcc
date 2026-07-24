// 움직이는 이모티콘 피커 패널 (Single Responsibility: 이모지 선택 UI만 담당)
//
// 기도 댓글(ReplyComposer)과 새가족 환영 댓글이 같은 피커를 공유한다.
// 조건부 렌더링으로 열리는 걸 전제해 마운트 시점에 '자주 쓴' 목록을 다시 읽는다
// (다른 화면에서 쓴 이모지도 반영).
import { useEffect, useState } from 'react'
import {
  EMOJI_CATEGORIES,
  AnimatedEmojiImg,
  getRecentEmojis,
  pushRecentEmoji,
  type AnimatedEmoji,
} from './animatedEmoji'

interface EmojiPickerPanelProps {
  onSelect: (char: string) => void
  disabled?: boolean
  className?: string
}

const EmojiPickerPanel = ({ onSelect, disabled, className }: EmojiPickerPanelProps) => {
  const [categoryKey, setCategoryKey] = useState(EMOJI_CATEGORIES[0].key)
  const [recent, setRecent] = useState<AnimatedEmoji[]>([])

  const category =
    EMOJI_CATEGORIES.find((c) => c.key === categoryKey) ?? EMOJI_CATEGORIES[0]

  useEffect(() => {
    setRecent(getRecentEmojis())
  }, [])

  const handlePick = (emoji: AnimatedEmoji) => {
    onSelect(emoji.char)
    setRecent(pushRecentEmoji(emoji.char))
  }

  return (
    <div
      className={[
        'rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden',
        className ?? '',
      ].join(' ')}
    >
      {recent.length > 0 && (
        <div className="px-2.5 pt-2.5">
          <p className="px-1 pb-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            자주 쓴 이모티콘
          </p>
          <div className="grid grid-cols-8 gap-0.5">
            {recent.map((e) => (
              <button
                key={`recent-${e.code}`}
                type="button"
                aria-label={e.label}
                disabled={disabled}
                onClick={() => handlePick(e)}
                className="h-10 flex items-center justify-center rounded-lg hover:bg-[var(--brand-soft)] active:scale-90 transition-all disabled:opacity-50"
              >
                <AnimatedEmojiImg emoji={e} size={28} />
              </button>
            ))}
          </div>
          <div className="mt-2.5 h-px bg-border-light dark:bg-border-dark" />
        </div>
      )}

      {/* 카테고리 탭 — 좁은 화면에서 가로 스크롤 */}
      <div className="flex gap-1 px-2.5 pt-2.5 overflow-x-auto scrollbar-hide">
        {EMOJI_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategoryKey(c.key)}
            aria-pressed={c.key === categoryKey}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
              c.key === categoryKey
                ? 'brand-gradient shadow-[0_2px_10px_-2px_var(--brand-glow)]'
                : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] hover:text-[var(--brand)]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="p-2.5 grid grid-cols-8 gap-0.5 max-h-[188px] overflow-y-auto">
        {category.emojis.map((e) => (
          <button
            key={e.code}
            type="button"
            aria-label={e.label}
            disabled={disabled}
            onClick={() => handlePick(e)}
            className="h-10 flex items-center justify-center rounded-lg hover:bg-[var(--brand-soft)] active:scale-90 transition-all disabled:opacity-50"
          >
            <AnimatedEmojiImg emoji={e} size={28} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default EmojiPickerPanel
