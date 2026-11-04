import { Suspense, lazy, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMessianicGenealogy, usePrefetchBibleFigure } from '../../../hooks/useBibleFigure'
import GenealogyTree from './components/GenealogyTree'
import FigureDetailPanel from './components/FigureDetailPanel'
import EraTimeline from './components/EraTimeline'
import { isApostleId, isTribeId, type ApostleId, type TribeId } from './twelveIds'
import type { BibleFigureSummary } from '../../../types/bibleFigure'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import './Genealogy.css'
import { tokenStore } from '../../../utils/tokenStore'

import { useThemeArt } from '../../../hooks/useThemeArt'
import { GENEALOGY_HERO } from '../../../utils/themeAssets'
import { warmGenealogySerif } from './warmSerifGlyphs'
import { SheetGrabber } from '../../../components/common/SheetGrabber'

// 지파·제자 보기는 카드 데이터(tribes.ts, apostles.ts)까지 묶여 커서 별도 청크 —
// 가계도·시대순만 보는 사람은 받지 않고, 보기 토글에 손이 가면 미리 받는다.
const loadTwelveView = () => import('./components/TwelveView')
const TwelveView = lazy(loadTwelveView)

const encouragement = (p: number) => {
  if (p >= 1) return '완독했어요!'
  if (p >= 0.7) return '잘하고 있어요!'
  if (p >= 0.3) return '순조롭게 가고 있어요'
  if (p > 0) return '좋은 출발이에요'
  return '첫 장을 펼쳐보세요'
}

type ViewMode = 'tree' | 'timeline' | 'tribes' | 'apostles'
type RoleFilter = 'all' | 'messianic' | 'king' | 'prophet' | 'woman' | 'patriarch'

const ROLE_FILTERS: { id: RoleFilter; label: string; icon: string }[] = [
  { id: 'all', label: '전체', icon: '✶' },
  { id: 'messianic', label: '메시아 라인', icon: '✦' },
  { id: 'king', label: '왕', icon: '♛' },
  { id: 'prophet', label: '선지자', icon: '✎' },
  { id: 'woman', label: '여인', icon: '♀' },
  { id: 'patriarch', label: '족장', icon: '⌖' },
]

const matchRole = (figure: BibleFigureSummary, filter: RoleFilter): boolean => {
  if (filter === 'all') return true
  if (filter === 'messianic') return figure.is_messianic_line
  const role = figure.role || ''
  if (filter === 'king') return role.includes('왕')
  if (filter === 'prophet') return role.includes('선지자')
  if (filter === 'woman') return figure.gender === 'female'
  if (filter === 'patriarch')
    return role.includes('족장') || (!role.includes('왕') && !role.includes('선지자'))
  return true
}

