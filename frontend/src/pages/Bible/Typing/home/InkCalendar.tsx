import { useMemo } from 'react'
import type { TypingCalendar, TypingStats } from '../../../../api/bibleTyping'
import { addDays, dayOf, kstToday, mondayOf, monthOf } from './dates'

const WEEKS = 26

/** 그날 쓴 절 수 → 잉크 농도 1~4 */
const levelOf = (n: number) => (n <= 0 ? 0 : n < 3 ? 1 : n < 5 ? 2 : n < 10 ? 3 : 4)

/** 날짜로 고정되는 번짐 모양 0~3 — 칸마다 잉크가 조금씩 다르게 번진다 */
const blotOf = (date: string) => {
  let h = 0
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0
  return h % 4
}

interface InkCalendarProps {
  calendar?: TypingCalendar
  stats?: TypingStats
}

/**
 * 나의 필사 노트 — 최근 26주를 잉크 자국으로. 많이 쓴 날일수록 진하게 번진다.
 * 연속 기록을 이어 준 쉼표(쉰 날)는 쉼표 표시로 남긴다.
 */
const InkCalendar = ({ calendar, stats }: InkCalendarProps) => {
  const today = calendar?.today ?? kstToday()
  const rests = useMemo(() => new Set(stats?.rest_days ?? []), [stats?.rest_days])

  const { columns, months } = useMemo(() => {
    const first = addDays(mondayOf(today), -7 * (WEEKS - 1))
    const cols: { date: string; n: number; future: boolean }[][] = []
    const labels: { col: number; text: string }[] = []
    let lastMonth = 0
    for (let w = 0; w < WEEKS; w++) {
      const monday = addDays(first, 7 * w)
      const col = Array.from({ length: 7 }, (_, d) => {
        const date = addDays(monday, d)
        return { date, n: calendar?.days[date] ?? 0, future: date > today }
      })
      cols.push(col)
      // 그 주에 1일이 들어 있으면(또는 첫 칸이면) 달 이름을 단다
      const firstOfMonth = col.find((c) => dayOf(c.date) === 1)
      const m = firstOfMonth ? monthOf(firstOfMonth.date) : w === 0 ? monthOf(monday) : 0
      if (m && m !== lastMonth) {
        labels.push({ col: w, text: `${m}월` })
        lastMonth = m
      }
    }
    return { columns: cols, months: labels }
  }, [calendar, today])

  const activeDays = Object.keys(calendar?.days ?? {}).length

  return (
    <section className="bt-section" aria-labelledby="bt-ink-title">
      <h2 id="bt-ink-title" className="bt-section__title">
        나의 필사 노트
        <span className="bt-section__sub">최근 6개월</span>
      </h2>
      <div className="bt-card bt-ink">
        <dl className="bt-ink__stats">
          <div>
            <dt>새긴 절</dt>
            <dd>{(stats?.total_verses ?? 0).toLocaleString()}</dd>
          </div>
          <div>
            <dt>쓴 날</dt>
            <dd>{stats?.typing_days ?? activeDays}</dd>
          </div>
          <div>
            <dt>완필한 장</dt>
            <dd>{stats?.completed_chapters ?? 0}</dd>
          </div>
          <div>
            <dt>암송한 절</dt>
            <dd>{stats?.memorize_verses ?? 0}</dd>
          </div>
        </dl>

        <div className="bt-ink__board">
          <div className="bt-ink__months" aria-hidden style={{ ['--weeks' as string]: WEEKS }}>
            {months.map((m) => (
              <span key={`${m.col}-${m.text}`} style={{ gridColumn: m.col + 1 }}>
                {m.text}
              </span>
            ))}
          </div>
          <div className="bt-ink__grid" role="img" aria-label={`최근 6개월 동안 ${activeDays}일 필사`} style={{ ['--weeks' as string]: WEEKS }}>
            {columns.flat().map((c) => {
              const lv = levelOf(c.n)
              const rest = rests.has(c.date)
              return (
                <span
                  key={c.date}
                  className={[
                    'bt-ink__cell',
                    `lv-${lv}`,
                    `blot-${blotOf(c.date)}`,
                    c.future ? 'is-future' : '',
                    rest ? 'is-rest' : '',
                    c.date === today ? 'is-today' : '',
                  ].join(' ')}
                  title={c.future ? undefined : rest ? `${c.date} · 쉼표` : c.n ? `${c.date} · ${c.n}절` : c.date}
                />
              )
            })}
          </div>
        </div>

        <div className="bt-ink__legend" aria-hidden>
          <span>옅게</span>
          {[1, 2, 3, 4].map((lv) => (
            <span key={lv} className={`bt-ink__cell lv-${lv} blot-${lv - 1}`} />
          ))}
          <span>진하게</span>
          <span className="bt-ink__legend-rest">
            <span className="bt-ink__cell is-rest" /> 쉼표
          </span>
        </div>
      </div>
    </section>
  )
}

export default InkCalendar
