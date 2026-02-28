import { useState, useEffect, useRef } from 'react'
import { useBibleBooks, useBibleChapterInfinite, useBibleSearch } from '../../hooks/useBible'
import { useLanguage } from '../../contexts/LanguageContext'
import './BibleStudy.css'

const BibleStudy = () => {
  const { language } = useLanguage()
  const [selectedBookId, setSelectedBookId] = useState<number>(0)
  const [selectedBook, setSelectedBook] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'read' | 'search'>('read')
  const [showBookList, setShowBookList] = useState<boolean>(true)
  
  // 무한 스크롤을 위한 ref
  const observerTarget = useRef<HTMLDivElement>(null)
  
  const { data: books, isLoading: booksLoading, error: booksError } = useBibleBooks()
  
  const selectedBookData = books?.find(b => b.id === selectedBookId)
  
  const { 
    data: chapterData, 
    isLoading: chapterLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useBibleChapterInfinite(
    selectedBookData?.book_number || 0, 
    selectedChapter,
    activeTab === 'read' && selectedBookId > 0
  )
  const { data: searchResults, isLoading: searchLoading } = useBibleSearch(searchQuery)
  
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
    if (chapterData) {
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
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      setSearchQuery(searchKeyword.trim())
    }
  }
  
  const handleBookSelect = (bookId: number, bookName: string) => {
    setSelectedBookId(bookId)
    setSelectedBook(bookName)
    setSelectedChapter(1)
    setShowBookList(false)
  }
  
  const handleChangeBook = () => {
    setShowBookList(true)
    setSelectedBookId(0)
    setSelectedBook('')
  }
  
  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter)
    // 스크롤을 상단으로
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const oldTestament = books?.filter(b => b.testament === 'OLD') || []
  const newTestament = books?.filter(b => b.testament === 'NEW') || []
  
  const texts = {
    ko: {
      title: '성경 공부',
      read: '읽기',
      search: '검색',
      selectBook: '책 선택',
      oldTestament: '구약',
      newTestament: '신약',
      searchPlaceholder: '검색어를 입력하세요...',
      searchResults: '검색 결과',
      noResults: '검색 결과가 없습니다',
      loadingBooks: '성경 책 목록을 불러오는 중...',
      errorBooks: '성경 책 목록을 불러오는데 실패했습니다. 백엔드 API를 확인해주세요.',
      noBooks: '성경 책 데이터가 없습니다.',
      prevChapter: '이전 장',
      nextChapter: '다음 장',
      showMore: '더보기',
      showLess: '접기',
    },
    en: {
      title: 'Bible Study',
      read: 'Read',
      search: 'Search',
      selectBook: 'Select Book',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      searchPlaceholder: 'Enter search keyword...',
      searchResults: 'Search Results',
      noResults: 'No results found',
      loadingBooks: 'Loading bible books...',
      errorBooks: 'Failed to load bible books. Please check backend API.',
      noBooks: 'No bible book data available.',
      prevChapter: 'Previous',
      nextChapter: 'Next',
      showMore: 'Show More',
      showLess: 'Show Less',
    }
  }
  
  const t = texts[language]
  
  return (
    <div className="bible-study-container">
      <div className="bible-study-header">
        <h1 className="bible-study-title">
          <span className="material-icons-round">auto_stories</span>
          {t.title}
        </h1>
      </div>
      
      {/* 탭 */}
      <div className="bible-tabs">
        <button
          className={`bible-tab ${activeTab === 'read' ? 'active' : ''}`}
          onClick={() => setActiveTab('read')}
        >
          <span className="material-icons-round">menu_book</span>
          {t.read}
        </button>
        <button
          className={`bible-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <span className="material-icons-round">search</span>
          {t.search}
        </button>
      </div>
      
      {/* 읽기 탭 */}
      {activeTab === 'read' && (
        <div className="bible-read-section">
          {/* 책 선택 */}
          {showBookList && (
            <div className="bible-books-section">
              <h2 className="section-title">{t.selectBook}</h2>
              
              {booksLoading ? (
                <div className="loading-spinner">
                  <span className="material-icons-round spinning">refresh</span>
                  <p style={{ marginTop: '1rem', color: 'var(--ig-secondary-text)' }}>
                    {t.loadingBooks}
                  </p>
                </div>
              ) : booksError ? (
                <div className="no-results">
                  <span className="material-icons-round">error_outline</span>
                  <p>{t.errorBooks}</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Error: {booksError.message}
                  </p>
                </div>
              ) : !books || books.length === 0 ? (
                <div className="no-results">
                  <span className="material-icons-round">menu_book</span>
                  <p>{t.noBooks}</p>
                </div>
              ) : (
                <>
                  <div className="testament-section">
                    <h3 className="testament-title">{t.oldTestament} ({oldTestament.length})</h3>
                    <div className="books-grid">
                      {oldTestament.map(book => (
                        <button
                          key={book.id}
                          className="book-button"
                          onClick={() => handleBookSelect(book.id, book.book_name_ko)}
                        >
                          {book.book_name_ko}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="testament-section">
                    <h3 className="testament-title">{t.newTestament} ({newTestament.length})</h3>
                    <div className="books-grid">
                      {newTestament.map(book => (
                        <button
                          key={book.id}
                          className="book-button"
                          onClick={() => handleBookSelect(book.id, book.book_name_ko)}
                        >
                          {book.book_name_ko}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* 장 선택 및 내용 */}
          {!showBookList && selectedBookId > 0 && selectedBookData && (
            <div className="bible-chapter-section">
              {/* 책 정보 헤더 */}
              <div className="book-header">
                <button className="back-button" onClick={handleChangeBook}>
                  <span className="material-icons-round">arrow_back</span>
                </button>
                <div className="book-info">
                  <h2 className="book-title">{selectedBook}</h2>
                  <p className="book-progress">
                    {selectedChapter}장 / {selectedBookData.chapter_count}장
                  </p>
                </div>
              </div>
              
              {/* 장 네비게이션 */}
              <div className="chapter-navigation">
                <button 
                  className="nav-button prev"
                  onClick={() => handleChapterChange(selectedChapter - 1)}
                  disabled={selectedChapter === 1}
                  title={t.prevChapter}
                >
                  <span className="material-icons-round">chevron_left</span>
                </button>
                
                <div className="chapter-dropdown">
                  <select 
                    value={selectedChapter}
                    onChange={(e) => handleChapterChange(Number(e.target.value))}
                    className="chapter-select"
                  >
                    {Array.from({ length: selectedBookData.chapter_count }, (_, i) => i + 1).map(ch => (
                      <option key={ch} value={ch}>{ch}장</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  className="nav-button next"
                  onClick={() => handleChapterChange(selectedChapter + 1)}
                  disabled={selectedChapter === selectedBookData.chapter_count}
                  title={t.nextChapter}
                >
                  <span className="material-icons-round">chevron_right</span>
                </button>
              </div>
              
              {chapterLoading ? (
                <div className="loading-spinner">
                  <span className="material-icons-round spinning">refresh</span>
                </div>
              ) : chapterData ? (
                <div className="bible-content">
                  <div className="verses-container">
                    <div className="verses-list">
                      {chapterData.pages.map((page, pageIndex) => (
                        <div key={pageIndex}>
                          {page.verses.map((verse) => (
                            <div key={verse.id} className="verse-item">
                              <span className="verse-number">{verse.verse}</span>
                              <span className="verse-text">
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
              ) : null}
            </div>
          )}
        </div>
      )}
      
      {/* 검색 탭 */}
      {activeTab === 'search' && (
        <div className="bible-search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <span className="material-icons-round">search</span>
              </button>
            </div>
          </form>
          
          {searchLoading ? (
            <div className="loading-spinner">
              <span className="material-icons-round spinning">refresh</span>
            </div>
          ) : searchResults ? (
            <div className="search-results">
              <p className="results-count">
                {t.searchResults}: {searchResults.total}개
              </p>
              <div className="verses-list">
                {searchResults.results.map(verse => (
                  <div key={verse.id} className="verse-item search-result">
                    <div className="verse-reference">
                      {verse.book_name_ko} {verse.chapter}:{verse.verse}
                    </div>
                    <div className="verse-text">{verse.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery ? (
            <div className="no-results">
              <span className="material-icons-round">search_off</span>
              <p>{t.noResults}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default BibleStudy
