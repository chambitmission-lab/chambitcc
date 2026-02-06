import { useState } from 'react'
import { useSermons } from '../../hooks/useSermons'
import { isAdmin } from '../../utils/auth'
import SermonCard from './components/SermonCard'
import SermonDetail from './components/SermonDetail'
import SermonForm from './components/SermonForm'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import type { Sermon as SermonType } from '../../types/sermon'

const Sermon = () => {
  const [showForm, setShowForm] = useState(false)
  const [selectedSermon, setSelectedSermon] = useState<SermonType | null>(null)
  const { data: sermons, isLoading, error, refetch } = useSermons(0, 20)
  const adminUser = isAdmin()

  const handleSermonClick = (sermon: SermonType) => {
    setSelectedSermon(sermon)
  }

  const handleFormSuccess = () => {
    refetch()
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="bg-gray-50 dark:bg-black min-h-screen">
          <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-900 dark:text-white font-semibold">설교 목록을 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <ErrorBoundary>
        <div className="bg-gray-50 dark:bg-black min-h-screen">
          <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
            <div className="flex items-center justify-center min-h-screen p-8">
              <div className="text-center">
                <span className="text-6xl mb-4 block">⚠️</span>
                <p className="text-gray-900 dark:text-white font-semibold mb-2">데이터를 불러올 수 없습니다</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error.message}</p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="bg-gray-50 dark:bg-black min-h-screen">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-3xl">📖</span>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">설교 말씀</h1>
              </div>
              {adminUser && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
                >
                  <span className="material-icons-outlined text-sm">add</span>
                  등록
                </button>
              )}
            </div>
          </div>

          {/* 설교 목록 */}
          <div className="p-4">
            {!sermons || sermons.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📖</span>
                <p className="text-gray-500 dark:text-gray-400">아직 등록된 설교가 없습니다.</p>
                {adminUser && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
                  >
                    첫 설교 등록하기
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sermons.map((sermon) => (
                  <SermonCard
                    key={sermon.id}
                    sermon={sermon}
                    onClick={() => handleSermonClick(sermon)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 설교 등록 폼 모달 */}
          {showForm && (
            <SermonForm
              onClose={() => setShowForm(false)}
              onSuccess={handleFormSuccess}
            />
          )}

          {/* 설교 상세 모달 */}
          {selectedSermon && (
            <SermonDetail
              sermon={selectedSermon}
              onClose={() => setSelectedSermon(null)}
              onDelete={() => {
                setSelectedSermon(null)
                refetch()
              }}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default Sermon
