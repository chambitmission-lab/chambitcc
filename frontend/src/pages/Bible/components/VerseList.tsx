// 장 본문 목록 — 절을 단락으로 묶어 그리고, 무한 스크롤·절 이동·선택 모드·해석 패널을 잇는다.
// 장 단위 데이터와 부속 화면은 각자 자기 파일에 있다:
//  - 읽음 상태(현황·완독·hold·절/장 읽음 처리)  → hooks/useChapterReadState
//  - 절별 부가 데이터(해석·단어장·북마크·묵상 수)   → hooks/useChapterVerseMeta
//  - 본문 색인(병합 구간·절 본문 맵)               → hooks/useChapterVerseIndex
//  - 함께 읽기(현황·하트비트)                      → hooks/useChapterTogether + together/ChapterTogether
//  - 낭독 따라가기                                  → AudioFollowLayer
//  - 수정 모달·공유 시트                            → verse/VerseListSheets
import { useEffect, useRef, useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse, BibleVerse } from '../../../types/bible'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../hooks/useAuth'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { prefetchAdjacentChapters } from '../../../hooks/useBible'
import { preloadBudget } from '../../../utils/idlePreload'
import { lazyModal } from '../../../utils/lazyModal'
import VerseItem from './VerseItem'
import { VerseListProvider } from './verse/VerseListProvider'
import VerseSheets from './verse/VerseSheets'
import VerseListSheets from './verse/VerseListSheets'
import type { VerseListActions, VerseListSettings } from './verse/VerseListContext'
import ChapterLoader from './ChapterLoader'
import ChapterSealStamp from './ChapterSealStamp'
import VerseSelectionBar from './VerseSelectionBar'
import AudioFollowLayer from './AudioFollowLayer'
import ChapterTogether from './together/ChapterTogether'
import type { VerseCopyTarget } from './verseCopy'
import { visibleVerses } from './mergedVerses'
import { buildFlowParagraphs, FLOW_FALLBACK_CHUNK, type FlowParagraph } from './flowParagraphs'
import { useVerseScroll } from '../hooks/useVerseScroll'
import { useReadingLine } from '../hooks/useReadingLine'
import { useChapterReadState } from '../hooks/useChapterReadState'
import { useChapterVerseIndex } from '../hooks/useChapterVerseIndex'
import { useChapterVerseMeta } from '../hooks/useChapterVerseMeta'
import { useChapterTogether } from '../hooks/useChapterTogether'
import { getReaderLayout, subscribeReaderLayout } from '../data/readerLayout'
import { isSectionHeadingsEnabled, subscribeSectionHeadings } from '../data/sectionHeadings'
import { loadBookOutline, peekBookOutline, type BookOutline } from '../data/chapterOutlines'
// 열 때만 받는 패널 — 읽기 화면 청크에서 분리
const BibleCommentaryPanel = lazyModal(() => import('../../../components/bible/BibleCommentaryPanel'))

