// 설교 상세 모달 — 와이드 시네마 레이아웃:
//   헤더(날짜·예배구분·액션) → 사진 리드(제목·성구 인용) → 메타 스트립 → 플레이어 → 본문 카드
// 색·질감은 theme.css 토큰만 참조하고, 문법은 목록(SermonHero)의 편집 위계를 잇는다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Sermon } from '../../../types/sermon'
import { API_URL } from '../../../config/api'
import { getBibleVerse } from '../../../api/bible'
import { useDeleteSermon } from '../../../hooks/useSermons'
import { useSermonBibleReferences } from '../../../hooks/useSermonBibleReferences'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { BibleReferencesSection } from './BibleReferencesSection'
import SermonContentFormatter from './SermonContentFormatter'
import {
  deriveWorshipType,
  extractSermonHighlight,
  extractYouTubeVideoId,
  parseBibleReference,
  formatReference,
  formatSermonDate,
  stripTitleDate,
} from '../utils/sermonMeta'
import './SermonDetail.css'
import { toastFeedback } from '../../../utils/toast'
import { can } from '../../../utils/access'

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
  const adminUser = can('sermons:manage')
  const navigate = useNavigate()
  const deleteSermonMutation = useDeleteSermon(toastFeedback({ success: '설교가 삭제되었습니다', error: '설교 삭제에 실패했습니다' }))
  
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

  const worshipType = deriveWorshipType(sermon.title)
  const referenceLabel = parsed ? formatReference(parsed) : sermon.bible_verse
  const mediaLabel = [videoId ? '영상' : null, sermon.audio_url ? '음성' : null].filter(Boolean).join(' · ')

  // "▶ …" 한 줄은 본문에서 빼내 핵심 포인트 카드로 (없으면 본문 그대로)
  const { highlight, body: bodyContent } = useMemo(
    () => extractSermonHighlight(sermon.content),
    [sermon.content]
  )

  // 성구 칩 → 성경 화면 딥링크 (책 번호를 해석한 경우에만 눌린다)
  const openBible = () => {
    if (!parsed?.bookNumber) return
    navigate(`/bible/${parsed.bookNumber}/${parsed.chapter}${parsed.verse ? `?verse=${parsed.verse}` : ''}`)
  }

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
    <div
      className="sermon-detail-overlay"
      onClick={(e) => {
        // 배경(모달 바깥) 클릭으로 닫기
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={modalRef} className="sermon-detail-modal">
        {/* 헤더 — 날짜 + 예배구분 칩 + 액션. 설교자·성구는 리드가 담당하므로 여기선 반복하지 않는다 */}
        <div className="sermon-detail-header">
          <div className="sermon-detail-header-meta">
            <span className="material-icons-outlined sermon-detail-header-icon">event</span>
            <span className="sermon-detail-header-date">{formatSermonDate(sermon.sermon_date)}</span>
            <span className="sermon-detail-type-chip">{worshipType}</span>
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
                  <span className="sermon-detail-action-label">수정</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="sermon-detail-action-btn sermon-detail-delete-btn"
                  title="삭제"
                >
                  <span className="material-icons-outlined">delete</span>
                  <span className="sermon-detail-action-label">삭제</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="sermon-detail-action-btn sermon-detail-close-btn"
              title="닫기"
              aria-label="닫기"
            >
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="sermon-detail-content">
          {/* 리드 — 썸네일을 오른쪽으로 흘려보내고 그 위에 제목·성구 인용을 얹는다.
            * 사진은 그라디언트로 왼쪽 절반을 덮어 글자 대비를 지킨다. */}
          <div className={`sermon-detail-lead${sermon.thumbnail_url ? ' has-photo' : ''}`}>
            {sermon.thumbnail_url && (
              <div
                className="sermon-detail-lead-photo"
                style={{ backgroundImage: `url(${sermon.thumbnail_url})` }}
                aria-hidden
              />
            )}

            <div className="sermon-detail-lead-body">
              <div className="sermon-detail-lead-head">
                <div className="sermon-detail-byline">{sermon.pastor}</div>
                <h1 className="sermon-detail-title">{stripTitleDate(sermon.title)}</h1>
              </div>

              {leadVerse?.text && (
                <blockquote className="sermon-detail-quote">
                  <p className="sermon-detail-quote-text">{leadVerse.text}</p>
                </blockquote>
              )}

              {referenceLabel && (
                parsed?.bookNumber ? (
                  <button type="button" className="sermon-detail-reference" onClick={openBible}>
                    <span className="material-icons-outlined">menu_book</span>
                    {referenceLabel}
                    <span className="material-icons-outlined sermon-detail-reference-arrow">chevron_right</span>
                  </button>
                ) : (
                  <span className="sermon-detail-reference is-static">
                    <span className="material-icons-outlined">menu_book</span>
                    {referenceLabel}
                  </span>
                )
              )}
            </div>
          </div>

          {/* 메타 스트립 — 리드와 플레이어 사이의 사실 한 줄 */}
          <div className="sermon-detail-meta">
            <div className="sermon-detail-meta-item">
              <span className="material-icons-outlined">church</span>
              <div className="sermon-detail-meta-text">
                <span className="sermon-detail-meta-label">예배구분</span>
                <strong className="sermon-detail-meta-value">{worshipType}</strong>
              </div>
            </div>
            <div className="sermon-detail-meta-item">
              <span className="material-icons-outlined">visibility</span>
              <div className="sermon-detail-meta-text">
                <span className="sermon-detail-meta-label">조회</span>
                <strong className="sermon-detail-meta-value">{sermon.views.toLocaleString()}</strong>
              </div>
            </div>
            {mediaLabel && (
              <div className="sermon-detail-meta-item">
                <span className="material-icons-outlined">play_circle</span>
                <div className="sermon-detail-meta-text">
                  <span className="sermon-detail-meta-label">자료</span>
                  <strong className="sermon-detail-meta-value">{mediaLabel}</strong>
                </div>
              </div>
            )}
          </div>

          {/* 무대 — 영상·썸네일·음성은 캔버스 위에 뜬 라운드 프레임으로 */}
          {(videoId || sermon.thumbnail_url || sermon.audio_url) && (
            <div className="sermon-detail-stage">
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

              {/* 썸네일 — 영상이 없는 설교의 유일한 비주얼로만 쓴다.
                * 썸네일은 대개 유튜브 대표 이미지라, 영상이 있으면 아래 플레이어의
                * 첫 화면과 같은 그림이 두 번 그려진다(리드 배경은 계속 사용). */}
              {sermon.thumbnail_url && !videoId && (
                <div className="sermon-detail-thumbnail">
                  <img src={sermon.thumbnail_url} alt={sermon.title} />
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
            </div>
          )}

          {/* 언급된 성경 구절 */}
          {displayReferences.length > 0 && (
            <div className="sermon-detail-card">
              <BibleReferencesSection
                references={displayReferences}
                videoId={videoId}
                hasAudio={!!sermon.audio_url}
                onTimestampClick={handleTimestampClick}
              />
            </div>
          )}
          
          {/* 성경 구절 로딩 중 */}
          {isLoadingReferences && (
            <div className="sermon-detail-card sermon-detail-loading">
              <span className="material-icons-outlined animate-spin">refresh</span>
              <span>성경 구절을 불러오는 중...</span>
            </div>
          )}

          {/* 설교 내용 */}
          {(bodyContent.trim() || highlight) && (
            <section className="sermon-detail-body">
              <div className="sermon-detail-body-head">
                <span className="material-icons-outlined">menu_book</span>
                <h3 className="sermon-detail-body-title">설교 내용</h3>
                <span className="sermon-detail-body-rule" aria-hidden />
              </div>

              <div className={`sermon-detail-body-grid${highlight ? ' has-aside' : ''}`}>
                {bodyContent.trim() && (
                  <div className="sermon-detail-body-main">
                    <SermonContentFormatter content={bodyContent} />
                  </div>
                )}

                {highlight && (
                  <aside className="sermon-detail-highlight">
                    <div className="sermon-detail-highlight-head">
                      <span className="material-icons-outlined">format_quote</span>
                      핵심 포인트
                    </div>
                    <p className="sermon-detail-highlight-text">{highlight}</p>
                  </aside>
                )}
              </div>
            </section>
          )}
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