export const Genealogy = () => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  // ?view=tribes(&tribe=judah) / ?view=apostles(&apostle=peter) — 성경 사전 칩의 "카드 보기"가 이 주소로 들어온다.
  // 보기 전환은 주소에 replace 로 남겨 본문에 다녀와도 같은 보기로 돌아온다.
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const v = searchParams.get('view')
    if (v === 'tribes' || v === 'apostles' || v === 'tree' || v === 'timeline') return v
    return typeof window !== 'undefined' && window.innerWidth < 1024 ? 'timeline' : 'tree'
  })
  const [selectedTribe, setSelectedTribe] = useState<TribeId | null>(() => {
    const t = searchParams.get('tribe')
    return isTribeId(t) ? t : null
  })
  const [selectedApostle, setSelectedApostle] = useState<ApostleId | null>(() => {
    const a = searchParams.get('apostle')
    return isApostleId(a) ? a : null
  })
  const setViewMode = useCallback(
    (v: ViewMode) => {
      setViewModeState(v)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('view', v)
          next.delete('tribe')
          next.delete('apostle')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )
  // 지파·제자 보기는 가계도 데이터(API)와 무관한 정적 화면 — 그 보기에선 요청도 통계 타일도 없다
  const isTwelve = viewMode === 'tribes' || viewMode === 'apostles'
  const { data, isLoading, error } = useMessianicGenealogy(!isTwelve)
  // 화면이 이미 열린 채 주소만 바뀌어도(사전 칩 → 같은 화면) 그 카드가 열리게
  // (렌더 중 이전 값과 비교해 맞추는 패턴 — effect 로 setState 하면 한 번 더 그린다)
  const tribeParam = searchParams.get('tribe')
  const apostleParam = searchParams.get('apostle')
  const [seenParams, setSeenParams] = useState(`${tribeParam}|${apostleParam}`)
  if (`${tribeParam}|${apostleParam}` !== seenParams) {
    setSeenParams(`${tribeParam}|${apostleParam}`)
    if (isTribeId(tribeParam)) {
      setViewModeState('tribes')
      setSelectedTribe(tribeParam)
    } else if (isApostleId(apostleParam)) {
      setViewModeState('apostles')
      setSelectedApostle(apostleParam)
    }
  }
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [helpOpen, setHelpOpen] = useState(false)
  // 히어로 이미지는 CSS 배경(테마 토큰)이라 렌더된 뒤에야 받기 시작하고 현재 테마 한 장만
  // 받는다 — 현재 테마를 받아 페이드인하고, 반대 테마는 유휴 시간에 데운다(themeAssets.ts)
  const heroReady = useThemeArt(GENEALOGY_HERO)
  const prefetchFigure = usePrefetchBibleFigure()

  // 상세 요청은 FigureDetailPanel 이 마운트돼야 출발했다 — 탭 → 타임라인·시트 렌더가 끝난 뒤.
  // 선택과 동시에 프리페치해 렌더와 네트워크를 겹친다(같은 쿼리 키라 패널의 useQuery 가 그대로 이어받는다).
  const selectFigure = useCallback(
    (slug: string | null) => {
      if (slug) prefetchFigure(slug)
      setSelectedSlug(slug)
    },
    [prefetchFigure],
  )

  // 인물 상세의 명조 제목·소개에 쓰일 Noto Serif KR 조각을 유휴 시간에 미리 받아 둔다
  useEffect(() => {
    if (!data) return
    const nodes = data.nodes
    const run = () => void warmGenealogySerif(nodes)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const t = window.setTimeout(run, 300)
    return () => window.clearTimeout(t)
  }, [data])

  const isLoggedIn = !!tokenStore.getAccess()

  const overallProgress = useMemo(() => {
    if (!data || !isLoggedIn) return null
    const values = Object.values(data.reading_progress || {})
    if (values.length === 0) return 0
    const sum = values.reduce((a, b) => a + b, 0)
    return sum / values.length
  }, [data, isLoggedIn])

  // 메시아 라인 인물 중 통독을 마친(진도 100%) 인물 수
  const readCounts = useMemo(() => {
    if (!data) return { done: 0, total: 0 }
    const line = data.nodes.filter((n) => n.is_messianic_line)
    const done = line.filter((n) => (data.reading_progress?.[n.slug] ?? 0) >= 0.999).length
    return { done, total: line.length }
  }, [data])

  const counts = useMemo(() => {
    if (!data) return { total: 0, messianic: 0 }
    return {
      total: data.nodes.length,
      messianic: data.nodes.filter((n) => n.is_messianic_line).length,
    }
  }, [data])

  const filteredNodes = useMemo(() => {
    if (!data) return [] as BibleFigureSummary[]
    const q = query.trim().toLowerCase()
    return data.nodes.filter((n) => {
      if (!matchRole(n, roleFilter)) return false
      if (!q) return true
      return (
        n.name_ko.toLowerCase().includes(q) ||
        (n.name_en || '').toLowerCase().includes(q) ||
        (n.era || '').toLowerCase().includes(q) ||
        (n.role || '').toLowerCase().includes(q)
      )
    })
  }, [data, query, roleFilter])

  // 데이터에 실제로 존재하는 역할만 칩으로 노출 (선지자 등 0명인 칩 숨김)
  const visibleFilters = useMemo(() => {
    if (!data) return ROLE_FILTERS
    return ROLE_FILTERS.filter(
      (rf) => rf.id === 'all' || data.nodes.some((n) => matchRole(n, rf.id)),
    )
  }, [data])

  const selectedSummary = useMemo(
    () => (data && selectedSlug ? data.nodes.find((n) => n.slug === selectedSlug) ?? null : null),
    [data, selectedSlug],
  )

  const matchedSlugs = useMemo(
    () => new Set(filteredNodes.map((n) => n.slug)),
    [filteredNodes],
  )

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen page-stage">
      {/* lg+: 좌측 섹션 레일 + 본문 — 하단 도크는 lg에서 숨고 레일이 섹션 내비를 맡는다.
          패딩은 루트가 아닌 내부 래퍼에 — 루트는 .main-content > * { padding: 0 } (App.css)에 걸려 pb가 제거된다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5">
      <BibleSideRail active="genealogy" />
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-bottomnav-safe lg:pb-12 lg:mx-0 lg:px-0 lg:flex-1 lg:min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 mb-3">
          <Link to="/bible" className="hover:text-brand transition-colors">
            성경
          </Link>
          <span className="opacity-50">›</span>
          <span className="text-gray-700 dark:text-gray-300">믿음의 가계도</span>
        </div>

        {/* 히어로 — 우측에 생명나무 이미지, 좌측 타이틀 + 통계 타일 */}
        <header className="gen-hero mb-4">
          <div className={`gen-hero__art${heroReady ? ' is-loaded' : ''}`} aria-hidden />
          <div className="gen-hero__content">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-brand text-[11.5px] font-bold tracking-[0.14em] uppercase mb-1.5">
                  Genealogy · 구속사 라인
                </p>
                <h1 className="text-ink-strong text-[26px] md:text-[30px] font-bold leading-[1.2] tracking-[-0.02em]">
                  믿음의 가계도
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setHelpOpen((v) => !v)}
                  aria-label="도움말"
                  aria-expanded={helpOpen}
                  className="gen-hero__btn"
                >
                  <span className="material-icons-round" style={{ fontSize: 18 }}>
                    help_outline
                  </span>
                </button>
              </div>
            </div>

            <p className="mt-2 max-w-[520px] text-[14px] text-gray-600 dark:text-white/65 leading-[1.65]">
              아담부터 예수 그리스도까지, 하나님이 친히 보존하신 메시아 약속의 계보입니다.
              {isLoggedIn ? (
                <> 통독한 만큼 내 열차가 아담역에서 예수역까지 달려가요.</>
              ) : (
                <>
                  {' '}
                  <Link to="/login" className="text-brand hover:underline font-medium">
                    로그인
                  </Link>
                  하면 통독한 만큼 열차가 노선을 따라 달려가는 걸 볼 수 있어요.
                </>
              )}
            </p>

            <AnimatePresence>
              {helpOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="mt-3 max-w-[520px] rounded-xl bg-white/70 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] px-3.5 py-3 text-[12.5px] text-gray-600 dark:text-white/65 leading-[1.6] space-y-1">
                    <li>· 인물을 누르면 생애·관련 구절·가족 관계를 볼 수 있어요.</li>
                    <li>· 인물과 연결된 장을 다 읽으면 그 역을 지나요. 아담역부터 이어서 다 읽은 역까지 열차가 내려와요.</li>
                    <li>· <b className="text-brand">가계도</b>는 아담→예수까지 한 줄 노선이에요. 시대마다 노선 색이 바뀌고, 점선은 성경이 건너뛴 세대예요.</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 통계 타일 — 가계도 인물 수라 지파·제자 보기에선 숨긴다 */}
            {!isTwelve && (
            <div className="mt-4 grid grid-cols-3 gap-2 max-w-[560px]">
              <StatTile icon="groups" label="전체 인물" value={counts.total} />
              <StatTile icon="account_tree" label="메시아 라인" value={counts.messianic} />
              {overallProgress !== null && (
                <StatTile
                  icon="donut_large"
                  label="통독 진도"
                  value={`${Math.round(overallProgress * 100)}%`}
                />
              )}
            </div>
            )}
          </div>
        </header>

        {/* 로그인 사용자 진도 카드 */}
        {!isTwelve && overallProgress !== null && (
          <div className="mb-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08] px-4 py-4 md:px-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-50 dark:opacity-100 pointer-events-none bg-gradient-to-br from-[var(--brand-soft)] via-transparent to-transparent dark:from-white/[0.05] dark:via-transparent dark:to-white/[0.02]" />
            <div className="relative">
              <span className="text-[13px] font-semibold text-gray-700 dark:text-white/90">
                메시아 라인 통독 진도
              </span>
              <div className="mt-2 flex items-center gap-3 md:gap-4">
                <span className="brand-text-gradient text-[30px] md:text-[34px] font-extrabold leading-none tracking-[-0.03em] flex-shrink-0">
                  {Math.round(overallProgress * 100)}%
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full brand-gradient-bg transition-all duration-700 rounded-full"
                    style={{ width: `${Math.max(2, overallProgress * 100)}%` }}
                  />
                </div>
                <span className="hidden sm:inline-flex flex-shrink-0 px-2.5 h-7 items-center rounded-full text-[12px] font-semibold bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/70 border border-gray-200 dark:border-white/[0.06]">
                  {readCounts.done} / {readCounts.total} 인물
                </span>
                <span className="hidden md:inline-flex flex-shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand">
                  <span className="material-icons-round" style={{ fontSize: 16 }}>auto_awesome</span>
                  {encouragement(overallProgress)}
                </span>
              </div>
              <div className="mt-2 flex sm:hidden items-center justify-between text-[12px] text-gray-500 dark:text-white/60">
                <span>{readCounts.done} / {readCounts.total} 인물</span>
                <span className="inline-flex items-center gap-1 font-semibold text-brand">
                  <span className="material-icons-round" style={{ fontSize: 14 }}>auto_awesome</span>
                  {encouragement(overallProgress)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 검색 + 필터 + 뷰 토글 카드 */}
        <div className="mb-5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08] p-3 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]" />
          <div className="relative flex flex-col gap-3">
            {/* 검색 + 뷰 토글 한 줄 */}
            <div className="flex items-center gap-2">
              {isTwelve ? (
                <p className="flex-1 min-w-0 px-1 text-[13px] text-gray-600 dark:text-white/65 leading-[1.5] break-keep">
                  {viewMode === 'tribes' ? '야곱의 열두 아들에서 시작된 하나님의 백성' : '예수님이 부르신 열두 사람, 새 이스라엘의 기초'}
                </p>
              ) : (
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 material-icons-round" style={{ fontSize: 18 }}>
                  search
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="인물·시대·역할 검색"
                  className="w-full h-10 pl-10 pr-3 rounded-xl text-[13.5px] bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] text-ink-strong placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-brand transition-colors"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="검색 지우기"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
              )}
              <ViewToggle value={viewMode === 'apostles' ? 'tribes' : viewMode} onChange={setViewMode} onWarmTwelve={loadTwelveView} />
            </div>

            {/* 역할 필터 pill */}
            {!isTwelve && (
            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 scrollbar-hide">
              {visibleFilters.map((rf) => {
                const active = roleFilter === rf.id
                return (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => setRoleFilter(rf.id)}
                    className={[
                      'inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 transition-all',
                      active
                        ? 'bg-[var(--brand-soft)] text-brand border border-[var(--brand-soft-strong)]'
                        : 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/60 border border-transparent hover:bg-gray-100 dark:hover:bg-white/[0.08]',
                    ].join(' ')}
                  >
                    <span aria-hidden>{rf.icon}</span>
                    {rf.label}
                  </button>
                )
              })}
            </div>
            )}
          </div>
        </div>

        {isTwelve && (
          <Suspense fallback={<TwelveLoading />}>
            <TwelveView
              side={viewMode === 'apostles' ? 'apostles' : 'tribes'}
              onChangeSide={setViewMode}
              selectedTribe={selectedTribe}
              onSelectTribe={setSelectedTribe}
              selectedApostle={selectedApostle}
              onSelectApostle={setSelectedApostle}
            />
          </Suspense>
        )}

        {/* 검색/필터 결과 안내 */}
        {!isTwelve && data && (query || roleFilter !== 'all') && (
          <div className="mb-3 text-[12.5px] text-gray-500 dark:text-white/55">
            <span className="font-semibold text-brand">
              {filteredNodes.length}명
            </span>
            의 인물이 일치합니다
          </div>
        )}

        {!isTwelve && isLoading && (
          <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08] py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
            가계도를 불러오는 중...
          </div>
        )}

        {!isTwelve && error && (
          <div className="rounded-2xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-[14px] text-red-700 dark:text-red-300">
            가계도 데이터를 불러오지 못했습니다.
          </div>
        )}

        {!isTwelve && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 min-w-0">
              {viewMode === 'tree' ? (
                <GenealogyTree
                  nodes={data.nodes}
                  links={data.links}
                  readingProgress={data.reading_progress}
                  selectedSlug={selectedSlug}
                  onSelect={selectFigure}
                  onHover={prefetchFigure}
                  isLoggedIn={isLoggedIn}
                  highlightSlugs={query || roleFilter !== 'all' ? matchedSlugs : null}
                />
              ) : (
                <EraTimeline
                  nodes={filteredNodes}
                  links={data.links}
                  readingProgress={data.reading_progress}
                  selectedSlug={selectedSlug}
                  onSelect={selectFigure}
                  onPrefetch={prefetchFigure}
                  isLoggedIn={isLoggedIn}
                  isFiltered={!!query.trim() || roleFilter !== 'all'}
                />
              )}
            </div>

            {/* 데스크톱(lg+): 우측 sticky 사이드 패널 */}
            <aside className="hidden lg:block lg:col-span-1 min-w-0">
              <div className="sticky lg:top-[4.5rem]">
                <FigureDetailPanel
                  slug={selectedSlug}
                  summary={selectedSummary}
                  onSelect={selectFigure}
                  onClose={() => setSelectedSlug(null)}
                />
              </div>
            </aside>
          </div>
        )}
      </div>
      </div>

      {/* 모바일/태블릿: 슬라이드업 시트 */}
      <AnimatePresence>
        {selectedSlug && (
          <>
            <motion.div
              key="genealogy-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setSelectedSlug(null)}
            />
            <motion.div
              key="genealogy-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 280 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
            >
              <FigureSheet onClose={() => setSelectedSlug(null)}>
                <FigureDetailPanel
                  slug={selectedSlug}
                  summary={selectedSummary}
                  onSelect={selectFigure}
                  onClose={() => setSelectedSlug(null)}
                  variant="sheet"
                />
              </FigureSheet>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 성경 섹션 하단 네비게이션 */}
      <BibleBottomNav active="genealogy" />
    </div>
  )
}

