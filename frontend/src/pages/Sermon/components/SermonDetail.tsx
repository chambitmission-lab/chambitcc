// 설교 상세 모달 컴포넌트
import { useEffect, useRef, useState } from 'react'
import type { Sermon } from '../../../types/sermon'
import { API_URL } from '../../../config/api'
import { isAdmin } from '../../../utils/auth'
import { useDeleteSermon } from '../../../hooks/useSermons'

interface SermonDetailProps {
  sermon: Sermon
  onClose: () => void
  onDelete?: () => void
}

const SermonDetail = ({ sermon, onClose, onDelete }: SermonDetailProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const adminUser = isAdmin()
  const deleteSermonMutation = useDeleteSermon()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  const handleDelete = async () => {
    try {
      await deleteSermonMutation.mutateAsync(sermon.id)
      onDelete?.()
      onClose()
    } catch (error) {
      // 삭제 실패는 mutation에서 처리
    }
  }

  // 오디오 URL 생성
  const getAudioUrl = () => {
    if (!sermon.audio_url) return ''
    
    // audio_url이 이미 전체 URL인 경우
    if (sermon.audio_url.startsWith('http://') || sermon.audio_url.startsWith('https://')) {
      return sermon.audio_url
    }
    
    // 상대 경로인 경우 API_URL과 결합
    return `${API_URL}${sermon.audio_url}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">설교 말씀</h2>
          <div className="flex items-center gap-2">
            {adminUser && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="삭제"
              >
                <span className="material-icons-outlined">delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 썸네일 */}
          {sermon.thumbnail_url && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img
                src={sermon.thumbnail_url}
                alt={sermon.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {sermon.title}
          </h1>

          {/* 성경 구절 */}
          <div className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              📖 {sermon.bible_verse}
            </p>
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-base">person</span>
              {sermon.pastor}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-base">calendar_today</span>
              {formatDate(sermon.sermon_date)}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-base">visibility</span>
              {sermon.views} 조회
            </span>
          </div>

          {/* 음성 플레이어 */}
          {sermon.audio_url && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-outlined text-purple-600 dark:text-purple-400">
                  headphones
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white">설교 음성</h3>
              </div>
              <audio
                controls
                src={getAudioUrl()}
                className="w-full"
                controlsList="nodownload"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* 비디오 링크 */}
          {sermon.video_url && (
            <div className="mb-6">
              <a
                href={sermon.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <span className="material-icons-outlined">play_circle</span>
                <span className="font-semibold">영상으로 보기</span>
                <span className="material-icons-outlined ml-auto">open_in_new</span>
              </a>
            </div>
          )}

          {/* 설교 내용 */}
          <div className="prose dark:prose-invert max-w-none">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                설교 내용
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {sermon.content}
              </p>
            </div>
          </div>
        </div>

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                설교 삭제
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                이 설교를 삭제하시겠습니까? 음성 파일도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteSermonMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteSermonMutation.isPending ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SermonDetail
