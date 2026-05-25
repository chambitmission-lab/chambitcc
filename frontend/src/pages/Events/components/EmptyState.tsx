interface EmptyStateProps {
  filtered?: boolean
}

const EmptyState = ({ filtered = false }: EmptyStateProps) => {
  return (
    <div className="mx-4 my-2 rounded-2xl bg-white dark:bg-[#1c1c26] border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-none py-12 px-6 text-center">
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4">
        <span className="text-3xl">📅</span>
        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
      </div>
      <p className="text-gray-900 dark:text-white text-[15px] font-bold mb-1">
        {filtered ? '조건에 맞는 일정이 없어요' : '다가오는 일정이 없어요'}
      </p>
      <p className="text-gray-500 dark:text-white/55 text-[13px] leading-[1.5]">
        {filtered
          ? '다른 카테고리를 선택해 보세요'
          : '곧 새로운 모임 소식이 올라올 거예요'}
      </p>
    </div>
  )
}

export default EmptyState
