import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation, useNavigationType } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useBibleBooks, useBibleChapterInfinite } from '../../hooks/useBible'
import { useResumeReading, useReadingProgress } from '../../hooks/useBibleReading'
import { useQueryClient } from '@tanstack/react-query'
import { biblePlanKeys, useBiblePlan, useCompleteDay } from '../../hooks/useBiblePlan'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { showToast } from '../../utils/toast'
import type { ResumePosition } from '../../api/bibleReading'
import {
  BibleHeader,
  BookSelector,
  ChapterNavigation,
  ChapterOutlineRail,
  BibleAudioPlayer,
  VerseList,
  BibleSearch,
  ResumeReadingCard,
  FavoritesPlaylistModal,
  FocusReading,
} from './components'
import type { PlayFromVerseRequest } from './components/BibleAudioPlayer'
import { useBookmarkStats } from '../../hooks/useBibleBookmark'
import BookIntroCard from '../../components/bible/BookIntroCard'
import BibleBottomNav from '../../components/bible/BibleBottomNav'
import BibleSectionTabs from '../../components/bible/BibleSectionTabs'
// 스토리 모드 진행 상태만 가볍게 읽는다 — 42화 콘텐츠 데이터는 스토리 라우트 청크에만 실린다
import { loadReadIds } from './Story/storyProgress'
import './BibleStudy.css'

