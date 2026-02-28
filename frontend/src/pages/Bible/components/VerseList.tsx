import { useEffect, useRef } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse } from '../../../types/bible'

interface VerseListProps {
  chapterData: InfiniteData<BibleChapterPaginatedResponse> | undefined
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

const VerseList = ({
  chapterData,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage
}: VerseListProps) => {
  const observerTarget = useRef<HTMLDivElement>(null)
  
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
  
  if (!chapterData) {
    return null
  }
  
  return (
    <div className="bible-content">
      <div className="verses-container">
        <div className="verses-list">
          {chapterData.pages.map((page, pageIndex) => (
            <div key={pageIndex}>
              {page.verses.map((verse) => (
                <div key={verse.id} className="bible-verse-item">
                  <span className="bible-verse-number">{verse.verse}</span>
                  <span className="bible-verse-text">
                    {verse.text || '(구절 내용 없음)'}
                  </span>
                </div>
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
            <p style={{ marginTop: '0.5rem' }}>
              {chapterData.pages[0].book_name_ko} {chapterData.pages[0].chapter}장 끝
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerseList
