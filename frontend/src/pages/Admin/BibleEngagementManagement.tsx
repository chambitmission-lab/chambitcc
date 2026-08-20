import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  fetchBibleEngagement,
  type BibleEngagementData,
  type EngagementVerse,
} from '../../api/admin'
import { FilterChip, FilterRow } from './components/FilterControls'
import { AdminPageHeader, EmptyHint, SectionCard, StatSpinner } from './components/StatCards'

type PeriodKey = 'all' | '7' | '30' | '90'
type TopTab = 'favorites' | 'notes' | 'underlines'

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: '7', label: '최근 7일' },
  { key: '30', label: '최근 30일' },
  { key: '90', label: '최근 90일' },
  { key: 'all', label: '전체 기간' },
]

const TOP_TABS: Array<{ key: TopTab; label: string }> = [
  { key: 'favorites', label: '⭐ 즐겨찾기' },
  { key: 'notes', label: '📝 묵상 노트' },
  { key: 'underlines', label: '🖊️ 밑줄 단어' },
]

/** 밑줄 단어 탭: 본문 미리보기에서 밑줄 그어진 단어를 강조해서 보여준다 */
const renderTextWithWords = (text: string, words?: string[]): React.ReactNode => {
  if (!words?.length) return text
  const ranges: Array<[number, number]> = []
  for (const word of words) {
    if (!word) continue
    const idx = text.indexOf(word)
    if (idx >= 0) ranges.push([idx, idx + word.length])
  }
  if (!ranges.length) return text
  ranges.sort((a, b) => a[0] - b[0])

  const parts: React.ReactNode[] = []
  let cursor = 0
  ranges.forEach(([start, end], i) => {
    if (start < cursor) return
    if (start > cursor) parts.push(text.slice(cursor, start))
    parts.push(
      <span
        key={i}
        className="font-bold text-brand underline decoration-2 underline-offset-2"
      >
        {text.slice(start, end)}
      </span>
    )
    cursor = end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

const BibleEngagementManagement = () => {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<PeriodKey>('7')
  const [topTab, setTopTab] = useState<TopTab>('favorites')
  const admin = isAdmin()

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  const { data, isPending, isError } = useQuery<BibleEngagementData>({
    queryKey: ['admin-bible-engagement', period],
    queryFn: () => fetchBibleEngagement(period === 'all' ? undefined : Number(period)),
    enabled: admin,
    // 기간 전환 시 스피너 대신 이전 데이터를 유지해 깜빡임 방지
    placeholderData: keepPreviousData,
  })
  const loading = isPending && !data

  useEffect(() => {
    if (isError) showToast('통계를 불러오는데 실패했습니다', 'error')
  }, [isError])

  const topList: EngagementVerse[] = data
    ? topTab === 'favorites'
      ? data.top_favorites
      : topTab === 'notes'
        ? data.top_notes
        : data.top_underlines
    : []

  const maxBookCount = data?.book_distribution[0]?.count ?? 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-10 lg:max-w-[1100px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border">
        <AdminPageHeader title="말씀 반응 통계" />

        {/* 익명 집계 안내 */}
        <p className="px-4 pt-3 text-[11.5px] text-gray-500 dark:text-white/45 leading-relaxed">
          교인들이 어느 말씀에 머무는지 보여주는 익명 집계입니다. 누가 기록했는지와 노트 내용은 표시되지 않습니다.
        </p>

        {/* 기간 필터 */}
        <div className="px-4 pt-3">
          <FilterRow label="기간" align="center">
            {PERIODS.map(p => (
              <FilterChip key={p.key} active={period === p.key} onClick={() => setPeriod(p.key)}>
                {p.label}
              </FilterChip>
            ))}
          </FilterRow>
        </div>

        {loading ? (
          <StatSpinner />
        ) : !data ? (
          <p className="px-4 py-16 text-center text-[13px] text-gray-500 dark:text-white/50">
            통계를 불러오지 못했습니다
          </p>
        ) : (
          <>
            {/* 요약 카드 */}
            <div className="px-4 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
              <SummaryCard icon="⭐" label="즐겨찾기" data={data.summary.favorites} />
              <SummaryCard icon="📝" label="묵상 노트" data={data.summary.notes} />
              <SummaryCard icon="🖍️" label="하이라이트" data={data.summary.highlights} />
              <SummaryCard icon="🖊️" label="단어 밑줄" data={data.summary.word_notes} />
            </div>

            {/* PC(lg+) 2단 — 좌: TOP 구절(긴 목록) / 우: 단어·책별 분포.
                래퍼 3개는 lg 미만에서 display:contents 라 모바일 흐름은 기존과 동일하다. */}
            <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
              <div className="contents lg:block lg:min-w-0">
                {/* TOP 구절 */}
                <SectionCard title="가장 많이 반응한 구절 TOP 10">
                  <div className="flex gap-1.5 flex-wrap pb-1">
                    {TOP_TABS.map(tab => (
                      <FilterChip key={tab.key} active={topTab === tab.key} onClick={() => setTopTab(tab.key)}>
                        {tab.label}
                      </FilterChip>
                    ))}
                  </div>

                  {topList.length === 0 ? (
                    <EmptyHint text="아직 이 기간의 기록이 없습니다" />
                  ) : (
                    <>
                    <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
                      구절을 누르면 해당 장으로 이동합니다. 본문 속 밑줄·하이라이트는 각자 본인 기록만 보이므로, 다른 교인의 기록은 본문에 표시되지 않습니다.
                    </p>
                    <ol className="space-y-1.5">
                      {topList.map((item, index) => (
                        <li key={item.verse_id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/bible/${item.book_number}/${item.chapter}`)}
                            className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] hover:border-brand transition-colors"
                          >
                            <span
                              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${
                                index < 3
                                  ? 'bg-[var(--brand-soft-strong)] text-brand'
                                  : 'bg-gray-200/70 dark:bg-white/[0.06] text-gray-500 dark:text-white/45'
                              }`}
                            >
                              {index + 1}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[13px] font-bold text-ink-strong tracking-[-0.01em]">
                                {item.book_name} {item.chapter}:{item.verse}
                              </span>
                              <span className="block text-[12px] text-gray-500 dark:text-white/55 leading-relaxed line-clamp-2 mt-0.5">
                                {renderTextWithWords(item.text, item.words)}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11.5px] font-semibold text-brand mt-0.5">
                              {item.count !== item.users ? `${item.count}건 · ${item.users}명` : `${item.users}명`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                    </>
                  )}
                </SectionCard>
              </div>

              <div className="contents lg:block">
                {/* 많이 찾은 단어 */}
                <SectionCard title="가장 많이 찾은 단어">
                  {data.top_words.length === 0 ? (
                    <EmptyHint text="아직 단어장 기록이 없습니다" />
                  ) : (
                    <div className="flex gap-1.5 flex-wrap">
                      {data.top_words.map(w => (
                        <span
                          key={w.word}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-gray-800 dark:text-white/80"
                        >
                          {w.word}
                          <span className="text-[11px] font-bold text-brand">{w.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* 책별 분포 */}
                <SectionCard title="책별 반응 분포">
                  {data.book_distribution.length === 0 ? (
                    <EmptyHint text="아직 기록이 없습니다" />
                  ) : (
                    <div className="space-y-2">
                      {data.book_distribution.map(book => (
                        <div key={book.book_number} className="flex items-center gap-2.5">
                          <span className="w-16 shrink-0 text-[12px] font-semibold text-gray-700 dark:text-white/70 truncate">
                            {book.book_name}
                          </span>
                          <div className="flex-1 h-[10px] rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand transition-all duration-500"
                              style={{ width: `${Math.max(6, (book.count / maxBookCount) * 100)}%` }}
                            />
                          </div>
                          <span className="w-9 shrink-0 text-right text-[11.5px] font-bold text-gray-500 dark:text-white/50">
                            {book.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const SummaryCard = ({
  icon,
  label,
  data,
}: {
  icon: string
  label: string
  data: { total: number; users: number }
}) => (
  <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] px-3.5 py-3">
    <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
    <div className="relative z-10">
      <p className="text-[12px] font-semibold text-gray-500 dark:text-white/55">
        <span className="mr-1">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-[20px] font-bold text-ink-strong tracking-[-0.02em]">
        {data.total.toLocaleString()}
        <span className="text-[12px] font-semibold text-gray-400 dark:text-white/40 ml-0.5">건</span>
      </p>
      <p className="text-[11px] font-medium text-brand">
        {data.users.toLocaleString()}명 참여
      </p>
    </div>
  </div>
)

export default BibleEngagementManagement