const BibleStudy = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
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
  // 집중 읽기 — 한 절씩 넘기는 몰입 모드 (본문 위 전체화면 오버레이)
  const [showFocus, setShowFocus] = useState<boolean>(false)
  // 오디오북 듣기-보기 동기화: 지금 낭독 중인 절 (플레이어가 통지, VerseList가 표시)
  const [audioActiveVerse, setAudioActiveVerse] = useState<number | null>(null)
  // 오디오북이 실제 재생 중인지 — 멈추면 본문 자동 따라가기도 멈춘다
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false)
  // 절 메뉴 '여기부터 듣기' 요청 (VerseList → 플레이어). seq로 같은 절 재요청도 구분
  const [playFromVerse, setPlayFromVerse] = useState<PlayFromVerseRequest | null>(null)
  // PC(lg+) 해석 패널이 우측에 도킹 중인지 — 본문 컬럼을 왼쪽으로 비켜 나란히 보이게 한다
  const [commentaryOpen, setCommentaryOpen] = useState<boolean>(false)

  const { data: books, isLoading: booksLoading, error: booksError } = useBibleBooks()
  const { isLoggedIn } = useAuth()
  const { language } = useLanguage()

  // 나의 서재 카드 문구 — BookSelector와 같은 방식의 화면 내 ko/en 사전
  const dashTexts = {
    ko: {
      storyTitle: '처음 만나는 성경',
      storyProgress: (n: number) => `${n}화까지 읽었어요 · 이어서 보기`,
      storyIntro: '창조부터 새 창조까지, 3분씩 42편의 이야기',
      situationTitle: '상황별 성구',
      situationText: '두려울 때, 슬플 때… 지금 내 마음에 맞는 말씀',
      photoTitle: '말씀 사진 카드',
      photoText: '내 사진 위에 말씀을 담아 간직하고 나누기',
      favTitle: '즐겨찾기 구절 듣기',
      favCount: (n: number) => `즐겨찾기한 ${n}개 구절을 묵상 플레이리스트로`,
      favIntro: '마음에 닿는 절을 모아 자기 전에 다시 듣기',
      // 모바일 4열 타일용 짧은 문구
      tileStory: '3분씩 42편의 이야기',
      tileStoryProgress: (n: number) => `${n}화까지 읽음`,
      tileSituation: '두려울 때, 슬플 때…',
      tilePhoto: '말씀을 담아 나누기',
      tileFavTitle: '즐겨찾기 구절',
      tileFav: '마음에 담는 말씀',
      tileFavCount: (n: number) => `${n}개 구절 듣기`,
    },
    en: {
      storyTitle: 'Meeting the Bible',
      storyProgress: (n: number) => `Read up to episode ${n} · Continue`,
      storyIntro: 'From creation to new creation — 42 stories, 3 min each',
      situationTitle: 'Verses for Your Moment',
      situationText: 'When afraid, when sad… words that meet your heart now',
      photoTitle: 'Verse Photo Cards',
      photoText: 'Lay a verse over your photo to keep and share',
      favTitle: 'Listen to Favorites',
      favCount: (n: number) => `Turn your ${n} favorite verses into a playlist`,
      favIntro: 'Gather verses that touch you, listen before sleep',
      tileStory: '42 stories, 3 min each',
      tileStoryProgress: (n: number) => `Read to ep. ${n}`,
      tileSituation: 'When afraid, sad…',
      tilePhoto: 'Verse over your photo',
      tileFavTitle: 'Favorites',
      tileFav: 'Verses to keep',
      tileFavCount: (n: number) => `Listen to ${n} verses`,
    },
  }
  const dt = dashTexts[language]
  const { data: bookmarkStats } = useBookmarkStats()
  const favoritesCount = bookmarkStats?.favorites_count ?? 0
  // isPending까지 받는 이유: 요약 카드·최근 읽은 책이 데이터 도착 전엔 자리 없이 숨어 있다가
  // 늦게 나타나면 아래 목록이 밀려 새로고침처럼 보인다 — 로딩 동안 스켈레톤으로 자리를 잡는다.
  // 비로그인 시 쿼리가 disabled라 isPending이 영원히 true이므로 isLoggedIn()과 함께 판정해야 한다.
  const { data: resumeData, isPending: resumePending } = useResumeReading(20, isLoggedIn())
  const { data: progressData, isPending: progressPending } = useReadingProgress(isLoggedIn())

  const resumeMap = useMemo(() => {
    const map = new Map<number, ResumePosition>()
    // 목록은 최신순 — 같은 책이 중복으로 오면(구버전 백엔드 동점 버그) 첫 행(최신)을 유지
    resumeData?.recent_books?.forEach(p => {
      if (!map.has(p.book_number)) map.set(p.book_number, p)
    })
    return map
  }, [resumeData])

  // 최근 읽은 책 슬라이더용 — 전역 최신(이어 읽기 카드)은 제외한 "다른 책" 목록.
  // 구버전 백엔드는 장 벌크 읽음(동일 read_at) 시 같은 책을 여러 행으로 반환하므로
  // book_number 기준 첫 항목(최신)만 남긴다.
  const recentForSlider = useMemo(() => {
    const list = resumeData?.recent_books ?? []
    const latest = resumeData?.latest
    const seen = new Set<number>()
    return list.filter(p => {
      if (seen.has(p.book_number)) return false
      seen.add(p.book_number)
      return !(latest && p.book_number === latest.book_number && p.verse_id === latest.verse_id)
    })
  }, [resumeData])
  
  const selectedBookData = books?.find(b => b.id === selectedBookId)

  // 처음 만나는 성경(스토리 모드) 진행 — 라우트 이동으로 돌아올 때마다 새로 읽힌다
  const storyReadCount = loadReadIds().size
  
  // URL 파라미터로 책과 장이 전달된 경우 자동으로 선택.
  // ?verse=N 이 함께 오면(프로필 묵상노트 카드 등에서 딥링크) 해당 절로 스크롤+하이라이트.
  //
  // 검색 탭에서 현재 URL과 동일한 책·장을 클릭하면 경로 파라미터가 그대로라 이 effect가
  // 재실행되지 않아 읽기 화면 대신 책 목록이 뜨는 버그가 있었다. goToChapter가 navigate
  // state로 넘긴 타임스탬프(chapterNav)를 재진입 신호로 의존성에 추가하되, 탭 전환처럼
  // state 없는 내비게이션에는 반응하지 않도록 마지막 신호값을 ref로 유지한다.
  const verseParam = Number(searchParams.get('verse')) || 0
  const chapterNavSignal = (location.state as { chapterNav?: number } | null)?.chapterNav
  const lastChapterNavRef = useRef(0)
  if (chapterNavSignal) lastChapterNavRef.current = chapterNavSignal
  const chapterNav = lastChapterNavRef.current
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

        if (verseParam > 0) {
          // 절 스크롤은 본문 로드 후 VerseList가 수행
          setPendingScrollVerse(verseParam)
        } else if (navigationType !== 'POP') {
          // 페이지 상단으로 스크롤.
          // 뒤로가기(POP)는 ScrollRestoration이 이전 읽던 위치를 복원하므로 건드리지 않는다
          setTimeout(() => {
            // 실제 스크롤러가 window가 아니라 body라서 둘 다 스크롤한다
            window.scrollTo({ top: 0, behavior: 'smooth' })
            document.body.scrollTo({ top: 0, behavior: 'smooth' })
          }, 100)
        }
      }
    }
  }, [bookNumber, chapter, books, verseParam, chapterNav])
  
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
  // 즉시 완료의 기준은 "오늘 분량의 마지막 장"을 끝까지 읽는 순간이다.
  // 첫 장(chapter_start)에 걸면 여러 장 분량(예: 창 30-32)에서 30장만 읽어도
  // 완료되거나, 31→32장으로 넘어가 다 읽고도 완료가 안 되는 왜곡이 생긴다.
  const planLastPassage = planDay?.passages[planDay.passages.length - 1]
  const planLastChapter =
    planLastPassage?.chapter_end || planLastPassage?.chapter_start
  const isPlanLastChapter =
    !!planLastPassage &&
    selectedBookData?.book_number === planLastPassage.book_number &&
    selectedChapter === planLastChapter
  // 지금 보는 장이 오늘 분량(passages)에 속하는지 — 마지막 장이 아니어도
  // 그 장을 다 읽으면 서버 동기화를 트리거한다. 특히 분량이 두 권에 걸치는 날
  // (예: 창 49-50 + 출 1-2)은 장 이동이 책 경계를 못 넘어 마지막 장 훅만으로는
  // 완료가 누락되던 버그가 있었다.
  const planChapterInDay =
    !!planDay &&
    !!selectedBookData &&
    planDay.passages.some(
      (p) =>
        p.book_number === selectedBookData.book_number &&
        selectedChapter >= p.chapter_start &&
        selectedChapter <= (p.chapter_end || p.chapter_start)
    )
  const planAutoComplete =
    planId > 0 && planDayNumber > 0 && !!planDay && !planDay.completed && planChapterInDay

  const qc = useQueryClient()
  const handleChapterFullyRead = useCallback(async () => {
    if (!planAutoComplete) return
    if (isPlanLastChapter) {
      try {
        await completeDay.mutateAsync({ planId, dayNumber: planDayNumber })
      } catch (e) {
        // 자동 완료 실패는 조용히 무시 — 플랜 화면의 수동 체크로 대체 가능
        console.error('plan auto-complete failed', e)
      }
    } else {
      // 중간 장 완독 — 서버가 읽음 기록으로 일차 완료를 동기화(get_detail)하도록
      // 플랜 데이터를 새로고침한다. 모두 읽었으면 아래 감지 effect가 축하를 띄운다.
      qc.invalidateQueries({ queryKey: biblePlanKeys.detail(planId), refetchType: 'all' })
      qc.invalidateQueries({ queryKey: biblePlanKeys.today(), refetchType: 'all' })
    }
  }, [planAutoComplete, isPlanLastChapter, completeDay, planId, planDayNumber, qc])

  // 일차 완료(미완료 → 완료 전환)를 감지해 축하 연출 — 마지막 장 즉시 완료와
  // 서버 동기화 완료가 같은 경로로 정확히 한 번씩만 발동한다.
  const prevPlanDayRef = useRef<{ day: number; completed: boolean } | null>(null)
  useEffect(() => {
    if (planId <= 0 || !planDay) return
    const prev = prevPlanDayRef.current
    prevPlanDayRef.current = { day: planDay.day_number, completed: planDay.completed }
    if (prev && prev.day === planDay.day_number && !prev.completed && planDay.completed) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.7 },
        colors: ['#3182f6', '#4593fc', '#60a5fa', '#93c5fd'],
      })
      showToast(`오늘 분량 완료! ${planDay.day_number}일차를 마쳤어요 🎉`, 'success')
    }
  }, [planId, planDay])

  // 절 메뉴 '여기부터 듣기' — 현재 장 기준 요청을 만들어 플레이어에 전달
  const handleListenFromVerse = useCallback(
    (verse: number) => {
      if (!selectedBookData) return
      setPlayFromVerse(prev => ({
        book: selectedBookData.book_number,
        chapter: selectedChapter,
        verse,
        seq: (prev?.seq ?? 0) + 1,
      }))
    },
    [selectedBookData, selectedChapter]
  )

  const handleBookSelect = (bookId: number, bookName: string, resume?: ResumePosition) => {
    setSelectedBookId(bookId)
    setSelectedBook(bookName)
    setSelectedChapter(resume?.chapter ?? 1)
    setPendingScrollVerse(resume?.verse ?? null)
    setShowBookList(false)
    setPlayFromVerse(null)
    // 책 목록(특히 여정 보기)은 세로로 길어서, 아래쪽 책을 고르면 스크롤이 그 위치에
    // 남은 채 본문 화면이 열린다. URL 진입 effect는 state 전환에는 타지 않으므로 여기서 직접 올린다.
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
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
    setPlayFromVerse(null)
  }
  
  const handleChangeBook = () => {
    setShowBookList(true)
    setSelectedBookId(0)
    setSelectedBook('')
  }

  // 본문(장) 보기는 책 목록 위에 뜬 오버레이처럼 취급한다.
  // 모바일/브라우저 뒤로가기 시 메인으로 빠져나가는 대신 책 목록으로 돌아간다.
  // 단, 읽기 플랜(?plan=)에서 진입한 경우는 예외 — 뒤로가기가 플랜 상세로
  // 자연스럽게 돌아가야 하므로 가로채지 않는다.
  useModalBackButton(handleChangeBook, !showBookList && planId === 0)
  
  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter)
    setPendingScrollVerse(null)
    setPlayFromVerse(null)
    // 여러 스크롤 컨테이너를 모두 처리
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }
  
  // 성경 공부 도구 카드 묶음 — 모바일에선 서재 스택 안에, PC(lg+)에선 우측 사이드바에 렌더
  const dashToolCards = (
    <>
      {/* 처음 만나는 성경 — 초보자용 스토리 모드 */}
      <button
        type="button"
        onClick={() => navigate('/bible/story')}
        className="dash-card dash-card--fav"
      >
        <span className="dash-card__icon">
          <span className="material-icons-round">auto_stories</span>
        </span>
        <span className="dash-card__body">
          <span className="dash-card__title">{dt.storyTitle}</span>
          <span className="dash-card__text">
            {storyReadCount > 0 ? dt.storyProgress(storyReadCount) : dt.storyIntro}
          </span>
        </span>
        <span className="material-icons-round dash-card__chevron">chevron_right</span>
      </button>

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
          <span className="dash-card__title">{dt.situationTitle}</span>
          <span className="dash-card__text">{dt.situationText}</span>
        </span>
        <span className="material-icons-round dash-card__chevron">chevron_right</span>
      </button>

      {/* 말씀 사진 카드 — 내 사진 위에 말씀을 올려 저장·공유 */}
      <button
        type="button"
        onClick={() => navigate('/bible/photo-verse')}
        className="dash-card dash-card--fav"
      >
        <span className="dash-card__icon">
          <span className="material-icons-round">photo_filter</span>
        </span>
        <span className="dash-card__body">
          <span className="dash-card__title">{dt.photoTitle}</span>
          <span className="dash-card__text">{dt.photoText}</span>
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
            <span className="dash-card__title">{dt.favTitle}</span>
            <span className="dash-card__text">
              {favoritesCount > 0 ? dt.favCount(favoritesCount) : dt.favIntro}
            </span>
          </span>
          <span className="material-icons-round dash-card__chevron">chevron_right</span>
        </button>
      )}
    </>
  )

  // 모바일(lg 미만) — 4열 아이콘 타일 그리드. 세로 4줄 리스트보다 화면을 절반만 쓰고 "책 선택"이 위로 올라온다.
  // 아이콘 색은 기능 식별용 시맨틱(스토리=브랜드, 상황=그린, 사진=퍼플, 듣기=오렌지)
  const dashToolTiles = (
    <div className={`dash-tiles${isLoggedIn() ? '' : ' dash-tiles--3'}`}>
      <button type="button" onClick={() => navigate('/bible/story')} className="dash-tile">
        <span className="dash-tile__icon dash-tile__icon--brand">
          <span className="material-icons-round">auto_stories</span>
        </span>
        <span className="dash-tile__title">{dt.storyTitle}</span>
        <span className="dash-tile__text">
          {storyReadCount > 0 ? dt.tileStoryProgress(storyReadCount) : dt.tileStory}
        </span>
      </button>
      <button type="button" onClick={() => navigate('/bible/situation')} className="dash-tile">
        <span className="dash-tile__icon dash-tile__icon--green">
          <span className="material-icons-round">sentiment_satisfied_alt</span>
        </span>
        <span className="dash-tile__title">{dt.situationTitle}</span>
        <span className="dash-tile__text">{dt.tileSituation}</span>
      </button>
      <button type="button" onClick={() => navigate('/bible/photo-verse')} className="dash-tile">
        <span className="dash-tile__icon dash-tile__icon--purple">
          <span className="material-icons-round">photo_filter</span>
        </span>
        <span className="dash-tile__title">{dt.photoTitle}</span>
        <span className="dash-tile__text">{dt.tilePhoto}</span>
      </button>
      {isLoggedIn() && (
        <button type="button" onClick={() => setShowPlaylist(true)} className="dash-tile">
          <span className="dash-tile__icon dash-tile__icon--orange">
            <span className="material-icons-round">headphones</span>
          </span>
          <span className="dash-tile__title">{dt.tileFavTitle}</span>
          <span className="dash-tile__text">
            {favoritesCount > 0 ? dt.tileFavCount(favoritesCount) : dt.tileFav}
          </span>
          </button>
      )}
    </div>
  )

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark screen-fit-minus-header page-stage">
      {/* 하단 고정 네비게이션에 가리지 않도록 컨테이너에 바 높이만큼 하단 여백.
          lg+: 모바일 프레임(max-w-md)을 풀어 전체 폭 캔버스로 (홈과 동일 문법) */}
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark screen-fit-minus-header pb-bottomnav-safe lg:max-w-none lg:shadow-none lg:border-x-0 lg:bg-transparent dark:lg:bg-transparent lg:pb-16">
        {/* 모바일 헤더 — PC에선 각 뷰의 컬럼 안에서 렌더한다 */}
        <div className="lg:hidden">
          <BibleHeader tab={activeTab} />
        </div>

        {/* PC 전용 섹션 탭 — 모바일 하단 도크(BibleBottomNav)의 데스크톱 대응물 */}
        <BibleSectionTabs
          active={activeTab === 'search' ? 'search' : 'read'}
          onSelectTab={handleSelectTab}
        />

        {/* 읽기 탭 */}
        {activeTab === 'read' && (
          <div className="bible-read-section">
            {/* 책 목록(허브) — PC에선 메인 컬럼(이어 읽기+책 선택) 옆에 도구 사이드바 2컬럼.
                모바일에선 래퍼가 그냥 세로 스택이라 기존 순서 그대로다 */}
            {showBookList && (
              // 컨테이너 폭·레일 규격은 다른 안내 페이지(/news 등)와 통일(1240 / 312 / sticky).
              // 다만 본문 컬럼은 620px를 유지한다 — 통독표(.books-grid)가 3열 고정이라
              // 폭을 더 주면 도장 격자가 늘어져 종이 통독표 느낌이 깨진다.
              // 그래서 쌍(본문+레일)을 컨테이너 안에서 가운데 정렬한다.
              <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:justify-center lg:gap-6 lg:px-5">
                <div className="lg:w-full lg:max-w-[620px] lg:min-w-0">
                  <div className="hidden lg:block">
                    <BibleHeader tab="read" />
                  </div>

                  {/* 나의 서재 — 이어 읽기(강조) + 도구 카드(모바일 위치).
                      처음 만나는 성경은 비로그인 초심자에게도 보여야 하므로 로그인 여부와 무관하게 렌더 */}
                  <div className="bible-dash">
                    {resumeData?.latest && (
                      <ResumeReadingCard
                        latest={resumeData.latest}
                        onResume={handleResume}
                        bookNameEn={books?.find(b => b.book_number === resumeData.latest!.book_number)?.book_name_en}
                      />
                    )}
                    <div className="lg:hidden">{dashToolTiles}</div>
                  </div>

                  {/* 책 선택 */}
                  <BookSelector
                    books={books}
                    isLoading={booksLoading}
                    error={booksError}
                    onBookSelect={handleBookSelect}
                    resumeMap={resumeMap}
                    progress={progressData}
                    progressPending={isLoggedIn() && progressPending}
                    recentBooks={recentForSlider}
                    recentPending={isLoggedIn() && resumePending}
                  />
                </div>

                {/* PC 사이드바 — 성경 공부 도구 모음 */}
                {/* 스크롤해도 도구가 따라오도록 sticky — 다른 페이지 레일과 같은 top 값 */}
                <aside className="hidden lg:block lg:w-[312px] lg:shrink-0 lg:pt-7 lg:sticky lg:top-[4.5rem]">
                  <p className="px-1 mb-2 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
                    성경 공부 도구
                  </p>
                  <div className="space-y-2.5">{dashToolCards}</div>
                </aside>
              </div>
            )}

            {/* 장 선택 및 내용 — PC에선 편안한 읽기 폭(66ch대)으로 중앙 배치,
                해석 패널이 우측에 도킹되면 컬럼이 왼쪽으로 비켜 나란히 보인다 */}
            {!showBookList && selectedBookId > 0 && selectedBookData && (
              <div
                className={`bible-chapter-section${commentaryOpen ? ' commentary-docked' : ''}`}
              >
                <div className="bible-chapter-inner">
                {/* PC 좌측 장 개요 레일 — 단락 소제목 + 절 격자. 모바일에선 CSS로 숨김 */}
                <ChapterOutlineRail
                  bookNumber={selectedBookData.book_number}
                  bookNameKo={selectedBook}
                  bookNameEn={selectedBookData.book_name_en}
                  chapter={selectedChapter}
                  totalChapters={selectedBookData.chapter_count}
                  totalVerses={chapterData?.pages[0]?.total_verses}
                  onJumpToVerse={setPendingScrollVerse}
                  onChapterChange={handleChapterChange}
                />
                <div className="bible-chapter-column">
                <ChapterNavigation
                  selectedBook={selectedBook}
                  selectedBookId={selectedBookId}
                  bookNumber={selectedBookData.book_number}
                  selectedChapter={selectedChapter}
                  totalChapters={selectedBookData.chapter_count}
                  resumeChapter={resumeMap.get(selectedBookData.book_number)?.chapter}
                  onChapterChange={handleChapterChange}
                  onBackToBooks={handleChangeBook}
                  onOpenFocus={() => setShowFocus(true)}
                />

                {/* 오디오북 — 현재 장을 음성으로 듣기.
                    key로 리마운트하지 않는다: 연속 재생(장 끝 → 다음 장 자동 재생)이
                    같은 <audio> 요소를 재사용해야 모바일 자동재생 정책에 안 걸린다. */}
                <BibleAudioPlayer
                  bookNumber={selectedBookData.book_number}
                  chapter={selectedChapter}
                  bookId={selectedBookId}
                  onActiveVerseChange={setAudioActiveVerse}
                  onPlayingChange={setAudioPlaying}
                  playFromVerse={playFromVerse}
                  hasNextChapter={selectedChapter < selectedBookData.chapter_count}
                  onAutoNextChapter={() => handleChapterChange(selectedChapter + 1)}
                  totalChapters={selectedBookData.chapter_count}
                  bookName={selectedBook}
                />

                {/* 권 개관 — 한 줄 진입 바. 실제 소개는 탭하면 열리는 읽기 시트라
                    본문을 밀지 않는다. 그래서 1장뿐 아니라 모든 장에서 열 수 있다. */}
                <BookIntroCard
                  bookNumber={selectedBookData.book_number}
                  bookNameKo={selectedBook}
                  totalChapters={selectedBookData.chapter_count}
                  currentChapter={selectedChapter}
                  onJumpToChapter={handleChapterChange}
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
                  audioActiveVerse={audioActiveVerse}
                  audioPlaying={audioPlaying}
                  onListenFromVerse={handleListenFromVerse}
                  onChapterFullyRead={planAutoComplete ? handleChapterFullyRead : undefined}
                  onCommentaryOpenChange={setCommentaryOpen}
                />
                </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 검색 탭 — PC에선 본문 + 우측 레일 2단 (레일은 BibleSearch 안에서 렌더한다) */}
        {activeTab === 'search' && (
          <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5">
            <div className="hidden lg:block">
              <BibleHeader tab="search" />
            </div>
            <BibleSearch />
          </div>
        )}
      </div>

      {/* 즐겨찾기 묵상 플레이리스트 모달 */}
      {showPlaylist && <FavoritesPlaylistModal onClose={() => setShowPlaylist(false)} />}

      {/* 집중 읽기 — 한 화면 한 절 몰입 오버레이. 장 이동은 기존 handleChapterChange를
          그대로 태워 아래 깔린 본문·오디오 플레이어와 장 상태가 어긋나지 않는다 */}
      {showFocus && !showBookList && selectedBookId > 0 && selectedBookData && (
        <FocusReading
          bookId={selectedBookId}
          bookNumber={selectedBookData.book_number}
          bookName={selectedBook}
          chapter={selectedChapter}
          totalChapters={selectedBookData.chapter_count}
          onChapterChange={handleChapterChange}
          onClose={() => setShowFocus(false)}
        />
      )}

      {/* 성경 섹션 하단 네비게이션 — 읽기/검색은 탭 전환, 플랜/가계도는 라우팅 */}
      <BibleBottomNav active={activeTab} onSelectTab={handleSelectTab} />
    </div>
  )
}

export default BibleStudy