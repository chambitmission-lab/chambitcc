import { useMemo } from 'react'
import type { BibleFigureSummary } from '../../../../types/bibleFigure'

interface EraTimelineProps {
  nodes: BibleFigureSummary[]
  readingProgress: Record<string, number>
  selectedSlug: string | null
  onSelect: (slug: string) => void
  isLoggedIn: boolean
}

interface EraGroup {
  key: string
  label: string
  minOrder: number
  figures: BibleFigureSummary[]
}

const ERA_ALIAS: { match: (era: string) => boolean; label: string; order: number }[] = [
  { match: (e) => /창조|에덴|아담|홍수|노아 이전/.test(e), label: '창조 · 홍수 이전', order: 0 },
  { match: (e) => /족장/.test(e), label: '족장 시대', order: 1 },
  { match: (e) => /출애굽|광야/.test(e), label: '출애굽 · 광야', order: 2 },
  { match: (e) => /가나안|사사|정복/.test(e), label: '정복 · 사사', order: 3 },
  { match: (e) => /통일왕국|왕정|초기왕국/.test(e), label: '통일 왕국', order: 4 },
  { match: (e) => /분열|남유다|북이스라엘/.test(e), label: '분열 왕국', order: 5 },
  { match: (e) => /포로|귀환/.test(e), label: '포로 · 귀환', order: 6 },
  { match: (e) => /중간기/.test(e), label: '중간기', order: 7 },
  { match: (e) => /신약|예수|초대교회|사도/.test(e), label: '신약 · 메시아', order: 8 },
]

const eraGroupFor = (figure: BibleFigureSummary): { key: string; label: string; order: number } => {
  const era = figure.era || ''
  if (era) {
    const found = ERA_ALIAS.find((g) => g.match(era))
    if (found) return { key: found.label, label: found.label, order: found.order }
    return { key: era, label: era, order: 99 }
  }
  if (figure.testament === 'NEW') return { key: '신약 · 메시아', label: '신약 · 메시아', order: 8 }
  return { key: '기타', label: '기타', order: 100 }
}

