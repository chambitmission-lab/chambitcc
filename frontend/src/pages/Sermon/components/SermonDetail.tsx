// 설교 상세 모달 컴포넌트
import { useEffect, useRef, useState } from 'react'
import type { Sermon } from '../../../types/sermon'
import { API_URL } from '../../../config/api'
import { isAdmin } from '../../../utils/auth'
import { useDeleteSermon } from '../../../hooks/useSermons'
import { useSermonBibleReferences } from '../../../hooks/useSermonBibleReferences'
import { BibleReferencesSection } from './BibleReferencesSection'
import './SermonDetail.css'

interface SermonDetailProps {
  sermon: Sermon
  onClose: () => void
  onDelete?: () => void
  onEdit?: () => void
}

const SermonDetail = ({ sermon, onClose, onDelete, onEdit }: SermonDetailProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const videoPlayerRef = useRef<HTMLIFrameElement>(null)
  const audioPlayerRef = useRef<HTMLAudioElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const adminUser = isAdmin()
  const deleteSermonMutation = useDeleteSermon()
  
  // 설교별 성경 구절 목록 조회 (설교 상세에 포함되지 않은 경우 별도 조회)
  const { data: bibleReferences, isLoading: isLoadingReferences } = useSermonBibleReferences(
    sermon.bible_references && sermon.bible_references.length > 0 ? null : sermon.id
  )
  
  // 설교 상세에 포함된 구절 또는 별도 조회한 구절 사용
  const displayReferences = sermon.bible_references || bibleReferences || []

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

  // YouTube Video ID 추출
  const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    
    // 다양한 YouTube URL 형식 지원
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // 직접 Video ID인 경우
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }

  const videoId = sermon.video_url ? extractYouTubeVideoId(sermon.video_url) : null

  // 타임스탬프 클릭 핸들러 - 오디오 우선, 없으면 비디오
  const handleTimestampClick = (timestamp: number) => {
    // 1. 오디오 플레이어가 있으면 오디오 재생 (트랜스크립트는 음성 기반)
    if (audioPlayerRef.current && sermon.audio_url) {
      audioPlayerRef.current.currentTime = timestamp
      audioPlayerRef.current.play()
      
      // 오디오 플레이어 위치로 스크롤
      audioPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    // 2. 오디오가 없고 비디오가 있으면 비디오 재생
    else if (videoPlayerRef.current && videoId) {
      const iframe = videoPlayerRef.current
      const currentSrc = iframe.src
      const newSrc = currentSrc.split('?')[0] + `?start=${Math.floor(timestamp)}&autoplay=1&playsinline=1&rel=0&modestbranding=1`
      iframe.src = newSrc
      
      // 비디오 위치로 스크롤
      iframe.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="sermon-detail-overlay">
      <div ref={modalRef} className="sermon-detail-modal">
        {/* 배경 효과 */}
        <div className="sermon-detail-bg-effects">
          <div className="sermon-detail-glow sermon-detail-glow-1"></div>
          <div className="sermon-detail-glow sermon-detail-glow-2"></div>
          <div className="sermon-detail-glow sermon-detail-glow-3"></div>
        </div>

        {/* 헤더 */}
        <div className="sermon-detail-header">
          <div className="sermon-detail-header-content">
            <div className="sermon-detail-avatar">
              <span className="sermon-detail-avatar-emoji">📖</span>
            </div>
            <div className="sermon-detail-header-info">
              <div className="sermon-detail-pastor-name">{sermon.pastor}</div>
              <div className="sermon-detail-date">{formatDate(sermon.sermon_date)}</div>
            </div>
          </div>
          <div className="sermon-detail-actions">
            {adminUser && (
              <>
                <button
                  onClick={onEdit}
                  className="sermon-detail-action-btn sermon-detail-edit-btn"
                  title="수정"
                >
                  <span className="material-icons-outlined">edit</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="sermon-detail-action-btn sermon-detail-delete-btn"
                  title="삭제"
                >
                  <span className="material-icons-outlined">delete</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="sermon-detail-action-btn sermon-detail-close-btn"
            >
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="sermon-detail-content">
          {/* 썸네일 */}
          {sermon.thumbnail_url && (
            <div className="sermon-detail-thumbnail">
              <img
                src={sermon.thumbnail_url}
                alt={sermon.title}
              />
            </div>
          )}

          {/* 제목 */}
          <h1 className="sermon-detail-title">{sermon.title}</h1>

          {/* 성경 구절 */}
          <div className="sermon-detail-bible-badge">
            <span>📖</span>
            <span>{sermon.bible_verse}</span>
          </div>

          {/* 메타 정보 */}
          <div className="sermon-detail-meta">
            <div className="sermon-detail-meta-item">
              <span className="material-icons-outlined">person</span>
              <span>{sermon.pastor}</span>
            </div>
            <div className="sermon-detail-meta-item">
              <span className="material-icons-outlined">visibility</span>
              <span>{sermon.views.toLocaleString()} 조회</span>
            </div>
          </div>

          {/* 음성 플레이어 */}
          {sermon.audio_url && (
            <div className="sermon-detail-audio">
              <div className="sermon-detail-audio-header">
                <span className="material-icons-outlined">headphones</span>
                <h3>설교 음성</h3>
              </div>
              <audio
                ref={audioPlayerRef}
                controls
                src={getAudioUrl()}
                className="sermon-detail-audio-player"
                controlsList="nodownload"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* YouTube 비디오 플레이어 */}
          {videoId && (
            <div className="sermon-detail-video-container">
              <iframe
                ref={videoPlayerRef}
                src={`https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`}
                title="설교 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="sermon-detail-video-iframe"
              />
            </div>
          )}

          {/* 언급된 성경 구절 */}
          {displayReferences.length > 0 && (
            <BibleReferencesSection
              references={displayReferences}
              videoId={videoId}
              hasAudio={!!sermon.audio_url}
              onTimestampClick={handleTimestampClick}
            />
          )}
          
          {/* 성경 구절 로딩 중 */}
          {isLoadingReferences && (
            <div className="sermon-detail-body">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="material-icons-outlined animate-spin">refresh</span>
                <span>성경 구절을 불러오는 중...</span>
              </div>
            </div>
          )}

          {/* 설교 내용 */}
          <div className="sermon-detail-body">
            <h3 className="sermon-detail-body-title">설교 내용</h3>
            <p className="sermon-detail-body-text">{sermon.content}</p>
          </div>
        </div>

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="sermon-delete-confirm-overlay">
            <div className="sermon-delete-confirm-modal">
              <h3 className="sermon-delete-confirm-title">설교 삭제</h3>
              <p className="sermon-delete-confirm-text">
                이 설교를 삭제하시겠습니까? 음성 파일도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="sermon-delete-confirm-actions">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="sermon-delete-confirm-cancel"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteSermonMutation.isPending}
                  className="sermon-delete-confirm-delete"
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
