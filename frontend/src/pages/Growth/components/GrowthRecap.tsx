import { useMemo, useState } from 'react'
import type { TimelineDomain, TimelineEvent } from '../../../types/growth'
import { DomainGlyph, GrowthGlyph } from '../../../components/icons/GrowthIcons'
import { DOMAIN_META, DOMAIN_ORDER, WEEKDAY_KO, dayLabel, ymdLocal } from './timelineMeta'
import './GrowthRecap.css'

/**
 * 지난 8주 돌아보기 — 숫자 대시보드가 아니라 "내가 이렇게 걸어왔구나"를 한눈에.
 *  1) 발자국 달력: 요일×주 칸에 그날 남긴 기록 수만큼 진해지는 도장(날짜 숫자 포함)
 *  2) 칸을 누르면 그날 한 일 미리보기 + "이날 기록 보기"(아래 발자취로 이동)
 *  3) 기록의 결: 8주 동안 무엇을 많이 했는지 도메인 비율 띠
 *  4) 돌아보는 한 줄: 가장 많이 한 일·가장 뜨거웠던 날·자주 찾은 시간·읽은 말씀
 * 타임라인 첫 구간(60일)만으로 계산한다 — 백엔드 무변경.
 */

const WEEKS = 8

interface DayStat {
  date: string
  count: number
  domains: { domain: TimelineDomain; count: number }[]
  items: { domain: TimelineDomain; title: string; time: string | null }[]
}

/** 기록 수 → 도장 농도 0~4 */
const levelOf = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4)

const TIME_SLOTS: { label: string; range: string; from: number; to: number }[] = [
  { label: '새벽', range: '오전 0~5시', from: 0, to: 5 },
  { label: '아침', range: '오전 5~11시', from: 5, to: 11 },
  { label: '낮', range: '오전 11시~오후 5시', from: 11, to: 17 },
  { label: '저녁', range: '오후 5~9시', from: 17, to: 21 },
  { label: '밤', range: '오후 9시~자정', from: 21, to: 24 },
]

