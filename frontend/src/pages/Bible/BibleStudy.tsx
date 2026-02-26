import { useState } from 'react'
import { useBibleBooks, useBibleChapter, useBibleSearch } from '../../hooks/useBible'
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
  
  const { data: books, isLoading: booksLoading, error: booksError } = useBibleBooks()
  const { data: chapterData, isLoading: chapterLoading } = useBibleChapter(
    selectedBookId, 
    selectedChapter,
    activeTab === 'read' && selectedBookId > 0
  )
  const { data: searchResults, isLoading: searchLoading } = useBibleSearch(searchQuery)
  
  // 데이터 확인용 로그
  if (books && books.length > 0) {
    console.log('✅ 첫 번째 책 데이터:', books[0])
    console.log('✅ 전체 책 개수:', books.length)
  }
  
  const selectedBookData = books?.find(b => b.id === selectedBookId)
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      setSearchQuery(searchKeyword.trim())
    }
  }
  
  const handleBookSelect = (bookId: number, bookName: string) => {
    setSelectedBookId(bookId)
    setSelectedBook(bookName)
    setSelectedChapter(1)
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
                        className={`book-button ${selectedBookId === book.id ? 'selected' : ''}`}
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
                        className={`book-button ${selectedBookId === book.id ? 'selected' : ''}`}
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
          
          {/* 장 선택 및 내용 */}
          {selectedBookId > 0 && selectedBookData && (
            <div className="bible-chapter-section">
              <div className="chapter-selector">
                <h2 className="section-title">{selectedBook}</h2>
                <div className="chapter-buttons">
                  {Array.from({ length: selectedBookData.chapter_count }, (_, i) => i + 1).map(ch => (
                    <button
                      key={ch}
                      className={`chapter-button ${selectedChapter === ch ? 'selected' : ''}`}
                      onClick={() => setSelectedChapter(ch)}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              
              {chapterLoading ? (
                <div className="loading-spinner">
                  <span className="material-icons-round spinning">refresh</span>
                </div>
              ) : chapterData ? (
                <div className="bible-content">
                  <h3 className="chapter-title">
                    {chapterData.book_name_ko} {chapterData.chapter}장
                  </h3>
                  <div className="verses-list">
                    {chapterData.verses.map(verse => (
                      <div key={verse.id} className="verse-item">
                        <span className="verse-number">{verse.verse}</span>
                        <span className="verse-text">{verse.text}</span>
                      </div>
                    ))}
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
