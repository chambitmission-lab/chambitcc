interface PrayerContentProps {
  title: string
  content: string
  testimony?: string
  isAnswered?: boolean
  transitionStyles: React.CSSProperties
}

const PrayerContent = ({ title, content, testimony, isAnswered, transitionStyles }: PrayerContentProps) => {
  return (
    <div className="px-4 mb-4">
      <div className="relative">
        {/* 기도 카드 — 새벽 블루 글래스 테마의 피드 카드.
            무한스크롤 피드이므로 blur 없는 불투명 서피스(.feed-card)를 쓴다.
            응답된 기도만 앰버 톤 글로우로 구분(기능적 색상). */}
        <div className="feed-card rounded-2xl p-6 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-glow)]">
          {/* 다크모드 카드 표면 그라데이션 — 평평한 회색 박스 느낌을 깨기 위함 */}
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl"></div>

          {/* 응답된 기도 전용 은은한 앰버 빛 (기능적 색상 — 브랜드 블루와 구분) */}
          {isAnswered && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-amber-300/30 to-transparent dark:from-amber-400/20 dark:to-transparent rounded-full blur-2xl"></div>
          )}

          {isAnswered && (
            <div className="mb-3 flex items-center gap-2 relative z-10">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">✨ 응답됨</span>
            </div>
          )}

          <h3
            className="text-[20px] font-bold text-gray-900 dark:text-white mb-6 tracking-[-0.015em] leading-[1.3] relative z-10 text-left"
            style={transitionStyles}
          >
            {title}
          </h3>

          <p
            className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.7] relative z-10 font-normal tracking-[-0.01em] line-clamp-3 text-left"
            style={transitionStyles}
          >
            {content}
          </p>

          {/* 간증 내용 */}
          {isAnswered && testimony && (
            <div className="mt-5 pt-4 border-t border-[var(--card-border)] relative z-10">
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
      </div>
    </div>
  )
}

export default PrayerContent
