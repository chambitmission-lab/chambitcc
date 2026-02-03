import { useState } from 'react'
import type { Prayer } from '../../../types/prayer'

interface PrayerArticleProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void
  onClick: () => void
}

const PrayerArticle = ({ prayer, onPrayerToggle, onClick }: PrayerArticleProps) => {
  const [isPraying, setIsPraying] = useState(false)
  const [showEnglish, setShowEnglish] = useState(false)

  const handlePray = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPraying) return
    setIsPraying(true)
    try {
      await onPrayerToggle(prayer.id)
    } finally {
      setIsPraying(false)
    }
  }

  const hasTranslation = !!(prayer.title_en && prayer.content_en)
  const displayTitle = showEnglish && prayer.title_en ? prayer.title_en : prayer.title
  const displayContent = showEnglish && prayer.content_en ? prayer.content_en : prayer.content

  return (
    <article 
      className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark pb-3 mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      onClick={onClick}
    >
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* 하늘에서 내려오는 빛 효과 - 테마별 색상 */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[3px] h-10 bg-gradient-to-b from-transparent via-purple-400/60 to-purple-500/80 dark:via-white/60 dark:to-white/80 blur-[2px]"></div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[1px] h-10 bg-gradient-to-b from-transparent via-purple-500/80 to-purple-600 dark:via-white/80 dark:to-white"></div>
            {/* 주변 빛 확산 효과 */}
            <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
            <div className="w-8 h-8 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
              {prayer.display_name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">
              {prayer.display_name}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {prayer.time_ago}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasTranslation && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowEnglish(!showEnglish)
              }}
              className="px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
              title={showEnglish ? '한글로 보기' : 'View in English'}
            >
              {showEnglish ? '🇰🇷 한글' : '🇺🇸 EN'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mb-3">
        <div className="relative">
          {/* 위에서 내려오는 빛 효과 - 테마별 색상 */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
          
          {/* 기도 카드 - 글래스모피즘 */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {/* 내부 빛 효과 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
            
            <h3 className={`text-base font-extrabold text-gray-900 dark:text-white mb-2.5 tracking-[0.02em] relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] ${!showEnglish ? 'uppercase' : ''}`}>
              {displayTitle}
            </h3>
            
            <p className="text-[15px] text-gray-600 dark:text-gray-400 leading-[1.7] relative z-10 font-normal tracking-[-0.01em] drop-shadow-[0_0_6px_rgba(168,85,247,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">
              {displayContent}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 flex items-center gap-3 mb-2">
        <button
          onClick={handlePray}
          disabled={isPraying}
          className={`group flex items-center gap-1 transition-colors ${
            prayer.is_prayed ? 'text-ig-red' : 'text-gray-800 dark:text-white hover:opacity-70'
          }`}
        >
          <span className={`text-[24px] ${prayer.is_prayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
            volunteer_activism
          </span>
        </button>
      </div>

      {/* Stats - 한 줄로 통합 */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-gray-900 dark:text-white">
            {prayer.prayer_count}명이 기도중
          </span>
          {prayer.reply_count > 0 && (
            <>
              <span className="text-gray-400 dark:text-gray-600">·</span>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                댓글 {prayer.reply_count}개
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default PrayerArticle
