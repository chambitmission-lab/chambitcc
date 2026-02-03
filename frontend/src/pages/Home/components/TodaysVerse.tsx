const TodaysVerse = () => {
  return (
    <section className="px-4 py-4 border-b border-border-light dark:border-border-dark">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-5 border border-blue-100/50 dark:border-gray-700/50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="material-icons-round text-primary text-xl">auto_stories</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">오늘의 말씀</p>
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed font-medium">
              "너희 마른 뼈들아, 이제 살아나리라!"
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">에스겔 37:5, 10</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TodaysVerse
