import { useDailyVerse } from '../../../hooks/useDailyVerse'

const TodaysVerse = () => {
  const { data: verse, isLoading, error } = useDailyVerse()
  
  // 404 에러이거나 데이터가 없으면 컴포넌트를 숨김
  if (error?.message === 'NOT_FOUND' || (!isLoading && !verse)) {
    return null
  }
  
  return (
    <section className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="px-4 py-1.5">
        <div className="flex items-center gap-1.5">
          {/* 아이콘 - 더 작게 */}
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <span className="material-icons-round text-purple-500 dark:text-purple-400 text-sm">auto_stories</span>
          </div>
          
          {/* 내용 */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            ) : verse ? (
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate flex-1 leading-tight">
                  "{verse.verse_text}"
                </p>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 flex-shrink-0 font-normal">
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
