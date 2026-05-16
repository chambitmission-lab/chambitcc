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
        {/* 기도 카드 - 글래스모피즘 + 입체감 + 여유로운 여백 */}
        <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-7 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(168,85,247,0.10)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-200 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_8px_20px_rgba(168,85,247,0.16)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.35)] hover:-translate-y-0.5">
          {/* 내부 빛 효과 */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b ${isAnswered ? 'from-amber-300/40 to-transparent dark:from-amber-400/30' : 'from-purple-300/30 to-transparent dark:from-white/20'} dark:to-transparent rounded-full blur-2xl`}></div>
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${isAnswered ? 'from-yellow-400/30 to-amber-400/30 dark:from-amber-400/20 dark:to-yellow-400/20' : 'from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5'} rounded-full blur-2xl`}></div>
          
          {isAnswered && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">✨ 응답됨</span>
            </div>
          )}
          
          <h3
            className="text-[17px] font-extrabold text-gray-900 dark:text-white mb-5 tracking-[0.02em] relative z-10 uppercase text-left"
            style={transitionStyles}
          >
            {title}
          </h3>

          <p
            className="text-[15px] text-gray-700 dark:text-gray-200 leading-[1.7] relative z-10 font-normal tracking-[-0.01em] line-clamp-3 text-left"
            style={transitionStyles}
          >
            {content}
          </p>
          
          {/* 간증 내용 */}
          {isAnswered && testimony && (
            <div className="mt-4 pt-4 border-t border-purple-200/40 dark:border-white/10">
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
