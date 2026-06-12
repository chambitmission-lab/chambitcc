import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useBibleBooks, useBibleChapterInfinite } from '../../hooks/useBible'
import { useResumeReading, useReadingProgress } from '../../hooks/useBibleReading'
import { useBiblePlan, useCompleteDay } from '../../hooks/useBiblePlan'
import { useAuth } from '../../hooks/useAuth'
import { showToast } from '../../utils/toast'
import type { ResumePosition } from '../../api/bibleReading'
import {
  BibleHeader,
  BibleTabs,
  BookSelector,
  ChapterNavigation,
  VerseList,
  BibleSearch,
  ResumeReadingCard,
} from './components'
import './BibleStudy.css'

const BibleStudy = () => {
  const { bookNumber, chapter } = useParams<{ bookNumber?: string; chapter?: string }>()
  
  const [selectedBookId, setSelectedBookId] = useState<number>(0)
  const [selectedBook, setSelectedBook] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'read' | 'search'>('read')
  const [showBookList, setShowBookList] = useState<boolean>(true)
  const [pendingScrollVerse, setPendingScrollVerse] = useState<number | null>(null)

  const { data: books, isLoading: booksLoading, error: booksError } = useBibleBooks()
  const { isLoggedIn } = useAuth()
  const { data: resumeData } = useResumeReading(20, isLoggedIn())
  const { data: progressData } = useReadingProgress(isLoggedIn())

  const resumeMap = useMemo(() => {
    const map = new Map<number, ResumePosition>()
    resumeData?.recent_books?.forEach(p => map.set(p.book_number, p))
    return map
  }, [resumeData])

  // book_id → 완독률(0~100) 매핑. 카드 하단 게이지바에 사용
  const progressMap = useMemo(() => {
    const map = new Map<number, number>()
    progressData?.books?.forEach(b => map.set(b.book_id, b.progress_rate))
    return map
  }, [progressData])
  
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
  
  // ── 읽기 플랜 연동 ──
  // PlanDetail에서 "오늘 분량 읽기"로 진입하면 ?plan=&day= 가 붙는다.
  // 그 본문(장)을 끝까지 읽으면 해당 일차를 자동 완료 처리한다.
  const [searchParams] = useSearchParams()
  const planId = Number(searchParams.get('plan')) || 0
  const planDayNumber = Number(searchParams.get('day')) || 0
  const { data: planData } = useBiblePlan(planId, planId > 0)
  const completeDay = useCompleteDay()

  const planDay = planData?.days.find((d) => d.day_number === planDayNumber)
  const planPassage = planDay?.passages[0]
  // 현재 보고 있는 장이 플랜이 지정한 본문과 일치하고, 아직 완료되지 않은 경우에만 자동 완료를 활성화.
  const planAutoComplete =
    planId > 0 &&
    planDayNumber > 0 &&
    !!planDay &&
    !planDay.completed &&
    !!planPassage &&
    selectedBookData?.book_number === planPassage.book_number &&
    selectedChapter === planPassage.chapter_start

  const handleChapterFullyRead = useCallback(async () => {
    if (!planAutoComplete) return
    try {
      await completeDay.mutateAsync({ planId, dayNumber: planDayNumber })
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.7 },
        colors: ['#a855f7', '#ec4899', '#d946ef', '#f472b6'],
      })
      showToast(`오늘 분량 완료! ${planDayNumber}일차를 마쳤어요 🎉`, 'success')
    } catch (e) {
      // 자동 완료 실패는 조용히 무시 — 플랜 화면의 수동 체크로 대체 가능
      console.error('plan auto-complete failed', e)
    }
  }, [planAutoComplete, completeDay, planId, planDayNumber])

  const handleBookSelect = (bookId: number, bookName: string, resume?: ResumePosition) => {
    setSelectedBookId(bookId)
    setSelectedBook(bookName)
    setSelectedChapter(resume?.chapter ?? 1)
    setPendingScrollVerse(resume?.verse ?? null)
    setShowBookList(false)
  }

  const handleResume = (pos: ResumePosition) => {
    const book = books?.find(b => b.book_number === pos.book_number)
    if (!book) return
    setSelectedBookId(book.id)
    setSelectedBook(book.book_name_ko)
    setSelectedChapter(pos.chapter)
    setPendingScrollVerse(pos.verse)
    setShowBookList(false)
    setActiveTab('read')
  }
  
  const handleChangeBook = () => {
    setShowBookList(true)
    setSelectedBookId(0)
    setSelectedBook('')
  }
  
  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter)
    setPendingScrollVerse(null)
    // 여러 스크롤 컨테이너를 모두 처리
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }
  
  return (
    <div className="bg-gray-50 dark:bg-background-dark min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <BibleHeader />
        
        <BibleTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* 읽기 탭 */}
        {activeTab === 'read' && (
          <div className="bible-read-section">
            {/* 이어 읽기 카드 - 책 목록 화면에서만 노출 */}
            {showBookList && resumeData?.latest && (
              <ResumeReadingCard
                latest={resumeData.latest}
                recentBooks={resumeData.recent_books}
                onResume={handleResume}
              />
            )}

            {/* 책 선택 */}
            {showBookList && (
              <BookSelector
                books={books}
                isLoading={booksLoading}
                error={booksError}
                onBookSelect={handleBookSelect}
                resumeMap={resumeMap}
                progressMap={progressMap}
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
                  scrollToVerse={pendingScrollVerse}
                  onScrolled={() => setPendingScrollVerse(null)}
                  onChapterFullyRead={planAutoComplete ? handleChapterFullyRead : undefined}
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
