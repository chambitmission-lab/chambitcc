import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useBibleBooks, useBibleChapterInfinite } from '../../hooks/useBible'
import { useResumeReading, useReadingProgress } from '../../hooks/useBibleReading'
import { useBiblePlan, useCompleteDay } from '../../hooks/useBiblePlan'
import { useAuth } from '../../hooks/useAuth'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { showToast } from '../../utils/toast'
import type { ResumePosition } from '../../api/bibleReading'
import {
  BibleHeader,
  BookSelector,
  ChapterNavigation,
  BibleAudioPlayer,
  VerseList,
  BibleSearch,
  ResumeReadingCard,
  FavoritesPlaylistModal,
} from './components'
import { useBookmarkStats } from '../../hooks/useBibleBookmark'
import BookIntroCard from '../../components/bible/BookIntroCard'
import BibleBottomNav from '../../components/bible/BibleBottomNav'
import './BibleStudy.css'

const BibleStudy = () => {
  const navigate = useNavigate()
  const { bookNumber, chapter } = useParams<{ bookNumber?: string; chapter?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedBookId, setSelectedBookId] = useState<number>(0)
  const [selectedBook, setSelectedBook] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  // 첫 렌더부터 URL의 ?tab= 을 반영해야 새로고침 시 읽기 화면이 깜빡이지 않는다
  const [activeTab, setActiveTab] = useState<'read' | 'search'>(() =>
    searchParams.get('tab') === 'search' ? 'search' : 'read'
  )
  const [showBookList, setShowBookList] = useState<boolean>(true)
  const [pendingScrollVerse, setPendingScrollVerse] = useState<number | null>(null)
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false)

  const { data: books, isLoading: booksLoading, error: booksError } = useBibleBooks()
  const { isLoggedIn } = useAuth()
  const { data: bookmarkStats } = useBookmarkStats()
  const favoritesCount = bookmarkStats?.favorites_count ?? 0
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

  // 최근 읽은 책 슬라이더용 — 전역 최신(이어 읽기 카드)은 제외한 "다른 책" 목록
  const recentForSlider = useMemo(() => {
    const list = resumeData?.recent_books ?? []
    const latest = resumeData?.latest
    if (!latest) return list
    return list.filter(
      p => !(p.book_number === latest.book_number && p.verse_id === latest.verse_id)
    )
  }, [resumeData])
  
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
  // 하단 네비게이션에서 다른 페이지(플랜/가계도)로부터 검색 탭으로 진입 (?tab=search)
  // URL을 탭 상태의 원본으로 삼아 새로고침해도 보고 있던 탭이 유지되게 한다.
  const tabParam = searchParams.get('tab')
  useEffect(() => {
    setActiveTab(tabParam === 'search' ? 'search' : 'read')
  }, [tabParam])

  // 하단 네비 탭 전환 시 상태와 함께 ?tab= 쿼리도 동기화한다.
  // (쿼리가 남아 있으면 새로고침 시 이전 탭으로 되돌아가는 버그가 있었음)
  const handleSelectTab = useCallback(
    (tab: 'read' | 'search') => {
      setActiveTab(tab)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (tab === 'search') next.set('tab', 'search')
          else next.delete('tab')
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )
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

  // 본문(장) 보기는 책 목록 위에 뜬 오버레이처럼 취급한다.
  // 모바일/브라우저 뒤로가기 시 메인으로 빠져나가는 대신 책 목록으로 돌아간다.
  useModalBackButton(handleChangeBook, !showBookList)
  
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
      {/* 하단 고정 네비게이션에 가리지 않도록 컨테이너에 바 높이만큼 하단 여백 */}
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
        <BibleHeader />

        {/* 읽기 탭 */}
        {activeTab === 'read' && (
          <div className="bible-read-section">
            {/* 나의 서재 — 이어 읽기(강조) + 즐겨찾기(보조)를 통일된 카드로. 책 목록 화면에서만 노출 */}
            {showBookList && (resumeData?.latest || isLoggedIn()) && (
              <div className="bible-dash">
                {resumeData?.latest && (
                  <ResumeReadingCard latest={resumeData.latest} onResume={handleResume} />
                )}

                {/* 상황별 성구 */}
                <button
                  type="button"
                  onClick={() => navigate('/bible/situation')}
                  className="dash-card dash-card--fav"
                >
                  <span className="dash-card__icon">
                    <span className="material-icons-round">sentiment_satisfied_alt</span>
                  </span>
                  <span className="dash-card__body">
                    <span className="dash-card__title">상황별 성구</span>
                    <span className="dash-card__text">두려울 때, 슬플 때… 지금 내 마음에 맞는 말씀</span>
                  </span>
                  <span className="material-icons-round dash-card__chevron">chevron_right</span>
                </button>

                {isLoggedIn() && (
                  <button
                    type="button"
                    onClick={() => setShowPlaylist(true)}
                    className="dash-card dash-card--fav"
                  >
                    <span className="dash-card__icon">
                      <span className="material-icons-round">headphones</span>
                    </span>
                    <span className="dash-card__body">
                      <span className="dash-card__title">즐겨찾기 구절 듣기</span>
                      <span className="dash-card__text">
                        {favoritesCount > 0
                          ? `즐겨찾기한 ${favoritesCount}개 구절을 묵상 플레이리스트로`
                          : '마음에 닿는 절을 모아 자기 전에 다시 듣기'}
                      </span>
                    </span>
                    <span className="material-icons-round dash-card__chevron">chevron_right</span>
                  </button>
                )}
              </div>
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
                recentBooks={recentForSlider}
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

                {/* 오디오북 — 현재 장을 음성으로 듣기. 장이 바뀌면 key로 새로 마운트 */}
                <BibleAudioPlayer
                  key={`${selectedBookData.book_number}-${selectedChapter}`}
                  bookNumber={selectedBookData.book_number}
                  chapter={selectedChapter}
                />

                {/* 권 개관 — 책 진입 시 큰 그림 노출 (1장에서만 보여 가독성 유지) */}
                {selectedChapter === 1 && (
                  <BookIntroCard
                    bookNumber={selectedBookData.book_number}
                    bookNameKo={selectedBook}
                  />
                )}
                
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

      {/* 즐겨찾기 묵상 플레이리스트 모달 */}
      {showPlaylist && <FavoritesPlaylistModal onClose={() => setShowPlaylist(false)} />}

      {/* 성경 섹션 하단 네비게이션 — 읽기/검색은 탭 전환, 플랜/가계도는 라우팅 */}
      <BibleBottomNav active={activeTab} onSelectTab={handleSelectTab} />
    </div>
  )
}

export default BibleStudy
