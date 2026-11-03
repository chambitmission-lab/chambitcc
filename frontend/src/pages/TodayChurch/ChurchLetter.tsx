// /today?tab=church — 어제 우리 교회를 '참비의 손편지'로 보여 준다 (2026-11-03 F2안).
//   편지지(규칙 기반 문장) · 폴라로이드(가장 많이 펼친 장) · 포스트잇(이번 주 마음)
//   · 하루의 언덕길(기도한 순간만 촛불, 모바일은 기도 일기 시간표) · 숫자 티켓
// 숫자는 전부 익명 집계. 표본이 적은 날(hidden)은 편지만 쉬어 가는 문장으로 쓴다.
import { useId } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChurchDay, ChurchMetricKey } from '../../api/todayChurch'
import { chapterLabel } from '../../utils/bibleLabels'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { buildLetter, EMOTION_NOTE, filmDate, prayerMoments, weekdayOf, type PrayerMoment } from './churchLetterCopy'
import './styles/churchLetter.css'

ensureFontFamily('nanumPen')

const COUNT_WORD = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열']
const countWord = (n: number) => COUNT_WORD[n] ?? `${n}번`
const KO_TIMES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열']
const timesWord = (n: number) => (KO_TIMES[n] ? `${KO_TIMES[n]} 번` : `${n}번`)

/** 한 순간에 놓는 촛불 수 — 많은 날도 3개까지, 가장 많은 때 대비로 줄인다 */
const flameCount = (count: number, max: number) => (max <= 3 ? count : Math.max(1, Math.ceil((count / max) * 3)))

const Flame = ({ gradId, x = 0, y = 0, w = 18, h = 27 }: { gradId: string; x?: number; y?: number; w?: number; h?: number }) => (
  <svg x={x} y={y} width={w} height={h} viewBox="0 0 18 26" aria-hidden className="overflow-visible">
    <path d="M9 1 C 12 7, 17 11, 17 17 A 8 8 0 0 1 1 17 C 1 12, 5 9, 7 5 C 7.5 8, 9 9, 9 1 Z" fill={`url(#${gradId})`} />
    <ellipse cx="9" cy="19" rx="3" ry="4" fill="#fffbea" opacity="0.85" />
  </svg>
)

const FlameGradient = ({ id }: { id: string }) => (
  <radialGradient id={id} cx="50%" cy="72%" r="65%">
    <stop offset="0" stopColor="#fff7dc" />
    <stop offset="0.45" stopColor="#ffcf5a" />
    <stop offset="1" stopColor="#ff8f2a" />
  </radialGradient>
)

// ── 편지지 ────────────────────────────────────────────
const Letter = ({ church }: { church: ChurchDay }) => {
  const navigate = useNavigate()
  const lines = buildLetter(church)
  const [, mo, d] = church.date.split('-')
  const typed = (church.metrics?.typing_verses.value ?? 0) > 0
  return (
    <article className="tcl-paper">
      <div className="tcl-postmark" aria-hidden>
        참빛 우체국
        <b>
          {mo}.{d}
        </b>
        어제 소식
      </div>
      <p className="tcl-paper-from">
        <b>참비</b>가 어제의 교회를 적어 왔어요
      </p>
      <p className="tcl-pen tcl-lines">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line.map((p, j) =>
              p.hl ? (
                <mark key={j} className="tcl-hl">
                  {p.text}
                </mark>
              ) : (
                <span key={j}>{p.text}</span>
              ),
            )}
          </span>
        ))}
        <span className="tcl-sign block">— 참비 드림</span>
        {!church.hidden && (
          <span className="tcl-ps block">
            {typed ? 'P.S. 오늘 펼친 말씀도 내일 편지에 담아 올게요.' : 'P.S. 오늘 쓴 첫 줄은 내일 편지에 실려요.'}{' '}
            <button type="button" className="tcl-ps-link" onClick={() => navigate(typed ? '/bible' : '/bible/typing')}>
              {typed ? '말씀 읽기 →' : '필사 한 절 쓰기 →'}
            </button>
          </span>
        )}
      </p>
    </article>
  )
}

