import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse, BibleVerse } from '../../../types/bible'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../hooks/useAuth'
import VerseItem from './VerseItem'
import ChapterLoader from './ChapterLoader'
import { useChapterReadStatus, useMarkVerseAsRead, useUnmarkVerseAsRead, useMarkChapterAsRead, useUnmarkChapterAsRead } from '../../../hooks/useBibleReading'
import { isAdmin } from '../../../utils/auth'
import { biblePlanKeys } from '../../../hooks/useBiblePlan'
import { celebrateFlowerBloom } from '../../../utils/confettiEffects'
import VerseEditModal from '../../../components/bible/VerseEditModal'
import BibleCommentaryPanel from '../../../components/bible/BibleCommentaryPanel'
import { showToast } from '../../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'
import { useOptimisticUpdateVerse } from '../../../hooks/useBibleAdmin'
import { useChapterCommentaries } from '../../../hooks/useBibleCommentary'
import { useChapterWordNotes, groupWordNotesByVerse } from '../../../hooks/useBibleWordNote'
import { useChapterBookmarks } from '../../../hooks/useBibleBookmark'
import type { VerseBookmark } from '../../../api/bibleBookmark'
import type { VerseCopyTarget } from './verseCopy'
import VerseSelectionBar from './VerseSelectionBar'
import { useVerseScroll } from '../hooks/useVerseScroll'
import { useAudioFollow } from '../hooks/useAudioFollow'
import VerseShareSheet from './VerseShareSheet'

