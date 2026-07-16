import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse, BibleVerse } from '../../../types/bible'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../hooks/useAuth'
import VerseItem from './VerseItem'
import ChapterLoader from './ChapterLoader'
import { useChapterReadStatus, useMarkVerseAsRead } from '../../../hooks/useBibleReading'
import { celebrateFlowerBloom } from '../../../utils/confettiEffects'
import VerseEditModal from '../../../components/bible/VerseEditModal'
import BibleCommentaryPanel from '../../../components/bible/BibleCommentaryPanel'
import { showToast } from '../../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'
import { useOptimisticUpdateVerse } from '../../../hooks/useBibleAdmin'
import { useChapterCommentaries } from '../../../hooks/useBibleCommentary'

interface VerseListProps {
  chapterData: InfiniteData<BibleChapterPaginatedResponse> | undefined
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  selectedChapter: number
  totalChapters: number
  onChapterChange: (chapter: number) => void
  bookNumber: number
  scrollToVerse?: number | null
  onScrolled?: () => void
  // 이 장의 모든 절을 읽었을 때 1회 호출 (읽기 플랜 자동 완료용)
  onChapterFullyRead?: () => void
}

const VerseList = ({
  chapterData,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  selectedChapter,
  totalChapters,
  onChapterChange,
  bookNumber,
  scrollToVerse,
  onScrolled,
  onChapterFullyRead,
}: VerseListProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const fullReadFiredRef = useRef(false)
  const { language } = useLanguage()
  const { isLoggedIn } = useAuth()
  const [editingVerse, setEditingVerse] = useState<BibleVerse | null>(null)
  // 액션 메뉴는 한 번에 한 절만 열린다. 다른 절을 탭하면 자동으로 이전 메뉴가 닫혀
  // 여러 메뉴가 동시에 떠 본문을 가리는 일이 없다.
  const [openVerseId, setOpenVerseId] = useState<number | null>(null)
  const [commentaryFocusVerse, setCommentaryFocusVerse] = useState<number | null>(null)
  const [commentaryPanelOpen, setCommentaryPanelOpen] = useState(false)
  const queryClient = useQueryClient()
  const updateVerseMutation = useOptimisticUpdateVerse()

  // 해당 장의 해석 목록 (절별로 indicator 표시용)
  const { data: chapterCommentaries } = useChapterCommentaries(
    bookNumber,
    selectedChapter,
    bookNumber > 0 && selectedChapter > 0,
  )

  // 절 → 해석 존재 여부 맵
  const verseHasCommentaryMap = useMemo(() => {
    const map = new Set<number>()
    if (!chapterCommentaries?.items) return map
    for (const c of chapterCommentaries.items) {
      for (let v = c.verse_start; v <= c.verse_end; v++) {
        map.add(v)
      }
    }
    return map
  }, [chapterCommentaries])

  const handleShowCommentary = (verse: BibleVerse) => {
    setCommentaryFocusVerse(verse.verse)
    setCommentaryPanelOpen(true)
  }

  const handleShowChapterCommentaries = () => {
    setCommentaryFocusVerse(null)
    setCommentaryPanelOpen(true)
  }
  
  // 모든 훅은 조건문 이전에 호출되어야 함
  // 백엔드에서 읽음 상태 조회 (로그인 시 항상)
  const {
    data: readStatusData,
    isLoading: readStatusLoading,
    refetch: refetchReadStatus
  } = useChapterReadStatus(
    bookNumber,
    selectedChapter,
    isLoggedIn()
  )
  
  // 읽음 처리 Mutation
  const markAsReadMutation = useMarkVerseAsRead()
  
  // 읽은 구절 Set 생성 (백엔드 데이터 기반)
  const readVerses = useMemo(() => {
    if (!readStatusData?.verses) return new Set<number>()
    return new Set(
      readStatusData.verses
        .filter(v => v.is_read)
        .map(v => v.verse_id)
    )
  }, [readStatusData])
  
  const texts = {
    ko: {
      prevChapter: '이전 장',
      nextChapter: '다음 장',
    },
    en: {
      prevChapter: 'Previous',
      nextChapter: 'Next',
    }
  }

  const t = texts[language]
  
  // 읽음 처리 핸들러 - 훅 호출 이후에 정의
  const handleReadSuccess = async (verseId: number, similarity: number) => {
    try {
      // 백엔드 API 호출
      await markAsReadMutation.mutateAsync({ verseId, similarity })
      
      // 꽃 피어남 축하 효과
      celebrateFlowerBloom()
      
      // 명시적으로 읽음 상태 다시 조회
      await refetchReadStatus()
    } catch (error: any) {
      // 이미 읽음 처리된 경우는 에러로 처리하지 않음
      if (error?.message === 'ALREADY_READ') {
        console.log('Verse already marked as read, refreshing status...')
        await refetchReadStatus()
      } else {
        console.error('Failed to save reading record:', error)
      }
    }
  }
  
  // 구절 수정 핸들러 (관리자용)
  const handleEditVerse = (verse: BibleVerse) => {
    setEditingVerse(verse)
  }
  
  // 구절 저장 핸들러 (최종 개선 버전)
  const handleSaveVerse = async (verseId: number, newText: string) => {
    try {
      // 방법 1: 낙관적 업데이트 사용
      await updateVerseMutation.mutateAsync({
        verseId,
        newText,
        bookNumber,
        chapter: selectedChapter
      })
      
      // 방법 2: 추가 안전장치 - 캐시 강제 새로고침
      setTimeout(async () => {
        await queryClient.refetchQueries({
          queryKey: ['bible', 'chapter', 'infinite', bookNumber, selectedChapter],
          type: 'active'
        })
      }, 100) // 100ms 후 새로고침
      
      showToast('성경 구절이 수정되었습니다', 'success')
      
    } catch (error) {
      console.error('❌ Failed to update verse:', error)
      showToast('구절 수정에 실패했습니다', 'error')
      throw error
    }
  }
  
  // 전체 구절 수 계산
  const totalVerses = chapterData?.pages.reduce((sum, page) => sum + page.verses.length, 0) || 0
  const readCount = readStatusData?.read_verses || 0
  const progress = readStatusData?.progress || 0

  // 장이 바뀌면 자동 완료 발동 플래그 초기화
  useEffect(() => {
    fullReadFiredRef.current = false
  }, [bookNumber, selectedChapter])

  // 이 장의 모든 절을 읽었으면 onChapterFullyRead 를 1회 호출 (읽기 플랜 자동 완료)
  // 백엔드가 계산한 장 전체 기준(total_verses/read_verses)을 사용해 페이지네이션 영향 없이 판정.
  useEffect(() => {
    if (!onChapterFullyRead || fullReadFiredRef.current) return
    const total = readStatusData?.total_verses ?? 0
    const read = readStatusData?.read_verses ?? 0
    if (total > 0 && read >= total) {
      fullReadFiredRef.current = true
      onChapterFullyRead()
    }
  }, [onChapterFullyRead, readStatusData])


  // 무한 스크롤: 옵저버 콜백이 항상 최신 값을 보도록 ref 에 보관.
  // 이렇게 하면 콜백 ref 자체는 deps 없이 안정적으로 유지할 수 있어,
  // 페이지 로드마다 옵저버를 재생성하지 않는다.
  const infiniteScrollState = useRef({ hasNextPage, isFetchingNextPage, fetchNextPage })
  infiniteScrollState.current = { hasNextPage, isFetchingNextPage, fetchNextPage }

  // 무한 스크롤 트리거 div 에 붙는 콜백 ref.
  // 트리거 div 는 로딩 스피너 early-return 이후에만 렌더되므로, useEffect+useRef
  // 조합은 부착 타이밍이 어긋나기 쉽다(본문이 먼저 오고 읽음 상태가 늦게 오면
  // 옵저버가 끝내 안 붙어 다음 페이지가 로드되지 않던 버그가 있었다).
  // 콜백 ref 는 노드가 마운트되는 즉시 호출되므로 타이밍과 무관하게 항상 부착된다.
  const observerTargetRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!node) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const { hasNextPage, isFetchingNextPage, fetchNextPage } = infiniteScrollState.current
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // 100px 전에 미리 로드
      }
    )
    observerRef.current.observe(node)
  }, [])

  // 언마운트 시 옵저버 정리
  useEffect(() => () => observerRef.current?.disconnect(), [])
  
  // 이어 읽기: 지정된 절로 자동 스크롤 + 일시적 하이라이트.
  // 무한 스크롤 페이지가 새로 로드될 때마다 DOM 존재 여부를 재확인하고,
  // 없으면 자동으로 다음 페이지를 미리 받는다.
  useEffect(() => {
    if (!scrollToVerse || !chapterData) return
    const el = document.getElementById(`bible-verse-${scrollToVerse}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('verse-resume-highlight')
      const timer = setTimeout(() => {
        el.classList.remove('verse-resume-highlight')
      }, 2400)
      onScrolled?.()
      return () => clearTimeout(timer)
    }
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [scrollToVerse, chapterData, hasNextPage, isFetchingNextPage, fetchNextPage, onScrolled])

  // 디버깅: 챕터 데이터 확인
  useEffect(() => {
    if (import.meta.env.DEV && chapterData) {
      const totalPages = chapterData.pages.length
      const totalVerses = chapterData.pages.reduce((sum, page) => sum + page.verses.length, 0)
      console.log('Chapter loaded:', { totalPages, totalVerses })
    }
  }, [chapterData])
  
  // 로딩 상태는 모든 훅 호출 이후에 체크.
  // 본문(캐시로 즉시)과 읽음 상태(staleTime 5분이라 늦게 도착)가 따로 도착하면
  // '안 읽음' 초기 상태가 잠깐 보였다가 읽음으로 확 바뀌는 깜빡임이 생긴다.
  // 읽음 상태가 처음 로드되는 동안에도 스피너를 유지해 최종 상태를 한 번에 그린다.
  // (읽음 상태가 이미 캐시에 있으면 readStatusLoading=false라 지연 없음)
  if (isLoading || readStatusLoading) {
    return <ChapterLoader size="lg" />
  }
  
  if (!chapterData) {
    return null
  }
  
  return (
    <div className="bible-content">
      {/* 진행률 pill - 읽은 절이 있을 때만 컴팩트하게 표시 */}
      {readCount > 0 && totalVerses > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.5rem 0.875rem',
          marginBottom: '0.875rem',
          background: 'var(--ig-secondary-background)',
          borderRadius: '999px',
          fontSize: '0.8125rem',
          maxWidth: '42rem',
          marginInline: 'auto',
        }}>
          <span className="material-icons-outlined" style={{ fontSize: '1rem', color: 'var(--ig-primary)' }}>
            auto_stories
          </span>
          <span style={{ color: 'var(--ig-secondary-text)', fontWeight: 500 }}>
            {readCount} / {totalVerses}
          </span>
          <div style={{
            flex: 1,
            height: '6px',
            background: 'var(--ig-border)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--brand)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
              minWidth: progress > 0 ? '2px' : '0',
            }} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--ig-primary)', minWidth: '2.5rem', textAlign: 'right' }}>
            {Math.round(progress)}%
          </span>
        </div>
      )}

      <div className="verses-container">
        <div className="verses-list">
          {chapterData.pages.map((page, pageIndex) => (
            <div key={pageIndex}>
              {page.verses.map((verse) => (
                <VerseItem
                  key={verse.id}
                  verse={verse}
                  bookNameKo={page.book_name_ko}
                  chapter={page.chapter}
                  isRead={readVerses.has(verse.id)}
                  onReadSuccess={handleReadSuccess}
                  onEdit={handleEditVerse}
                  onShowCommentary={handleShowCommentary}
                  hasCommentary={verseHasCommentaryMap.has(verse.verse)}
                  actionsOpen={openVerseId === verse.id}
                  onActionsOpenChange={(open) => setOpenVerseId(open ? verse.id : null)}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* 무한 스크롤 트리거 */}
        {hasNextPage && (
          <div
            ref={observerTargetRef}
            style={{
              height: '100px', 
              margin: '2rem 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isFetchingNextPage && (
              <ChapterLoader size="sm" label="구절을 불러오는 중" />
            )}
          </div>
        )}
        
        {!hasNextPage && chapterData.pages.length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem 1rem',
            color: 'var(--ig-secondary-text)',
            fontSize: '0.875rem'
          }}>
            <span className="material-icons-round" style={{ fontSize: '2rem', opacity: 0.3 }}>
              check_circle
            </span>
            
            {/* 장 끝 텍스트와 네비게이션을 한 줄에 배치 */}
            <div style={{ 
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <button 
                onClick={() => onChapterChange(selectedChapter - 1)}
                disabled={selectedChapter === 1}
                title={t.prevChapter}
                style={{
                  padding: '0.5rem',
                  borderRadius: '50%',
                  border: '2px solid var(--ig-border)',
                  background: 'var(--ig-primary-background)',
                  color: 'var(--ig-primary-text)',
                  cursor: selectedChapter === 1 ? 'not-allowed' : 'pointer',
                  opacity: selectedChapter === 1 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>
                  chevron_left
                </span>
              </button>
              
              <p style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                {chapterData.pages[0].book_name_ko} {chapterData.pages[0].chapter}장 끝
              </p>
              
              <button 
                onClick={() => onChapterChange(selectedChapter + 1)}
                disabled={selectedChapter === totalChapters}
                title={t.nextChapter}
                style={{
                  padding: '0.5rem',
                  borderRadius: '50%',
                  border: '2px solid var(--ig-border)',
                  background: 'var(--ig-primary-background)',
                  color: 'var(--ig-primary-text)',
                  cursor: selectedChapter === totalChapters ? 'not-allowed' : 'pointer',
                  opacity: selectedChapter === totalChapters ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 구절 수정 모달 */}
      {editingVerse && (
        <VerseEditModal
          verse={editingVerse}
          onSave={handleSaveVerse}
          onClose={() => setEditingVerse(null)}
        />
      )}

      {/* 장 전체 해석 보기 플로팅 버튼 */}
      {(chapterCommentaries?.items?.length ?? 0) > 0 && !commentaryPanelOpen && (
        <button
          onClick={handleShowChapterCommentaries}
          title="이 장의 해석 모두 보기"
          style={{
            position: 'fixed',
            right: '1rem',
            bottom: '5.5rem',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--brand)',
            color: 'white',
            boxShadow: '0 6px 18px var(--brand-glow)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <span className="material-icons-round" style={{ fontSize: '1.5rem' }}>
            menu_book
          </span>
        </button>
      )}

      {/* 해석 패널 */}
      {commentaryPanelOpen && chapterData && chapterData.pages[0] && (
        <BibleCommentaryPanel
          bookNumber={bookNumber}
          chapter={selectedChapter}
          bookNameKo={chapterData.pages[0].book_name_ko}
          focusVerse={commentaryFocusVerse}
          totalVerses={chapterData.pages[0].total_verses}
          onClose={() => {
            setCommentaryPanelOpen(false)
            setCommentaryFocusVerse(null)
          }}
        />
      )}
    </div>
  )
}

export default VerseList
