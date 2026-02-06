// 설교 카드 컴포넌트
import type { Sermon } from '../../../types/sermon'

interface SermonCardProps {
  sermon: Sermon
  onClick: () => void
}

const SermonCard = ({ sermon, onClick }: SermonCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* 썸네일 */}
      {sermon.thumbnail_url && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <img
            src={sermon.thumbnail_url}
            alt={sermon.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* 제목 */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {sermon.title}
      </h3>

      {/* 성경 구절 */}
      <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-3">
        {sermon.bible_verse}
      </p>

      {/* 목사님 & 날짜 */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <span className="material-icons-outlined text-base">person</span>
          {sermon.pastor}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-icons-outlined text-base">calendar_today</span>
          {formatDate(sermon.sermon_date)}
        </span>
      </div>

      {/* 내용 미리보기 */}
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">
        {sermon.content}
      </p>

      {/* 하단 정보 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="material-icons-outlined text-base">visibility</span>
            {sermon.views}
          </span>
          {sermon.audio_url && (
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <span className="material-icons-outlined text-base">headphones</span>
              음성
            </span>
          )}
          {sermon.video_url && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="material-icons-outlined text-base">play_circle</span>
              영상
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default SermonCard