/** 모바일 시트 본체 — 닫기는 X 버튼·바깥 딤 탭·손잡이 끌어내리기(본문 끌어닫기는 없음, 바깥 motion.div 가 퇴장 애니메이션 담당) */
const FigureSheet = ({ children, onClose }: { children: ReactNode; onClose: () => void }) => {
  return (
    <div
      className="gfd-paper max-h-[88vh] rounded-t-[28px] shadow-[0_-20px_60px_-10px_var(--brand-glow)] border-t border-x border-gray-200 dark:border-white/[0.08] flex flex-col overflow-hidden"
    >
      <div className="flex-shrink-0 flex justify-center py-2.5">
        <SheetGrabber onClose={onClose} className="w-10 h-1.5 bg-black/15 dark:bg-white/20 rounded-full" />
      </div>
      <div className="overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  )
}

const StatTile = ({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: number | string
}) => (
  <div className="gen-stat">
    <span className="gen-stat__icon">
      <span className="material-icons-round" style={{ fontSize: 18 }}>{icon}</span>
    </span>
    <div className="min-w-0">
      <div className="gen-stat__label truncate">{label}</div>
      <div className="gen-stat__value">{value}</div>
    </div>
  </div>
)

/** 지파·제자 청크를 받는 동안 — 카드 자리의 빈 상자 */
const TwelveLoading = () => (
  <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08] py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
    열두 지파·제자를 불러오는 중...
  </div>
)

