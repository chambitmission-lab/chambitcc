import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useBibleBooks, useBibleChapterInfinite } from '../../hooks/useBible'
import {
  BibleHeader,
  BibleTabs,
  BookSelector,
  ChapterNavigation,
  VerseList,
  BibleSearch
} from './components'
import './BibleStudy.css'

const BibleStudy = () => {
  const { bookNumber, chapter } = useParams<{ bookNumber?: string; chapter?: string }>()
  
  const [selectedBookId, setSelectedBookId] = useState<number>(0)
  const [selectedBook, setSelectedBook] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'read' | 'search'>('read')
  const [showBookList, setShowBookList] = useState<boolean>(true)
  
  const { data: books, isLoading: booksLoading, error: booksError } = useBibleBooks()
  
  const selectedBookData = books?.find(b => b.id === selectedBookId)
  
  // URL 파라미터로 책과 장이 전달된 경우 자동으로 선택
  useEffect(() => {
    if (bookNumber && chapter && books && books.length > 0) {
      const bookNum = parseInt(bookNumber)
      const chapterNum = parseInt(chapter)
      
      const book = books.find(b => b.book_number === bookNum)
      if (book) {
        setSelectedBookId(book.id)
        setSelectedBook(book.book_name_ko)
        setSelectedChapter(chapterNum)
        setShowBookList(false)
        setActiveTab('read')
        
        // 페이지 상단으로 스크롤
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }
    }
  }, [bookNumber, chapter, books])
  
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
    // 여러 스크롤 컨테이너를 모두 처리
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }
  
  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <BibleHeader />
        
        <BibleTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* 읽기 탭 */}
        {activeTab === 'read' && (
          <div className="bible-read-section">
            {/* 책 선택 */}
            {showBookList && (
              <BookSelector
                books={books}
                isLoading={booksLoading}
                error={booksError}
                onBookSelect={handleBookSelect}
              />
            )}
            
            {/* 장 선택 및 내용 */}
            {!showBookList && selectedBookId > 0 && selectedBookData && (
              <div className="bible-chapter-section">
                <ChapterNavigation
                  selectedBook={selectedBook}
                  selectedChapter={selectedChapter}
                  totalChapters={selectedBookData.chapter_count}
                  onChapterChange={handleChapterChange}
                  onBackToBooks={handleChangeBook}
                />
                
                <VerseList
                  chapterData={chapterData}
                  isLoading={chapterLoading}
                  hasNextPage={hasNextPage || false}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  selectedChapter={selectedChapter}
                  totalChapters={selectedBookData.chapter_count}
                  onChapterChange={handleChapterChange}
                  bookNumber={selectedBookData.book_number}
                />
              </div>
            )}
          </div>
        )}
        
        {/* 검색 탭 */}
        {activeTab === 'search' && <BibleSearch />}
      </div>
    </div>
  )
}

export default BibleStudy
