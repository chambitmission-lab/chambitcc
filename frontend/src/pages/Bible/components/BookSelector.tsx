import { useCallback, useMemo, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'
import type { ReadingProgressResponse, ResumePosition } from '../../../api/bibleReading'
import { parseApiDate } from '../../../utils/dateUtils'
import BibleProgressMap from './BibleProgressMap'
import BookJourneyPath from './BookJourneyPath'
import { aggregateRange, buildBookInfoMap } from './readingProgressInfo'
import { bookAbbrev } from './bibleBookAbbrev'
import {
  BookOpen,
  ChartPieSlice,
  Cross,
  HandsPraying,
  MapTrifold,
  Scroll,
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
const VIEW_MODE_KEY = 'bible-book-view-mode'

const loadViewMode = (): BookViewMode => {
  try {
    const saved = localStorage.getItem(VIEW_MODE_KEY)
    return saved === 'grid' || saved === 'list' ? saved : 'journey'
  } catch {
    return 'journey'
  }
}

const OT_CATEGORIES: { id: string; label: string; labelEn: string; min: number; max: number }[] = [
  { id: 'all', label: '전체', labelEn: 'All', min: 1, max: 39 },
  { id: 'law', label: '모세오경', labelEn: 'Pentateuch', min: 1, max: 5 },
  { id: 'history', label: '역사서', labelEn: 'History', min: 6, max: 17 },
  { id: 'poetry', label: '시가서', labelEn: 'Wisdom', min: 18, max: 22 },
  { id: 'prophets', label: '선지서', labelEn: 'Prophets', min: 23, max: 39 },
]

const NT_CATEGORIES: { id: string; label: string; labelEn: string; min: number; max: number }[] = [
  { id: 'all', label: '전체', labelEn: 'All', min: 40, max: 66 },
  { id: 'gospels', label: '복음서', labelEn: 'Gospels', min: 40, max: 43 },
  { id: 'acts', label: '사도행전', labelEn: 'Acts', min: 44, max: 44 },
  { id: 'epistles', label: '서신서', labelEn: 'Epistles', min: 45, max: 65 },
  { id: 'revelation', label: '요한계시록', labelEn: 'Revelation', min: 66, max: 66 },
]

/** 0보다 크면 최소 1%로 올려 표기 — 읽기 시작했는데 "0%"로 보이는 일을 막는다 */
const pctLabel = (rate: number) => (rate > 0 ? Math.max(1, Math.round(rate)) : 0)

/** 게이지 최소 두께 — 0.4% 같은 값도 눈에 보이게 */
const gaugeWidth = (rate: number) => (rate > 0 ? Math.max(3, rate) : 0)

const BookSelector = ({ books, isLoading, error, onBookSelect, resumeMap, progress, progressPending }: BookSelectorProps) => {
  const { language } = useLanguage()
  const [testament, setTestament] = useState<Testament>('OT')
  const [filter, setFilter] = useState<string>('all')
  // 서브 필터가 어느 방향에서 슬라이드 인 될지 — OT→NT는 우측(forward), NT→OT는 좌측(back)에서 들어온다
  const [dir, setDir] = useState<'forward' | 'back'>('forward')
  const [showMap, setShowMap] = useState(false)
  // 책 목록 보기 방식 — 여정 경로(기본)와 예전 격자 중 취향대로. 선택은 기기에 기억된다
  const [viewMode, setViewMode] = useState<BookViewMode>(loadViewMode)

  // 목록 보기 전용 "안 읽은 책만" 필터 — 통독 후반부에 남은 책만 추려 보는 용도.
  // 세션 한정 상태로 둔다: 기기에 기억하면 다음 방문에 목록이 비어 보이는 이유를 찾기 어렵다
  const [unreadOnly, setUnreadOnly] = useState(false)

  const handleViewModeChange = (mode: BookViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode)
    } catch {
      // 저장 실패(시크릿 모드 등)해도 이번 세션 동안은 상태로 동작한다
    }
  }

  const infoMap = useMemo(() => buildBookInfoMap(books, progress), [books, progress])

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
      loadingBooks: '성경 책 목록을 불러오는 중...',
      errorBooks: '성경 책 목록을 불러오는데 실패했습니다. 백엔드 API를 확인해주세요.',
      noBooks: '성경 책 데이터가 없습니다.',
      summaryTitle: '성경 읽기 현황',
      summarySubtitle: '말씀을 읽으며 믿음이 자라가요',
      overallLabel: '전체 진행률',
      remaining: '남은',
      allComplete: '성경 전체를 완독했어요 🎉',
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
      allDone: '이 분류는 모두 완독했어요 🎉',
    },
    en: {
      selectBook: 'Select Book',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      loadingBooks: 'Loading bible books...',
      errorBooks: 'Failed to load bible books. Please check backend API.',
      noBooks: 'No bible book data available.',
      summaryTitle: 'Bible reading',
      summarySubtitle: 'Faith grows as you read the Word',
      overallLabel: 'Overall progress',
      remaining: 'Remaining',
      allComplete: 'Whole Bible complete 🎉',
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
      allDone: 'Everything here is complete 🎉',
    }
  }

  const t = texts[language]

  const handleTestamentChange = (next: Testament) => {
    if (next === testament) return
    setDir(next === 'NT' ? 'forward' : 'back')
    setTestament(next)
    setFilter('all')
  }

  const categories = testament === 'OT' ? OT_CATEGORIES : NT_CATEGORIES
  const activeCategory = categories.find(c => c.id === filter) ?? categories[0]

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

  // 격자 보기 — 성경통독표: 괘선으로 나뉜 표에 도장이 쌓인다.
  // 색은 먹(ink)+인주 둘뿐, 진행률은 게이지가 아니라 인장의 농도로 말한다.
  const renderBook = (book: BibleBook, index: number) => {
    const resume = resumeMap?.get(book.book_number)
    const info = infoMap.get(book.book_number)
    const rate = info?.rate ?? 0
    const readChapters = info?.readChapters ?? null
    const totalChapters = info?.totalChapters ?? book.chapter_count
    const isComplete = rate >= 100
    const hasProgress = rate > 0

    const isCurrent = book.book_number === currentBookNumber

    let metaText: string | null = null
    if (isComplete) {
      metaText = `${t.complete} · ${totalChapters}${t.chapterUnit}`
    } else if (readChapters !== null && readChapters > 0) {
      // 분수만으론 "얼마나 남았나"가 한눈에 안 잡혀 %를 함께 — 아래 게이지의 눈금 역할
      metaText = `${readChapters}/${totalChapters}${t.chapterUnit} · ${pctLabel(rate)}%`
    } else if (hasProgress) {
      // 완독한 장이 아직 없는 단계 — 비율 대신 "몇 장을 읽는 중"이라는 위치를 알려준다
      metaText = resume ? `${resume.chapter}${t.chapterUnit} ${t.reading}` : t.reading
    }

    // 인장의 농도 = 진행률 (읽을수록 인주가 진해진다). 완독은 선명한 도장
    const stampOpacity = isComplete ? 1 : hasProgress ? 0.13 + rate * 0.0045 : undefined
    // 도장마다 손으로 찍은 듯 살짝 다른 기울기 — book_number 기반이라 리렌더에도 흔들리지 않는다
    const stampTilt = ((book.book_number % 5) - 2) * 3.5

    // 이어 읽기 위치가 읽은 양보다 앞설 때만 연한 구간으로 이어 붙인다 (최근 읽은 책 칩과 같은 규칙)
    const resumePct =
      resume && rate < 100 && totalChapters > 0
        ? Math.max(0, Math.min(100, (resume.chapter / totalChapters) * 100))
        : 0
    const aheadPct = resumePct > rate + 1 ? resumePct : 0

    return (
      <button
        key={book.id}
        className={`book-cell${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}${
          hasProgress ? '' : ' is-untouched'
        }`}
        // 필터 전환 시 앞에서부터 순차적으로 떠오르는 스태거 — 뒤쪽 칸은 딜레이 상한으로 묶는다
        style={{ animationDelay: `${Math.min(index * 14, 320)}ms` }}
        aria-label={[
          language === 'en' && book.book_name_en ? book.book_name_en : book.book_name_ko,
          isCurrent ? t.reading : null,
          metaText,
        ]
          .filter(Boolean)
          .join(' · ')}
        onClick={() => onBookSelect(book.id, book.book_name_ko, resume)}
      >
        {/* 지금 읽는 책은 표 전체에서 딱 한 칸 — 배지 하나로 시선을 먼저 잡는다 */}
        {isCurrent && !isComplete && <span className="book-cell__badge">{t.reading}</span>}
        <span className="book-cell__top">
          {/* 인장은 옅은 원반(할로) 위에 — 카드 왼편의 시각적 닻 */}
          <span className="book-stamp-halo" aria-hidden="true">
            <span
              className={`book-stamp${hasProgress ? ' inked' : ''}`}
              style={{
                ['--stamp-tilt' as string]: `${stampTilt}deg`,
                ...(stampOpacity !== undefined && !isComplete ? { opacity: stampOpacity } : {}),
              }}
            >
              {bookAbbrev(book.book_number, language)}
            </span>
          </span>
          <span className="book-cell__text">
            <span className="book-cell__name">
              {language === 'en' && book.book_name_en ? book.book_name_en : book.book_name_ko}
            </span>
            {/* 빈 카드도 줄 높이를 유지 — 카드 높이가 들쭉날쭉해지지 않게 */}
            <span className="book-cell__meta" aria-hidden="true">
              {metaText ?? ' '}
            </span>
          </span>
        </span>
        {/* 인장 농도는 눈대중이라 "얼마나 남았나"까지는 못 준다 — 카드 하단 게이지+%가 그 몫.
            안 읽은 책은 게이지를 그리지 않되 줄 높이는 남겨 카드 크기를 맞춘다 */}
        <span className="book-cell__gauge" aria-hidden="true">
          {hasProgress && (
            <>
              <span className="book-progress-track">
                {aheadPct > 0 && (
                  <span className="book-progress-ahead" style={{ width: `${aheadPct}%` }} />
                )}
                <span className="book-progress-fill" style={{ width: `${gaugeWidth(rate)}%` }} />
              </span>
              <span className="book-cell__pct">{pctLabel(rate)}%</span>
            </>
          )}
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
    const bookName = language === 'en' && book.book_name_en ? book.book_name_en : book.book_name_ko

    // 이어 읽기 위치가 읽은 양보다 앞설 때만 연한 구간 — 격자·최근 읽은 책 칩과 같은 규칙
    const resumePct =
      resume && !isComplete && totalChapters > 0
        ? Math.max(0, Math.min(100, (resume.chapter / totalChapters) * 100))
        : 0
    const aheadPct = resumePct > rate + 1 ? resumePct : 0

    // 버튼 문구의 3단계: 완독(상태) / 진행 중(이어읽기) / 새 책(읽기)
    const ctaLabel = isComplete ? t.complete : hasProgress ? t.ctaContinue : t.ctaStart

    return (
      <button
        key={book.id}
        type="button"
        className={`book-row${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}${
          hasProgress ? ' has-progress' : ''
        }`}
        // 격자와 같은 스태거 — 목록은 행이 많아 딜레이 상한을 더 낮게 묶는다
        style={{ animationDelay: `${Math.min(index * 12, 280)}ms` }}
        aria-label={[
          bookName,
          isCurrent ? t.reading : null,
          `${readChapters}/${totalChapters}${t.chapterUnit}`,
          isComplete ? t.complete : `${pctLabel(rate)}%`,
        ]
          .filter(Boolean)
          .join(' · ')}
        onClick={() => onBookSelect(book.id, book.book_name_ko, resume)}
      >
        <span className="book-row__num" aria-hidden="true">
          {book.book_number}
        </span>
        <span className="book-row__avatar" aria-hidden="true">
          {isComplete ? (
            <span className="material-icons-round">check</span>
          ) : (
            bookAbbrev(book.book_number, language)
          )}
        </span>
        <span className="book-row__body">
          <span className="book-row__name">
            {bookName}
            {isCurrent && <span className="book-row__badge">{t.reading}</span>}
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

  return (
    <div className="bible-books-section">
      <h2 className="section-title">{t.selectBook}</h2>

      {/* 읽기 진행 요약 — 히어로(전체 진행률·격려·게이지) + 구약/신약 타일, 또는 66권 지도.
          링 3개 대신 "숫자 하나가 먼저 읽히고" 그 아래 구약/신약이 나뉘는 위계로 재구성했다.
          탭 안에 %를 넣지 않는 이유: 탭은 선택 컨트롤이고, 비활성 탭의 수치는 가려지기 때문 */}
      {summaryStats.length === 0 && progressPending && (
        <div className="reading-summary" aria-hidden="true">
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
            <span className="bib-skel bib-skel--label" />
            <span className="bib-skel bib-skel--number" />
            <span className="bib-skel bib-skel--cheer" />
            <span className="reading-hero__track" />
          </div>
          <div className="reading-tiles">
            {[0, 1].map(i => (
              <div className="reading-tile" key={i}>
                <span className="bib-skel bib-skel--tile" />
              </div>
            ))}
          </div>
        </div>
      )}
      {summaryStats.length > 0 && overallStat && (
        <section className="reading-summary" aria-label={t.summaryTitle}>
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

            {/* 보기 전환 — 진행률(구약/신약 타일) ↔ 지도(66권 히트맵). 히어로는 둘 다에서 유지 */}
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
              >
                <MapTrifold size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
                {t.mapToggle}
              </button>
            </div>
          </div>

          {/* 히어로 — 전체 진행률 한 숫자 + 장 수 칩 + 격려 한 줄 + 게이지.
              배경은 우측에 펼친 성경 삽화(라이트/다크 각 1장, CSS background) — 왼쪽은 스크림으로 비워 글자 자리 확보 */}
          <div className="reading-hero" data-done={overallStat.rate >= 100 ? 'true' : undefined}>
            <span className="reading-hero__label">{t.overallLabel}</span>
            <div className="reading-hero__row">
              <span
                className="reading-hero__value"
                aria-label={`${t.overallLabel} ${pctLabel(overallStat.rate)}%`}
              >
                {pctLabel(overallStat.rate)}
                <small>%</small>
              </span>
              <span className="reading-hero__chip">{overallStat.detail}</span>
            </div>
            {/* 마지막 어절 + 손모양 아이콘을 nowrap 한 덩어리로 — 크롬은 NBSP 뒤의 인라인 SVG 앞에서도
                줄을 바꾸므로, 아이콘만 다음 줄로 떨어지지 않게 어절과 함께 움직이게 한다 */}
            <p className="reading-hero__cheer">
              {cheerHead}
              <span className="reading-hero__cheer-tail">
                {cheerTail}
                <HandsPraying size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
              </span>
            </p>
            <div className="reading-hero__gauge">
              <span className="reading-hero__track" aria-hidden="true">
                <span
                  className="reading-hero__fill"
                  style={{ width: `${gaugeWidth(overallStat.rate)}%` }}
                />
              </span>
              <span className="reading-hero__left">
                {overallStat.total - overallStat.read > 0
                  ? `${t.remaining} ${(overallStat.total - overallStat.read).toLocaleString()}${overallStat.unit}`
                  : t.allComplete}
              </span>
            </div>
          </div>

          {/* 구약/신약 타일 — 색으로 나누지 않고(전부 브랜드 블루) 두루마리·십자가 아이콘으로 구분한다.
              전체 수치는 히어로에 이미 있으므로 타일에서 반복하지 않는다 */}
          {!showMap && (
            <div className="reading-tiles">
              {summaryStats
                .filter(stat => stat.id !== 'all')
                .map(stat => (
                  <div
                    className="reading-tile"
                    key={stat.id}
                    data-stat={stat.id}
                    role="img"
                    aria-label={`${stat.label} ${pctLabel(stat.rate)}% · ${stat.detail}`}
                  >
                    <div className="reading-tile__head" aria-hidden="true">
                      <span className="reading-tile__icon">
                        {stat.id === 'ot' ? (
                          <Scroll size="1em" weight="duotone" color="currentColor" />
                        ) : (
                          <Cross size="1em" weight="duotone" color="currentColor" />
                        )}
                      </span>
                      <span className="reading-tile__text">
                        <span className="reading-tile__label">{stat.label}</span>
                        <span className="reading-tile__value">
                          {pctLabel(stat.rate)}
                          <small>%</small>
                        </span>
                        <span className="reading-tile__detail">{stat.detail}</span>
                      </span>
                    </div>
                    <span className="reading-tile__track" aria-hidden="true">
                      <span
                        className="reading-tile__fill"
                        style={{ width: `${gaugeWidth(stat.rate)}%` }}
                      />
                    </span>
                  </div>
                ))}
            </div>
          )}

          {showMap && (
            <BibleProgressMap books={books} infoMap={infoMap} onBookSelect={handleMapSelect} />
          )}
        </section>
      )}

      {/* (구 "최근 읽은 책" 슬라이더 자리 — 이어 읽기 카드·통독표 마커와 역할이 겹쳐 제거.
          책별 이어 읽기 진입은 통독표에서 책을 탭하면 동일하게 동작한다) */}

      {/* 구약/신약 탭 + 서브 카테고리 칩 — 한 패널로 묶어 "칩은 탭에 종속"임을 시각적으로 표현.
          탭 전환 시 key가 바뀌며 칩들이 순차적으로 슬라이드 인 된다. */}
      <div className="book-nav">
        <div className="testament-tabs" role="tablist" data-active={testament}>
          {/* 슬라이딩 선택 마커 — 트랙 위를 부드럽게 이동한다 */}
          <span className="testament-marker" aria-hidden="true" />
          <button
            type="button"
            role="tab"
            aria-selected={testament === 'OT'}
            className={`testament-tab${testament === 'OT' ? ' active' : ''}`}
            onClick={() => handleTestamentChange('OT')}
          >
            <span className="material-icons-round testament-tab__icon">auto_stories</span>
            <span className="testament-tab__label">{t.oldTestament}</span>
            <span className="testament-tab__count">39</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={testament === 'NT'}
            className={`testament-tab${testament === 'NT' ? ' active' : ''}`}
            onClick={() => handleTestamentChange('NT')}
          >
            <span className="material-icons-round testament-tab__icon">menu_book</span>
            <span className="testament-tab__label">{t.newTestament}</span>
            <span className="testament-tab__count">27</span>
          </button>
        </div>

        <div className="book-filter" key={testament} data-dir={dir}>
          {categories.map((cat, i) => {
            const rate = categoryStats.get(`${cat.min}-${cat.max}`) ?? 0
            const showRate = hasAnyProgress
            return (
              <button
                key={cat.id}
                type="button"
                className={`book-filter-chip${filter === cat.id ? ' active' : ''}`}
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => setFilter(cat.id)}
              >
                {/* 칩 배경을 진행률만큼 채워, 숫자를 읽지 않아도 덜 읽은 분류가 드러나게 */}
                {showRate && (
                  <span
                    className="book-filter-chip__fill"
                    aria-hidden="true"
                    style={{ width: `${gaugeWidth(rate)}%` }}
                  />
                )}
                <span className="book-filter-chip__label">
                  {language === 'en' ? cat.labelEn : cat.label}
                </span>
                {showRate && <span className="book-filter-chip__pct">{pctLabel(rate)}%</span>}
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
          />
        ) : viewMode === 'list' ? (
          <>
            {showUnreadChip && (
              <div className="list-tools">
                <button
                  type="button"
                  className={`unread-chip${unreadOnly ? ' active' : ''}`}
                  aria-pressed={unreadOnly}
                  onClick={() => setUnreadOnly(v => !v)}
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
                <div className="books-list__empty">{t.allDone}</div>
              )}
            </div>
          </>
        ) : (
          <div className="books-grid">
            {filteredBooks.map(renderBook)}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookSelector
