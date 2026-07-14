interface PrayerContentProps {
  title?: string | null
  content: string
  testimony?: string
  isAnswered?: boolean
  transitionStyles: React.CSSProperties
}

const PrayerContent = ({ title, content, testimony, isAnswered, transitionStyles }: PrayerContentProps) => {
  return (
    <div className="px-5 pb-3 relative z-10">
      {isAnswered && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">✨ 응답됨</span>
        </div>
      )}

      {title && (
        <h3
          className="text-[19px] font-bold text-gray-900 dark:text-white mb-3 tracking-[-0.015em] leading-[1.35] text-left"
          style={transitionStyles}
        >
          {title}
        </h3>
      )}

      <p
        className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7] font-normal tracking-[-0.01em] line-clamp-3 text-left"
        style={transitionStyles}
      >
        {content}
      </p>

      {/* 간증 내용 */}
      {isAnswered && testimony && (
        <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🎉</span>
            <span className="text-xs font-bold text-brand">간증</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
            {testimony}
          </p>
        </div>
      )}
    </div>
  )
}

export default PrayerContent
