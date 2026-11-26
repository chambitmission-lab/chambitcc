import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'
import type { ReadingProgressResponse, ResumePosition } from '../../../api/bibleReading'
import { safeSessionStorage, safeStorage } from '../../../utils/safeStorage'
import BookJourneyPath from './BookJourneyPath'
import { useBookIntroPeek, type PeekBook } from '../../../components/bible/BookIntroPeek'
import { BOOK_GENRES, genreStyle } from '../../../components/bible/bookGenre'
import { aggregateRange, buildBookInfoMap, gaugeWidth, pctLabel } from './readingProgressInfo'
import { BOOK_SELECTOR_TEXTS } from './bookSelector/bookSelectorTexts'
import BookGridCell from './bookSelector/BookGridCell'
import BookListRow from './bookSelector/BookListRow'
import ReadingSummaryCard from './bookSelector/ReadingSummaryCard'
import {
  findCurrentBookNumber,
  findNextBookNumber,
  pickAutoTestament,
  pickDoneSide,
  type Testament,
} from './bookSelector/readingPosition'

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

type BookViewMode = 'journey' | 'grid' | 'list'

/** 보기 방식 선택 저장 키 — 여정(경로)·격자·목록은 취향 문제라 사용자별로 기억한다 */
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
  // 기본은 리스트형. 직접 고른 보기(지도·카드)는 저장돼 그대로 유지된다
  return saved === 'journey' || saved === 'grid' ? saved : 'list'
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

  // 책 선택 툴바가 앱바 아래 붙었는지(PC 3안 — 판 없는 툴바, 붙었을 때만 캔버스색 블러 바탕).
  // CSS 만으론 sticky 고정 상태를 알 수 없어 툴바 바로 위 1px 파수꾼이 앱바(56px) 위로 사라지면 붙은 것으로 본다
  const navRef = useRef<HTMLDivElement>(null)
  const navSentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const nav = navRef.current
    const sentinel = navSentinelRef.current
    if (!nav || !sentinel || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => {
        // 파수꾼이 위로 벗어났을 때만 붙은 것 — 아래로 벗어난 경우(첫 화면 밖)는 아직 안 붙은 상태
        const stuck = !entry.isIntersecting && entry.boundingClientRect.top < 57
        nav.toggleAttribute('data-stuck', stuck)
      },
      { rootMargin: '-57px 0px 0px 0px', threshold: 0 },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  // 책 목록 보기 방식 — 여정 경로(기본)와 예전 격자 중 취향대로. 선택은 기기에 기억된다
  const [viewMode, setViewMode] = useState<BookViewMode>(loadViewMode)

  // 카드·목록 보기 공용 "안 읽은 책만" 필터 — 통독 후반부에 남은 책만 추려 보는 용도.
  // 여정 보기는 경로가 끊기면 안 되므로 제외.
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
  // 보기를 바꿔도 강조되는 책이 달라지지 않는다(규칙은 readingPosition 이 단일 출처).
  const currentBookNumber = useMemo(() => findCurrentBookNumber(books, resumeMap), [books, resumeMap])

  const t = BOOK_SELECTOR_TEXTS[language]

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
  const autoTestament = pickAutoTestament(currentBookNumber, otDone, ntDone)
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
  const doneSide = pickDoneSide(otDone, ntDone)
  // "본 적 있나"는 TestamentCelebrate 가 마운트 시점 값으로 고정한다 — (쪽, 회차)가 바뀌면 key 로 다시 마운트
  const celebrateKey = doneSide ? celebratedKey(doneSide, cycleNo) : null

  const handleMapSelect = useCallback(
    (book: BibleBook) => {
      onBookSelect(book.id, book.book_name_ko, resumeMap?.get(book.book_number))
    },
    [onBookSelect, resumeMap]
  )

  // 격자 칸·목록 행이 함께 받는 재료 — 책 하나의 진행 정보와 강조 여부.
  // 그리는 일은 BookGridCell·BookListRow 가 맡고, 여기서는 "어느 책이 지금/다음인가"만 정한다
  const cellProps = (book: BibleBook, index: number) => {
    const resume = resumeMap?.get(book.book_number)
    return {
      book,
      index,
      info: infoMap.get(book.book_number),
      resume,
      isCurrent: book.book_number === currentBookNumber,
      isNext: book.book_number === nextBookNumber,
      language,
      t,
      onSelect: () => onBookSelect(book.id, book.book_name_ko, resume),
      peek: peekProps(peekBook(book)),
    }
  }
  const renderBook = (book: BibleBook, index: number) => <BookGridCell key={book.id} {...cellProps(book, index)} />
  const renderListRow = (book: BibleBook, index: number) => <BookListRow key={book.id} {...cellProps(book, index)} />

  // 목록 보기의 분류 머리말 — 전체 필터일 때만 장르가 바뀌는 자리에 한 줄(모세오경·역사서…).
  // 분류 필터 중에는 칩이 그 역할을 이미 한다
  const renderListRows = (list: BibleBook[]) => {
    if (activeCategory.id !== 'all') return list.map(renderListRow)
    const groups = categories.filter(c => c.id !== 'all')
    let lastGroup: string | null = null
    const nodes: ReactNode[] = []
    list.forEach((book, index) => {
      const group = groups.find(c => book.book_number >= c.min && book.book_number <= c.max)
      if (group && group.id !== lastGroup) {
        lastGroup = group.id
        nodes.push(
          <div
            key={`group-${group.id}`}
            className="books-list__group"
            style={genreStyle(group.min)}
            aria-hidden="true"
          >
            {language === 'en' ? group.labelEn : group.label}
          </div>,
        )
      }
      nodes.push(renderListRow(book, index))
    })
    return nodes
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
  const shownBooks = unreadOnly ? remainingBooks : filteredBooks

  // "안 읽은 책만" 칩과 전부 완독 빈 상태 — 카드·목록 보기가 함께 쓴다
  const unreadTools =
    showUnreadChip && (
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
    )

  const allDoneState = (
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
  )

  // 다음 읽을 책 — 여정 보기의 '다음 정거장'과 같은 규칙(지금 읽는 책 바로 뒤의 첫 미완독 책,
  // 지금 읽는 책이 이 목록에 없으면 첫 미완독 책). 격자·목록에서는 읽는 중인 책이 이미
  // 보이면 그게 곧 갈 곳이라, 그런 책이 없을 때만 '다음' 배지로 출발점을 집어 준다
  const nextBookNumber = hasAnyProgress
    ? findNextBookNumber(filteredBooks, infoMap, currentBookNumber, {
        skipWhileReading: true,
        startOverWhenAbsent: true,
      })
    : undefined

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

      <ReadingSummaryCard
        books={books}
        infoMap={infoMap}
        progress={progress}
        progressPending={progressPending}
        currentBookNumber={currentBookNumber}
        onMapSelect={handleMapSelect}
        t={t}
      />

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
      <div ref={navSentinelRef} className="book-nav__sentinel" aria-hidden="true" />
      <div ref={navRef} className="book-nav">
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
            {unreadTools}
            <div className="books-list">
              {shownBooks.length > 0 ? (
                renderListRows(shownBooks)
              ) : (
                allDoneState
              )}
            </div>
          </>
        ) : (
          <>
            {unreadTools}
            {shownBooks.length > 0 ? (
              <div className="books-grid">
                {shownBooks.map(renderBook)}
              </div>
            ) : (
              allDoneState
            )}
          </>
        )}
      </div>
      {peekNode}
    </div>
  )
}

export default BookSelector
