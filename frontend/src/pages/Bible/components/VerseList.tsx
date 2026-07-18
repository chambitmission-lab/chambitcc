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
import { useChapterWordNotes, groupWordNotesByVerse } from '../../../hooks/useBibleWordNote'

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
  // 오디오북이 지금 낭독 중인 절 — 하이라이트 + 자동 스크롤 따라가기
  audioActiveVerse?: number | null
  // 절 메뉴 '여기부터 듣기' — 오디오북을 해당 절부터 재생
  onListenFromVerse?: (verse: number) => void
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
  audioActiveVerse,
  onListenFromVerse,
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

  // 이 장의 내 단어 노트 전체 (절마다 개별 요청하지 않도록 배치 조회)
  const { data: chapterWordNotes } = useChapterWordNotes(
    bookNumber,
    selectedChapter,
    isLoggedIn(),
  )
  const wordNotesByVerse = useMemo(
    () => groupWordNotesByVerse(chapterWordNotes),
    [chapterWordNotes],
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
  
  // 절 스크롤은 브라우저 smooth scrollIntoView를 쓰지 않고 rAF로 직접 애니메이션한다.
  // smooth scrollIntoView는 모바일 브라우저에서 소리 없이 실패하는 일이 잦아
  // "어떤 절은 안 움직이다가 다음 절에서 훅 점프"하는 증상을 만들었다.
  // 매 프레임 남은 거리의 일정 비율만큼 움직이는 방식(지수 감속)이라 항상 부드럽고,
  // 목표 지점을 프레임마다 다시 재기 때문에 도중 레이아웃 변화에도 안전하다.
  const scrollAnimRef = useRef<number | null>(null)
  const cancelVerseScroll = useCallback(() => {
    if (scrollAnimRef.current != null) {
      cancelAnimationFrame(scrollAnimRef.current)
      scrollAnimRef.current = null
    }
  }, [])
  useEffect(() => () => cancelVerseScroll(), [cancelVerseScroll])

  const scrollVerseIntoView = useCallback(
    (el: HTMLElement, block: ScrollLogicalPosition = 'center') => {
      cancelVerseScroll()
      // 실제 스크롤 컨테이너가 기기/브라우저에 따라 갈린다(이 앱은 html/body
      // overflow-x:hidden + height:100% 구조라 body가 스크롤러인 환경이 있음).
      // 1px 나눠보기로 실제 스크롤되는 쪽을 먼저 확정한다.
      const candidates = Array.from(
        new Set(
          [
            document.scrollingElement as HTMLElement | null,
            document.body,
            document.documentElement,
          ].filter((c): c is HTMLElement => c != null)
        )
      )
      let scroller: HTMLElement | null = null
      for (const c of candidates) {
        const before = c.scrollTop
        c.scrollTop = before + 1
        if (c.scrollTop !== before) {
          c.scrollTop = before
          scroller = c
          break
        }
        c.scrollTop = before - 1
        if (c.scrollTop !== before) {
          c.scrollTop = before
          scroller = c
          break
        }
      }
      if (!scroller) return // 스크롤 자체가 불가능한 상태

      // 목표 위치: 상단 정렬은 고정 헤더+미니 플레이어 아래(112px), 중앙 정렬은
      // 뷰포트 중앙(단, 헤더 아래로는 안 올라가게)
      const viewportTarget =
        block === 'start'
          ? 112
          : Math.max(112, (window.innerHeight - el.clientHeight) / 2)
      // 시작 시 한 번만 측정해 목표 scrollTop을 확정하고, 이후엔 경과 시간만으로
      // 절대 위치를 계산한다(easeOutCubic 고정 곡선). 매 프레임 요소 위치를
      // 재측정하는 피드백 방식은 강제 레이아웃 + dt 널뜀으로 이동량이 프레임마다
      // 들쭉날쭉해져 모바일에서 드득거리는 스크롤이 됐다. 절대 곡선은 프레임이
      // 떨어져도 곡선 위 제 위치로 건너뛰므로 항상 고르게 보인다.
      const startTop = scroller.scrollTop
      const dist = el.getBoundingClientRect().top - viewportTarget
      if (Math.abs(dist) < 2) return // 이미 제자리
      const maxTop = scroller.scrollHeight - scroller.clientHeight
      const endTop = Math.max(0, Math.min(startTop + dist, maxTop))
      // 거리에 비례하되 240~550ms로 클램프 — 한 절 이동은 ~0.3초, 먼 복귀도 과하지 않게
      const duration = Math.max(240, Math.min(200 + Math.abs(endTop - startTop) * 0.35, 550))
      const t0 = performance.now()
      const target = scroller
      const step = (now: number) => {
        scrollAnimRef.current = null
        const p = Math.min(1, (now - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        target.scrollTop = startTop + (endTop - startTop) * eased
        if (p < 1) scrollAnimRef.current = requestAnimationFrame(step)
      }
      scrollAnimRef.current = requestAnimationFrame(step)
    },
    [cancelVerseScroll]
  )

  // 이어 읽기: 지정된 절로 자동 스크롤 + 일시적 하이라이트.
  // 무한 스크롤 페이지가 새로 로드될 때마다 DOM 존재 여부를 재확인하고,
  // 없으면 자동으로 다음 페이지를 미리 받는다.
  useEffect(() => {
    if (!scrollToVerse || !chapterData) return
    const el = document.getElementById(`bible-verse-${scrollToVerse}`)
    if (el) {
      scrollVerseIntoView(el)
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
  }, [scrollToVerse, chapterData, hasNextPage, isFetchingNextPage, fetchNextPage, onScrolled, scrollVerseIntoView])

  // ---------- 오디오북 듣기-보기 동기화 ----------
  // 낭독 절을 자동으로 따라간다. 정렬은 화면 중앙이 아니라 항상 "맨 위"
  // (고정 헤더 아래) — 절이 바뀔 때마다 화면이 절 높이만큼 아래로만 착착
  // 이동해 텔레프롬프터처럼 안정적이고, 다음 절들이 항상 화면에 보인다.
  // 사용자가 직접 스크롤하면 잠시 멈추고 pill을 띄우며, pill 탭 또는
  // 마지막 조작 6초 후 자동으로 다시 따라간다.
  const [audioFollow, setAudioFollow] = useState(true)
  const audioFollowRef = useRef(audioFollow)
  audioFollowRef.current = audioFollow
  const audioSyncActive = audioActiveVerse != null

  // 낭독 절이 바뀌면: 따라가기 중이면 맨 위로 스크롤.
  // 아직 로드 안 된 절(무한 스크롤 뒷페이지)이면 다음 페이지를 미리 받는다.
  useEffect(() => {
    if (audioActiveVerse == null) {
      setAudioFollow(true) // 다음 재생을 위해 초기화
      return
    }
    if (!chapterData) return
    const el = document.getElementById(`bible-verse-${audioActiveVerse}`)
    if (el) {
      if (audioFollowRef.current) scrollVerseIntoView(el, 'start')
    } else if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [audioActiveVerse, chapterData, hasNextPage, isFetchingNextPage, fetchNextPage, scrollVerseIntoView])

  const followResumeTimerRef = useRef<number | null>(null)
  const resumeAudioFollow = () => {
    if (followResumeTimerRef.current) {
      clearTimeout(followResumeTimerRef.current)
      followResumeTimerRef.current = null
    }
    setAudioFollow(true)
    if (audioActiveVerse != null) {
      const el = document.getElementById(`bible-verse-${audioActiveVerse}`)
      if (el) scrollVerseIntoView(el, 'start')
    }
  }
  // 자동 재개 타이머에서 항상 최신 상태(현재 낭독 절)를 보도록 ref로 보관
  const resumeAudioFollowRef = useRef(resumeAudioFollow)
  resumeAudioFollowRef.current = resumeAudioFollow

  // 낭독 중 사용자가 직접 스크롤(휠/터치)하면 따라가기를 잠시 멈춘다.
  // - 모바일은 화면에 손가락이 스치기만 해도 touchmove가 오므로, 12px 이상
  //   실제로 드래그했을 때만 '직접 스크롤'로 간주한다 (탭 떨림 방어).
  // - 멈춘 따라가기는 마지막 조작 후 6초가 지나면 현재 낭독 절로 자동 복귀한다.
  // scrollIntoView가 만드는 scroll 이벤트는 wheel/touchmove를 발생시키지 않아 안전.
  useEffect(() => {
    if (!audioSyncActive) return
    let touchStartY: number | null = null
    const pauseFollow = () => {
      cancelVerseScroll() // 진행 중인 자동 스크롤이 손가락과 싸우지 않게 즉시 중단
      setAudioFollow(false)
      if (followResumeTimerRef.current) clearTimeout(followResumeTimerRef.current)
      followResumeTimerRef.current = window.setTimeout(() => {
        followResumeTimerRef.current = null
        resumeAudioFollowRef.current()
      }, 6000)
    }
    const onWheel = () => pauseFollow()
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (touchStartY == null || y == null) return
      if (Math.abs(y - touchStartY) > 12) pauseFollow()
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      if (followResumeTimerRef.current) {
        clearTimeout(followResumeTimerRef.current)
        followResumeTimerRef.current = null
      }
    }
  }, [audioSyncActive, cancelVerseScroll])

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
                  onListenFrom={onListenFromVerse ? (v) => onListenFromVerse(v.verse) : undefined}
                  hasCommentary={verseHasCommentaryMap.has(verse.verse)}
                  isAudioActive={verse.verse === audioActiveVerse}
                  actionsOpen={openVerseId === verse.id}
                  onActionsOpenChange={(open) => setOpenVerseId(open ? verse.id : null)}
                  wordNotes={wordNotesByVerse.get(verse.id)}
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

      {/* 낭독 따라가기 재개 — 듣던 중 직접 스크롤해 따라가기가 꺼졌을 때만 */}
      {audioSyncActive && !audioFollow && (
        <button
          onClick={resumeAudioFollow}
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '5.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--brand)',
            color: 'white',
            fontSize: '0.8125rem',
            fontWeight: 700,
            boxShadow: '0 6px 18px var(--brand-glow)',
            cursor: 'pointer',
            zIndex: 50,
            whiteSpace: 'nowrap',
          }}
        >
          <span className="material-icons-round" style={{ fontSize: '1rem' }}>
            my_location
          </span>
          {audioActiveVerse}절 낭독 중
        </button>
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
