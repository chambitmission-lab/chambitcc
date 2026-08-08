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
      {/* 응답됨 배지 — 이모지 대신 SVG 별(홈 '함께 나누는 은혜' 장식과 같은 형태),
          맨글자가 떠 있지 않게 앰버 pill로 감싼다 */}
      {isAnswered && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--amber-soft)] px-2.5 py-1">
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-[var(--amber-icon)] shrink-0" aria-hidden>
              <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" fill="currentColor" />
            </svg>
            <span className="text-[11px] font-bold text-[var(--amber)]">응답됨</span>
          </span>
        </div>
      )}

      {title && (
        <h3
          className="text-[19px] font-bold text-ink-strong mb-3 tracking-[-0.015em] leading-[1.35] text-left"
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

      {/* 간증 — 구분선으로 끊지 않고 앰버 인용 블록으로 감싼다.
          응답/영광의 색 언어(앰버)로 통일 — 브랜드 블루·파티 이모지는 결이 어긋남 */}
      {isAnswered && testimony && (
        <div className="mt-4 rounded-xl bg-[var(--amber-soft)] px-4 py-3 text-left">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="9" height="9" viewBox="0 0 10 10" className="text-[var(--amber-icon)] shrink-0" aria-hidden>
              <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" fill="currentColor" />
            </svg>
            <span className="text-[11px] font-bold tracking-[0.04em] text-[var(--amber)]">간증</span>
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
