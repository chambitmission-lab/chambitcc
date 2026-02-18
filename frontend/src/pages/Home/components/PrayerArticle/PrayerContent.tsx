interface PrayerContentProps {
  title: string
  content: string
  transitionStyles: React.CSSProperties
}

const PrayerContent = ({ title, content, transitionStyles }: PrayerContentProps) => {
  return (
    <div className="px-4 mb-3">
      <div className="relative">
        {/* 기도 카드 - 글래스모피즘 */}
        <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-5 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* 내부 빛 효과 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
          
          <h3 
            className="text-base font-extrabold text-gray-900 dark:text-white mb-3 tracking-[0.02em] relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] uppercase"
            style={transitionStyles}
          >
            {title}
          </h3>
          
          <p 
            className="text-[15px] text-gray-600 dark:text-gray-400 leading-[1.8] relative z-10 font-normal tracking-[-0.01em] drop-shadow-[0_0_6px_rgba(168,85,247,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
            style={transitionStyles}
          >
            {content}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrayerContent
