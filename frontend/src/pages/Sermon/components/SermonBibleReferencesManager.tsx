// 설교별 성경 구절 관리 컴포넌트 (관리자용)
import { useState } from 'react'
import { useSermonBibleReferences } from '../../../hooks/useSermonBibleReferences'
import { useNavigate } from 'react-router-dom'
import type { BibleReference } from '../../../types/sermon'
import './SermonBibleReferencesManager.css'

interface SermonBibleReferencesManagerProps {
  sermonId: number
  sermonTitle: string
  onClose: () => void
}

export const SermonBibleReferencesManager = ({
  sermonId,
  sermonTitle,
  onClose,
}: SermonBibleReferencesManagerProps) => {
  const navigate = useNavigate()
  const { data: references, isLoading, error } = useSermonBibleReferences(sermonId)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredReferences = references?.filter((ref) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      ref.book_name.toLowerCase().includes(searchLower) ||
      ref.reference_text.toLowerCase().includes(searchLower) ||
      ref.segment_text?.toLowerCase().includes(searchLower)
    )
  })

  const handleReferenceClick = (ref: BibleReference) => {
    navigate(`/bible/${ref.book_number}/${ref.chapter}`)
  }

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="sermon-refs-manager-overlay" onClick={onClose}>
      <div className="sermon-refs-manager-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="sermon-refs-manager-header">
          <div className="sermon-refs-manager-header-content">
            <span className="material-icons-outlined">menu_book</span>
            <div>
              <h2 className="sermon-refs-manager-title">성경 구절 관리</h2>
              <p className="sermon-refs-manager-subtitle">{sermonTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="sermon-refs-manager-close-btn">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* 검색 */}
        <div className="sermon-refs-manager-search">
          <span className="material-icons-outlined">search</span>
          <input
            type="text"
            placeholder="성경 구절 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sermon-refs-manager-search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="sermon-refs-manager-search-clear"
            >
              <span className="material-icons-outlined">close</span>
            </button>
          )}
        </div>

        {/* 내용 */}
        <div className="sermon-refs-manager-content">
          {isLoading && (
            <div className="sermon-refs-manager-loading">
              <span className="material-icons-outlined animate-spin">refresh</span>
              <p>성경 구절을 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="sermon-refs-manager-error">
              <span className="material-icons-outlined">error</span>
              <p>성경 구절을 불러오는데 실패했습니다</p>
            </div>
          )}

          {!isLoading && !error && filteredReferences && filteredReferences.length === 0 && (
            <div className="sermon-refs-manager-empty">
              <span className="material-icons-outlined">search_off</span>
              <p>{searchTerm ? '검색 결과가 없습니다' : '추출된 성경 구절이 없습니다'}</p>
            </div>
          )}

          {!isLoading && !error && filteredReferences && filteredReferences.length > 0 && (
            <>
              <div className="sermon-refs-manager-stats">
                <span className="material-icons-outlined">analytics</span>
                <span>
                  총 {filteredReferences.length}개의 성경 구절
                  {searchTerm && ` (전체 ${references?.length}개 중)`}
                </span>
              </div>

              <div className="sermon-refs-manager-list">
                {filteredReferences.map((ref) => (
                  <div
                    key={ref.id}
                    className="sermon-refs-manager-card"
                    onClick={() => handleReferenceClick(ref)}
                  >
                    <div className="sermon-refs-manager-card-header">
                      <div className="sermon-refs-manager-card-title">
                        <span className="sermon-refs-manager-card-book">{ref.book_name}</span>
                        <span className="sermon-refs-manager-card-chapter-verse">
                          {ref.chapter}:{ref.verse}
                        </span>
                      </div>
                      <div className="sermon-refs-manager-card-timestamp">
                        <span className="material-icons-outlined">schedule</span>
                        <span>{formatTimestamp(ref.timestamp)}</span>
                      </div>
                    </div>

                    {ref.segment_text && (
                      <div className="sermon-refs-manager-card-context">
                        <span className="material-icons-outlined">format_quote</span>
                        <p>{ref.segment_text}</p>
                      </div>
                    )}

                    {ref.bible_text && (
                      <div className="sermon-refs-manager-card-text">
                        <p>{ref.bible_text}</p>
                      </div>
                    )}

                    <div className="sermon-refs-manager-card-action">
                      <span className="material-icons-outlined">arrow_forward</span>
                      <span>성경 보기</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
