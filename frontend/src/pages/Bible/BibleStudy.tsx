import { useState } from 'react'
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
  const [selectedBookId, setSelectedBookId] = useState<number>(0)
  const [selectedBook, setSelectedBook] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'read' | 'search'>('read')
  const [showBookList, setShowBookList] = useState<boolean>(true)
  
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  return (
    <div className="bible-study-container">
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
              />
            </div>
          )}
        </div>
      )}
      
      {/* 검색 탭 */}
      {activeTab === 'search' && <BibleSearch />}
    </div>
  )
}

export default BibleStudy
