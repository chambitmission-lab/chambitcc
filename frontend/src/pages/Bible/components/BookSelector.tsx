import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BibleBook } from '../../../types/bible'
import type { ReadingProgressResponse, ResumePosition } from '../../../api/bibleReading'
import { parseApiDate } from '../../../utils/dateUtils'
import BibleProgressMap from './BibleProgressMap'
import BookJourneyPath from './BookJourneyPath'
import { aggregateRange, buildBookInfoMap } from './readingProgressInfo'

interface BookSelectorProps {
  books: BibleBook[] | undefined
  isLoading: boolean
  error: Error | null
  onBookSelect: (bookId: number, bookName: string, resume?: ResumePosition) => void
  resumeMap?: Map<number, ResumePosition>
  /** 읽기 진행률 원본 — 요약 줄·분류 칩·책 카드·지도의 모든 수치가 여기서 파생된다 */
  progress?: ReadingProgressResponse['data']
  /** 최근 읽은 책(전역 최신 제외) — 상단 가로 슬라이더에 사용 */
  recentBooks?: ResumePosition[]
}

type Testament = 'OT' | 'NT'

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

const formatRelativeShort = (iso: string, language: 'ko' | 'en'): string => {
  const date = parseApiDate(iso)
  const diffDay = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (language === 'en') {
    if (diffDay <= 0) return 'Today'
    if (diffDay === 1) return 'Yesterday'
    if (diffDay < 7) return `${diffDay} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (diffDay <= 0) return '오늘'
  if (diffDay === 1) return '어제'
  // "5일"만 쓰면 5일 전인지 5일째인지 읽히지 않는다
  if (diffDay < 7) return `${diffDay}일 전`
  // toLocaleDateString('ko-KR')은 "7. 20." 처럼 점이 붙어 날짜보다 오타로 보인다
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

/** 0보다 크면 최소 1%로 올려 표기 — 읽기 시작했는데 "0%"로 보이는 일을 막는다 */
const pctLabel = (rate: number) => (rate > 0 ? Math.max(1, Math.round(rate)) : 0)

/** 게이지 최소 두께 — 0.4% 같은 값도 눈에 보이게 */
const gaugeWidth = (rate: number) => (rate > 0 ? Math.max(3, rate) : 0)

const BookSelector = ({ books, isLoading, error, onBookSelect, resumeMap, progress, recentBooks }: BookSelectorProps) => {
  const { language } = useLanguage()
  const [testament, setTestament] = useState<Testament>('OT')
  const [filter, setFilter] = useState<string>('all')
  // 서브 필터가 어느 방향에서 슬라이드 인 될지 — OT→NT는 우측(forward), NT→OT는 좌측(back)에서 들어온다
  const [dir, setDir] = useState<'forward' | 'back'>('forward')
  const [showMap, setShowMap] = useState(false)

  // 최근 읽은 책 슬라이더 — 스크롤 여지가 있는 방향에만 엣지 페이드를 켠다
  const recentScrollRef = useRef<HTMLDivElement>(null)
  const [recentFade, setRecentFade] = useState({ left: false, right: false })

  const updateRecentFade = useCallback(() => {
    const el = recentScrollRef.current
    if (!el) return
    const left = el.scrollLeft > 4
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    setRecentFade(prev => (prev.left === left && prev.right === right ? prev : { left, right }))
  }, [])

  // 최근 읽은 책 — book_number로 실제 책을 찾아 onBookSelect에 resume까지 넘긴다
  const recentItems = (recentBooks || [])
    .map(pos => ({ pos, book: books?.find(b => b.book_number === pos.book_number) }))
    .filter((x): x is { pos: ResumePosition; book: BibleBook } => !!x.book)
    .slice(0, 8)

  useEffect(() => {
    updateRecentFade()
    window.addEventListener('resize', updateRecentFade)
    return () => window.removeEventListener('resize', updateRecentFade)
  }, [recentItems.length, updateRecentFade])

  const infoMap = useMemo(() => buildBookInfoMap(books, progress), [books, progress])

  const texts = {
    ko: {
      selectBook: '책 선택',
      recentTitle: '최근 읽은 책',
      // 이어 읽기 '위치'임을 문구로 못 박는다 — 읽은 분량은 카드 하단 게이지가 담당
      resumeFrom: (ch: number) => `${ch}장부터`,
      oldTestament: '구약',
      newTestament: '신약',
      loadingBooks: '성경 책 목록을 불러오는 중...',
      errorBooks: '성경 책 목록을 불러오는데 실패했습니다. 백엔드 API를 확인해주세요.',
      noBooks: '성경 책 데이터가 없습니다.',
      summaryTitle: '읽기 진행',
      whole: '전체',
      mapToggle: '지도',
      chapterUnit: '장',
      verseUnit: '절',
      complete: '완독',
      reading: '읽는 중',
      read: '읽음',
    },
    en: {
      selectBook: 'Select Book',
      recentTitle: 'Recently read',
      resumeFrom: (ch: number) => `From ch ${ch}`,
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      loadingBooks: 'Loading bible books...',
      errorBooks: 'Failed to load bible books. Please check backend API.',
      noBooks: 'No bible book data available.',
      summaryTitle: 'Reading progress',
      whole: 'Whole Bible',
      mapToggle: 'Map',
      chapterUnit: 'ch',
      verseUnit: 'v',
      complete: 'Done',
      reading: 'Reading',
      read: 'read',
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

  // 전체/구약/신약 요약 — 장 기준을 주 지표로 쓰고, 장 집계가 없는 구버전 응답에서는 절 기준으로 폴백
  const summaryStats = useMemo(() => {
    if (!progress) return []
    const build = (label: string, src: ReadingProgressResponse['data']['overall']) => {
      const hasChapters = (src.total_chapters ?? 0) > 0
      const rate = hasChapters
        ? ((src.read_chapters ?? 0) / (src.total_chapters ?? 1)) * 100
        : src.progress_rate
      return {
        label,
        rate: Math.max(0, Math.min(100, rate)),
        detail: hasChapters
          ? `${(src.read_chapters ?? 0).toLocaleString()} / ${(src.total_chapters ?? 0).toLocaleString()}${t.chapterUnit}`
          : `${src.read_verses.toLocaleString()} / ${src.total_verses.toLocaleString()}${t.verseUnit}`,
      }
    }
    return [
      build(t.whole, progress.overall),
      build(t.oldTestament, progress.old_testament),
      build(t.newTestament, progress.new_testament),
    ]
  }, [progress, t.whole, t.oldTestament, t.newTestament, t.chapterUnit, t.verseUnit])

  const handleMapSelect = useCallback(
    (book: BibleBook) => {
      onBookSelect(book.id, book.book_name_ko, resumeMap?.get(book.book_number))
    },
    [onBookSelect, resumeMap]
  )

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

  return (
    <div className="bible-books-section">
      <h2 className="section-title">{t.selectBook}</h2>

      {/* 읽기 진행 요약 — 전체/구약/신약을 나란히 두어 "지금 어디가 비었나"를 먼저 알려준다.
          탭 안에 %를 넣지 않는 이유: 탭은 선택 컨트롤이고, 비활성 탭의 수치는 가려지기 때문 */}
      {summaryStats.length > 0 && (
        <div className="reading-summary">
          <div className="reading-summary__head">
            <span className="reading-summary__title">{t.summaryTitle}</span>
            <button
              type="button"
              className={`reading-summary__map-toggle${showMap ? ' active' : ''}`}
              aria-expanded={showMap}
              onClick={() => setShowMap(v => !v)}
            >
              <span className="material-icons-round">grid_view</span>
              {t.mapToggle}
            </button>
          </div>

          <div className="reading-summary__row">
            {summaryStats.map(stat => (
              <div className="summary-stat" key={stat.label}>
                <span className="summary-stat__label">{stat.label}</span>
                <span className="summary-stat__value">
                  {pctLabel(stat.rate)}
                  <small>%</small>
                </span>
                <span className="summary-stat__track">
                  <span className="summary-stat__fill" style={{ width: `${gaugeWidth(stat.rate)}%` }} />
                </span>
                <span className="summary-stat__detail">{stat.detail}</span>
              </div>
            ))}
          </div>

          {showMap && (
            <BibleProgressMap books={books} infoMap={infoMap} onBookSelect={handleMapSelect} />
          )}
        </div>
      )}

      {recentItems.length > 0 && (
        <div className="recent-strip">
          <h3 className="recent-strip__title">{t.recentTitle}</h3>
          {/* 카드는 내용 폭으로 줄고, "더 있음"은 스크롤 여지가 있는 쪽의 엣지 페이드가 알린다
              (예전엔 고정폭으로도 같은 힌트를 줬는데 역할이 겹쳐 카드 오른쪽만 비었다) */}
          <div
            className="recent-scroll-wrap"
            data-fade-left={recentFade.left}
            data-fade-right={recentFade.right}
          >
            <div className="recent-scroll" ref={recentScrollRef} onScroll={updateRecentFade}>
              {recentItems.map(({ pos, book }) => {
                // 게이지는 아래 책 그리드(renderBook)와 같은 규칙 — 채움은 실제 읽은 양,
                // 이어 읽기 위치는 그보다 앞설 때만 연한 구간으로 이어 붙인다
                const info = infoMap.get(book.book_number)
                const rate = info?.rate ?? 0
                const totalChapters = info?.totalChapters ?? book.chapter_count
                const resumePct =
                  rate < 100 && totalChapters > 0
                    ? Math.max(0, Math.min(100, (pos.chapter / totalChapters) * 100))
                    : 0
                const aheadPct = resumePct > rate + 1 ? resumePct : 0
                const isComplete = rate >= 100

                return (
                  <button
                    key={book.id}
                    type="button"
                    className="recent-chip"
                    onClick={() => onBookSelect(book.id, book.book_name_ko, pos)}
                  >
                    <span className="recent-chip__icon" data-complete={isComplete}>
                      {/* 이 자리엔 원래 모든 카드가 똑같은 책 아이콘이었다(정보량 0).
                          권 약칭은 바로 옆 책 이름과 같은 말이라 진행률로 채운다 —
                          하단 게이지가 눈대중이면 이쪽은 정확한 수치. */}
                      {isComplete ? (
                        <span className="material-icons-round" aria-label={t.complete}>
                          check
                        </span>
                      ) : (
                        <span className="recent-chip__pct">
                          {pctLabel(rate)}
                          <small>%</small>
                        </span>
                      )}
                    </span>
                    <span className="recent-chip__body">
                      <span className="recent-chip__name">{book.book_name_ko}</span>
                      <span className="recent-chip__meta">
                        {t.resumeFrom(pos.chapter)} · {formatRelativeShort(pos.read_at, language)}
                      </span>
                    </span>
                    {rate > 0 && (
                      <span className="book-progress-track" aria-hidden="true">
                        {aheadPct > 0 && (
                          <span className="book-progress-ahead" style={{ width: `${aheadPct}%` }} />
                        )}
                        <span
                          className="book-progress-fill"
                          style={{ width: `${gaugeWidth(rate)}%` }}
                        />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

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

      {/* key로 탭·칩 변경마다 리마운트 — 제목 페이드 + 정거장 스태거 애니메이션이 다시 재생된다 */}
      <div className="testament-section" key={`${testament}-${filter}`}>
        <h3 className="testament-title">
          {activeCategory.id === 'all'
            ? (testament === 'OT' ? t.oldTestament : t.newTestament)
            : (language === 'en' ? activeCategory.labelEn : activeCategory.label)}
          {' '}({filteredBooks.length})
        </h3>
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
      </div>
    </div>
  )
}

export default BookSelector
