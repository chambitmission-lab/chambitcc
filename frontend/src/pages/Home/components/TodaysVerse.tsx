import { useDailyVerse } from '../../../hooks/useDailyVerse'

const TodaysVerse = () => {
  const { data: verse, isLoading, error } = useDailyVerse()
  
  // 404 에러이거나 데이터가 없으면 컴포넌트를 숨김
  if (error?.message === 'NOT_FOUND' || (!isLoading && !verse)) {
    return null
  }
  
  return (
    <section className="sticky top-0 z-40 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95">
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          {/* 아이콘 */}
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-white/20 dark:to-white/10 rounded-full flex items-center justify-center">
            <span className="material-icons-round text-purple-600 dark:text-white text-base">auto_stories</span>
          </div>
          
          {/* 내용 */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            ) : verse ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-900 dark:text-white font-semibold truncate flex-1">
                  "{verse.verse_text}"
                </p>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {verse.verse_reference}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TodaysVerse
