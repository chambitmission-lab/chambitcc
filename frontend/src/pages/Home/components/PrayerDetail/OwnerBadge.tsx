// 작성자 배지 컴포넌트
const OwnerBadge = () => {
  return (
    <div className="mb-5 p-3 bg-purple-50 dark:bg-purple-500/10 border border-purple-200/60 dark:border-purple-400/20 rounded-2xl">
      <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
        <span className="material-icons-outlined text-base">info</span>
        내가 작성한 기도 요청입니다
      </p>
    </div>
  )
}

export default OwnerBadge
