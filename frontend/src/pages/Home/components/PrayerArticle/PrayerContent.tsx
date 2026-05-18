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
        {/* 기도 카드 - 글래스모피즘 + 입체감 + 여유로운 여백
            다크모드는 단색 알파 대신 두 겹(베이스+그라데이션)으로 깔아
            검은 배경 위에서도 카드가 살짝 떠 보이도록 함. */}
        <div className="backdrop-blur-xl bg-white/40 dark:bg-[#1c1c26] rounded-2xl p-7 border border-white/60 dark:border-white/[0.08] relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(168,85,247,0.10)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_8px_20px_rgba(168,85,247,0.16)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.6),0_12px_28px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-0.5">
          {/* 다크모드 카드 표면 그라데이션 — 평평한 회색 박스 느낌을 깨기 위함 */}
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl"></div>

          {/* 내부 빛 효과 — 다크모드에서도 보랏빛 글로우가 보이도록 강화 */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b ${isAnswered ? 'from-amber-300/40 to-transparent dark:from-amber-400/30' : 'from-purple-300/30 to-transparent dark:from-purple-500/25'} dark:to-transparent rounded-full blur-2xl`}></div>
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${isAnswered ? 'from-yellow-400/30 to-amber-400/30 dark:from-amber-400/20 dark:to-yellow-400/20' : 'from-purple-400/20 to-pink-400/20 dark:from-pink-500/15 dark:to-purple-500/10'} rounded-full blur-2xl`}></div>

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
            <div className="mt-5 pt-4 border-t border-purple-200/40 dark:border-white/10 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🎉</span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">간증</span>
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