/** 절 번호 길게 누르기 안내를 이미 본 적 있는지 (한 번 보면 다시 안 뜬다) */
const HOLD_HINT_KEY = 'bible_hold_read_hint_v1'

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
  // 오디오북이 실제 재생 중인지. 일시정지하면 하이라이트는 남기되 따라가기는 멈춘다
  audioPlaying?: boolean
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
  audioPlaying = false,
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
  // 여러 절 선택 — 액션바의 '여러 절' 버튼으로 진입, 탭으로 절을 담고 하단 바에서 복사/공유
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  // 공유 시트 — 단일 절(VerseItem)과 여러 절 선택 바가 같은 시트 하나를 공유한다.
  // 절마다 시트를 두면 여러 개가 겹쳐 뜨고 뒤로가기 스택도 꼬인다.
  const [shareTarget, setShareTarget] = useState<VerseCopyTarget | null>(null)
  // '절 번호 꾹 눌러 읽음 표시' 안내 — 처음 한 번만. 제스처는 눈에 보이지 않아
  // 알려주지 않으면 아무도 쓰지 않는다. 한 번 써 보면 자동으로 사라진다.
  const [showHoldHint, setShowHoldHint] = useState(() => {
    try {
      return localStorage.getItem(HOLD_HINT_KEY) !== 'done'
    } catch {
      return false
    }
  })
  const dismissHoldHint = useCallback(() => {
    setShowHoldHint(false)
    try {
      localStorage.setItem(HOLD_HINT_KEY, 'done')
    } catch {
      // 사파리 프라이빗 모드 등 저장 불가 — 안내만 닫고 넘어간다
    }
  }, [])
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

  // 이 장의 내 북마크 전체 (절마다 개별 요청하던 N+1 제거 — 단어 노트와 동일 패턴).
  // 데이터가 아직 없으면(로딩/백엔드 미배포) null 대신 undefined를 내려보내
  // VerseItem이 기존 절별 조회로 폴백하게 한다.
  const { data: chapterBookmarks } = useChapterBookmarks(
    bookNumber,
    selectedChapter,
    isLoggedIn(),
  )
  const bookmarksByVerse = useMemo(() => {
    if (!chapterBookmarks) return null
    const map = new Map<number, VerseBookmark>()
    for (const b of chapterBookmarks) map.set(b.verse_id, b)
    return map
  }, [chapterBookmarks])

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

  // VerseItem은 memo라 여기서 내려보내는 콜백은 전부 useCallback으로 안정화한다.
  // 절별 인라인 클로저를 만들면 memo가 무력화돼 상태 변화마다 전 절이 재렌더된다.
  const handleShowCommentary = useCallback((verse: BibleVerse) => {
    setCommentaryFocusVerse(verse.verse)
    setCommentaryPanelOpen(true)
  }, [])

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
  // 읽음 취소 Mutation (수동 처리용)
  const unmarkAsReadMutation = useUnmarkVerseAsRead()
  // 수동 읽음 처리 중인 절 — 중복 클릭 방지
  const [togglingVerseId, setTogglingVerseId] = useState<number | null>(null)

  // ---------- 관리자 전용: 장 일괄 읽음/취소 (업적 테스트용, 본인 계정) ----------
  const isAdminUser = isAdmin()
  const markChapterMutation = useMarkChapterAsRead()
  const unmarkChapterMutation = useUnmarkChapterAsRead()
  // 실수 방지 2탭 확인 — 한 번 탭하면 확인 문구로 바뀌고 3초 내 재탭 시 실행
  const [bulkConfirm, setBulkConfirm] = useState<'mark' | 'unmark' | null>(null)
  const bulkConfirmTimer = useRef<number | null>(null)
  const bulkPending = markChapterMutation.isPending || unmarkChapterMutation.isPending

  useEffect(() => {
    setBulkConfirm(null)
    return () => {
      if (bulkConfirmTimer.current) window.clearTimeout(bulkConfirmTimer.current)
    }
  }, [bookNumber, selectedChapter])

  const handleAdminBulkTap = async (action: 'mark' | 'unmark') => {
    if (bulkPending) return
    if (bulkConfirm !== action) {
      setBulkConfirm(action)
      if (bulkConfirmTimer.current) window.clearTimeout(bulkConfirmTimer.current)
      bulkConfirmTimer.current = window.setTimeout(() => setBulkConfirm(null), 3000)
      return
    }
    if (bulkConfirmTimer.current) window.clearTimeout(bulkConfirmTimer.current)
    setBulkConfirm(null)
    try {
      if (action === 'mark') {
        const res = await markChapterMutation.mutateAsync({ bookNumber, chapter: selectedChapter })
        celebrateFlowerBloom()
        showToast(`${res.marked_verses}개 절을 읽음 처리했습니다`, 'success')
      } else {
        const res = await unmarkChapterMutation.mutateAsync({ bookNumber, chapter: selectedChapter })
        showToast(`${res.deleted_records}개 읽음 기록을 취소했습니다`, 'info')
      }
      await refetchReadStatus()
    } catch (error) {
      console.error('Failed to bulk toggle chapter read:', error)
      showToast(
        action === 'mark' ? '장 전체 읽음 처리에 실패했습니다' : '장 전체 읽음 취소에 실패했습니다',
        'error'
      )
    }
  }

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
  // (mutateAsync/refetch는 React Query가 참조를 보장하므로 deps에 넣어도 안정적)
  const handleReadSuccess = useCallback(async (verseId: number, similarity: number) => {
    try {
      // 백엔드 API 호출
      await markAsReadMutation.mutateAsync({ verseId, similarity })

      // 꽃 피어남 축하 효과
      celebrateFlowerBloom()

      // 명시적으로 읽음 상태 다시 조회
      await refetchReadStatus()
    } catch (error) {
      // 이미 읽음 처리된 경우는 에러로 처리하지 않음
      if (error instanceof Error && error.message === 'ALREADY_READ') {
        console.log('Verse already marked as read, refreshing status...')
        await refetchReadStatus()
      } else {
        console.error('Failed to save reading record:', error)
      }
    }
  }, [markAsReadMutation.mutateAsync, refetchReadStatus])

  // 수동 읽음 처리/취소 — 음성 낭독 없이 상태만 바꾼다. 로그인한 사용자면 누구나.
  // similarity는 수동 처리임을 뜻하는 1.0으로 보낸다(백엔드 최소 임계값 0.75 충족).
  // 중복 클릭 가드는 ref로 — togglingVerseId(state)를 읽으면 콜백 참조가 흔들린다.
  const togglingGuardRef = useRef(false)
  const handleToggleRead = useCallback(async (verse: BibleVerse, nextRead: boolean) => {
    if (togglingGuardRef.current) return
    togglingGuardRef.current = true
    setTogglingVerseId(verse.id)
    try {
      if (nextRead) {
        await markAsReadMutation.mutateAsync({ verseId: verse.id, similarity: 1 })
        showToast(`${verse.verse}절을 읽음 처리했습니다`, 'success')
        // 한 번 해봤으면 안내는 역할을 다했다
        dismissHoldHint()
      } else {
        await unmarkAsReadMutation.mutateAsync(verse.id)
        showToast(`${verse.verse}절 읽음을 취소했습니다`, 'info')
      }
      await refetchReadStatus()
    } catch (error) {
      // 이미 읽음 상태면 화면만 동기화하면 된다
      if (error instanceof Error && error.message === 'ALREADY_READ') {
        await refetchReadStatus()
      } else {
        console.error('Failed to toggle read state:', error)
        showToast(nextRead ? '읽음 처리에 실패했습니다' : '읽음 취소에 실패했습니다', 'error')
      }
    } finally {
      togglingGuardRef.current = false
      setTogglingVerseId(null)
    }
  }, [markAsReadMutation.mutateAsync, unmarkAsReadMutation.mutateAsync, refetchReadStatus, dismissHoldHint])

  // 구절 수정 핸들러 (관리자용)
  const handleEditVerse = useCallback((verse: BibleVerse) => {
    setEditingVerse(verse)
  }, [])
  
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

  // 해석 패널이 해석 위에 실제 말씀을 띄울 수 있게 절 번호 → 본문 맵을 넘긴다
  const verseTextMap = useMemo(() => {
    const map = new Map<number, string>()
    chapterData?.pages.forEach((page) => {
      page.verses.forEach((v) => map.set(v.verse, v.text))
    })
    return map
  }, [chapterData])

  // ---------- 여러 절 선택 ----------
  const bookNameKo = chapterData?.pages[0]?.book_name_ko ?? ''

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // 선택된 절을 절 번호 순으로 — 탭한 순서가 아니라 본문 순서로 복사돼야 한다
  const selectedVerses = useMemo(() => {
    if (!selectedIds.length || !chapterData) return []
    const picked: BibleVerse[] = []
    chapterData.pages.forEach((page) => {
      page.verses.forEach((v) => {
        if (selectedIdSet.has(v.id)) picked.push(v)
      })
    })
    return picked.sort((a, b) => a.verse - b.verse)
  }, [selectedIds, selectedIdSet, chapterData])

  const selectionTarget: VerseCopyTarget = {
    bookNameKo,
    bookNumber,
    chapter: selectedChapter,
    verses: selectedVerses.map((v) => ({ verse: v.verse, text: v.text })),
  }

  // 선택 구간에 빈 절이 있는지 (16, 19만 골랐다면 17·18) — 있으면 '구간 채우기' 제안
  const selectionGapCount = useMemo(() => {
    if (selectedVerses.length < 2) return 0
    const span = selectedVerses[selectedVerses.length - 1].verse - selectedVerses[0].verse + 1
    return span - selectedVerses.length
  }, [selectedVerses])

  const enterSelection = useCallback((verse: BibleVerse) => {
    setOpenVerseId(null)
    setSelectedIds([verse.id])
    setSelectionMode(true)
  }, [])

  const toggleSelect = useCallback((verseId: number) => {
    setSelectedIds((prev) =>
      prev.includes(verseId) ? prev.filter((id) => id !== verseId) : [...prev, verseId]
    )
  }, [])

  // 절 메뉴 열림/닫힘 — verseId를 인자로 받아 절별 클로저 없이 하나의 콜백을 공유한다
  const handleActionsOpenChange = useCallback((verseId: number, open: boolean) => {
    setOpenVerseId(open ? verseId : null)
  }, [])

  // '여기부터 듣기' — BibleVerse → 절 번호로 변환해 상위 오디오 플레이어에 전달
  const handleListenFrom = useCallback((v: BibleVerse) => {
    onListenFromVerse?.(v.verse)
  }, [onListenFromVerse])

  const exitSelection = () => {
    setSelectionMode(false)
    setSelectedIds([])
  }

  // 선택된 첫 절~끝 절 사이의 빠진 절을 모두 채운다
  const fillSelectionGap = () => {
    if (selectedVerses.length < 2 || !chapterData) return
    const from = selectedVerses[0].verse
    const to = selectedVerses[selectedVerses.length - 1].verse
    const ids: number[] = []
    chapterData.pages.forEach((page) => {
      page.verses.forEach((v) => {
        if (v.verse >= from && v.verse <= to) ids.push(v.id)
      })
    })
    setSelectedIds(ids)
  }

  // 장이 바뀌면 선택은 초기화 (다른 장의 절이 섞여 복사되지 않도록)
  useEffect(() => {
    setSelectionMode(false)
    setSelectedIds([])
  }, [bookNumber, selectedChapter])

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

  // 플랜 화면을 거치지 않은 자유 읽기로 이 장을 "방금" 다 읽었을 때 —
  // 이 장이 속한 플랜 일차를 서버가 완료 동기화(get_today/get_detail)할 수 있도록
  // 플랜 캐시를 무효화한다. 전역이 캐시 우선(refetchOnMount:false)이라 이렇게
  // 밀어주지 않으면 홈 카드가 재로그인 전까지 옛 상태로 남는다.
  // 이미 다 읽힌 장을 단순히 다시 열람한 경우(전환 없음)에는 발동하지 않는다.
  const wasFullyReadRef = useRef<boolean | null>(null)
  useEffect(() => {
    wasFullyReadRef.current = null
  }, [bookNumber, selectedChapter])
  useEffect(() => {
    if (!readStatusData) return
    const total = readStatusData.total_verses ?? 0
    const full = total > 0 && (readStatusData.read_verses ?? 0) >= total
    const prev = wasFullyReadRef.current
    wasFullyReadRef.current = full
    if (prev === false && full) {
      queryClient.invalidateQueries({ queryKey: biblePlanKeys.all, refetchType: 'all' })
    }
  }, [readStatusData, queryClient])


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
  
  // 절 스크롤 엔진(스크롤러 탐지 + rAF 애니메이션)은 useVerseScroll 로 분리했다.
  const { scrollVerseIntoView, cancelVerseScroll } = useVerseScroll()

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
  // 하단 앵커 따라가기, 직접 스크롤 시 일시 정지, 6초 자동 복귀는 useAudioFollow 로 분리했다.
  const { audioFollow, audioSyncActive, resumeAudioFollow } = useAudioFollow({
    audioActiveVerse,
    audioPlaying,
    chapterData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollVerseIntoView,
    cancelVerseScroll,
  })

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

      {/* 관리자 전용: 장 일괄 읽음/취소 — 업적·칭호 테스트용, 본인 계정에만 적용 */}
      {isAdminUser && isLoggedIn() && readStatusData && (() => {
        const total = readStatusData.total_verses ?? 0
        const unread = Math.max(0, total - (readStatusData.read_verses ?? 0))
        const action: 'mark' | 'unmark' = unread > 0 ? 'mark' : 'unmark'
        const confirming = bulkConfirm === action
        const label = bulkPending
          ? '처리 중...'
          : confirming
            ? (action === 'mark' ? `한 번 더 탭하면 ${unread}개 절 읽음 처리` : '한 번 더 탭하면 전체 취소')
            : (action === 'mark' ? `이 장 전체 읽음 (미읽음 ${unread}절)` : '이 장 전체 읽음 취소')
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.5rem 0.375rem 0.625rem',
            marginBottom: '0.875rem',
            background: 'var(--ig-secondary-background)',
            border: '1px dashed var(--brand-soft-strong)',
            borderRadius: '999px',
            fontSize: '0.8125rem',
            maxWidth: '42rem',
            marginInline: 'auto',
          }}>
            <span style={{
              flexShrink: 0,
              padding: '0.125rem 0.5rem',
              borderRadius: '999px',
              background: 'var(--brand-soft)',
              color: 'var(--brand)',
              fontWeight: 800,
              fontSize: '0.6875rem',
              letterSpacing: '0.04em',
            }}>
              ADMIN
            </span>
            <button
              type="button"
              onClick={() => handleAdminBulkTap(action)}
              disabled={bulkPending}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '999px',
                border: 'none',
                background: confirming ? 'var(--brand)' : 'transparent',
                color: confirming ? 'white' : (action === 'mark' ? 'var(--brand)' : 'var(--ig-secondary-text)'),
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: bulkPending ? 'wait' : 'pointer',
                opacity: bulkPending ? 0.6 : 1,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span className="material-icons-round" style={{ fontSize: '1rem', flexShrink: 0 }}>
                {action === 'mark' ? 'done_all' : 'remove_done'}
              </span>
              {label}
            </button>
          </div>
        )
      })()}

      {/* 길게 누르기 안내 — 로그인 사용자에게 처음 한 번만 */}
      {showHoldHint && isLoggedIn() && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem 0.5rem 0.875rem',
            marginBottom: '0.875rem',
            background: 'var(--brand-soft)',
            border: '1px solid var(--brand-soft-strong)',
            borderRadius: '999px',
            fontSize: '0.8125rem',
            color: 'var(--ig-secondary-text)',
            maxWidth: '42rem',
            marginInline: 'auto',
          }}
        >
          <span className="material-icons-round" style={{ fontSize: '1.0625rem', color: 'var(--brand)', flexShrink: 0 }}>
            touch_app
          </span>
          <span style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--brand)', fontWeight: 700 }}>절 번호를 꾹 누르면</strong> 바로 읽음 표시돼요
          </span>
          <button
            type="button"
            onClick={dismissHoldHint}
            style={{
              flexShrink: 0,
              border: 'none',
              background: 'transparent',
              color: 'var(--ig-secondary-text)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              padding: '0.2rem 0.4rem',
            }}
          >
            확인
          </button>
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
                  bookNumber={bookNumber}
                  chapter={page.chapter}
                  isRead={readVerses.has(verse.id)}
                  onReadSuccess={handleReadSuccess}
                  onEdit={handleEditVerse}
                  onToggleRead={handleToggleRead}
                  isTogglingRead={togglingVerseId === verse.id}
                  onShowCommentary={handleShowCommentary}
                  onListenFrom={onListenFromVerse ? handleListenFrom : undefined}
                  hasCommentary={verseHasCommentaryMap.has(verse.verse)}
                  isAudioActive={verse.verse === audioActiveVerse}
                  actionsOpen={openVerseId === verse.id}
                  onActionsOpenChange={handleActionsOpenChange}
                  wordNotes={wordNotesByVerse.get(verse.id)}
                  chapterBookmark={bookmarksByVerse ? (bookmarksByVerse.get(verse.id) ?? null) : undefined}
                  selectionMode={selectionMode}
                  isSelected={selectedIdSet.has(verse.id)}
                  onToggleSelect={toggleSelect}
                  onEnterSelection={enterSelection}
                  onShare={setShareTarget}
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

      {/* 여러 절 선택 바 — 선택 중에만 하단에 떠서 개수/참조를 보여주고 복사·공유를 받는다 */}
      {selectionMode && (
        <VerseSelectionBar
          target={selectionTarget}
          gapCount={selectionGapCount}
          onFillGap={fillSelectionGap}
          onShare={setShareTarget}
          onExit={exitSelection}
        />
      )}

      {/* 낭독 따라가기 재개 — 듣던 중 직접 스크롤해 따라가기가 꺼졌을 때만 */}
      {audioSyncActive && !audioFollow && !selectionMode && (
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
      {(chapterCommentaries?.items?.length ?? 0) > 0 && !commentaryPanelOpen && !selectionMode && (
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

      {/* 공유 시트 — 보내기 전 미리보기 (텍스트/이미지 카드/링크) */}
      {shareTarget && (
        <VerseShareSheet target={shareTarget} onClose={() => setShareTarget(null)} />
      )}

      {/* 해석 패널 */}
      {commentaryPanelOpen && chapterData && chapterData.pages[0] && (
        <BibleCommentaryPanel
          bookNumber={bookNumber}
          chapter={selectedChapter}
          bookNameKo={chapterData.pages[0].book_name_ko}
          focusVerse={commentaryFocusVerse}
          totalVerses={chapterData.pages[0].total_verses}
          verseTexts={verseTextMap}
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
