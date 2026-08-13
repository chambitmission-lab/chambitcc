// 설교 상세 모달 — 목록(SermonHero)과 같은 편집 문법: 제목 → 세리프 성구 인용 → 미디어 → 본문
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Sermon } from '../../../types/sermon'
import { API_URL } from '../../../config/api'
import { getBibleVerse } from '../../../api/bible'
import { isAdmin } from '../../../utils/auth'
import { useDeleteSermon } from '../../../hooks/useSermons'
import { useSermonBibleReferences } from '../../../hooks/useSermonBibleReferences'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { BibleReferencesSection } from './BibleReferencesSection'
import SermonContentFormatter from './SermonContentFormatter'
import {
  extractYouTubeVideoId,
  parseBibleReference,
  formatReference,
  formatSermonDate,
  stripTitleDate,
} from '../utils/sermonMeta'
import './SermonDetail.css'

interface SermonDetailProps {
  sermon: Sermon
  /** 목록에서 음성/영상 버튼으로 진입한 경우 해당 미디어를 바로 재생 */
  initialMedia?: 'audio' | 'video' | null
  onClose: () => void
  onDelete?: () => void
  onEdit?: () => void
}

const SermonDetail = ({ sermon, initialMedia = null, onClose, onDelete, onEdit }: SermonDetailProps) => {
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

  // 뒤로가기 → 삭제 확인이 떠있으면 그것만, 아니면 상세 닫기 (목록에서 벗어나지 않도록)
  useModalBackButton(() => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false)
    } else {
      onClose()
    }
  })

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

  const handleDelete = async () => {
    try {
      await deleteSermonMutation.mutateAsync(sermon.id)
      onDelete?.()
      onClose()
    } catch {
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

  const videoId = sermon.video_url ? extractYouTubeVideoId(sermon.video_url) : null

  // 성구 첫 절 인용 — 목록 히어로와 같은 파서·쿼리키라 캐시를 공유한다
  const parsed = useMemo(() => parseBibleReference(sermon.bible_verse), [sermon.bible_verse])
  const { data: leadVerse } = useQuery({
    queryKey: ['sermon-hero-verse', parsed?.bookNumber, parsed?.chapter, parsed?.verse ?? 1],
    queryFn: () => getBibleVerse(parsed!.bookNumber!, parsed!.chapter, parsed!.verse ?? 1),
    enabled: parsed?.bookNumber != null,
    staleTime: Infinity,
    retry: 1,
  })

  // 목록에서 음성/영상 버튼으로 진입 — 해당 플레이어 위치로 스크롤 (음성은 바로 재생, 영상은 autoplay 파라미터)
  useEffect(() => {
    if (!initialMedia) return

    const timer = setTimeout(() => {
      if (initialMedia === 'audio' && audioPlayerRef.current) {
        audioPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        audioPlayerRef.current.play().catch(() => {
          // 브라우저 자동재생 정책에 막히면 사용자가 직접 재생
        })
      } else if (initialMedia === 'video' && videoPlayerRef.current) {
        videoPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        {/* 헤더 — 날짜 한 줄 + 액션. 설교자·성구는 도입부가 담당하므로 여기선 반복하지 않는다 */}
        <div className="sermon-detail-header">
          <span className="sermon-detail-header-date">{formatSermonDate(sermon.sermon_date)}</span>
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
          {/* 도입 — 제목 → 설교자·조회 → 세리프 성구 인용 (히어로와 같은 위계) */}
          <div className="sermon-detail-lead">
            <h1 className="sermon-detail-title">{stripTitleDate(sermon.title)}</h1>
            <div className="sermon-detail-byline">
              <span>{sermon.pastor}</span>
              <span aria-hidden>·</span>
              <span>조회 {sermon.views.toLocaleString()}</span>
            </div>
            {leadVerse?.text && (
              <blockquote className="sermon-detail-quote">
                <p className="sermon-detail-quote-text">{leadVerse.text}</p>
              </blockquote>
            )}
            <div className="sermon-detail-reference">
              {parsed ? formatReference(parsed) : sermon.bible_verse}
            </div>
          </div>

          {/* 썸네일 — 영상이 없는 설교의 유일한 비주얼로만 쓴다.
            * 썸네일은 대개 유튜브 대표 이미지라, 영상이 있으면 아래 플레이어의
            * 첫 화면과 같은 그림이 두 번 그려진다(목록 히어로 배경은 계속 사용). */}
          {sermon.thumbnail_url && !videoId && (
            <div className="sermon-detail-thumbnail">
              <img
                src={sermon.thumbnail_url}
                alt={sermon.title}
              />
            </div>
          )}

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
                src={`https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1${initialMedia === 'video' ? '&autoplay=1' : ''}`}
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
            <SermonContentFormatter content={sermon.content} />
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
