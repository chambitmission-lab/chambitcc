// 설교 말씀 — '주일의 말씀 편지' (2026-10 개편)
//   이번 주 편지 히어로 → 동행 3단계(본문 읽기·설교 듣기·한 줄 붙잡기) → 지난 주일의 편지들
// 히어로 = 계절 교회 사진 편지
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSermon } from '../../api/sermon'
import { useInfiniteSermons } from '../../hooks/useSermons'
import { useSermonTakeaways } from '../../hooks/useSermonTakeaways'
import { useAuth } from '../../hooks/useAuth'
import SermonLetterHero from './components/SermonLetterHero'
import SermonWalk from './components/SermonWalk'
import SermonLetterCard from './components/SermonLetterCard'
import SermonNotesRail from './components/SermonNotesRail'
import SermonDetail from './components/SermonDetail'
import SermonForm from './components/SermonForm'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import { deriveWorshipType, groupSermonsByMonth, WORSHIP_TYPES } from './utils/sermonMeta'
import type { WorshipType } from './utils/sermonMeta'
import { weekdayGreeting } from './utils/sermonLetter'
import type { Sermon as SermonType } from '../../types/sermon'
import { ensureFontFamily } from '../../utils/deferredFonts'
import './Sermon.css'
import './components/SermonLetter.css'
import { can } from '../../utils/access'

// 소인·서명·붙잡은 한 줄의 손글씨 + 인용 구절의 고운바탕
void ensureFontFamily('nanumPen')
void ensureFontFamily('gowunBatang')

type Filter = '전체' | WorshipType

interface SelectedSermon {
  sermon: SermonType
  media: 'audio' | 'video' | null
}

