import { useEffect, useRef, useState, useMemo } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse } from '../../../types/bible'
import { useLanguage } from '../../../contexts/LanguageContext'
import VerseItem from './VerseItem'
import { useChapterReadStatus, useMarkVerseAsRead } from '../../../hooks/useBibleReading'

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
  bookNumber
}: VerseListProps) => {
  const observerTarget = useRef<HTMLDivElement>(null)
  const { language } = useLanguage()
  const [readingMode, setReadingMode] = useState(false)
  
  // 백엔드에서 읽음 상태 조회
  const { data: readStatusData, isLoading: isLoadingReadStatus } = useChapterReadStatus(
    bookNumber,
    selectedChapter,
    readingMode // 읽기 모드일 때만 조회
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
      readingMode: '음성 읽기 모드',
      normalMode: '일반 모드',
      readVerse: '구절 읽기',
      progress: '진행률'
    },
    en: { 
      prevChapter: 'Previous', 
      nextChapter: 'Next',
      readingMode: 'Voice Reading Mode',
      normalMode: 'Normal Mode',
      readVerse: 'Read Verse',
      progress: 'Progress'
    }
  }
  
  const t = texts[language]
  
  // 무한 스크롤 Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log('🔄 Loading next page...', { hasNextPage, isFetchingNextPage })
          fetchNextPage()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // 100px 전에 미리 로드
      }
    )
    
    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
      console.log('👀 Observer attached', { hasNextPage, isFetchingNextPage })
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  
  // 디버깅: 챕터 데이터 확인
  useEffect(() => {
    if (import.meta.env.DEV && chapterData) {
      console.log('📖 Chapter Data:', {
        totalPages: chapterData.pages.length,
        pages: chapterData.pages.map(page => ({
          page: page.current_page,
          verseCount: page.verses.length,
          verseNumbers: page.verses.map(v => v.verse),
          hasMore: page.has_more
        }))
      })
    }
  }, [chapterData])
  
  if (isLoading) {
    return (
      <div className="loading-spinner">
        <span className="material-icons-round spinning">refresh</span>
      </div>
    )
  }
  
  // 읽음 처리 핸들러
  const handleReadSuccess = async (verseId: number, similarity: number) => {
    console.log(`✅ Verse ${verseId} read successfully! Similarity: ${similarity}`)
    
    try {
      // 백엔드 API 호출
      await markAsReadMutation.mutateAsync({ verseId, similarity })
      console.log('✅ Successfully saved to backend')
    } catch (error) {
      console.error('❌ Failed to save to backend:', error)
      // 에러 처리 (사용자에게 알림 등)
    }
  }
  
  // 전체 구절 수 계산
  const totalVerses = chapterData?.pages.reduce((sum, page) => sum + page.verses.length, 0) || 0
  const readCount = readStatusData?.read_verses || 0
  const progress = readStatusData?.progress || 0
  
  if (!chapterData) {
    return null
  }
  
  return (
    <div className="bible-content">
      {/* 읽기 모드 토글 및 진행률 */}
      <div style={{
        padding: '1rem',
        background: 'var(--ig-secondary-background)',
        borderRadius: '0.75rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setReadingMode(!readingMode)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: readingMode ? 'var(--ig-primary)' : 'var(--ig-border)',
              color: readingMode ? 'white' : 'var(--ig-primary-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <span className="material-icons-outlined" style={{ fontSize: '1.25rem' }}>
              {readingMode ? 'mic' : 'mic_none'}
            </span>
            {readingMode ? t.readingMode : t.normalMode}
          </button>
          
          {readingMode && !isLoadingReadStatus && (
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--ig-secondary-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                auto_stories
              </span>
              {readCount} / {totalVerses}
            </div>
          )}
        </div>
        
        {/* 진행률 바 */}
        {readingMode && !isLoadingReadStatus && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <span style={{ color: 'var(--ig-secondary-text)' }}>{t.progress}</span>
              <span style={{ fontWeight: 600, color: 'var(--ig-primary)' }}>{Math.round(progress)}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'var(--ig-border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--ig-primary), var(--ig-accent))',
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>
          </div>
        )}
        
        {/* 로딩 중 */}
        {readingMode && isLoadingReadStatus && (
          <div style={{ 
            textAlign: 'center', 
            padding: '0.5rem',
            color: 'var(--ig-secondary-text)',
            fontSize: '0.875rem'
          }}>
            읽음 상태 불러오는 중...
          </div>
        )}
      </div>
      
      <div className="verses-container">
        <div className="verses-list">
          {chapterData.pages.map((page, pageIndex) => (
            <div key={pageIndex}>
              {page.verses.map((verse) => (
                <VerseItem
                  key={verse.id}
                  verse={verse}
                  readingMode={readingMode}
                  isRead={readVerses.has(verse.id)}
                  onReadSuccess={handleReadSuccess}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* 무한 스크롤 트리거 */}
        {hasNextPage && (
          <div 
            ref={observerTarget} 
            style={{ 
              height: '100px', 
              margin: '2rem 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isFetchingNextPage && (
              <div className="loading-spinner" style={{ padding: '1rem' }}>
                <span className="material-icons-round spinning">refresh</span>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  구절을 불러오는 중...
                </p>
              </div>
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
    </div>
  )
}

export default VerseList
