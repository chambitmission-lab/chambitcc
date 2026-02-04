// 로딩 상태 컴포넌트
import PrayerDetailModal from './PrayerDetailModal'

const LoadingState = () => {
  return (
    <PrayerDetailModal>
      <div className="p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">기도 요청을 불러오는 중...</p>
        </div>
      </div>
    </PrayerDetailModal>
  )
}

export default LoadingState
