import { useMemo } from 'react'
import { DECADES } from '../historyData'
import { INDEXED_EVENTS } from '../historyThemes'
import type { IndexedEvent } from '../historyThemes'
import HistoryRecord from './HistoryRecord'

interface Props {
  openYears: Set<number>
  onToggleYear: (year: number) => void
  openItems: Set<number>
  onToggleItem: (index: number) => void
  flashedIndex: number | null
  sectionRef: (key: string, el: HTMLElement | null) => void
  ko: boolean
}

interface YearBucket {
  year: number
  milestones: IndexedEvent[]
  rest: IndexedEvent[]
}

/**
 * 연대순 렌즈. 이정표는 항상 펼쳐 보여주고, 나머지 기록은 연도 단위로 접어 둔다.
 * (예전에는 643건이 통째로 세로로 쏟아져서 연대 비교가 불가능했다.)
 */
const EraTimeline = ({
  openYears,
  onToggleYear,
  openItems,
  onToggleItem,
  flashedIndex,
  sectionRef,
  ko,
}: Props) => {
  const byDecade = useMemo(() => {
    const map = new Map<string, YearBucket[]>()
    const yearIndex = new Map<string, YearBucket>()
    INDEXED_EVENTS.forEach((e) => {
      const key = `${e.decade}:${e.year}`
      let bucket = yearIndex.get(key)
      if (!bucket) {
        bucket = { year: e.year, milestones: [], rest: [] }
        yearIndex.set(key, bucket)
        if (!map.has(e.decade)) map.set(e.decade, [])
        map.get(e.decade)!.push(bucket)
      }
      if (e.event.icon) bucket.milestones.push(e)
      else bucket.rest.push(e)
    })
    return map
  }, [])

  return (
    <div className="hera">
      {DECADES.filter((d) => byDecade.has(d.key)).map((decade) => {
        const years = byDecade.get(decade.key)!
        const total = years.reduce((n, y) => n + y.milestones.length + y.rest.length, 0)
        return (
          <section
            key={decade.key}
            data-decade={decade.key}
            ref={(el) => sectionRef(decade.key, el)}
            className="hera-decade"
          >
            <header className="hera-chapter">
              <div className="hera-chapter-era">
                <span>{decade.label}</span>
                <span className="hera-chapter-period">{decade.period}</span>
                <span className="hera-chapter-total">
                  {total}
                  {ko ? '건' : ''}
                </span>
              </div>
              <h2 className="hera-chapter-title">{decade.title}</h2>
              <p className="hera-chapter-copy">{decade.copy}</p>
            </header>

            <div className="hera-years">
              {years.map((bucket) => {
                const open = openYears.has(bucket.year)
                const count = bucket.milestones.length + bucket.rest.length
                const preview = bucket.rest[0]?.event.text.split('\n')[0]
                return (
                  <div key={bucket.year} id={`hyear-${bucket.year}`} className="hyear">
                    <div className="hyear-head">
                      <span className="hyear-label">{bucket.year}</span>
                      <span className="hyear-count">
                        {count}
                        {ko ? '건' : ''}
                      </span>
                      {bucket.milestones.length > 0 && (
                        <span className="hyear-icons" aria-hidden="true">
                          {bucket.milestones.map((m) => m.event.icon).join(' ')}
                        </span>
                      )}
                    </div>

                    {bucket.milestones.map(({ event, index }) => (
                      <HistoryRecord
                        key={index}
                        event={event}
                        index={index}
                        open={openItems.has(index)}
                        onToggle={onToggleItem}
                        flashed={flashedIndex === index}
                        ko={ko}
                      />
                    ))}

                    {bucket.rest.length > 0 && !open && preview && (
                      <p className="hyear-preview">{preview}</p>
                    )}

                    {bucket.rest.length > 0 && (
                      <button
                        type="button"
                        className={`hyear-toggle ${open ? 'is-open' : ''}`}
                        onClick={() => onToggleYear(bucket.year)}
                        aria-expanded={open}
                      >
                        {open
                          ? ko
                            ? '기록 접기'
                            : 'Collapse'
                          : ko
                            ? `그 해의 기록 ${bucket.rest.length}건 더보기`
                            : `Show ${bucket.rest.length} more`}
                        <span className="hyear-chevron" aria-hidden="true" />
                      </button>
                    )}

                    {open &&
                      bucket.rest.map(({ event, index }) => (
                        <HistoryRecord
                          key={index}
                          event={event}
                          index={index}
                          open={openItems.has(index)}
                          onToggle={onToggleItem}
                          flashed={flashedIndex === index}
                          ko={ko}
                        />
                      ))}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default EraTimeline
