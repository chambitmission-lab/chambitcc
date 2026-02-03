const TodaysVerse = () => {
  return (
    <section className="px-4 py-4 border-b border-border-light dark:border-border-dark">
      <div className="relative">
        {/* 위에서 내려오는 빛 효과 */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
        
        {/* 글래스모피즘 카드 */}
        <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-2xl p-5 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {/* 내부 빛 효과 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
          
          <div className="flex items-start gap-3 relative z-10">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-white/20 dark:to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-purple-500/30 dark:border-white/30">
              <span className="material-icons-round text-purple-600 dark:text-white text-xl drop-shadow-[0_0_6px_rgba(168,85,247,0.4)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">auto_stories</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 drop-shadow-[0_0_4px_rgba(168,85,247,0.15)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">오늘의 말씀</p>
              <p className="text-sm text-gray-900 dark:text-white leading-relaxed font-extrabold drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                "너희 마른 뼈들아, 이제 살아나리라!"
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 drop-shadow-[0_0_4px_rgba(168,85,247,0.15)] dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]">에스겔 37:5, 10</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TodaysVerse