/** 절 번호 길게 누르기 안내를 이미 본 적 있는지 (한 번 보면 다시 안 뜬다) */
const HOLD_HINT_KEY = 'bible_hold_read_hint_v1'
// 본문 그려진 뒤 이전·다음 장 선요청까지의 여유 — 이 장의 부가 요청과 경쟁하지 않게
const ADJACENT_PREFETCH_DELAY_MS = 1500

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
  // 해석 패널 열림/닫힘 통지 — PC(lg+)에서 부모가 본문 컬럼을 옆으로 비켜
  // 본문과 해석을 나란히 배치하는 데 쓴다
  onCommentaryOpenChange?: (open: boolean) => void
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
  onCommentaryOpenChange,
}: VerseListProps) => {
  const { language } = useLanguage()
  const { isLoggedIn } = useAuth()
  const loggedIn = isLoggedIn()
  const queryClient = useQueryClient()

  // ── 목록 수준 열림 상태 ──
  const [editingVerse, setEditingVerse] = useState<BibleVerse | null>(null)
  // 액션 메뉴는 한 번에 한 절만 열린다. 다른 절을 탭하면 자동으로 이전 메뉴가 닫혀
  // 여러 메뉴가 동시에 떠 본문을 가리는 일이 없다.
  const [openVerseId, setOpenVerseId] = useState<number | null>(null)
  const [commentaryFocusVerse, setCommentaryFocusVerse] = useState<number | null>(null)
  const [commentaryPanelOpen, setCommentaryPanelOpen] = useState(false)
  // 여러 절 선택 — 액션바의 '여러 절' 버튼으로 진입, 탭으로 절을 담고 하단 바에서 복사/공유
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  // 공유 시트 — 단일 절(VerseItem)과 여러 절 선택 바가 같은 시트 하나를 공유한다
  const [shareTarget, setShareTarget] = useState<VerseCopyTarget | null>(null)
  // 함께 읽기 묵상 시트 — 절 칩·액션 메뉴·실시간 배너가 모두 이 하나를 연다
  const [reflectionTarget, setReflectionTarget] = useState<BibleVerse | null>(null)
  const openReflections = useCallback((verse: BibleVerse) => setReflectionTarget(verse), [])
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

  // 사전 칩·단어장·묵상 노트 시트는 lazy 청크라 첫 탭이 네트워크 왕복만큼 늦게 열렸다.
  // 본문이 그려진 뒤 브라우저가 한가할 때 미리 받아둔다 (배포 직후 해시가 바뀐 경우 포함).
  // 해석 패널도 함께 — "해석" 버튼은 해석이 없는 장의 절에도 떠 있어서, 안 받아 두면
  // 첫 탭이 Suspense 폴백 스로틀(300ms)을 탄다. 해석 있는 장은 아래에서 더 일찍 받는다.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const run = () => {
      void VerseSheets.preload()
      void BibleCommentaryPanel.preload()
    }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 2500 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(run, 1200)
    return () => window.clearTimeout(id)
  }, [])

  // ── 본문 보기(절별/이어읽기)·단락 ──
  // Aa 읽기 설정에서 바꾸면 열린 본문에 즉시 반영
  const layout = useSyncExternalStore(subscribeReaderLayout, getReaderLayout)
  const isFlow = layout === 'flow'
  // 단락 소제목 표시 여부 — 끄면 본문 중간의 소제목만 감추고 단락 나누기는 그대로 둔다
  const showHeadings = useSyncExternalStore(subscribeSectionHeadings, isSectionHeadingsEnabled)
  // 단락 나누기용 장 개요(책별 lazy). 캐시된 책은 동기로 꺼내 깜빡임을 피한다.
  // 이어읽기는 문단으로, 절별 보기는 단락 첫 절 앞 소제목으로 쓴다 — PC 레일의 "이 장의 흐름"이
  // 모바일에선 숨겨지므로(1024px 미만 display:none) 본문 안에서 같은 흐름을 보여준다.
  const [bookOutline, setBookOutline] = useState<BookOutline | null>(() => peekBookOutline(bookNumber))
  useEffect(() => {
    const cached = peekBookOutline(bookNumber)
    if (cached) {
      setBookOutline(cached)
      return
    }
    let alive = true
    loadBookOutline(bookNumber).then((o) => {
      if (alive) setBookOutline(o)
    })
    return () => {
      alive = false
    }
  }, [bookNumber])
  const flowParagraphs = useMemo<FlowParagraph[]>(() => {
    if (!chapterData) return []
    // 병합 구간의 자리표시자 절(신 6:19)은 그리지 않는다 — 앞 절이 '18-19'로 품는다
    const verses = visibleVerses(chapterData.pages.flatMap((page) => page.verses))
    const outline = bookOutline ?? peekBookOutline(bookNumber)
    return buildFlowParagraphs(verses, outline?.[selectedChapter] ?? [], isFlow ? FLOW_FALLBACK_CHUNK : 0)
  }, [isFlow, chapterData, bookOutline, bookNumber, selectedChapter])

  // ── 장 단위 데이터 ──
  const index = useChapterVerseIndex(chapterData)
  const meta = useChapterVerseMeta(bookNumber, selectedChapter, loggedIn)
  const read = useChapterReadState({
    bookNumber,
    chapter: selectedChapter,
    chapterData,
    chapterLoading: isLoading,
    mergedMemberIds: index.mergedMemberIds,
    onChapterFullyRead,
    onManualReadDone: dismissHoldHint,
  })
  const { bodyRendered } = read

  // ── 해석 패널 ──
  useEffect(() => {
    if (meta.hasCommentaries) void BibleCommentaryPanel.preload()
  }, [meta.hasCommentaries])

  // VerseItem은 memo라 여기서 내려보내는 콜백은 전부 useCallback으로 안정화한다.
  // 절별 인라인 클로저를 만들면 memo가 무력화돼 상태 변화마다 전 절이 재렌더된다.
  const handleShowCommentary = useCallback((verse: BibleVerse) => {
    setCommentaryFocusVerse(verse.verse)
    setCommentaryPanelOpen(true)
  }, [])

  const handleShowChapterCommentaries = () => {
    setCommentaryFocusVerse(null)
    setCommentaryFollowFrom(`${bookNumber}:${selectedChapter}`)
    setCommentaryPanelOpen(true)
  }

  // 해석 패널 따라가기 (PC 도킹 · 장 전체 해석일 때만)
  // 본문을 18절까지 내리면 패널도 18절을 덮는 해석으로 옮겨 간다. 모바일은 패널이 본문을
  // 덮는 모달이라 해당 없음. 패널을 연 장에선 이전 장 DOM이 남아 있지 않으니 워밍업 없이
  // 바로 재고, 패널을 연 채 장을 넘기면 기본 워밍업(0.8초)으로 되돌린다.
  const isDesktopDock = useMediaQuery('(min-width: 1024px)')
  const [commentaryFollowFrom, setCommentaryFollowFrom] = useState<string | null>(null)
  const commentaryFollowActive = isDesktopDock && commentaryPanelOpen && commentaryFocusVerse == null
  const commentaryFollowVerse = useReadingLine(
    bookNumber,
    selectedChapter,
    index.chapterTotalVerses,
    commentaryFollowActive,
    250,
    commentaryFollowFrom === `${bookNumber}:${selectedChapter}` ? 0 : 800,
  )

  // 부모(BibleStudy)에 패널 상태 통지 — 장을 떠나며 언마운트될 때도 닫힘으로 되돌린다
  useEffect(() => {
    onCommentaryOpenChange?.(commentaryPanelOpen)
  }, [commentaryPanelOpen, onCommentaryOpenChange])
  useEffect(() => {
    return () => onCommentaryOpenChange?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 해석 FAB가 떠 있는 동안 전역 챗봇 버튼을 위로 밀어 우하단 겹침을 막는다.
  // 챗봇 쪽은 --chat-fab-lift 변수만 읽으므로 두 컴포넌트가 서로를 몰라도 된다.
  const commentaryFabVisible = meta.hasCommentaries && !commentaryPanelOpen && !selectionMode
  useEffect(() => {
    if (!commentaryFabVisible) return
    document.documentElement.style.setProperty('--chat-fab-lift', '3rem')
    return () => {
      document.documentElement.style.removeProperty('--chat-fab-lift')
    }
  }, [commentaryFabVisible])

  const texts = {
    ko: { prevChapter: '이전 장', nextChapter: '다음 장' },
    en: { prevChapter: 'Previous', nextChapter: 'Next' },
  }
  const t = texts[language]

  // ── 여러 절 선택 ──
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // 선택된 절을 절 번호 순으로 — 탭한 순서가 아니라 본문 순서로 복사돼야 한다
  const selectedVerses = useMemo(() => {
    if (!selectedIds.length) return []
    return index.allVerses.filter((v) => selectedIdSet.has(v.id)).sort((a, b) => a.verse - b.verse)
  }, [selectedIds, selectedIdSet, index])

  const selectionTarget: VerseCopyTarget = {
    bookNameKo: index.bookNameKo,
    bookNumber,
    chapter: selectedChapter,
    verses: selectedVerses.map((v) => ({ verse: v.verse, text: v.text })),
    // 병합 묶음은 본문 한 덩이가 여러 절이라 출처·링크만 펼쳐 적는다
    refVerses: selectedVerses.flatMap((v) => v.merged_verses ?? [v.verse]),
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
      prev.includes(verseId) ? prev.filter((id) => id !== verseId) : [...prev, verseId],
    )
  }, [])

  // 절 메뉴 열림/닫힘 — verseId를 인자로 받아 절별 클로저 없이 하나의 콜백을 공유한다
  const handleActionsOpenChange = useCallback((verseId: number, open: boolean) => {
    setOpenVerseId(open ? verseId : null)
  }, [])

  // '여기부터 듣기' — BibleVerse → 절 번호로 변환해 상위 오디오 플레이어에 전달
  const handleListenFrom = useCallback(
    (v: BibleVerse) => {
      onListenFromVerse?.(v.verse)
    },
    [onListenFromVerse],
  )

  const handleEditVerse = useCallback((verse: BibleVerse) => {
    setEditingVerse(verse)
  }, [])

  const exitSelection = () => {
    setSelectionMode(false)
    setSelectedIds([])
  }

  // 선택된 첫 절~끝 절 사이의 빠진 절을 모두 채운다 (화면에 없는 자리표시자 절은 제외)
  const fillSelectionGap = () => {
    if (selectedVerses.length < 2) return
    const from = selectedVerses[0].verse
    const to = selectedVerses[selectedVerses.length - 1].verse
    setSelectedIds(
      index.allVerses.filter((v) => !v.merged_into && v.verse >= from && v.verse <= to).map((v) => v.id),
    )
  }

  // 장이 바뀌면 선택은 초기화 (다른 장의 절이 섞여 복사되지 않도록)
  useEffect(() => {
    setSelectionMode(false)
    setSelectedIds([])
  }, [bookNumber, selectedChapter])

  // ── 무한 스크롤 ──
  // 옵저버 콜백이 항상 최신 값을 보도록 ref 에 보관. 콜백 ref 자체는 deps 없이
  // 안정적으로 유지할 수 있어 페이지 로드마다 옵저버를 재생성하지 않는다.
  const observerRef = useRef<IntersectionObserver | null>(null)
  const infiniteScrollState = useRef({ hasNextPage, isFetchingNextPage, fetchNextPage })
  infiniteScrollState.current = { hasNextPage, isFetchingNextPage, fetchNextPage }

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
        // 화면 1.5개 앞에서 미리 받는다 — 100px 로는 20절마다 스크롤이 잠깐 멈췄다.
        // 첫 페이지가 짧으면(PC·짧은 절) 마운트 직후 바로 걸려 2페이지가 미리 들어온다
        rootMargin: '0px 0px 150% 0px',
      },
    )
    observerRef.current.observe(node)
  }, [])
  useEffect(() => () => observerRef.current?.disconnect(), [])

  // ── 절 이동 ──
  // 절 스크롤 엔진(스크롤러 탐지 + rAF 애니메이션). 낭독 따라가기와 같은 인스턴스를 쓴다.
  const { scrollVerseIntoView, cancelVerseScroll } = useVerseScroll()

  // 이어 읽기: 지정된 절로 자동 스크롤 + 일시적 하이라이트.
  // 무한 스크롤 페이지가 새로 로드될 때마다 DOM 존재 여부를 재확인하고,
  // 없으면 자동으로 다음 페이지를 미리 받는다.
  // 절 DOM 은 bodyRendered 와 같은 조건으로 그려진다 — 게이트 조건과 이 값은 반드시 같이
  // 움직여야 한다(스피너 상태에서 getElementById 가 null 인 채 끝나던 버그).
  useEffect(() => {
    if (!scrollToVerse || !bodyRendered || !chapterData) return
    // ?verse=19 처럼 병합 자리표시자를 가리키면 화면에 그 절이 없다 — 첫 절로
    const el = document.getElementById(`bible-verse-${index.anchorVerse(scrollToVerse)}`)
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
  }, [scrollToVerse, index, bodyRendered, chapterData, hasNextPage, isFetchingNextPage, fetchNextPage, onScrolled, scrollVerseIntoView])

  // 이전·다음 장을 미리 받아 둔다 — 장 넘김이 URL 을 안 바꿔 라우트 선요청을 못 타므로 여기서.
  // 본문이 그려지고 이 장의 부가 요청(해석·북마크·단어장·현황)이 먼저 나간 뒤 유휴 시간에 띄운다.
  useEffect(() => {
    if (!bodyRendered || preloadBudget() !== 'full') return
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    let idleId: number | null = null
    const timer = window.setTimeout(() => {
      const run = () => prefetchAdjacentChapters(queryClient, bookNumber, selectedChapter, totalChapters)
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(run, { timeout: 4000 })
      else run()
    }, ADJACENT_PREFETCH_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
      if (idleId !== null) w.cancelIdleCallback?.(idleId)
    }
  }, [bodyRendered, bookNumber, selectedChapter, totalChapters, queryClient])

  // ── 함께 읽기 ── (현황 요청은 본문보다 먼저 나가야 하므로 로딩 분기 앞에서)
  const together = useChapterTogether({
    bookNumber,
    chapter: selectedChapter,
    chapterTotalVerses: index.chapterTotalVerses,
    loggedIn,
    bodyRendered,
  })

  // ── 절에 내려보낼 계약 ──
  // 목록 수준 액션 — 절마다 props 로 내려보내지 않고 컨텍스트로 한 번만 제공한다.
  // 전부 useCallback/setState 라 참조가 고정돼 memo 된 절이 불필요하게 재렌더되지 않는다.
  const verseActions = useMemo<VerseListActions>(
    () => ({
      onReadSuccess: read.markVerseRead,
      onEdit: handleEditVerse,
      onToggleRead: read.toggleVerseRead,
      onShowCommentary: handleShowCommentary,
      onListenFrom: onListenFromVerse ? handleListenFrom : undefined,
      onActionsOpenChange: handleActionsOpenChange,
      onToggleSelect: toggleSelect,
      onEnterSelection: enterSelection,
      onShare: setShareTarget,
      onOpenReflections: openReflections,
    }),
    [read.markVerseRead, read.toggleVerseRead, handleEditVerse, handleShowCommentary, onListenFromVerse, handleListenFrom, handleActionsOpenChange, toggleSelect, enterSelection, openReflections],
  )
  const verseSettings = useMemo<VerseListSettings>(
    () => ({ selectionMode, readStatusReady: read.readStatusReady }),
    [selectionMode, read.readStatusReady],
  )

  // 절 하나 렌더 — 절별/이어읽기 두 보기가 같은 props를 쓴다
  const renderVerse = (verse: BibleVerse, verseLayout: 'list' | 'flow') => (
    <VerseItem
      key={verse.id}
      verse={verse}
      bookNameKo={index.bookNameKo}
      bookNumber={bookNumber}
      chapter={selectedChapter}
      isRead={read.readVerses.has(verse.id)}
      isTogglingRead={read.togglingVerseId === verse.id}
      hasCommentary={meta.hasCommentaryAt(verse.verse)}
      isAudioActive={verse.verse === audioActiveVerse}
      actionsOpen={openVerseId === verse.id}
      wordNotes={meta.wordNotesOf(verse.id)}
      chapterBookmark={meta.bookmarkOf(verse.id)}
      isSelected={selectedIdSet.has(verse.id)}
      layout={verseLayout}
      reflectionCount={meta.reflectionCountAt(verse.verse)}
    />
  )

  // 로딩 상태는 모든 훅 호출 이후에 체크. 읽음 상태는 아주 짧게만(holdingForReadStatus)
  // 같이 기다리고, 그 뒤엔 본문을 먼저 그리고 읽음 표시는 도착 시 색만 입힌다
  // (팝 애니메이션은 사용자가 직접 바꾼 절만 — VerseItem.readPop).
  if (isLoading || read.holdingForReadStatus) {
    return <ChapterLoader size="lg" />
  }

  if (!chapterData) {
    return null
  }

  const isFirstChapter = selectedChapter === 1
  const isLastChapter = selectedChapter === totalChapters
  const chapterNavButtonStyle = (disabled: boolean) => ({
    padding: '0.5rem',
    borderRadius: '50%',
    border: '2px solid var(--ig-border)',
    background: 'var(--ig-primary-background)',
    color: 'var(--ig-primary-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.3 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    flexShrink: 0,
    transition: 'all 0.2s',
  })

  return (
    <VerseListProvider actions={verseActions} settings={verseSettings}>
    <div className="bible-content">
      {/* 진행률 pill - 읽은 절이 있을 때만 컴팩트하게 표시 */}
      {read.readCount > 0 && read.pillTotal > 0 && (
        <div className={read.pillReveal ? 'verse-progress-pill--reveal' : undefined} style={{
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
            {read.readCount} / {read.pillTotal}
          </span>
          <div style={{
            flex: 1,
            height: '6px',
            background: 'var(--ig-border)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${read.progress}%`,
              height: '100%',
              background: 'var(--brand)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
              minWidth: read.progress > 0 ? '2px' : '0',
            }} />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--ig-primary)', minWidth: '2.5rem', textAlign: 'right' }}>
            {Math.round(read.progress)}%
          </span>
        </div>
      )}

      {/* 함께 읽기 — 상단 캡션 + 묵상 배너 + 묵상 시트 */}
      <ChapterTogether
        bookNumber={bookNumber}
        chapter={selectedChapter}
        bookNameKo={index.bookNameKo}
        together={together}
        findVerse={index.findVerse}
        reflectionTarget={reflectionTarget}
        onReflectionTargetChange={setReflectionTarget}
      />

      {/* 길게 누르기 안내 — 로그인 사용자에게 처음 한 번만 */}
      {showHoldHint && loggedIn && (
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
        <div className={`verses-list${isFlow ? ' verses-list--flow' : ''}`}>
          {isFlow
            ? // 이어읽기: 단락(소제목) 안에 절이 인라인으로 흐른다
              flowParagraphs.map((para) => (
                <section key={para.key} className="verse-paragraph">
                  {showHeadings && para.title && (
                    <h3 className="verse-paragraph__title">{para.title}</h3>
                  )}
                  <div className="verse-paragraph__body">
                    {para.verses.map((verse) => renderVerse(verse, 'flow'))}
                  </div>
                </section>
              ))
            : // 절별 보기: 절 카드는 그대로 두고, 개요 단락이 시작되는 절 앞에 소제목만 끼운다
              flowParagraphs.map((para) => (
                <div key={para.key} className="verse-section">
                  {showHeadings && para.title && (
                    <h3 className="verse-section__title">
                      <span className="verse-section__name">{para.title}</span>
                      {para.range && (
                        <span className="verse-section__range">
                          {para.range[0] === para.range[1]
                            ? `${para.range[0]}절`
                            : `${para.range[0]}-${para.range[1]}절`}
                        </span>
                      )}
                    </h3>
                  )}
                  {para.verses.map((verse) => renderVerse(verse, 'list'))}
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
              justifyContent: 'center',
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
            fontSize: '0.875rem',
          }}>
            {read.hasStatus ? (
              // 장 끝 읽음 완료 — 끝까지 읽고 스크롤을 되올리지 않도록 여기서 한 번에 처리
              <div style={{ marginBottom: '0.5rem' }}>
                <ChapterSealStamp
                  bookName={index.bookNameKo}
                  chapter={selectedChapter}
                  totalVerses={read.totalVerses}
                  unread={read.unreadCount}
                  pending={read.bulkPending}
                  onStamp={read.stampChapter}
                />
                {read.unreadCount === 0 && (
                  <button
                    type="button"
                    onClick={read.unmarkChapterTap}
                    disabled={read.bulkPending}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: 'none',
                      borderRadius: '999px',
                      background: read.unmarkConfirming ? 'var(--ig-secondary-background)' : 'transparent',
                      color: 'var(--ig-secondary-text)',
                      fontSize: '0.75rem',
                      fontWeight: read.unmarkConfirming ? 700 : 500,
                      textDecoration: read.unmarkConfirming ? 'none' : 'underline',
                      textUnderlineOffset: '2px',
                      cursor: read.bulkPending ? 'wait' : 'pointer',
                      opacity: read.bulkPending ? 0.6 : 1,
                    }}
                  >
                    {read.bulkPending ? '처리 중...' : read.unmarkConfirming ? '한 번 더 누르면 이 장 읽음 전체 취소' : '읽음 취소'}
                  </button>
                )}
              </div>
            ) : (
              <span className="material-icons-round" style={{ fontSize: '2rem', opacity: 0.3 }}>
                check_circle
              </span>
            )}

            {/* 장 끝 텍스트와 네비게이션을 한 줄에 배치 */}
            <div style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
            }}>
              <button
                onClick={() => onChapterChange(selectedChapter - 1)}
                disabled={isFirstChapter}
                title={t.prevChapter}
                style={chapterNavButtonStyle(isFirstChapter)}
              >
                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>
                  chevron_left
                </span>
              </button>

              <p style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                {index.bookNameKo} {chapterData.pages[0].chapter}장 끝
              </p>

              <button
                onClick={() => onChapterChange(selectedChapter + 1)}
                disabled={isLastChapter}
                title={t.nextChapter}
                style={chapterNavButtonStyle(isLastChapter)}
              >
                <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 구절 수정 모달 · 공유 시트 (목록에 하나씩) */}
      <VerseListSheets
        bookNumber={bookNumber}
        chapter={selectedChapter}
        editingVerse={editingVerse}
        onCloseEdit={() => setEditingVerse(null)}
        shareTarget={shareTarget}
        onCloseShare={() => setShareTarget(null)}
      />

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

      {/* 낭독 따라가기 — 하단 앵커 추적 + 직접 스크롤 시 복귀 버튼 */}
      <AudioFollowLayer
        audioActiveVerse={audioActiveVerse}
        audioPlaying={audioPlaying}
        chapterData={chapterData}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        scrollVerseIntoView={scrollVerseIntoView}
        cancelVerseScroll={cancelVerseScroll}
        hidden={selectionMode}
      />

      {/* 장 전체 해석 보기 플로팅 버튼 — 위로 비켜선 챗봇 버튼(56px)과 세로 스택, 중심축 정렬 */}
      {commentaryFabVisible && (
        <button
          onClick={handleShowChapterCommentaries}
          title="이 장의 해석 모두 보기"
          style={{
            position: 'fixed',
            right: 'calc(1rem + 2px)',
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
      {commentaryPanelOpen && chapterData.pages[0] && (
        <BibleCommentaryPanel
          bookNumber={bookNumber}
          chapter={selectedChapter}
          bookNameKo={index.bookNameKo}
          focusVerse={commentaryFocusVerse}
          followVerse={commentaryFollowVerse}
          totalVerses={chapterData.pages[0].total_verses}
          verseTexts={index.verseTextMap}
          onClose={() => {
            setCommentaryPanelOpen(false)
            setCommentaryFocusVerse(null)
          }}
        />
      )}
    </div>
    </VerseListProvider>
  )
}

export default VerseList