// ── 폴라로이드 ────────────────────────────────────────
const Polaroid = ({ church }: { church: ChurchDay }) => {
  const navigate = useNavigate()
  const top = church.top_chapters[0]
  const book = church.reading_books?.[0]
  const pick = top
    ? { title: `${top.book_name} ${chapterLabel(top.book_number, top.chapter)}`, sub: '어제 가장 많이 펼친 장', to: `/bible/${top.book_number}/${top.chapter}` }
    : book
      ? { title: book.book_name, sub: '어제 가장 많이 읽은 책', to: `/bible/${book.book_number}/1` }
      : null
  if (!pick) return null
  const others = church.top_chapters.slice(1, 3)
  return (
    <div className="tcl-pol-wrap">
      <button type="button" className="tcl-pol" onClick={() => navigate(pick.to)} aria-label={`${pick.title} 펼치기 — ${pick.sub}`}>
        <span className="tcl-tape tcl-pol-tape" aria-hidden />
        <span className="tcl-pol-photo" aria-hidden>
          <span className="tcl-pol-date">{filmDate(church.date)}</span>
        </span>
        <span className="tcl-pol-cap">
          <span className="tcl-pen tcl-pol-title">{pick.title}</span>
          <span className="tcl-pen tcl-pol-sub">{pick.sub}</span>
        </span>
      </button>
      <button type="button" className="tcl-link" onClick={() => navigate(pick.to)}>
        나도 {pick.title} 펼치기 →
      </button>
      {others.length > 0 && (
        <p className="tcl-pen tcl-others">
          함께 펼친 다른 장 ·{' '}
          {others.map((c, i) => (
            <span key={`${c.book_number}-${c.chapter}`}>
              {i > 0 && ', '}
              <button type="button" className="tcl-inline" onClick={() => navigate(`/bible/${c.book_number}/${c.chapter}`)}>
                {c.book_name} {chapterLabel(c.book_number, c.chapter)}
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

// ── 포스트잇 — 이번 주 마음 ───────────────────────────
const EmotionNote = ({ church }: { church: ChurchDay }) => {
  const navigate = useNavigate()
  const list = church.emotions.slice(0, 3)
  if (!list.length) return null
  return (
    <div className="tcl-note">
      <span className="tcl-tape tcl-note-tape" aria-hidden />
      <p className="tcl-note-title">이번 주 기도에 담긴 마음</p>
      <ul className="tcl-pen tcl-note-list">
        {list.map((e) => (
          <li key={e.emotion}>
            {EMOTION_NOTE[e.emotion] ?? e.emotion}
            {e.rising && <small className="tcl-rising">늘었어요</small>}
          </li>
        ))}
      </ul>
      <button type="button" className="tcl-note-link" onClick={() => navigate('/feed')}>
        한 줄 기도 보태기 →
      </button>
    </div>
  )
}

// ── 하루의 언덕길 (PC) ───────────────────────────────
const VB_W = 1000
const VB_H = 240
/** 해(40,200) → 꼭대기 → 달(960,200) 2차 곡선 위의 점 */
const arcPoint = (hour: number) => {
  const t = (hour + 0.5) / 24
  const u = 1 - t
  return { x: u * u * 40 + 2 * u * t * 500 + t * t * 960, y: u * u * 200 + 2 * u * t * -60 + t * t * 200 }
}

const HillPath = ({ moments, total }: { moments: PrayerMoment[]; total: number }) => {
  const gradId = useId().replace(/:/g, '')
  const max = Math.max(1, ...moments.map((m) => m.count))
  const label = moments
    .filter((m) => m.labeled)
    .map((m) => `${m.label} ${m.count}번`)
    .join(', ')
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="tcl-hill" role="img" aria-label={`어제 기도한 순간: ${label}. 모두 ${total}번`}>
      <defs>
        <FlameGradient id={gradId} />
      </defs>
      <path d="M10 214 C 120 206, 200 220, 320 212 S 560 204, 700 214 S 900 208, 990 214" className="tcl-hill-ground" />
      <path d="M40 200 Q 500 -60 960 200" className="tcl-hill-path" />
      <g className="tcl-hill-sun">
        <circle cx="40" cy="196" r="12" />
        <path d="M40 172v-8M18 182l-6-5M62 182l6-5M14 200h-8M66 200h8" />
      </g>
      <path d="M968 184 a 16 16 0 1 0 6 26 a 12 12 0 1 1 -6 -26 Z" className="tcl-hill-moon" />
      {moments.map((m) => {
        const p = arcPoint(m.hour)
        const n = m.labeled ? flameCount(m.count, max) : 1
        const w = m.labeled ? 20 : 14
        const h = m.labeled ? 30 : 21
        return (
          <g key={m.hour} className="tcl-glow">
            {Array.from({ length: n }, (_, i) => {
              const side = i === 0 ? 0 : i % 2 ? 1 : -1
              const scale = i === 0 ? 1 : 0.8
              return (
                <Flame
                  key={i}
                  gradId={gradId}
                  x={p.x - (w * scale) / 2 + side * 17}
                  y={p.y - h * scale - 2 + (i === 0 ? 0 : 6)}
                  w={w * scale}
                  h={h * scale}
                />
              )
            })}
          </g>
        )
      })}
      {moments
        .filter((m) => m.labeled)
        .map((m) => {
          const p = arcPoint(m.hour)
          return (
            <text key={m.hour} x={Math.min(870, Math.max(130, p.x))} y={Math.min(198, p.y + 40)} textAnchor="middle" className="tcl-hill-label">
              {m.label} · {countWord(m.count)}
            </text>
          )
        })}
      <text x="40" y="236" textAnchor="middle" className="tcl-hill-end">새벽</text>
      <text x="960" y="236" textAnchor="middle" className="tcl-hill-end">밤</text>
    </svg>
  )
}

// ── 기도 일기 시간표 (모바일) ─────────────────────────
const PrayerDiary = ({ moments }: { moments: PrayerMoment[] }) => {
  const gradId = useId().replace(/:/g, '')
  const max = Math.max(1, ...moments.map((m) => m.count))
  // 줄이 너무 많으면 많은 순 6줄만, 다시 시간 순으로
  const rows = [...moments].sort((a, b) => b.count - a.count || a.hour - b.hour).slice(0, 6).sort((a, b) => a.hour - b.hour)
  return (
    <div>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <FlameGradient id={gradId} />
        </defs>
      </svg>
      <ul className="tcl-diary">
        {rows.map((m) => (
          <li key={m.hour}>
            <span className="tcl-diary-time">{String(m.hour).padStart(2, '0')}:00</span>
            <span className="tcl-glow tcl-diary-flames" aria-hidden>
              {Array.from({ length: flameCount(m.count, max) }, (_, i) => (
                <Flame key={i} gradId={gradId} w={13} h={20} />
              ))}
            </span>
            <span className="tcl-pen tcl-diary-text">
              {m.mood}, 기도 {timesWord(m.count)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const PrayerTimes = ({ church }: { church: ChurchDay }) => {
  const moments = prayerMoments(church.hours)
  if (!moments.length) return null
  const total = church.metrics?.prayers.value ?? moments.reduce((s, m) => s + m.count, 0)
  return (
    <section className="tcl-card tcl-times">
      <div className="tcl-times-head">
        <p className="tcl-card-title">기도가 올라간 시간</p>
        <p className="tcl-pen tcl-times-lead">해가 뜨고 질 때까지, {timesWord(total)}의 기도</p>
      </div>
      <div className="hidden lg:block">
        <HillPath moments={moments} total={total} />
      </div>
      <div className="lg:hidden">
        <PrayerDiary moments={moments} />
      </div>
    </section>
  )
}

// ── 숫자 티켓 ────────────────────────────────────────
const TICKETS: { key: ChurchMetricKey; label: string; unit: string }[] = [
  { key: 'active_users', label: '함께한 성도', unit: '명' },
  { key: 'chapters', label: '읽은 장', unit: '장' },
  { key: 'prayers', label: '기도', unit: '번' },
  { key: 'typing_verses', label: '필사', unit: '절' },
]

const Tickets = ({ church }: { church: ChurchDay }) => {
  const m = church.metrics
  if (church.hidden || !m) return null
  return (
    <div className="tcl-tickets">
      {TICKETS.map(({ key, label, unit }) => {
        const { value, avg } = m[key]
        const up = value - avg
        return (
          <div key={key} className="tcl-ticket">
            <span className="tcl-ticket-label">{label}</span>
            <span className="tcl-ticket-value">
              {value.toLocaleString()}
              <small>{unit}</small>
              {/* 늘어난 것만 초록 — 줄어든 날을 굳이 강조하지 않는다 */}
              {up > 0 ? (
                <em className="tcl-ticket-up">+{up}</em>
              ) : (
                <em className="tcl-ticket-avg">
                  평소 {avg.toLocaleString()}
                </em>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const dayTitle = (ymd: string) => {
  const [, mo, d] = ymd.split('-').map(Number)
  return `${mo}월 ${d}일 ${weekdayOf(ymd)}`
}

export const ChurchLetter = ({ church }: { church: ChurchDay }) => (
  <div className="tcl">
    <p className="tcl-day">어제 · {dayTitle(church.date)}의 기록</p>
    <div className="tcl-top">
      <Letter church={church} />
      <div className="tcl-side">
        {!church.hidden && <Polaroid church={church} />}
        <EmotionNote church={church} />
      </div>
    </div>
    {!church.hidden && <PrayerTimes church={church} />}
    <Tickets church={church} />
  </div>
)