export const EraTimeline = ({
  nodes,
  readingProgress,
  selectedSlug,
  onSelect,
  isLoggedIn,
}: EraTimelineProps) => {
  const groups = useMemo<EraGroup[]>(() => {
    const map = new Map<string, EraGroup>()
    for (const figure of nodes) {
      const { key, label, order } = eraGroupFor(figure)
      let group = map.get(key)
      if (!group) {
        group = { key, label, minOrder: order, figures: [] }
        map.set(key, group)
      }
      group.figures.push(figure)
      if ((figure.sort_order ?? 0) < group.minOrder) {
        group.minOrder = figure.sort_order ?? group.minOrder
      }
    }
    const arr = Array.from(map.values())
    arr.sort((a, b) => a.minOrder - b.minOrder)
    for (const g of arr) {
      g.figures.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }
    return arr
  }, [nodes])

  if (nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c26] py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
        조건에 맞는 인물이 없습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, gi) => {
        const total = group.figures.length
        const completed = isLoggedIn
          ? group.figures.filter((f) => (readingProgress[f.slug] ?? 0) >= 1).length
          : 0
        return (
          <section key={group.key} className="relative">
            {/* 시대 헤더 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[12px] font-bold shadow-[0_4px_12px_-2px_rgba(168,85,247,0.5)]">
                {gi + 1}
              </span>
              <h3 className="text-[15.5px] font-bold tracking-[-0.01em] text-gray-900 dark:text-white">
                {group.label}
              </h3>
              <span className="text-[11.5px] font-semibold text-gray-500 dark:text-white/45">
                {total}명{isLoggedIn && total > 0 ? ` · ${completed}/${total}` : ''}
              </span>
            </div>

            {/* 인물 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.figures.map((fig) => (
                <FigureRow
                  key={fig.slug}
                  figure={fig}
                  selected={fig.slug === selectedSlug}
                  progress={readingProgress[fig.slug] ?? 0}
                  isLoggedIn={isLoggedIn}
                  onSelect={() => onSelect(fig.slug)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

interface FigureRowProps {
  figure: BibleFigureSummary
  selected: boolean
  progress: number
  isLoggedIn: boolean
  onSelect: () => void
}

const FigureRow = ({ figure, selected, progress, isLoggedIn, onSelect }: FigureRowProps) => {
  const isJesus = figure.slug === 'jesus_christ'
  const isMessianic = figure.is_messianic_line
  const isFemale = figure.gender === 'female'
  const isKing = (figure.role || '').includes('왕')
  const isProphet = (figure.role || '').includes('선지자')

  const tagLabel = isJesus
    ? '메시아'
    : isKing
      ? '왕'
      : isProphet
        ? '선지자'
        : isFemale
          ? '여인'
          : figure.role || '족장'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'relative w-full text-left rounded-2xl px-3.5 py-3 border transition-all group overflow-hidden',
        isJesus
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent shadow-[0_10px_28px_-12px_rgba(236,72,153,0.6)]'
          : selected
            ? 'bg-purple-50 dark:bg-purple-500/15 border-purple-300 dark:border-purple-500/40'
            : isMessianic
              ? 'bg-white dark:bg-[#1c1c26] border-purple-200 dark:border-purple-500/25 hover:border-purple-300 dark:hover:border-purple-500/40'
              : 'bg-white dark:bg-[#1c1c26] border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.15]',
      ].join(' ')}
    >
      {/* 다크 카드 미세 광택 */}
      {!isJesus && (
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.01]" />
      )}

      <div className="relative flex items-center gap-3">
        {/* 아바타: 첫 글자 */}
        <div
          className={[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold',
            isJesus
              ? 'bg-white/25 text-white backdrop-blur-sm'
              : isMessianic
                ? 'bg-gradient-to-br from-purple-500/15 to-pink-500/15 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-500/30'
                : isFemale
                  ? 'bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300'
                  : 'bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/70',
          ].join(' ')}
        >
          {figure.name_ko.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={[
                'text-[14.5px] font-bold tracking-[-0.01em] truncate',
                isJesus ? 'text-white' : 'text-gray-900 dark:text-white',
              ].join(' ')}
            >
              {figure.name_ko}
            </span>
            {isMessianic && !isJesus && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0"
                title="메시아 직계"
              />
            )}
          </div>
          <div
            className={[
              'flex items-center gap-1.5 text-[11.5px] truncate',
              isJesus ? 'text-white/85' : 'text-gray-500 dark:text-white/55',
            ].join(' ')}
          >
            <span
              className={[
                'inline-flex items-center px-1.5 h-[18px] rounded-md text-[10.5px] font-semibold',
                isJesus
                  ? 'bg-white/25 text-white'
                  : isFemale
                    ? 'bg-pink-50 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300'
                    : isMessianic
                      ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/60',
              ].join(' ')}
            >
              {tagLabel}
            </span>
            {figure.name_en && (
              <span className="truncate opacity-80">{figure.name_en}</span>
            )}
          </div>
          {isLoggedIn && (
            <div
              className={[
                'mt-2 h-1 rounded-full overflow-hidden',
                isJesus ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/[0.06]',
              ].join(' ')}
            >
              <div
                className={[
                  'h-full rounded-full transition-all duration-500',
                  isJesus
                    ? 'bg-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500',
                ].join(' ')}
                style={{ width: `${Math.max(progress > 0 ? 4 : 0, progress * 100)}%` }}
              />
            </div>
          )}
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={[
            'flex-shrink-0 transition-transform group-hover:translate-x-0.5',
            isJesus ? 'text-white/90' : 'text-gray-400 dark:text-white/35',
          ].join(' ')}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}

export default EraTimeline
