// 에러 상태 컴포넌트
import PrayerDetailModal from './PrayerDetailModal'

interface ErrorStateProps {
  error: string
  onClose: () => void
}

const ErrorState = ({ error, onClose }: ErrorStateProps) => {
  return (
    <PrayerDetailModal>
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-surface-light dark:bg-surface-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            닫기
          </button>
        </div>
      </div>
    </PrayerDetailModal>
  )
}

export default ErrorState