const Sermon = () => {
  const [showForm, setShowForm] = useState(false)
  const [editingSermon, setEditingSermon] = useState<SermonType | null>(null)
  const [selected, setSelected] = useState<SelectedSermon | null>(null)
  const [filter, setFilter] = useState<Filter>('전체')
  const [passageSignal, setPassageSignal] = useState(0)
  const adminUser = can('sermons:manage')

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSermons()

  const sermons = useMemo(() => data?.pages.flat() ?? [], [data])
  const sermonsById = useMemo(() => new Map(sermons.map((s) => [s.id, s])), [sermons])

  const { requireAuth } = useAuth()
  const { loggedIn, bySermon, data: takeaways } = useSermonTakeaways()

  // 예배 유형 칩 — 로드된 설교에 실제로 존재하는 유형만 노출
  const filterOptions = useMemo<Filter[]>(() => {
    const present = new Set(sermons.map((s) => deriveWorshipType(s.title)))
    if (present.size < 2) return []
    return ['전체', ...WORSHIP_TYPES.filter((t) => present.has(t))]
  }, [sermons])

  // 우측 레일 필터 — 유형별 편수 (로드된 범위 기준)
  const typeCounts = useMemo(() => {
    const map = new Map<WorshipType, number>()
    for (const s of sermons) {
      const type = deriveWorshipType(s.title)
      map.set(type, (map.get(type) ?? 0) + 1)
    }
    return map
  }, [sermons])

  const filtered = useMemo(
    () => (filter === '전체' ? sermons : sermons.filter((s) => deriveWorshipType(s.title) === filter)),
    [sermons, filter]
  )

  // 전체 보기에서만 최신 1건을 이번 주 편지로 승격
  const heroSermon = filter === '전체' ? filtered[0] : undefined
  const listSermons = heroSermon ? filtered.slice(1) : filtered
  const monthGroups = useMemo(() => groupSermonsByMonth(listSermons), [listSermons])
  const greeting = useMemo(() => weekdayGreeting(), [])

  // 무한 스크롤 센티널
  const loadMoreRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const openDetail = (sermon: SermonType, media: 'audio' | 'video' | null = null) => {
    setSelected({ sermon, media })
  }

  const openById = (id: number) => {
    const found = sermonsById.get(id)
    if (found) openDetail(found)
    else getSermon(id).then((s) => openDetail(s)).catch(() => {})
  }

  // 히어로 '본문 읽기' → 동행 1단계를 펼치고 그 자리로 (body 가 스크롤러라 scrollIntoView)
  const readPassage = () => {
    setPassageSignal((n) => n + 1)
    requestAnimationFrame(() =>
      document.getElementById('sermon-walk')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    )
  }

  // ?id= 딥링크(⌘K 검색 등) — 목록에 있으면 바로, 없으면 단건 조회 후 상세를 연다
  const [searchParams, setSearchParams] = useSearchParams()
  const deepId = Number(searchParams.get('id')) || 0
  useEffect(() => {
    if (!deepId) return
    let cancelled = false
    const found = sermons.find((s) => s.id === deepId)
    const open = (s: SermonType) => {
      if (cancelled) return
      setSelected({ sermon: s, media: null })
      setSearchParams({}, { replace: true })
    }
    if (found) open(found)
    else getSermon(deepId).then(open).catch(() => setSearchParams({}, { replace: true }))
    return () => { cancelled = true }
    // sermons 가 늦게 와도 단건 조회로 열리므로 sermons 변화엔 재실행하지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepId])

  const handleEdit = (sermon: SermonType) => {
    setEditingSermon(sermon)
    setSelected(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSermon(null)
  }

  return (
    <ErrorBoundary>
      <div className="sl-page bg-[var(--app-canvas)] min-h-screen page-stage">
        {/* lg+: 좁은 셸을 풀고 본문 + 우측 위젯 레일 2단 (/news·/ministry·/worship과 같은 문법) */}
        <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto bg-[var(--app-canvas)] min-h-screen lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:shadow-2xl lg:overflow-hidden lg:min-h-0">
          {/* 헤더 — 캔버스 위 편집 헤더(/news와 같은 문법) */}
          <header className="sermon-page-header">
            <div className="sermon-page-heading">
              <p className="sermon-page-eyebrow">SERMON</p>
              <h1 className="sermon-page-title">설교 말씀</h1>
              <p className="sermon-page-subtitle">한 주에 한 통, 강단에서 온 말씀 편지</p>
            </div>
            {adminUser && (
              <button className="sermon-add-btn" onClick={() => setShowForm(true)}>
                <span className="material-icons-outlined">add</span>
                등록
              </button>
            )}
          </header>

          {/* 로딩 스켈레톤 */}
          {isLoading && (
            <div className="p-4">
              <div className="sermon-skeleton sermon-skeleton-hero" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="sermon-skeleton sermon-skeleton-row" />
              ))}
            </div>
          )}

          {/* 에러 */}
          {!isLoading && error && (
            <div className="text-center py-16 px-8">
              <p className="text-ink-strong font-semibold mb-2">데이터를 불러올 수 없습니다</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="px-6 py-2 bg-brand text-white font-bold rounded-full hover:shadow-lg transition-all"
              >
                새로고침
              </button>
            </div>
          )}

          {/* 빈 상태 */}
          {!isLoading && !error && sermons.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400">아직 도착한 말씀 편지가 없습니다.</p>
              {adminUser && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-6 py-2 bg-brand text-white font-bold rounded-full hover:shadow-lg transition-all"
                >
                  첫 설교 등록하기
                </button>
              )}
            </div>
          )}

          {/* 본문 */}
          {!isLoading && !error && sermons.length > 0 && (
            <div className="p-4 pb-8 lg:px-6">
              {/* 예배 유형 필터 칩 (모바일 — PC는 우측 레일) */}
              {filterOptions.length > 0 && (
                <div className="sermon-filter-chips lg:hidden">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      className={`sermon-filter-chip${filter === option ? ' active' : ''}`}
                      onClick={() => setFilter(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {heroSermon && (
                <>
                  <p className="sl-greet">
                    {greeting.lead} <b>{greeting.emphasis}</b>
                  </p>
                  <SermonLetterHero
                    sermon={heroSermon}
                    onOpen={(media) => openDetail(heroSermon, media)}
                    onReadPassage={readPassage}
                  />
                  <SermonWalk
                    key={heroSermon.id}
                    sermon={heroSermon}
                    passageSignal={passageSignal}
                    onOpen={(media) => openDetail(heroSermon, media)}
                  />
                </>
              )}

              {/* 지난 주일의 편지들 — 월별 */}
              {monthGroups.length > 0 && (
                <div className="sermon-archive">
                  {heroSermon && <div className="sermon-archive-heading">지난 주일의 편지들</div>}
                  {monthGroups.map((group) => (
                    <div key={group.key} id={`sermon-month-${group.key}`} className="sermon-month-group scroll-mt-20">
                      <div className="sermon-month-label">{group.label}</div>
                      <div className="sl-letters">
                        {group.items.map((sermon) => (
                          <SermonLetterCard
                            key={sermon.id}
                            sermon={sermon}
                            takeaway={bySermon.get(sermon.id)?.text}
                            showTakeawaySlot={loggedIn}
                            onOpen={(media) => openDetail(sermon, media)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 필터 결과 없음 */}
              {filter !== '전체' && filtered.length === 0 && (
                <p className="sermon-filter-empty">해당 예배의 설교가 아직 없습니다.</p>
              )}

              {/* 무한 스크롤 센티널 */}
              <div ref={loadMoreRef} className="sermon-load-more">
                {isFetchingNextPage && <div className="sermon-load-spinner" />}
              </div>
            </div>
          )}

          {/* 설교 등록/수정 폼 모달 */}
          {showForm && (
            <SermonForm
              sermon={editingSermon || undefined}
              onClose={handleCloseForm}
              onSuccess={() => refetch()}
            />
          )}

          {/* 설교 상세 모달 */}
          {selected && (
            <SermonDetail
              sermon={selected.sermon}
              initialMedia={selected.media}
              onClose={() => setSelected(null)}
              onEdit={() => handleEdit(selected.sermon)}
              onDelete={() => {
                setSelected(null)
                refetch()
              }}
            />
          )}
        </div>

        {/* 우측 위젯 레일 (lg+) — 나의 말씀 노트 · 필터 · 월별 아카이브 */}
        <aside className="sermon-rail rail-lift hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem] lg:max-h-[calc((100dvh-5.5rem)/var(--az,1))] lg:overflow-y-auto scrollbar-hide lg:[&>*]:shrink-0">
          {!isLoading && !error && sermons.length > 0 && (
            <SermonNotesRail
              loggedIn={loggedIn}
              takeaways={takeaways ?? []}
              sermonsById={sermonsById}
              onOpen={openById}
              onLogin={() => requireAuth(() => {})}
            />
          )}

          {!isLoading && !error && sermons.length > 0 && filterOptions.length > 0 && (
            <section className="feed-card rounded-2xl p-4">
              <p className="sermon-rail-title">말씀 찾기</p>
              <div className="sermon-rail-list">
                {filterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`sermon-rail-link${filter === option ? ' active' : ''}`}
                    onClick={() => setFilter(option)}
                  >
                    <span className="sermon-rail-link-name">{option}</span>
                    <span className="sermon-rail-link-count">
                      {option === '전체' ? sermons.length : typeCounts.get(option) ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!isLoading && !error && monthGroups.length > 0 && (
            <section className="feed-card rounded-2xl p-4">
              <p className="sermon-rail-title">월별 편지</p>
              <div className="sermon-rail-list">
                {monthGroups.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    className="sermon-rail-link"
                    onClick={() =>
                      document
                        .getElementById(`sermon-month-${group.key}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  >
                    <span className="sermon-rail-link-name">{group.label}</span>
                    <span className="sermon-rail-link-count">{group.items.length}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default Sermon