const ViewToggle = ({
  value,
  onChange,
  onWarmTwelve,
}: {
  value: ViewMode
  onChange: (v: ViewMode) => void
  /** 지파·제자 탭에 호버·터치 — 누르기 전에 청크를 받아 둔다 */
  onWarmTwelve: () => void
}) => {
  const opts: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'tree', label: '가계도', icon: 'account_tree' },
    { id: 'timeline', label: '시대순', icon: 'view_agenda' },
    { id: 'tribes', label: '지파·제자', icon: 'groups' },
  ]
  return (
    <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06]">
      {opts.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            onMouseEnter={o.id === 'tribes' ? onWarmTwelve : undefined}
            onTouchStart={o.id === 'tribes' ? onWarmTwelve : undefined}
            onFocus={o.id === 'tribes' ? onWarmTwelve : undefined}
            className={[
              'inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-[12px] font-semibold transition-all',
              active
                ? 'bg-white dark:bg-[var(--brand-soft-strong)] text-brand shadow-sm'
                : 'text-gray-500 dark:text-white/55 hover:text-gray-700 dark:hover:text-white/80',
            ].join(' ')}
          >
            <span className="material-icons-round" style={{ fontSize: 15 }}>
              {o.icon}
            </span>
            {/* 새로 생긴 보기라 모바일에서도 글자를 보여 찾기 쉽게 */}
            <span className={o.id === 'tribes' ? '' : 'hidden sm:inline'}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default Genealogy
