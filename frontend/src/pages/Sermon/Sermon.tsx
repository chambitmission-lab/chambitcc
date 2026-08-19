import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteSermons } from '../../hooks/useSermons'
import { isAdmin } from '../../utils/auth'
import SermonHero from './components/SermonHero'
import SermonRow from './components/SermonRow'
import SermonDetail from './components/SermonDetail'
import SermonForm from './components/SermonForm'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import { deriveWorshipType, groupSermonsByMonth, WORSHIP_TYPES } from './utils/sermonMeta'
import type { WorshipType } from './utils/sermonMeta'
import type { Sermon as SermonType } from '../../types/sermon'
import './Sermon.css'

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
  const adminUser = isAdmin()

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

  // 전체 보기에서만 최신 1건을 히어로로 승격
  const heroSermon = filter === '전체' ? filtered[0] : undefined
  const listSermons = heroSermon ? filtered.slice(1) : filtered
  const monthGroups = useMemo(() => groupSermonsByMonth(listSermons), [listSermons])

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
      <div className="bg-surface min-h-screen page-stage">
        {/* lg+: 좁은 셸을 풀고 본문 + 우측 위젯 레일 2단 (/news·/ministry·/worship과 같은 문법) */}
        <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto bg-surface shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
          {/* 헤더 — 플랫 스티키 */}
          <div className="sermon-page-header">
            <h1 className="sermon-page-title">설교 말씀</h1>
            {adminUser && (
              <button className="sermon-add-btn" onClick={() => setShowForm(true)}>
                <span className="material-icons-outlined">add</span>
                등록
              </button>
            )}
          </div>

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
              <span className="text-5xl mb-4 block">⚠️</span>
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
              <span className="text-6xl mb-4 block">📖</span>
              <p className="text-gray-500 dark:text-gray-400">아직 등록된 설교가 없습니다.</p>
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
            <div className="p-4 pb-8">
              {/* 예배 유형 필터 칩 */}
              {filterOptions.length > 0 && (
                <div className="sermon-filter-chips">
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

              {/* 이번 주 말씀 히어로 */}
              {heroSermon && (
                <SermonHero
                  sermon={heroSermon}
                  onOpen={(media) => openDetail(heroSermon, media ?? null)}
                />
              )}

              {/* 지난 말씀 — 월별 아카이브 */}
              {monthGroups.length > 0 && (
                <div className="sermon-archive">
                  {heroSermon && <div className="sermon-archive-heading">지난 말씀</div>}
                  {monthGroups.map((group) => (
                    <div key={group.key} id={`sermon-month-${group.key}`} className="sermon-month-group scroll-mt-20">
                      <div className="sermon-month-label">{group.label}</div>
                      <div className="sermon-month-rows">
                        {group.items.map((sermon) => (
                          <SermonRow
                            key={sermon.id}
                            sermon={sermon}
                            onOpen={(media) => openDetail(sermon, media ?? null)}
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

        {/* 우측 위젯 레일 (lg+) — 필터와 월별 아카이브를 본문 밖으로 빼
            넓어진 본문은 말씀 카드에만 집중하게 한다 */}
        <aside className="sermon-rail hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
          {!isLoading && !error && sermons.length > 0 && (
            <section className="feed-card rounded-2xl p-4">
              <p className="sermon-rail-title">말씀 찾기</p>
              {filterOptions.length > 0 ? (
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
              ) : (
                <p className="sermon-rail-note">
                  지금까지 {sermons.length}편의 말씀이 쌓였어요
                </p>
              )}
            </section>
          )}

          {!isLoading && !error && monthGroups.length > 0 && (
            <section className="feed-card rounded-2xl p-4">
              <p className="sermon-rail-title">월별 아카이브</p>
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
