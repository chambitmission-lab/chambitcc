import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'
import type { ReadingProgressResponse, ResumePosition } from '../../../api/bibleReading'
import { parseApiDate } from '../../../utils/dateUtils'
import { lazyModal } from '../../../utils/lazyModal'
import { preloadBudget, scheduleAfterFirstScreen } from '../../../utils/idlePreload'
import { readingSceneFor } from '../../../utils/themeAssets'
import { safeSessionStorage, safeStorage } from '../../../utils/safeStorage'
import { alertDialog, confirmDialog } from '../../../utils/confirmDialog'
import { isApiError } from '../../../api/utils/request'
import { useStartReadingCycle } from '../../../hooks/useBibleReading'
// 지도 보기는 토글해야 나온다 — 기본 뷰(여정)만 정적으로 둔다.
// 단, 청크는 요약 카드가 뜬 뒤 유휴 시간에(그리고 버튼에 손이 닿는 순간) 미리 받아 둔다 —
// 예전엔 "지도"를 누른 뒤에야 청크 왕복이 시작돼 fallback(null) 빈 화면이 한 박자 끼었다
const BibleProgressMap = lazyModal(() => import('./BibleProgressMap'))
const preloadProgressMap = () => void BibleProgressMap.preload()
import BookJourneyPath from './BookJourneyPath'
import { useBookIntroPeek, type PeekBook } from '../../../components/bible/BookIntroPeek'
import { BOOK_GENRES } from '../../../components/bible/bookGenre'
import { aggregateRange, buildBookInfoMap, gaugeWidth, pctLabel } from './readingProgressInfo'
import { bookAbbrev } from './bibleBookAbbrev'
import CandleHero from '../../PrayerFocus/CandleHero'
import {
  BookOpen,
  ChartPieSlice,
  HandsPraying,
  MapTrifold,
} from '../../../components/icons/phosphor'

interface BookSelectorProps {
  books: BibleBook[] | undefined
  isLoading: boolean
  error: Error | null
  onBookSelect: (bookId: number, bookName: string, resume?: ResumePosition) => void
  resumeMap?: Map<number, ResumePosition>
  /** 읽기 진행률 원본 — 요약 줄·분류 칩·책 카드·지도의 모든 수치가 여기서 파생된다 */
  progress?: ReadingProgressResponse['data']
  /** progress 쿼리가 로딩 중(로그인 상태 한정) — 요약 카드 자리에 스켈레톤을 세운다 */
  progressPending?: boolean
}

type Testament = 'OT' | 'NT'
type BookViewMode = 'journey' | 'grid' | 'list'

/** 보기 방식 선택 저장 키 — 여정(경로)·격자·목록은 취향 문제라 사용자별로 기억한다 */
// 격자 "지금 읽는 책" 카드의 장 칸 상한 — 넘으면 칸이 실처럼 가늘어져 막대로 그린다
const HERO_CELL_MAX = 40
// 작은 카드 진행 링 둘레 (r=10)
const RING_LEN = 2 * Math.PI * 10

const VIEW_MODE_KEY = 'bible-book-view-mode'

/** 사용자가 직접 고른 구약/신약 탭 — 책에 들어갔다 돌아와도 그 탭이 유지되도록 세션 동안만 기억한다.
 *  앱을 새로 열면 다시 "지금 읽는 쪽" 자동 선택으로 돌아간다 */
const TESTAMENT_SESSION_KEY = 'bible-testament-tab'

/** 구약/신약 완독 축하 문구를 이미 보여 줬는지 — 기기에 회차마다 한 번만.
 *  1독은 예전 키 그대로(이미 본 사람에게 다시 띄우지 않기), 2독부터 회차를 붙여 다시 축하한다 */
const celebratedKey = (tm: Testament, cycleNo: number) =>
  cycleNo > 1 ? `bible-testament-complete-seen-${tm}-c${cycleNo}` : `bible-testament-complete-seen-${tm}`

/**
 * 구약/신약 완독 축하 띠 — "본 적 있나"는 마운트 시점 저장소 값으로 고정해, 저장소에 '봤다'고
 * 적은 직후 재렌더돼도 닫기 전까지 남아 있다. (쪽, 회차)가 바뀌면 부모가 key 로 다시 마운트한다
 */
const TestamentCelebrate = ({
  storageKey,
  title,
  next,
  closeLabel,
}: {
  storageKey: string
  title: string
  next: string
  closeLabel: string
}) => {
  const [seenAtMount] = useState(() => !!safeStorage.get(storageKey))
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (!seenAtMount) safeStorage.set(storageKey, '1')
  }, [seenAtMount, storageKey])
  if (seenAtMount || closed) return null
  return (
    <div className="testament-celebrate" role="status">
      <span className="testament-celebrate__text">
        <strong>{title}</strong>
        <span>{next}</span>
      </span>
      <button
        type="button"
        className="testament-celebrate__close"
        aria-label={closeLabel}
        onClick={() => setClosed(true)}
      >
        <span className="material-icons-round">close</span>
      </button>
    </div>
  )
}

const loadChosenTestament = (): Testament | null => {
  const saved = safeSessionStorage.get(TESTAMENT_SESSION_KEY)
  return saved === 'OT' || saved === 'NT' ? saved : null
}

const loadViewMode = (): BookViewMode => {
  const saved = safeStorage.get(VIEW_MODE_KEY)
  return saved === 'grid' || saved === 'list' ? saved : 'journey'
}

// 분류 칩 — '전체' + 장르 구간. 장르 표(BOOK_GENRES)가 단일 출처라 여기엔 '전체' 칩만 따로 둔다
interface BookCategory {
  id: string
  label: string
  labelEn: string
  min: number
  max: number
  colorVar?: string
}

const OT_CATEGORIES: BookCategory[] = [
  { id: 'all', label: '전체', labelEn: 'All', min: 1, max: 39 },
  ...BOOK_GENRES.filter(g => g.max <= 39),
]

const NT_CATEGORIES: BookCategory[] = [
  { id: 'all', label: '전체', labelEn: 'All', min: 40, max: 66 },
  ...BOOK_GENRES.filter(g => g.min >= 40),
]

