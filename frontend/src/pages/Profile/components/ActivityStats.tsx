interface ActivityStatsProps {
  thisWeekCount: number
  totalCount: number
  streakDays: number
}

const ActivityStats = ({ thisWeekCount, totalCount, streakDays }: ActivityStatsProps) => {
  return (
    <div className="px-4 pb-6">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-lg">📊</span>
        나의 기도 활동
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="relative">
          {/* 위에서 내려오는 빛 효과 */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[2px] h-4 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
          
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {thisWeekCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 relative z-10">이번 주</div>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[2px] h-4 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
          
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {totalCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 relative z-10">총 기도</div>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[2px] h-4 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
          
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-xl"></div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {streakDays}{streakDays >= 7 && '🔥'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 relative z-10">연속 기도</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityStats
