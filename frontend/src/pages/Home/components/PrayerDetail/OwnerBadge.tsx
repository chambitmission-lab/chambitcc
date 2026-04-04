// 작성자 배지 컴포넌트
const OwnerBadge = () => {
  return (
    <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
      <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <span className="material-icons-outlined text-base">info</span>
        내가 작성한 기도 요청입니다
      </p>
    </div>
  )
}

export default OwnerBadge