const BookSelector = ({ books, isLoading, error, onBookSelect, resumeMap, progress, progressPending }: BookSelectorProps) => {
  const { language } = useLanguage()
  // 직접 고른 탭(세션 한정). null이면 진행 상황에서 자동으로 고른 탭을 쓴다
  const [chosenTestament, setChosenTestament] = useState<Testament | null>(loadChosenTestament)
  const [filter, setFilter] = useState<string>('all')
  // 서브 필터가 어느 방향에서 슬라이드 인 될지 — OT→NT는 우측(forward), NT→OT는 좌측(back)에서 들어온다
  const [dir, setDir] = useState<'forward' | 'back'>('forward')
  const [showMap, setShowMap] = useState(false)
  // 진행률 카드 배경 장면 — 낮은 "함께 걷는 길", 저녁·밤은 "함께 읽기"(진입 시각 기준, 머무는 동안 고정)
  const [readingScene] = useState(() => readingSceneFor(new Date().getHours()))

  // 지도 청크 선로드 — 요약 카드(토글 버튼)가 보이는 동안 3G 이하가 아니면 유휴 시간에 받는다
  useEffect(() => {
    if (preloadBudget() !== 'full') return
    return scheduleAfterFirstScreen(preloadProgressMap, { settleMs: 1000 })
  }, [])
  // 책 목록 보기 방식 — 여정 경로(기본)와 예전 격자 중 취향대로. 선택은 기기에 기억된다
  const [viewMode, setViewMode] = useState<BookViewMode>(loadViewMode)

  // 목록 보기 전용 "안 읽은 책만" 필터 — 통독 후반부에 남은 책만 추려 보는 용도.
  // 세션 한정 상태로 둔다: 기기에 기억하면 다음 방문에 목록이 비어 보이는 이유를 찾기 어렵다
  const [unreadOnly, setUnreadOnly] = useState(false)

  // 진입 스태거(칩 슬라이드·카드/정거장 pop-in·도장 압인)는 "필터를 바꿨다"는 응답이지
  // 화면 로딩 연출이 아니다. 라우트 진입 첫 마운트에도 매번 0.7초씩 순차로 떠오르니
  // 웜 진입조차 "아직 불러오는 중"처럼 읽혔다 — 사용자가 탭·칩·보기를 한 번 만진 뒤부터만
  // 켠다(data-animate). CSS 는 이 속성이 없으면 해당 animation 을 끈다.
  const [interacted, setInteracted] = useState(false)

  const handleViewModeChange = (mode: BookViewMode) => {
    setInteracted(true)
    setViewMode(mode)
    safeStorage.set(VIEW_MODE_KEY, mode) // 저장 실패(시크릿 모드 등)해도 이번 세션 동안은 상태로 동작한다
  }

  const infoMap = useMemo(() => buildBookInfoMap(books, progress), [books, progress])

  // 책에 마우스를 올리면 권 개관 미리보기 — 마우스 기기에서만 동작한다
  const { peekProps, peekNode } = useBookIntroPeek()
  const peekBook = (book: BibleBook): PeekBook => ({
    bookNumber: book.book_number,
    bookName: language === 'en' && book.book_name_en ? book.book_name_en : book.book_name_ko,
    totalChapters: book.chapter_count,
  })

  // 지금 읽는 책 — 가장 최근에 펼친 책. 여정 보기(BookJourneyPath)의 '지금 여기'와 같은 규칙이라
  // 보기를 바꿔도 강조되는 책이 달라지지 않는다.
  // 원시값 둘로 나눠 두는 이유: 콜백 안에서만 재할당되는 객체는 tsc가 never로 좁혀 빌드가 깨진다
  const currentBookNumber = useMemo(() => {
    let bestNumber: number | undefined
    let bestTime = -Infinity
    books?.forEach(b => {
      const pos = resumeMap?.get(b.book_number)
      if (!pos?.read_at) return
      const time = parseApiDate(pos.read_at).getTime()
      if (time > bestTime) {
        bestTime = time
        bestNumber = b.book_number
      }
    })
    return bestNumber
  }, [books, resumeMap])

  const texts = {
    ko: {
      selectBook: '책 선택',
      oldTestament: '구약',
      newTestament: '신약',
      otShort: '구약',
      ntShort: '신약',
      loadingBooks: '성경 책 목록을 불러오는 중...',
      errorBooks: '성경 책 목록을 불러오는데 실패했습니다. 백엔드 API를 확인해주세요.',
      noBooks: '성경 책 데이터가 없습니다.',
      summaryTitle: '성경 읽기 현황',
      summarySubtitle: '말씀을 읽으며 믿음이 자라가요',
      overallLabel: '전체 진행률',
      remaining: '남은',
      allComplete: '성경 전체를 완독했어요',
      whole: '전체',
      statsToggle: '진행률',
      mapToggle: '지도',
      cheerStart: '오늘 첫 장을 펼쳐볼까요?',
      cheerEarly: '좋은 시작이에요, 한 장씩 이어가요',
      cheerSteady: '하나님 말씀을 꾸준히 읽어가고 있어요',
      cheerHalf: '절반을 넘었어요, 조금만 더 힘내요',
      cheerAlmost: '완독이 눈앞이에요, 끝까지 함께해요',
      cheerDone: '성경 66권을 모두 읽었어요',
      chapterUnit: '장',
      verseUnit: '절',
      complete: '완독',
      reading: '읽는 중',
      read: '읽음',
      journeyView: '여정으로 보기',
      gridView: '격자로 보기',
      listView: '목록으로 보기',
      ctaContinue: '이어읽기',
      ctaStart: '읽기',
      unreadOnly: '안 읽은 책만',
      allDone: '모두 읽었어요',
      allDoneMeta: (n: number, ch: number) => `${n}권 · ${ch}장 완독`,
      showAllBooks: '읽은 책 다시 보기',
      nextUp: '다음',
      nextBook: '다음 책',
      nowReading: '지금 읽는 중',
      continueFrom: (ch: number) => `${ch}장 이어 읽기`,
      testamentDone: '완독',
      celebrateOT: '구약 39권을 모두 읽었어요 🎉',
      celebrateOTNext: '이제 신약으로 넘어가요',
      celebrateNT: '신약 27권을 모두 읽었어요 🎉',
      celebrateNTNext: '이제 구약으로 넘어가요',
      close: '닫기',
      cycleLabel: (n: number) => `${n}독 진행률`,
      cycleDone: (n: number) => `성경 통독 ${n}회 완료`,
      cycleStart: (n: number) => `${n}독 시작하기`,
      cycleConfirmTitle: (n: number) => `${n}독을 시작할까요?`,
      cycleConfirmMessage: '진행률이 0%에서 다시 시작해요.',
      cycleConfirmDescription: '지금까지 읽은 기록과 통독 횟수는 프로필에 그대로 남아요.',
      cycleConfirmOk: '시작하기',
      cycleStartFailed: '새 회차를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
      cycleStartConflict: '아직 이 회차를 완독하지 않았거나, 다른 기기에서 이미 새 회차를 시작했어요. 진행률을 다시 맞췄어요.',
    },
    en: {
      selectBook: 'Select Book',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      otShort: 'OT',
      ntShort: 'NT',
      loadingBooks: 'Loading bible books...',
      errorBooks: 'Failed to load bible books. Please check backend API.',
      noBooks: 'No bible book data available.',
      summaryTitle: 'Bible reading',
      summarySubtitle: 'Faith grows as you read the Word',
      overallLabel: 'Overall progress',
      remaining: 'Remaining',
      allComplete: 'Whole Bible complete',
      whole: 'Whole Bible',
      statsToggle: 'Progress',
      mapToggle: 'Map',
      cheerStart: 'Shall we open the first chapter today?',
      cheerEarly: 'A good start — keep going one chapter at a time',
      cheerSteady: "You're steadily reading through God's Word",
      cheerHalf: "Past the halfway mark — you've got this",
      cheerAlmost: 'Almost there — finish strong',
      cheerDone: "You've read all 66 books",
      chapterUnit: 'ch',
      verseUnit: 'v',
      complete: 'Done',
      reading: 'Reading',
      read: 'read',
      journeyView: 'Journey view',
      gridView: 'Grid view',
      listView: 'List view',
      ctaContinue: 'Continue',
      ctaStart: 'Read',
      unreadOnly: 'Unread only',
      allDone: 'All read',
      allDoneMeta: (n: number, ch: number) => `${n} books · ${ch} chapters complete`,
      showAllBooks: 'Show finished books',
      nextUp: 'Next',
      nextBook: 'Up next',
      nowReading: 'Reading now',
      continueFrom: (ch: number) => `Continue ch. ${ch}`,
      testamentDone: 'complete',
      celebrateOT: 'You finished all 39 books of the Old Testament 🎉',
      celebrateOTNext: 'On to the New Testament',
      celebrateNT: 'You finished all 27 books of the New Testament 🎉',
      celebrateNTNext: 'On to the Old Testament',
      close: 'Close',
      cycleLabel: (n: number) => `Read-through #${n}`,
      cycleDone: (n: number) => `Bible read through ${n}×`,
      cycleStart: (n: number) => `Start read-through #${n}`,
      cycleConfirmTitle: (n: number) => `Start read-through #${n}?`,
      cycleConfirmMessage: 'Your progress will start again from 0%.',
      cycleConfirmDescription: 'Everything you have read so far and your read-through count stay on your profile.',
      cycleConfirmOk: 'Start',
      cycleStartFailed: "Couldn't start a new read-through. Please try again shortly.",
      cycleStartConflict: "This read-through isn't finished yet, or another device already started the next one. Your progress has been refreshed.",
    }
  }

  const t = texts[language]

  // 분류별 합산 진행률 — "어느 분류를 덜 읽었나"가 칩 한 줄로 보이게 한다.
  // 진행 기록이 아예 없으면(비로그인·첫 사용) 0%가 5개 늘어서는 것 자체가 노이즈이므로 숨긴다.
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>()
    ;[...OT_CATEGORIES, ...NT_CATEGORIES].forEach(cat => {
      map.set(`${cat.min}-${cat.max}`, aggregateRange(books, infoMap, cat.min, cat.max).rate)
    })
    return map
  }, [books, infoMap])

  const hasAnyProgress = (progress?.overall?.read_verses ?? 0) > 0
  const testamentRate: Record<Testament, number> = {
    OT: categoryStats.get('1-39') ?? 0,
    NT: categoryStats.get('40-66') ?? 0,
  }
  const otDone = testamentRate.OT >= 100
  const ntDone = testamentRate.NT >= 100

  // 기본 탭 = 지금 읽고 있는 쪽. 가장 최근에 읽은 책이 속한 쪽을 펼치되,
  // 그쪽을 이미 다 읽었고 반대쪽이 남아 있으면 반대쪽으로 넘겨 준다
  // (구약을 다 읽었으면 신약 — 읽은 기록이 없어도 같은 규칙이 적용된다)
  const autoTestament = useMemo<Testament>(() => {
    const base: Testament = currentBookNumber !== undefined && currentBookNumber >= 40 ? 'NT' : 'OT'
    const baseDone = base === 'OT' ? otDone : ntDone
    const otherDone = base === 'OT' ? ntDone : otDone
    if (baseDone && !otherDone) return base === 'OT' ? 'NT' : 'OT'
    return base
  }, [currentBookNumber, otDone, ntDone])
  const testament = chosenTestament ?? autoTestament

  const handleTestamentChange = (next: Testament) => {
    if (next === testament) return
    setInteracted(true)
    setDir(next === 'NT' ? 'forward' : 'back')
    setChosenTestament(next)
    safeSessionStorage.set(TESTAMENT_SESSION_KEY, next) // 저장 실패해도 이번 화면에서는 상태로 동작한다
    setFilter('all')
  }

  const categories = testament === 'OT' ? OT_CATEGORIES : NT_CATEGORIES
  const activeCategory = categories.find(c => c.id === filter) ?? categories[0]

  // 구약/신약 완독 축하 — 한쪽을 다 읽고 반대쪽이 남았을 때 기기당·회차당 딱 한 번만 띄운다.
  // 탭이 저절로 넘어간 이유도 이 한 줄이 설명해 준다.
  const cycleNo = progress?.cycle?.current_cycle ?? 1
  const doneSide: Testament | null = otDone && !ntDone ? 'OT' : ntDone && !otDone ? 'NT' : null
  // "본 적 있나"는 TestamentCelebrate 가 마운트 시점 값으로 고정한다 — (쪽, 회차)가 바뀌면 key 로 다시 마운트
  const celebrateKey = doneSide ? celebratedKey(doneSide, cycleNo) : null


  // 전체/구약/신약 요약 — 장 기준을 주 지표로 쓰고, 장 집계가 없는 구버전 응답에서는 절 기준으로 폴백.
  // 링 색은 셋을 구분하는 용도라 전체=브랜드, 구약=딥 틸(선지서 토큰), 신약=로얄 퍼플(계시록 토큰)로 고정
  const summaryStats = useMemo(() => {
    if (!progress) return []
    const build = (
      id: 'all' | 'ot' | 'nt',
      label: string,
      src: ReadingProgressResponse['data']['overall']
    ) => {
      const hasChapters = (src.total_chapters ?? 0) > 0
      const read = hasChapters ? (src.read_chapters ?? 0) : src.read_verses
      const total = hasChapters ? (src.total_chapters ?? 0) : src.total_verses
      const rate = hasChapters ? (read / (total || 1)) * 100 : src.progress_rate
      const unit = hasChapters ? t.chapterUnit : t.verseUnit
      return {
        id,
        label,
        rate: Math.max(0, Math.min(100, rate)),
        read,
        total,
        unit,
        detail: `${read.toLocaleString()} / ${total.toLocaleString()}${unit}`,
      }
    }
    return [
      build('all', t.whole, progress.overall),
      build('ot', t.oldTestament, progress.old_testament),
      build('nt', t.newTestament, progress.new_testament),
    ]
  }, [progress, t.whole, t.oldTestament, t.newTestament, t.chapterUnit, t.verseUnit])

  const overallStat = summaryStats[0]
  const testamentStats = useMemo(() => summaryStats.filter(stat => stat.id !== 'all'), [summaryStats])

  // 통독 회차 — 진행률은 현재 회차 기준. 완독한 뒤에만 다음 회차를 열 수 있다(서버도 409 로 막는다)
  const cycle = progress?.cycle
  const startCycle = useStartReadingCycle()
  const handleStartCycle = async () => {
    if (!cycle || startCycle.isPending) return
    const next = cycle.current_cycle + 1
    const ok = await confirmDialog({
      title: t.cycleConfirmTitle(next),
      message: t.cycleConfirmMessage,
      description: t.cycleConfirmDescription,
      confirmText: t.cycleConfirmOk,
      tone: 'brand',
    })
    if (!ok) return
    try {
      await startCycle.mutateAsync()
    } catch (error) {
      // 409 면 mutation onError 가 이미 읽기 캐시를 다시 맞췄다 — 버튼도 새 진행률에 따라 사라진다
      await alertDialog({ message: isApiError(error, 409) ? t.cycleStartConflict : t.cycleStartFailed })
    }
  }


  // 격려 문구 — 진행률 구간별 한 줄. 숫자만 있는 대시보드가 아니라 "함께 읽는" 톤을 만든다
  const cheerText = useMemo(() => {
    if (!overallStat) return ''
    const r = overallStat.rate
    if (r >= 100) return t.cheerDone
    if (r >= 85) return t.cheerAlmost
    if (r >= 50) return t.cheerHalf
    if (r >= 10) return t.cheerSteady
    if (r > 0) return t.cheerEarly
    return t.cheerStart
  }, [overallStat, t.cheerDone, t.cheerAlmost, t.cheerHalf, t.cheerSteady, t.cheerEarly, t.cheerStart])

  // 격려 문구를 "앞부분 + 마지막 어절"로 나눈다 — 마지막 어절은 아이콘과 묶여 함께 줄바꿈된다
  const cheerSplit = useMemo(() => {
    const text = cheerText.trim()
    const cut = text.lastIndexOf(' ')
    return cut < 0 ? { head: '', tail: text } : { head: text.slice(0, cut + 1), tail: text.slice(cut + 1) }
  }, [cheerText])
  const cheerHead = cheerSplit.head
  const cheerTail = cheerSplit.tail

  const handleMapSelect = useCallback(
    (book: BibleBook) => {
      onBookSelect(book.id, book.book_name_ko, resumeMap?.get(book.book_number))
    },
    [onBookSelect, resumeMap]
  )

  // 격자 보기 — 큰 약어 카드 격자. 시선이 갈 곳은 "지금 읽는 책" 한 장뿐이라 그 카드만 2×2로 키운다
  // (다크 = 집중 기도 화면의 유리컵 촛불, 라이트 = 브랜드 테두리). 완독은 체크 하나로 조용히 물러난다.
  const renderBook = (book: BibleBook, index: number) => {
    const resume = resumeMap?.get(book.book_number)
    const info = infoMap.get(book.book_number)
    const rate = info?.rate ?? 0
    const readChapters = info?.readChapters ?? null
    const totalChapters = info?.totalChapters ?? book.chapter_count
    const isComplete = rate >= 100
    const hasProgress = rate > 0

    const isCurrent = book.book_number === currentBookNumber
    const isNext = book.book_number === nextBookNumber
    const isHero = isCurrent && !isComplete
    const name = language === 'en' && book.book_name_en ? book.book_name_en : book.book_name_ko
    const abbrev = bookAbbrev(book.book_number, language)

    let metaText: string
    if (isComplete) {
      metaText = `${t.complete} · ${totalChapters}${t.chapterUnit}`
    } else if (readChapters !== null && readChapters > 0) {
      metaText = `${readChapters}/${totalChapters}${t.chapterUnit} · ${pctLabel(rate)}%`
    } else if (hasProgress) {
      // 완독한 장이 아직 없는 단계 — 비율 대신 "몇 장을 읽는 중"이라는 위치를 알려준다
      metaText = resume ? `${resume.chapter}${t.chapterUnit} ${t.reading}` : t.reading
    } else {
      metaText = `${isNext ? `${t.nextBook} · ` : ''}${totalChapters}${t.chapterUnit}`
    }

    const buttonProps = {
      // 필터 전환 시 앞에서부터 순차적으로 떠오르는 스태거 — 뒤쪽 칸은 딜레이 상한으로 묶는다
      style: { animationDelay: `${Math.min(index * 14, 320)}ms` },
      'aria-label': [name, isCurrent ? t.reading : null, isNext ? t.nextUp : null, metaText]
        .filter(Boolean)
        .join(' · '),
      onClick: () => onBookSelect(book.id, book.book_name_ko, resume),
      ...peekProps(peekBook(book)),
    }

    if (isHero) {
      // 이어 읽을 장 — 마지막으로 펼친 장. 기록이 없으면 다 읽은 장 다음
      const resumeChapter = resume?.chapter ?? Math.min((readChapters ?? 0) + 1, totalChapters)
      // 장 칸은 "몇 장을 읽었나"의 눈금이다(어느 장인지는 집계에 없다) — 앞에서부터 읽은 수만큼 채우고,
      // 이어 읽을 장이 그 뒤에 있으면 그 칸만 테두리로 짚는다. 장이 많은 책은 칸이 실처럼 가늘어져 막대로
      const filled = readChapters ?? 0
      return (
        <button key={book.id} {...buttonProps} className="book-cell book-hero">
          {/* 다크에서만 보이는 촛불 — 라이트에선 CSS가 숨겨 애니메이션도 돌지 않는다 */}
          <span className="book-hero__candle" aria-hidden="true">
            <CandleHero haloTint="#ffb05a" />
          </span>
          <span className="book-hero__head">
            <span className="book-hero__eyebrow">{t.nowReading}</span>
            <span className="book-hero__abbr">{abbrev}</span>
            <span className="book-hero__name">{name}</span>
          </span>
          <span className="book-hero__foot" aria-hidden="true">
            {totalChapters <= HERO_CELL_MAX ? (
              <span className="book-hero__cells">
                {Array.from({ length: totalChapters }, (_, i) => (
                  <span
                    key={i}
                    className={i < filled ? 'is-read' : i + 1 === resumeChapter ? 'is-now' : undefined}
                  />
                ))}
              </span>
            ) : (
              <span className="book-hero__track">
                <span style={{ width: `${gaugeWidth(rate)}%` }} />
              </span>
            )}
            <span className="book-hero__meta">{metaText}</span>
            <span className="book-hero__cta">
              {t.continueFrom(resumeChapter)}
              <span className="material-icons-round">arrow_forward</span>
            </span>
          </span>
        </button>
      )
    }

    return (
      <button
        key={book.id}
        {...buttonProps}
        className={`book-cell${isComplete ? ' is-complete' : ''}${isNext ? ' is-next' : ''}${
          hasProgress ? '' : ' is-untouched'
        }`}
      >
        {/* 오른쪽 위 표식 하나 — 완독 체크 / 읽는 중 진행 링 / 안 읽은 책은 권 번호 */}
        {isComplete ? (
          <span className="book-cell__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : hasProgress ? (
          <svg className="book-cell__ring" viewBox="0 0 26 26" aria-hidden="true">
            <circle cx="13" cy="13" r="10" />
            <circle
              cx="13"
              cy="13"
              r="10"
              className="book-cell__ring-fill"
              strokeDasharray={`${(RING_LEN * gaugeWidth(rate)) / 100} ${RING_LEN}`}
            />
          </svg>
        ) : (
          <span className="book-cell__no" aria-hidden="true">
            {book.book_number}
          </span>
        )}
        <span className="book-cell__abbr" aria-hidden="true">
          {abbrev}
        </span>
        <span className="book-cell__foot">
          <span className="book-cell__name">{name}</span>
          <span className="book-cell__meta" aria-hidden="true">
            {metaText}
          </span>
        </span>
      </button>
    )
  }

  // 목록 보기 — 장식을 걷어낸 통독 체크리스트. 순번·분수·게이지·행동 버튼이 세로로 정렬되어
  // 훑어 내리며 "다음에 읽을 책"을 고르는 용도다. 순번은 필터와 무관하게 성경 권 번호(1~66)를
  // 그대로 쓴다 — 신약 필터에서 40부터 시작하는 것이 정답이지, 매번 1부터 세면 위치 감각이 끊긴다.
  const renderListRow = (book: BibleBook, index: number) => {
    const resume = resumeMap?.get(book.book_number)
    const info = infoMap.get(book.book_number)
    const rate = info?.rate ?? 0
    const readChapters = info?.readChapters ?? 0
    const totalChapters = info?.totalChapters ?? book.chapter_count
    const isComplete = rate >= 100
    const hasProgress = rate > 0
    const isCurrent = book.book_number === currentBookNumber && !isComplete
    const isNext = book.book_number === nextBookNumber
    const bookName = language === 'en' && book.book_name_en ? book.book_name_en : book.book_name_ko

    // 이어 읽기 위치가 읽은 양보다 앞설 때만 연한 구간 — 격자·최근 읽은 책 칩과 같은 규칙
    const resumePct =
      resume && !isComplete && totalChapters > 0
        ? Math.max(0, Math.min(100, (resume.chapter / totalChapters) * 100))
        : 0
    const aheadPct = resumePct > rate + 1 ? resumePct : 0

    // 버튼 문구의 3단계: 완독(상태) / 진행 중(이어읽기) / 새 책(읽기).
    // 지금 읽는 책만 "4장 이어 읽기"처럼 갈 곳을 구체적으로 적는다
    const ctaLabel = isComplete
      ? t.complete
      : isCurrent && resume
        ? t.continueFrom(resume.chapter)
        : hasProgress
          ? t.ctaContinue
          : t.ctaStart

    return (
      <button
        key={book.id}
        type="button"
        className={`book-row${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}${
          isNext ? ' is-next' : ''
        }${hasProgress ? ' has-progress' : ''}`}
        // 격자와 같은 스태거 — 목록은 행이 많아 딜레이 상한을 더 낮게 묶는다
        style={{ animationDelay: `${Math.min(index * 12, 280)}ms` }}
        aria-label={[
          bookName,
          isCurrent ? t.reading : null,
          isNext ? t.nextUp : null,
          `${readChapters}/${totalChapters}${t.chapterUnit}`,
          isComplete ? t.complete : `${pctLabel(rate)}%`,
        ]
          .filter(Boolean)
          .join(' · ')}
        onClick={() => onBookSelect(book.id, book.book_name_ko, resume)}
        {...peekProps(peekBook(book))}
      >
        <span className="book-row__num" aria-hidden="true">
          {book.book_number}
        </span>
        <span className="book-row__avatar" aria-hidden="true">
          {isComplete ? (
            <span className="material-icons-round">check</span>
          ) : (
            <>
              {/* 읽는 중 — 약칭 둘레에 진행 링 */}
              {hasProgress && (
                <svg className="book-row__ring" viewBox="0 0 36 36">
                  <circle className="book-row__ring-track" cx="18" cy="18" r="16.5" pathLength={100} />
                  <circle
                    className="book-row__ring-fill"
                    cx="18"
                    cy="18"
                    r="16.5"
                    pathLength={100}
                    strokeDasharray={`${gaugeWidth(rate)} 100`}
                  />
                </svg>
              )}
              {bookAbbrev(book.book_number, language)}
            </>
          )}
        </span>
        <span className="book-row__body">
          <span className="book-row__name">
            {bookName}
            {isCurrent && <span className="book-row__badge">{t.reading}</span>}
            {isNext && <span className="book-row__badge book-row__badge--next">{t.nextUp}</span>}
          </span>
          <span className="book-row__meta" aria-hidden="true">
            {/* 분수는 "0/50장"까지 그대로 — 열이 흔들리지 않아야 표처럼 훑어진다 */}
            <span className="book-row__frac">
              {readChapters}/{totalChapters}
              {t.chapterUnit}
            </span>
            <span className="book-row__track">
              {aheadPct > 0 && (
                <span className="book-row__ahead" style={{ width: `${aheadPct}%` }} />
              )}
              <span className="book-row__fill" style={{ width: `${gaugeWidth(rate)}%` }} />
            </span>
            <span className="book-row__pct">{pctLabel(rate)}%</span>
          </span>
        </span>
        {/* 행 전체가 버튼이라 이건 눌림 대상이 아니라 "누르면 무슨 일이 생기나"의 라벨 */}
        <span className="book-row__cta" aria-hidden="true">
          {ctaLabel}
        </span>
        <svg className="book-row__chev" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9.5 6l6 6-6 6" />
        </svg>
      </button>
    )
  }

  if (isLoading) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="loading-spinner">
          <span className="material-icons-round spinning">refresh</span>
          <p style={{ marginTop: '1rem', color: 'var(--ig-secondary-text)' }}>
            {t.loadingBooks}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="no-results">
          <span className="material-icons-round">error_outline</span>
          <p>{t.errorBooks}</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Error: {error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!books || books.length === 0) {
    return (
      <div className="bible-books-section">
        <h2 className="section-title">{t.selectBook}</h2>
        <div className="no-results">
          <span className="material-icons-round">menu_book</span>
          <p>{t.noBooks}</p>
        </div>
      </div>
    )
  }

  const filteredBooks =
    books?.filter(b => b.book_number >= activeCategory.min && b.book_number <= activeCategory.max) || []

  // "안 읽은 책만" = 완독(100%)만 제외 — 읽다 만 책도 아직 다 읽은 책이 아니므로 남긴다
  const remainingBooks = filteredBooks.filter(b => (infoMap.get(b.book_number)?.rate ?? 0) < 100)
  // 칩은 걸러낼 것이 있을 때만 노출 — 완독한 책이 없으면 눌러도 아무 일도 없는 장식이 된다.
  // 칩이 숨은 상태에서 unreadOnly가 켜져 있어도 remaining === filtered라 목록은 그대로다
  const showUnreadChip = remainingBooks.length < filteredBooks.length
  const listBooks = unreadOnly ? remainingBooks : filteredBooks

  // 다음 읽을 책 — 여정 보기의 '다음 정거장'과 같은 규칙(지금 읽는 책 바로 뒤의 첫 미완독 책,
  // 지금 읽는 책이 이 목록에 없으면 첫 미완독 책). 격자·목록에서는 읽는 중인 책이 이미
  // 보이면 그게 곧 갈 곳이라, 그런 책이 없을 때만 '다음' 배지로 출발점을 집어 준다
  const nextBookNumber = (() => {
    if (!hasAnyProgress) return undefined
    const curIdx = filteredBooks.findIndex(b => b.book_number === currentBookNumber)
    if (curIdx >= 0 && (infoMap.get(filteredBooks[curIdx].book_number)?.rate ?? 0) < 100) return undefined
    return filteredBooks.slice(curIdx + 1).find(b => (infoMap.get(b.book_number)?.rate ?? 0) < 100)
      ?.book_number
  })()

  // 토글 안 상태 — 읽은 기록이 있으면 %(다 읽었으면 '완독'). 누르기 전에 양쪽이 어디까지 왔는지 보인다
  const renderTabStatus = (tm: Testament) => {
    const rate = testamentRate[tm]
    if (!hasAnyProgress || rate <= 0) return null
    return (
      <span className="testament-tab__status">{rate >= 100 ? t.testamentDone : `${pctLabel(rate)}%`}</span>
    )
  }

  return (
    <div className="bible-books-section" data-animate={interacted ? '' : undefined}>

      {/* 읽기 진행 요약 — 히어로(전체 진행률·격려·구약/신약으로 쪼갠 게이지), 지도 보기면 66권 지도가 아래에.
          링 3개 대신 "숫자 하나가 먼저 읽히고" 그 아래 구약/신약이 나뉘는 위계로 재구성했다.
          탭 안에 %를 넣지 않는 이유: 탭은 선택 컨트롤이고, 비활성 탭의 수치는 가려지기 때문 */}
      {summaryStats.length === 0 && progressPending && (
        <div className="reading-summary" data-scene={readingScene} aria-hidden="true">
          <div className="reading-summary__head">
            <div className="reading-summary__heading">
              <span className="bib-skel bib-skel--badge" />
              <span className="reading-summary__heading-text">
                <span className="bib-skel bib-skel--title" />
                <span className="bib-skel bib-skel--subtitle" />
              </span>
            </div>
            <span className="bib-skel bib-skel--toggle" />
          </div>
          <div className="reading-hero">
            <div className="reading-hero__top">
              <div className="reading-hero__stat">
                <span className="bib-skel bib-skel--label" />
                <span className="bib-skel bib-skel--number" />
                <span className="bib-skel bib-skel--cheer" />
              </div>
            </div>
            <div className="reading-hero__gauge">
              <span className="reading-hero__track">
                <span className="reading-hero__seg" />
              </span>
            </div>
          </div>
        </div>
      )}
      {summaryStats.length > 0 && overallStat && (
        <section className="reading-summary" data-scene={readingScene} aria-label={t.summaryTitle}>
          <div className="reading-summary__head">
            <div className="reading-summary__heading">
              <span className="reading-summary__badge" aria-hidden="true">
                <BookOpen size="1em" weight="duotone" color="currentColor" />
              </span>
              <span className="reading-summary__heading-text">
                <span className="reading-summary__title">{t.summaryTitle}</span>
                <span className="reading-summary__subtitle">{t.summarySubtitle}</span>
              </span>
            </div>

            {/* 보기 전환 — 진행률(히어로만, 구약/신약은 게이지 안) ↔ 지도(히어로 + 66권 히트맵) */}
            <div className="reading-summary__views" role="tablist" aria-label={t.summaryTitle}>
              <button
                type="button"
                role="tab"
                aria-selected={!showMap}
                className={`reading-summary__view${!showMap ? ' active' : ''}`}
                onClick={() => setShowMap(false)}
              >
                <ChartPieSlice size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
                {t.statsToggle}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={showMap}
                className={`reading-summary__view${showMap ? ' active' : ''}`}
                onClick={() => setShowMap(true)}
                onPointerEnter={preloadProgressMap}
                onTouchStart={preloadProgressMap}
                onFocus={preloadProgressMap}
              >
                <MapTrifold size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
                {t.mapToggle}
              </button>
            </div>
          </div>

          {/* 히어로 — 위는 "숫자 + 격려 | 삽화" 두 칸, 아래는 폭 전체를 쓰는 게이지.
              삽화를 배경으로 깔고 글자에 padding-right 를 주던 방식은 책이 오른쪽에서 잘리고
              글줄 폭이 눈에 안 보이는 규칙에 묶여 어색했다 — 삽화에 자기 칸을 주어 겹침을 없앴다.
              장 수는 게이지 양 끝(읽은 만큼 / 남은 만큼)으로 내려, 막대가 그 두 숫자의 그림이 된다 */}
          <div className="reading-hero" data-done={overallStat.rate >= 100 ? 'true' : undefined}>
            <div className="reading-hero__top">
              <div className="reading-hero__stat">
                <span className="reading-hero__label">
                  {cycle && cycle.current_cycle > 1 ? t.cycleLabel(cycle.current_cycle) : t.overallLabel}
                </span>
                <span
                  className="reading-hero__value"
                  aria-label={`${t.overallLabel} ${pctLabel(overallStat.rate)}%`}
                >
                  {pctLabel(overallStat.rate)}
                  <small>%</small>
                </span>
                {/* 마지막 어절 + 손모양 아이콘을 nowrap 한 덩어리로 — 크롬은 NBSP 뒤의 인라인 SVG 앞에서도
                    줄을 바꾸므로, 아이콘만 다음 줄로 떨어지지 않게 어절과 함께 움직이게 한다 */}
                <p className="reading-hero__cheer">
                  {cheerHead}
                  <span className="reading-hero__cheer-tail">
                    {cheerTail}
                    <HandsPraying size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
                  </span>
                </p>
              </div>
            </div>

            {/* 게이지 — 막대 하나를 구약·신약 장 수 비율(929 : 260)로 쪼갠다(2026-10-28, 구약/신약 타일 대체).
                전체 진행률이 "구약 얼마 + 신약 얼마"로 막대 하나에 그대로 보여 같은 정보를 두 번 그리지 않는다.
                칸 이름은 같은 flex 비율로 칸 바로 아래에 선다 — 책 이름 캡션(창세기·마태복음…)은 칸 이름과
                겹치는 정보라 넣지 않는다 */}
            <div className="reading-hero__gauge">
              <div className="reading-hero__meta">
                <span className="reading-hero__read">{overallStat.detail}</span>
                <span className="reading-hero__left">
                  {overallStat.total - overallStat.read > 0
                    ? `${t.remaining} ${(overallStat.total - overallStat.read).toLocaleString()}${overallStat.unit}`
                    : t.allComplete}
                </span>
              </div>
              <span className="reading-hero__track" aria-hidden="true">
                {testamentStats.map(stat => (
                  <span
                    key={stat.id}
                    className="reading-hero__seg"
                    data-full={stat.rate >= 100 ? 'true' : undefined}
                    style={{ flex: `${stat.total} 1 0` }}
                  >
                    <span className="reading-hero__fill" style={{ width: `${gaugeWidth(stat.rate)}%` }} />
                  </span>
                ))}
              </span>
              <div className="reading-hero__parts">
                {testamentStats.map(stat => (
                  <span
                    key={stat.id}
                    className="reading-hero__part"
                    style={{ flex: `${stat.total} 1 0` }}
                    aria-label={`${stat.label} ${pctLabel(stat.rate)}% · ${stat.detail}`}
                  >
                    <span className="reading-hero__part-label" aria-hidden="true">
                      {stat.id === 'ot' ? t.otShort : t.ntShort}
                    </span>
                    <span className="reading-hero__part-value" aria-hidden="true">
                      {pctLabel(stat.rate)}
                      <small>%</small>
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* 완독한 회차 — 통독 횟수와 다음 회차 시작. 버튼은 휴지 상태라 중립색 */}
            {cycle?.current_completed && (
              <div className="reading-hero__cycle">
                <span className="reading-hero__cycle-done">{t.cycleDone(cycle.completed_count)}</span>
                <button
                  type="button"
                  className="reading-hero__cycle-btn"
                  onClick={handleStartCycle}
                  disabled={startCycle.isPending}
                >
                  {t.cycleStart(cycle.current_cycle + 1)}
                </button>
              </div>
            )}
          </div>

          {showMap && (
            <BibleProgressMap books={books} infoMap={infoMap} onBookSelect={handleMapSelect} />
          )}
        </section>
      )}

      {/* (구 "최근 읽은 책" 슬라이더 자리 — 이어 읽기 카드·통독표 마커와 역할이 겹쳐 제거.
          책별 이어 읽기 진입은 통독표에서 책을 탭하면 동일하게 동작한다) */}

      {/* "책 선택" 제목 + 구약/신약 토글 + 분류 칩을 카드 하나로 묶는다 — 칩은 토글에 종속.
          토글 전환 시 key가 바뀌며 칩들이 순차적으로 슬라이드 인 된다. */}
      {/* 완독 축하 — sticky 탭 바깥에 둬 스크롤을 따라다니지 않게 한다 */}
      {doneSide && celebrateKey && (
        <TestamentCelebrate
          key={celebrateKey}
          storageKey={celebrateKey}
          title={doneSide === 'OT' ? t.celebrateOT : t.celebrateNT}
          next={doneSide === 'OT' ? t.celebrateOTNext : t.celebrateNTNext}
          closeLabel={t.close}
        />
      )}
      <div className="book-nav">
        <div className="book-nav__head">
          <h2 className="section-title">{t.selectBook}</h2>
          <div className="testament-tabs" role="tablist" data-active={testament}>
            <span className="testament-thumb" aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={testament === 'OT'}
              className={`testament-tab${testament === 'OT' ? ' active' : ''}`}
              onClick={() => handleTestamentChange('OT')}
            >
              <span className="testament-tab__label">{t.oldTestament}</span>
              {renderTabStatus('OT')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={testament === 'NT'}
              className={`testament-tab${testament === 'NT' ? ' active' : ''}`}
              onClick={() => handleTestamentChange('NT')}
            >
              <span className="testament-tab__label">{t.newTestament}</span>
              {renderTabStatus('NT')}
            </button>
          </div>
        </div>

        <div className="book-filter" key={testament} data-dir={dir}>
          {categories.map((cat, i) => {
            const rate = categoryStats.get(`${cat.min}-${cat.max}`) ?? 0
            const showRate = hasAnyProgress
            const done = showRate && rate >= 100
            return (
              <button
                key={cat.id}
                type="button"
                className={`book-filter-chip${filter === cat.id ? ' active' : ''}`}
                style={{
                  animationDelay: `${i * 45}ms`,
                  // 분류 이름 글자가 진행률만큼 왼쪽부터 장르색으로 차오른다('전체'는 브랜드 블루)
                  '--chip-color': cat.colorVar ? `var(${cat.colorVar})` : 'var(--brand)',
                  // 경계가 앞뒤로 살짝 번지므로 완독·0%는 번짐이 글자에 닿지 않게 바깥으로 민다
                  '--chip-fill': `${!showRate || rate <= 0 ? -10 : done ? 110 : gaugeWidth(rate)}%`,
                } as CSSProperties}
                onClick={() => {
                  setInteracted(true)
                  setFilter(cat.id)
                }}
              >
                <span className="book-filter-chip__label">
                  {language === 'en' ? cat.labelEn : cat.label}
                </span>
                {done ? (
                  <span className="material-icons-round book-filter-chip__done" aria-label={t.testamentDone}>
                    check
                  </span>
                ) : (
                  showRate && <span className="book-filter-chip__pct">{pctLabel(rate)}%</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* key로 탭·칩 변경마다 리마운트 — 제목 페이드 + 정거장/카드 스태거 애니메이션이 다시 재생된다 */}
      <div className="testament-section" key={`${testament}-${filter}`}>
        <div className="testament-head">
          <h3 className="testament-title">
            {activeCategory.id === 'all'
              ? (testament === 'OT' ? t.oldTestament : t.newTestament)
              : (language === 'en' ? activeCategory.labelEn : activeCategory.label)}
            {' '}({filteredBooks.length})
          </h3>
          {/* 여정/격자/목록 보기 전환 — 취향 문제라 강요하지 않고 선택을 기기에 기억한다 */}
          <div
            className="view-toggle"
            role="group"
            aria-label={`${t.journeyView} / ${t.gridView} / ${t.listView}`}
          >
            <button
              type="button"
              className={`view-toggle__btn${viewMode === 'journey' ? ' active' : ''}`}
              aria-pressed={viewMode === 'journey'}
              aria-label={t.journeyView}
              title={t.journeyView}
              onClick={() => handleViewModeChange('journey')}
            >
              <span className="material-icons-round">route</span>
            </button>
            <button
              type="button"
              className={`view-toggle__btn${viewMode === 'grid' ? ' active' : ''}`}
              aria-pressed={viewMode === 'grid'}
              aria-label={t.gridView}
              title={t.gridView}
              onClick={() => handleViewModeChange('grid')}
            >
              <span className="material-icons-round">grid_view</span>
            </button>
            <button
              type="button"
              className={`view-toggle__btn${viewMode === 'list' ? ' active' : ''}`}
              aria-pressed={viewMode === 'list'}
              aria-label={t.listView}
              title={t.listView}
              onClick={() => handleViewModeChange('list')}
            >
              <span className="material-icons-round">view_list</span>
            </button>
          </div>
        </div>

        {viewMode === 'journey' ? (
          <BookJourneyPath
            books={filteredBooks}
            infoMap={infoMap}
            resumeMap={resumeMap}
            onBookSelect={onBookSelect}
            // 전체 필터일 때만 분류 경계 이정표 — 분류 필터 중에는 칩이 그 역할을 이미 한다
            milestones={
              activeCategory.id === 'all'
                ? categories
                    .filter(c => c.id !== 'all')
                    .map(c => ({
                      id: c.id,
                      label: language === 'en' ? c.labelEn : c.label,
                      min: c.min,
                      max: c.max,
                    }))
                : undefined
            }
            showRates={hasAnyProgress}
            language={language}
            peekProps={book => peekProps(peekBook(book))}
          />
        ) : viewMode === 'list' ? (
          <>
            {showUnreadChip && (
              <div className="list-tools">
                <button
                  type="button"
                  className={`unread-chip${unreadOnly ? ' active' : ''}`}
                  aria-pressed={unreadOnly}
                  onClick={() => {
                    setInteracted(true)
                    setUnreadOnly(v => !v)
                  }}
                >
                  {t.unreadOnly}
                  <span className="unread-chip__count">{remainingBooks.length}</span>
                </button>
              </div>
            )}
            <div className="books-list">
              {listBooks.length > 0 ? (
                listBooks.map(renderListRow)
              ) : (
                // 이 분류를 전부 완독한 순간 — 이모지 대신 완독 인장 + 분량 + 원래 목록으로 돌아가는 길
                <div className="books-list__empty" role="status">
                  <span className="books-list__empty-seal" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.2 4.2L19 7" />
                    </svg>
                  </span>
                  <p className="books-list__empty-title">
                    <span className="books-list__empty-cat">
                      {activeCategory.id === 'all'
                        ? (testament === 'OT' ? t.oldTestament : t.newTestament)
                        : (language === 'en' ? activeCategory.labelEn : activeCategory.label)}
                    </span>
                    {t.allDone}
                  </p>
                  <p className="books-list__empty-meta">
                    {t.allDoneMeta(
                      filteredBooks.length,
                      filteredBooks.reduce((sum, b) => sum + (b.chapter_count ?? 0), 0),
                    )}
                  </p>
                  <button
                    type="button"
                    className="books-list__empty-action"
                    onClick={() => {
                      setInteracted(true)
                      setUnreadOnly(false)
                    }}
                  >
                    {t.showAllBooks}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="books-grid">
            {filteredBooks.map(renderBook)}
          </div>
        )}
      </div>
      {peekNode}
    </div>
  )
}

export default BookSelector
