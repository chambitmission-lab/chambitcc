import { useMemo } from 'react'
import { DECADES } from '../historyData'
import { INDEXED_EVENTS, THEME_STATS } from '../historyThemes'
import type { ThemeKey } from '../historyThemes'
import HistoryRecord from './HistoryRecord'
import { HistoryGlyph } from '../HistoryIcons'

interface Props {
  active: ThemeKey | null
  onSelect: (key: ThemeKey | null) => void
  openItems: Set<number>
  onToggleItem: (index: number) => void
  ko: boolean
}

const decadeLabel = (key: string) => DECADES.find((d) => d.key === key)?.label ?? key

/**
 * 테마별 렌즈. 32년을 시간이 아니라 주제로 가로지른다.
 * 색으로 테마를 구분하지 않고 이모지 + 이름으로 구분한다 (색맹 안전, 브랜드 일관성).
 */
const ThemeLens = ({ active, onSelect, openItems, onToggleItem, ko }: Props) => {
  const detail = useMemo(() => {
    if (!active) return null
    const stat = THEME_STATS.find((t) => t.key === active)!
    const groups = DECADES.map((d) => ({
      decade: d,
      items: INDEXED_EVENTS.filter((e) => e.theme === active && e.decade === d.key),
    })).filter((g) => g.items.length > 0)
    return { stat, groups }
  }, [active])

  if (detail) {
    const { stat, groups } = detail
    return (
      <div className="hthm-detail">
        <button type="button" className="hthm-back" onClick={() => onSelect(null)}>
          <span aria-hidden="true">←</span> {ko ? '전체 테마' : 'All themes'}
        </button>

        <header className="hthm-detail-head">
          <span className="hthm-detail-icon" aria-hidden="true">
            <HistoryGlyph emoji={stat.icon} size={23} />
          </span>
          <h2 className="hthm-detail-title">{stat.label}</h2>
          <p className="hthm-detail-copy">{stat.copy}</p>
          <p className="hthm-detail-count">
            {ko ? `기록 ${stat.count}건` : `${stat.count} records`}
          </p>
        </header>

        {groups.map(({ decade, items }) => (
          <section key={decade.key} className="hthm-group">
            <div className="hthm-group-head">
              <span className="hthm-group-era">{decade.label}</span>
              <span className="hthm-group-count">
                {items.length}
                {ko ? '건' : ''}
              </span>
            </div>
            {items.map(({ event, index }) => (
              <HistoryRecord
                key={index}
                event={event}
                index={index}
                open={openItems.has(index)}
                onToggle={onToggleItem}
                showYear
                ko={ko}
              />
            ))}
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="hthm">
      <p className="hthm-lead">
        {ko
          ? '32년을 시간이 아니라 주제로 가로질러 봅니다. 카드를 누르면 그 갈래의 기록만 모아 보여줍니다.'
          : 'Cut across 32 years by theme instead of time.'}
      </p>
      <div className="hthm-grid">
        {THEME_STATS.map((stat) => {
          const peak = Math.max(...DECADES.map((d) => stat.byDecade[d.key] ?? 0), 1)
          return (
            <button
              key={stat.key}
              type="button"
              className="hthm-card"
              onClick={() => onSelect(stat.key)}
            >
              <span className="hthm-card-icon" aria-hidden="true">
                <HistoryGlyph emoji={stat.icon} size={19} />
              </span>
              <span className="hthm-card-label">{stat.label}</span>
              <span className="hthm-card-count">
                {stat.count}
                <em>{ko ? '건' : ''}</em>
              </span>
              <span className="hthm-card-spark" aria-hidden="true">
                {DECADES.map((d) => (
                  <span key={d.key} className="hthm-card-spark-slot">
                    <span className="hthm-card-spark-track">
                      <span
                        className="hthm-card-spark-fill"
                        style={{
                          ['--f' as string]: `${Math.round(((stat.byDecade[d.key] ?? 0) / peak) * 100)}%`,
                        }}
                      />
                    </span>
                    {/* '1990s' → '90' */}
                    <span className="hthm-card-spark-tick">{d.key.slice(2, 4)}</span>
                  </span>
                ))}
              </span>
              <span className="hthm-card-peak">
                {ko ? `기록 최다 · ${decadeLabel(stat.peakDecade)}` : `Peak · ${decadeLabel(stat.peakDecade)}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeLens
