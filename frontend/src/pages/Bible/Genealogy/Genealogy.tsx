import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMessianicGenealogy } from '../../../hooks/useBibleFigure'
import GenealogyTree from './components/GenealogyTree'
import FigureDetailPanel from './components/FigureDetailPanel'
import EraTimeline from './components/EraTimeline'
import type { BibleFigureSummary } from '../../../types/bibleFigure'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'

type ViewMode = 'tree' | 'timeline'
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
  const { data, isLoading, error } = useMessianicGenealogy()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(
    typeof window !== 'undefined' && window.innerWidth < 1024 ? 'timeline' : 'tree',
  )
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  const isLoggedIn = !!localStorage.getItem('access_token')

  const overallProgress = useMemo(() => {
    if (!data || !isLoggedIn) return null
    const values = Object.values(data.reading_progress || {})
    if (values.length === 0) return 0
    const sum = values.reduce((a, b) => a + b, 0)
    return sum / values.length
  }, [data, isLoggedIn])

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

  const matchedSlugs = useMemo(
    () => new Set(filteredNodes.map((n) => n.slug)),
    [filteredNodes],
  )

  return (
    <div className="bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen">
      {/* 패딩은 루트가 아닌 내부 래퍼에 — 루트는 .main-content > * { padding: 0 } (App.css)에 걸려 pb가 제거된다 */}
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-bottomnav-safe">
        {/* Breadcrumb + 헤더 */}
        <header className="mb-5">
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 mb-3">
            <Link
              to="/bible"
              className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
            >
              성경
            </Link>
            <span className="opacity-50">›</span>
            <span className="text-gray-700 dark:text-gray-300">믿음의 가계도</span>
          </div>

          <p className="text-purple-600 dark:text-purple-300/90 text-[11.5px] font-bold tracking-[0.14em] uppercase mb-1.5">
            Genealogy · 구속사 라인
          </p>
          <h1 className="text-gray-900 dark:text-white text-[26px] md:text-[30px] font-bold leading-[1.2] tracking-[-0.02em]">
            믿음의 가계도
          </h1>
          <p className="mt-2 text-[14px] text-gray-600 dark:text-white/65 leading-[1.65]">
            아담부터 예수 그리스도까지, 하나님이 친히 보존하신 메시아 약속의 계보입니다.
            {isLoggedIn ? (
              <> 통독한 구절이 늘어날수록 인물 카드가 또렷해져요.</>
            ) : (
              <>
                {' '}
                <Link
                  to="/login"
                  className="text-purple-600 dark:text-purple-300 hover:underline font-medium"
                >
                  로그인
                </Link>
                하면 통독 진도에 따라 안개가 걷히는 연출을 볼 수 있어요.
              </>
            )}
          </p>

          {/* 통계 칩 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <StatChip label="전체 인물" value={counts.total} />
            <StatChip label="메시아 직계" value={counts.messianic} accent />
            {overallProgress !== null && (
              <StatChip
                label="통독 진도"
                value={`${Math.round(overallProgress * 100)}%`}
                progress
              />
            )}
          </div>
        </header>

        {/* 로그인 사용자 진도 바 */}
        {overallProgress !== null && (
          <div className="mb-4 rounded-2xl bg-white dark:bg-[#1c1c26] border border-gray-200 dark:border-white/[0.08] p-4 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-50 dark:opacity-100 pointer-events-none bg-gradient-to-br from-purple-500/[0.04] via-transparent to-pink-500/[0.04] dark:from-white/[0.05] dark:via-transparent dark:to-white/[0.02]"
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-gray-700 dark:text-white/90">
                  메시아 라인 통독 진도
                </span>
                <span className="text-[13px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {Math.round(overallProgress * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 rounded-full"
                  style={{ width: `${Math.max(2, overallProgress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 검색 + 필터 + 뷰 토글 카드 */}
        <div className="mb-5 rounded-2xl bg-white dark:bg-[#1c1c26] border border-gray-200 dark:border-white/[0.08] p-3 relative overflow-hidden">
          <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]" />
          <div className="relative flex flex-col gap-3">
            {/* 검색 + 뷰 토글 한 줄 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 material-icons-round" style={{ fontSize: 18 }}>
                  search
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="인물·시대·역할 검색"
                  className="w-full h-10 pl-10 pr-3 rounded-xl text-[13.5px] bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/60 transition-colors"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="검색 지우기"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>

            {/* 역할 필터 pill */}
            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 scrollbar-hide">
              {ROLE_FILTERS.map((rf) => {
                const active = roleFilter === rf.id
                return (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => setRoleFilter(rf.id)}
                    className={[
                      'inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 transition-all',
                      active
                        ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                        : 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/60 border border-transparent hover:bg-gray-100 dark:hover:bg-white/[0.08]',
                    ].join(' ')}
                  >
                    <span aria-hidden>{rf.icon}</span>
                    {rf.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 검색/필터 결과 안내 */}
        {data && (query || roleFilter !== 'all') && (
          <div className="mb-3 text-[12.5px] text-gray-500 dark:text-white/55">
            <span className="font-semibold text-purple-600 dark:text-purple-300">
              {filteredNodes.length}명
            </span>
            의 인물이 일치합니다
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl bg-white dark:bg-[#1c1c26] border border-gray-200 dark:border-white/[0.08] py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
            가계도를 불러오는 중...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-[14px] text-red-700 dark:text-red-300">
            가계도 데이터를 불러오지 못했습니다.
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 min-w-0">
              {viewMode === 'tree' ? (
                <>
                  <GenealogyTree
                    nodes={data.nodes}
                    links={data.links}
                    readingProgress={data.reading_progress}
                    selectedSlug={selectedSlug}
                    onSelect={setSelectedSlug}
                    isLoggedIn={isLoggedIn}
                    highlightSlugs={query || roleFilter !== 'all' ? matchedSlugs : null}
                  />
                  <p className="mt-2 text-[11.5px] text-gray-400 dark:text-white/40 text-center">
                    Ctrl(⌘)+휠 또는 두 손가락 핀치로 확대·축소
                  </p>
                </>
              ) : (
                <EraTimeline
                  nodes={filteredNodes}
                  readingProgress={data.reading_progress}
                  selectedSlug={selectedSlug}
                  onSelect={setSelectedSlug}
                  isLoggedIn={isLoggedIn}
                />
              )}
            </div>

            {/* 데스크톱(lg+): 우측 sticky 사이드 패널 */}
            <aside className="hidden lg:block lg:col-span-1 min-w-0">
              <div className="sticky top-4">
                <FigureDetailPanel
                  slug={selectedSlug}
                  onSelect={setSelectedSlug}
                  onClose={() => setSelectedSlug(null)}
                />
              </div>
            </aside>
          </div>
        )}
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
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] bg-white dark:bg-[#1c1c26] rounded-t-[28px] shadow-[0_-20px_60px_-10px_rgba(168,85,247,0.35)] border-t border-x border-gray-200 dark:border-white/[0.08] flex flex-col overflow-hidden"
            >
              <div className="flex-shrink-0 flex justify-center py-2.5">
                <div className="w-10 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full" />
              </div>
              <div className="overflow-y-auto">
                <FigureDetailPanel
                  slug={selectedSlug}
                  onSelect={setSelectedSlug}
                  onClose={() => setSelectedSlug(null)}
                  variant="sheet"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 성경 섹션 하단 네비게이션 */}
      <BibleBottomNav active="genealogy" />
    </div>
  )
}

const StatChip = ({
  label,
  value,
  accent,
  progress,
}: {
  label: string
  value: number | string
  accent?: boolean
  progress?: boolean
}) => {
  let cls = 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/75 border border-gray-200 dark:border-white/[0.06]'
  if (accent) {
    cls =
      'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
  } else if (progress) {
    cls =
      'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/15 dark:to-pink-500/15 text-purple-700 dark:text-pink-300 border border-purple-200 dark:border-purple-500/30'
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[12px] font-semibold ${cls}`}
    >
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{value}</span>
    </span>
  )
}

const ViewToggle = ({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (v: ViewMode) => void
}) => {
  const opts: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'tree', label: '가계도', icon: 'account_tree' },
    { id: 'timeline', label: '시대순', icon: 'view_agenda' },
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
            className={[
              'inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-[12px] font-semibold transition-all',
              active
                ? 'bg-white dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 shadow-sm'
                : 'text-gray-500 dark:text-white/55 hover:text-gray-700 dark:hover:text-white/80',
            ].join(' ')}
          >
            <span className="material-icons-round" style={{ fontSize: 15 }}>
              {o.icon}
            </span>
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default Genealogy
