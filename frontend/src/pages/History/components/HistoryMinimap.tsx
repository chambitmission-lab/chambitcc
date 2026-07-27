import { MAX_YEAR_COUNT, YEAR_BARS } from '../historyThemes'

const BAR_AREA = 58 // px — 막대 영역 높이
const MIN_BAR = 3 // 기록이 있는 해는 최소한 보이게

interface Props {
  activeDecade: string
  onPickYear: (year: number) => void
  ko: boolean
}

/**
 * 32년치 연도별 기록 수를 한 줄 막대로 압축한 미니맵.
 * 단일 계열이라 색은 브랜드 한 가지만 쓰고, 마일스톤은 아래 점으로 따로 표시한다.
 */
const HistoryMinimap = ({ activeDecade, onPickYear, ko }: Props) => {
  const first = YEAR_BARS[0].year
  const last = YEAR_BARS[YEAR_BARS.length - 1].year

  return (
    <section className="hmap glass-card" aria-label={ko ? '연도별 기록 미니맵' : 'Records by year'}>
      <header className="hmap-head">
        <h2 className="hmap-title">
          {first} <span aria-hidden="true">→</span> {last}
        </h2>
        <p className="hmap-sub">{ko ? '연도별 기록 수 · 탭하면 그 해로' : 'Records per year · tap to jump'}</p>
      </header>

      <div className="hmap-bars">
        {YEAR_BARS.map((bar) => {
          const h = bar.count === 0 ? 0 : Math.max(MIN_BAR, (bar.count / MAX_YEAR_COUNT) * BAR_AREA)
          return (
            <button
              key={bar.year}
              type="button"
              className={`hmap-col ${bar.decade === activeDecade ? 'is-active' : ''}`}
              style={{ ['--h' as string]: `${h}px` }}
              onClick={() => onPickYear(bar.year)}
              title={`${bar.year} · ${bar.count}건`}
              aria-label={
                ko ? `${bar.year}년 기록 ${bar.count}건` : `${bar.year}: ${bar.count} records`
              }
            >
              <span className="hmap-bar" />
              <span className={`hmap-tick ${bar.milestones > 0 ? 'has-milestone' : ''}`} />
            </button>
          )
        })}
      </div>

      <div className="hmap-axis" aria-hidden="true">
        <span>1994</span>
        <span>2002</span>
        <span>2010</span>
        <span>2018</span>
        <span>{last}</span>
      </div>

      <p className="hmap-legend">
        <span className="hmap-legend-dot" aria-hidden="true" />
        {ko ? '점이 찍힌 해에 주요 이정표가 있습니다' : 'Dotted years contain milestones'}
      </p>
    </section>
  )
}

export default HistoryMinimap
