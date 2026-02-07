const CategoryBadge = () => {
  return (
    <div className="mb-4">
      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/30 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
        <span className="w-1.5 h-1.5 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse"></span>
        기도 요청
      </span>
    </div>
  )
}

export default CategoryBadge