/** "15:07" → "오후 3:07" */
const timeLabel = (t: string) => {
  const h = Number(t.slice(0, 2))
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${t.slice(3, 5)}`
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

interface GrowthRecapProps {
  events: TimelineEvent[]
  onJumpToDay: (date: string) => void
}

const GrowthRecap = ({ events, onJumpToDay }: GrowthRecapProps) => {
  const todayStr = ymdLocal(new Date())

  const recap = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // 이번 주 일요일에서 7주를 거슬러 — 열 = 주, 행 = 요일(일~토)
    const start = addDays(today, -today.getDay() - (WEEKS - 1) * 7)
    const startStr = ymdLocal(start)

    const byDate = new Map<string, TimelineEvent[]>()
    events.forEach((e) => {
      if (e.date < startStr || e.date > todayStr) return
      const list = byDate.get(e.date)
      if (list) list.push(e)
      else byDate.set(e.date, [e])
    })

    const columns: (DayStat | null)[][] = []
    const monthMarks: (string | null)[] = []
    for (let w = 0; w < WEEKS; w++) {
      const col: (DayStat | null)[] = []
      let mark: string | null = null
      for (let d = 0; d < 7; d++) {
        const day = addDays(start, w * 7 + d)
        const date = ymdLocal(day)
        if (date > todayStr) {
          col.push(null)
          continue
        }
        if (day.getDate() === 1 || (w === 0 && d === 0)) mark = `${day.getMonth() + 1}월`
        const list = byDate.get(date) ?? []
        const counts = new Map<TimelineDomain, number>()
        list.forEach((e) => counts.set(e.domain, (counts.get(e.domain) ?? 0) + 1))
        col.push({
          date,
          count: list.length,
          domains: DOMAIN_ORDER.filter((k) => counts.has(k)).map((k) => ({
            domain: k,
            count: counts.get(k) as number,
          })),
          items: list.slice(0, 3).map((e) => ({ domain: e.domain, title: e.title, time: e.time })),
        })
      }
      columns.push(col)
      monthMarks.push(mark)
    }

    const days = columns.flat().filter((d): d is DayStat => !!d)
    const activeDays = days.filter((d) => d.count > 0)
    const thisWeekActive = columns[WEEKS - 1].filter((d) => d && d.count > 0).length

    // 기록의 결 — 도메인 비율
    const domainTotals = new Map<TimelineDomain, number>()
    const slotCounts = TIME_SLOTS.map(() => 0)
    let versesRead = 0
    let total = 0
    byDate.forEach((list) =>
      list.forEach((e) => {
        total++
        domainTotals.set(e.domain, (domainTotals.get(e.domain) ?? 0) + 1)
        if (e.time) {
          const h = Number(e.time.slice(0, 2))
          const i = TIME_SLOTS.findIndex((s) => h >= s.from && h < s.to)
          if (i >= 0) slotCounts[i]++
        }
        if (e.type === 'read') versesRead += Number(e.meta?.verse_count ?? 0) || 0
      }),
    )
    const mix = DOMAIN_ORDER.filter((k) => domainTotals.has(k))
      .map((k) => ({ domain: k, count: domainTotals.get(k) as number }))
      .sort((a, b) => b.count - a.count)

    const busiest = activeDays.reduce<DayStat | null>(
      (best, d) => (!best || d.count > best.count ? d : best),
      null,
    )
    const slotMax = Math.max(...slotCounts)
    const favoriteSlot = slotMax > 0 ? TIME_SLOTS[slotCounts.indexOf(slotMax)] : null

    return {
      columns,
      monthMarks,
      totalDays: days.length,
      activeDays: activeDays.length,
      thisWeekActive,
      mix,
      total,
      busiest,
      favoriteSlot,
      versesRead,
      latestActive: activeDays[activeDays.length - 1]?.date ?? null,
    }
  }, [events, todayStr])

  const [picked, setPicked] = useState<string | null>(null)
  const selectedDate = picked ?? recap.latestActive ?? todayStr
  const selected = useMemo(
    () => recap.columns.flat().find((d) => d?.date === selectedDate) ?? null,
    [recap.columns, selectedDate],
  )

  if (recap.total === 0) return null

  const top = recap.mix[0]

  return (
    <section className="px-4 pt-5" aria-labelledby="grc-title">
      <div className="grc-card">
        <div className="grc-main">
        <header className="grc-head">
          <p className="grc-eyebrow">지난 8주 돌아보기</p>
          <h3 id="grc-title" className="grc-title">
            {recap.totalDays}일 중 <em>{recap.activeDays}일</em>,
            <br />
            주님 앞에 발자국을 남겼어요
          </h3>
          <p className="grc-sub">
            {recap.thisWeekActive > 0
              ? `이번 주에도 벌써 ${recap.thisWeekActive}일째 이어가고 있어요`
              : '이번 주 첫 발자국을 기다리고 있어요'}
          </p>
        </header>

        {/* 발자국 달력 */}
        <div className="grc-board" role="group" aria-label="최근 8주 활동 달력">
          <div className="grc-month-row" aria-hidden="true">
            <span />
            {recap.monthMarks.map((m, i) => (
              <span key={i} className="grc-month">{m}</span>
            ))}
          </div>
          <div className="grc-grid">
            <div className="grc-weekdays" aria-hidden="true">
              {WEEKDAY_KO.map((w, i) => (
                <span key={w} className={i === 0 ? 'is-sun' : ''}>{w}</span>
              ))}
            </div>
            {recap.columns.map((col, w) => (
              <div key={w} className="grc-col">
                {col.map((day, d) =>
                  day ? (
                    <button
                      key={day.date}
                      type="button"
                      className={
                        'grc-cell' +
                        (day.date === todayStr ? ' is-today' : '') +
                        (day.date === selectedDate ? ' is-picked' : '')
                      }
                      data-level={levelOf(day.count)}
                      style={{ ['--grc-i' as string]: w * 7 + d }}
                      onClick={() => setPicked(day.date)}
                      aria-label={`${dayLabel(day.date)} 기록 ${day.count}개`}
                      aria-pressed={day.date === selectedDate}
                    >
                      {Number(day.date.slice(8))}
                    </button>
                  ) : (
                    <span key={`f${d}`} className="grc-cell is-future" aria-hidden="true" />
                  ),
                )}
              </div>
            ))}
          </div>
          <div className="grc-legend" aria-hidden="true">
            <span>쉼</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <i key={l} className="grc-cell grc-legend-cell" data-level={l} />
            ))}
            <span>가득</span>
          </div>
        </div>

        {/* 고른 날 미리보기 — 토스 내역식: 아이콘 행 + 시각, "외 N개"는 하단 버튼으로 흡수 */}
        {selected && (
          <div className="grc-day" key={selected.date}>
            <div className="grc-day-head">
              <strong>{dayLabel(selected.date)}</strong>
              {selected.count > 0 && <span className="grc-day-count">기록 {selected.count}개</span>}
            </div>
            {selected.count > 0 ? (
              <>
                <div className="grc-day-domains">
                  {selected.domains.map(({ domain, count }) => (
                    <span
                      key={domain}
                      style={{ ['--grc-dot' as string]: DOMAIN_META[domain].color }}
                    >
                      {DOMAIN_META[domain].label} <b>{count}</b>
                    </span>
                  ))}
                </div>
                <ul className="grc-day-list">
                  {selected.items.map((it, i) => (
                    <li key={i} style={{ ['--grc-dot' as string]: DOMAIN_META[it.domain].color }}>
                      <span className="grc-day-icon" aria-hidden="true">
                        <DomainGlyph domain={it.domain} size={16} />
                      </span>
                      <span className="grc-day-title">{it.title}</span>
                      {it.time && <time className="grc-day-time">{timeLabel(it.time)}</time>}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="grc-day-jump"
                  onClick={() => onJumpToDay(selected.date)}
                >
                  {selected.count > selected.items.length
                    ? `이날 기록 ${selected.count}개 모두 보기`
                    : '이날 기록 자세히 보기'}
                  <span className="material-icons-outlined" aria-hidden="true">chevron_right</span>
                </button>
              </>
            ) : (
              <p className="grc-day-empty">
                {selected.date === todayStr
                  ? '오늘은 아직 조용해요. 말씀 한 절로 첫 발자국을 남겨 볼까요?'
                  : '쉼표 같은 하루였어요. 쉬어 가는 날도 여정의 일부예요.'}
              </p>
            )}
          </div>
        )}

        </div>

        <div className="grc-side">
        {/* 기록의 결 */}
        <div className="grc-mix">
          <div className="grc-mix-head">
            <span>내 기록의 결</span>
            <span className="grc-mix-total">기록 {recap.total.toLocaleString('ko-KR')}개</span>
          </div>
          <div className="grc-mix-bar" role="img" aria-label={recap.mix.map((m) => `${DOMAIN_META[m.domain].label} ${m.count}개`).join(', ')}>
            {recap.mix.map((m) => (
              <span
                key={m.domain}
                style={{
                  flexGrow: m.count,
                  ['--grc-dot' as string]: DOMAIN_META[m.domain].color,
                }}
              />
            ))}
          </div>
          <div className="grc-mix-legend">
            {recap.mix.map((m) => (
              <span key={m.domain} style={{ ['--grc-dot' as string]: DOMAIN_META[m.domain].color }}>
                {DOMAIN_META[m.domain].label}
                <b>{Math.round((m.count / recap.total) * 100)}%</b>
              </span>
            ))}
          </div>
        </div>

        {/* 돌아보는 한 줄 */}
        <ul className="grc-facts">
          {top && (
            <li style={{ ['--grc-dot' as string]: DOMAIN_META[top.domain].color }}>
              <span className="grc-fact-icon"><DomainGlyph domain={top.domain} size={18} /></span>
              <span className="grc-fact-label">가장 많이 남긴 기록</span>
              <span className="grc-fact-value">
                {DOMAIN_META[top.domain].label} {top.count}번
              </span>
            </li>
          )}
          {recap.busiest && recap.busiest.count > 1 && (
            <li>
              <span className="grc-fact-icon"><GrowthGlyph name="days" size={18} /></span>
              <span className="grc-fact-label">가장 뜨거웠던 날</span>
              <button
                type="button"
                className="grc-fact-value is-link"
                onClick={() => {
                  setPicked(recap.busiest!.date)
                  onJumpToDay(recap.busiest!.date)
                }}
              >
                {dayLabel(recap.busiest.date)} · {recap.busiest.count}개
              </button>
            </li>
          )}
          {recap.favoriteSlot && (
            <li>
              <span className="grc-fact-icon"><GrowthGlyph name="session" size={18} /></span>
              <span className="grc-fact-label">주님을 자주 찾은 시간</span>
              <span className="grc-fact-value">
                {recap.favoriteSlot.label}
                <small>{recap.favoriteSlot.range}</small>
              </span>
            </li>
          )}
          {recap.versesRead > 0 && (
            <li>
              <span className="grc-fact-icon"><GrowthGlyph name="verses" size={18} /></span>
              <span className="grc-fact-label">함께 읽은 말씀</span>
              <span className="grc-fact-value">{recap.versesRead.toLocaleString('ko-KR')}절</span>
            </li>
          )}
        </ul>
        </div>
      </div>
    </section>
  )
}

export default GrowthRecap
