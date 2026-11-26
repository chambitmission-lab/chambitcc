import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import type { Event, EventCategory } from '../../types/event'
import { CategoryIcon } from '../Events/components/CategoryIcons'
import WallCalendar from '../Events/components/WallCalendar'
import '../Events/styles/weekPostcard.css'
import './eventsCalendarPreview.css'

/**
 * /#/dev/events-calendar — /events 달력 영역(달력 + 고른 날 + 다가오는 일정) 개편 시안.
 *   ?v=final 적용본(A+D, 실제 WallCalendar) · a 교회 벽달력 · b 우표 시트 · c 스티커판 · d 일력
 * 표본 일정만 쓴다(오늘 = 2026-11-26). PC 레일(400)과 모바일(343) 폭을 나란히 본다.
 */

type VKey = 'final' | 'a' | 'b' | 'c' | 'd'
const VARIANTS: { key: VKey; label: string; note: string }[] = [
  {
    key: 'final',
    label: '적용본 A+D',
    note: '실제 /events 에 들어간 컴포넌트(WallCalendar)를 표본 일정으로 돌린 것. 벽달력(A)이 메인, 점선 아래는 일력(D) 한 장 — 큰 날짜·"주일까지 세 밤"·그날 일정, 화살표로 하루씩 넘긴다.',
  },
  {
    key: 'a',
    label: 'A 교회 벽달력',
    note: '연말에 교회에서 나눠 주던 그 벽달력. 큰 명조 숫자, 붉은 주일, 칸 안에 일정 이름이 그대로 인쇄돼 있어 누르지 않아도 무슨 날인지 보인다. 맨 아래는 "참빛교회" 인쇄 띠, 점선 아래 칸은 오늘(또는 고른 날) 일정. 달력·고른 날·다가오는 일정이 종이 한 장.',
  },
  {
    key: 'b',
    label: 'B 우표 시트',
    note: '왼쪽 우편엽서와 한 세트 — 한 달이 우표 한 장(시트). 일정 있는 날에만 그림 우표가 붙고, 오늘은 빨간 소인. 날짜를 누르면 아래에 그날 소인이 찍힌 엽서 뒷면이 펼쳐진다.',
  },
  {
    key: 'c',
    label: 'C 스티커판',
    note: '주일학교 출석 스티커판처럼. 일정 있는 날에 종류별 스티커(예배당·찻잔·하트·반짝이·책)가 톡톡 붙고, 여러 개면 겹쳐서 숫자 딱지. 가장 밝고 유쾌한 안. 색을 몰라도 그림과 숫자로 읽힌다.',
  },
  {
    key: 'd',
    label: 'D 일력',
    note: '하루 한 장 넘기는 일력이 주인공. 큰 날짜 한 장에 그날 일정과 "주일까지 세 밤" 한마디, 아래 작은 달력은 날짜 찾기용. "날짜를 누르면 여기에 나와요" 빈칸이 사라지고 늘 오늘이 펼쳐져 있다.',
  },
]

// ── 표본 일정 (스크린샷의 2026년 11월과 같은 개수) ──
interface Ev {
  id: number
  day: number
  title: string
  category: EventCategory
  time: string
  place?: string
}
const E = (id: number, day: number, title: string, category: EventCategory, time: string, place?: string): Ev => ({
  id, day, title, category, time, place,
})
const SAMPLE: Ev[] = [
  E(1, 1, '주일예배', 'worship', '오전 11:00', '본당'),
  E(2, 1, '11월 제직회', 'meeting', '오후 1:30', '본당'),
  E(3, 2, '구역장 모임', 'meeting', '오후 7:30', '교육관'),
  E(4, 6, '금요기도회', 'worship', '오후 8:00', '본당'),
  E(5, 7, '예배당 대청소', 'service', '오전 9:00'),
  E(6, 8, '주일예배', 'worship', '오전 11:00', '본당'),
  E(7, 8, '새가족 환영회', 'special', '오후 12:30', '친교실'),
  E(8, 8, '성경공부 개강', 'education', '오후 2:00', '교육관'),
  E(9, 14, '김장 나눔', 'service', '오전 9:00', '교회 마당'),
  E(10, 15, '추수감사주일 예배', 'worship', '오전 11:00', '본당'),
  E(11, 15, '유아세례식', 'worship', '오전 11:40', '본당'),
  E(12, 15, '사랑의 애찬', 'meeting', '오후 12:30', '친교실'),
  E(13, 15, '감사 찬양제', 'special', '오후 2:00', '본당'),
  E(14, 15, '감사 과일 나눔', 'service', '오후 3:30'),
  E(15, 16, '교사 모임', 'education', '오후 7:30', '교육관'),
  E(16, 19, '목장 모임', 'meeting', '오후 7:30'),
  E(17, 21, '청년부 수련회', 'special', '오전 10:00'),
  E(18, 22, '주일예배', 'worship', '오전 11:00', '본당'),
  E(19, 23, '직분자 선거를 위한 특별새벽기도회', 'worship', '오전 5:30', '본당'),
  E(20, 29, '직원선출을 위한 공동의회', 'meeting', '오후 1:30', '본당'),
]

const TODAY = new Date(2026, 10, 26)
const WD = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => n.toString().padStart(2, '0')
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const dateOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const TODAY_KEY = keyOf(TODAY)
const EV_MAP = new Map<string, Ev[]>()
for (const ev of SAMPLE) {
  const k = `2026-11-${pad(ev.day)}`
  EV_MAP.set(k, [...(EV_MAP.get(k) ?? []), ev])
}
const evOf = (key: string) => EV_MAP.get(key) ?? []
const diffDays = (key: string) => Math.round((dateOf(key).getTime() - TODAY.getTime()) / 86400000)
const leftLabel = (key: string) => {
  const n = diffDays(key)
  return n === 0 ? '오늘' : n === 1 ? '내일' : n > 0 ? `${n}일 뒤` : '마쳤어요'
}
const fullDay = (key: string) => {
  const d = dateOf(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getDay() === 0 ? '주일' : `${WD[d.getDay()]}요일`}`
}
/** 칸에 인쇄할 짧은 이름 — 우리말은 끝 낱말이 알맹이("…를 위한 공동의회" → "공동의회") */
const shortTitle = (title: string) => {
  const words = title.trim().split(/\s+/)
  const last = words[words.length - 1]
  return last.length <= 2 && words.length > 1 ? words.slice(-2).join('') : last
}
/** 칸 폭(네 글자)에 맞춰 두 줄로 고르게 나눈다 — "특별새벽기도회" → 특별새벽 / 기도회 */
const twoLines = (label: string): string[] => {
  if (label.length <= 4) return [label]
  const cut = Math.min(4, Math.ceil(label.length / 2))
  return [label.slice(0, cut), label.slice(cut, cut + 4)]
}
const UPCOMING = [...EV_MAP.keys()]
  .filter((k) => k > TODAY_KEY)
  .sort()
  .flatMap((k) => evOf(k).map((ev) => ({ key: k, ev })))
  .slice(0, 3)
const MONTH_WORD: Record<number, string> = { 10: '감사가 익어 가는 달', 11: '기다림의 달', 9: '열매 맺는 달' }
const SUNDAY_HAND = ['오늘은 주일, 예배당에서 만나요', '주일까지 여섯 밤', '주일까지 다섯 밤', '주일까지 네 밤', '주일까지 세 밤', '주일까지 두 밤', '내일이 주일이에요']

// ── 공통 달력 상태 ──
const useCal = () => {
  const [view, setView] = useState(() => new Date(2026, 10, 1))
  const [sel, setSel] = useState<string | null>(null)
  const cells = useMemo(() => {
    const y = view.getFullYear()
    const m = view.getMonth()
    const lead = new Date(y, m, 1).getDay()
    const days = new Date(y, m + 1, 0).getDate()
    const list: { d: Date; inMonth: boolean }[] = []
    for (let i = lead; i > 0; i--) list.push({ d: new Date(y, m, 1 - i), inMonth: false })
    for (let i = 1; i <= days; i++) list.push({ d: new Date(y, m, i), inMonth: true })
    while (list.length % 7 !== 0) list.push({ d: new Date(y, m, list.length - lead + 1), inMonth: false })
    return list
  }, [view])
  const move = (n: number) => {
    setSel(null)
    setView((d) => new Date(d.getFullYear(), d.getMonth() + n, 1))
  }
  const goToday = () => {
    setView(new Date(2026, 10, 1))
    setSel(null)
  }
  const pick = (key: string) => setSel((p) => (p === key ? null : key))
  /** 고른 날이 없으면 늘 오늘을 펼쳐 둔다 — 빈 안내문 칸을 없앤다 */
  const shown = sel ?? TODAY_KEY
  return { view, setView, sel, setSel, cells, move, goToday, pick, shown }
}
type Cal = ReturnType<typeof useCal>

const Chevron = ({ dir }: { dir: 'l' | 'r' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points={dir === 'l' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
  </svg>
)

const Nav = ({ cal }: { cal: Cal }) => (
  <div className="ecp-nav">
    <button type="button" onClick={cal.goToday} className="ecp-nav-today">오늘</button>
    <button type="button" onClick={() => cal.move(-1)} aria-label="이전 달" className="ecp-nav-btn"><Chevron dir="l" /></button>
    <button type="button" onClick={() => cal.move(1)} aria-label="다음 달" className="ecp-nav-btn"><Chevron dir="r" /></button>
  </div>
)

const Weekdays = () => (
  <div className="ecp-wds">
    {WD.map((w, i) => (
      <span key={w} className={i === 0 ? 'is-sun' : i === 6 ? 'is-sat' : ''}>{w}</span>
    ))}
  </div>
)

/** 그날 일정 줄 — 시간 굵게, 제목 18px, 장소는 뒤에 */
const DayRows = ({ list }: { list: Ev[] }) => (
  <ul className="ecp-rows">
    {list.map((ev) => (
      <li key={ev.id}>
        <button type="button" className="ecp-row">
          <span className="ecp-row-time">{ev.time}</span>
          <span className="ecp-row-body">
            <b className="ecp-row-title">{ev.title}</b>
            {ev.place && <span className="ecp-row-place">{ev.place}</span>}
          </span>
        </button>
      </li>
    ))}
  </ul>
)

/** 일정 없는 날 — 다음 일정으로 이어 준다 */
const NoEvents = ({ dayKey }: { dayKey: string }) => {
  const next = [...EV_MAP.keys()].filter((k) => k > dayKey).sort()[0]
  const ev = next ? evOf(next)[0] : undefined
  return (
    <div className="ecp-none">
      <p>일정이 없는 날이에요.</p>
      {ev && (
        <button type="button" className="ecp-next">
          <span className="ecp-pill">다음 일정 · {leftLabel(next)}</span>
          <b>{ev.title}</b>
          <span className="ecp-next-when">{fullDay(next)} {ev.time}</span>
        </button>
      )}
    </div>
  )
}

const DayPanel = ({ dayKey, head }: { dayKey: string; head?: ReactNode }) => {
  const list = evOf(dayKey)
  return (
    <section className="ecp-panel">
      <div className="ecp-panel-head">
        {head}
        <p className="ecp-panel-date">
          {fullDay(dayKey)}
          {dayKey === TODAY_KEY && <span className="ecp-chip">오늘</span>}
        </p>
        {list.length > 0 && <span className="ecp-pill">{list.length}개</span>}
      </div>
      {list.length ? <DayRows list={list} /> : <NoEvents dayKey={dayKey} />}
    </section>
  )
}

const Upcoming = ({ title = '다가오는 일정' }: { title?: string }) => (
  <section className="ecp-up">
    <p className="ecp-up-title">{title}</p>
    {UPCOMING.map(({ key, ev }) => (
      <button key={ev.id} type="button" className="ecp-up-row">
        <span className="ecp-pill">{leftLabel(key)}</span>
        <span className="ecp-up-body">
          <b>{ev.title}</b>
          <span>{fullDay(key)} · {ev.time}</span>
        </span>
      </button>
    ))}
  </section>
)

const numClass = (d: Date) => (d.getDay() === 0 ? 'is-sun' : d.getDay() === 6 ? 'is-sat' : '')

// ── A 교회 벽달력 ──
const WallDraft = () => {
  const cal = useCal()
  const m = cal.view.getMonth()
  return (
    <article className="wpc ecp ecp-paper ecp-wall">
      <header className="ecp-wall-head">
        <span className="ecp-wall-num wpc-serif">{m + 1}</span>
        <p className="ecp-wall-year">{cal.view.getFullYear()}년</p>
        <Nav cal={cal} />
        <p className="wpc-hand ecp-wall-word">{MONTH_WORD[m] ?? ' '}</p>
      </header>
      <Weekdays />
      <div className="ecp-grid ecp-wall-grid">
        {cal.cells.map(({ d, inMonth }) => {
          const key = keyOf(d)
          const list = inMonth ? evOf(key) : []
          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth}
              onClick={() => cal.pick(key)}
              className={`ecp-wcell ${inMonth ? '' : 'is-out'} ${key === cal.sel ? 'is-sel' : ''} ${key === TODAY_KEY ? 'is-today' : ''}`}
            >
              <span className={`ecp-wnum wpc-serif ${numClass(d)}`}>{d.getDate()}</span>
              {list.length > 0 && (
                <span className="ecp-wlabel">
                  {twoLines(shortTitle(list[0].title)).map((line) => <span key={line}>{line}</span>)}
                  {list.length > 1 && <i>외 {list.length - 1}</i>}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="ecp-wall-foot wpc-serif">대한예수교장로회 참빛교회</p>
      <div className="ecp-tear" aria-hidden="true" />
      <DayPanel dayKey={cal.shown} />
      <Upcoming />
    </article>
  )
}

// ── B 우표 시트 ──
const Postmark = ({ text }: { text: string }) => (
  <svg viewBox="0 0 120 60" className="ecp-postmark" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="30" cy="30" r="25" />
      <circle cx="30" cy="30" r="19" strokeWidth="0.9" />
      {[18, 26, 34, 42].map((y) => (
        <path key={y} d={`M58 ${y} q7 -4 14 0 t14 0 t14 0 t14 0`} />
      ))}
    </g>
    <text x="30" y="27" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">참빛</text>
    <text x="30" y="39" textAnchor="middle" fontSize="10" fontWeight="800" fill="currentColor">{text}</text>
  </svg>
)

const StampSheet = () => {
  const cal = useCal()
  const m = cal.view.getMonth()
  const stampCount = cal.cells.filter((c) => c.inMonth && evOf(keyOf(c.d)).length).length
  const shownDate = dateOf(cal.shown)
  return (
    <div className="ecp-stack">
      <article className="wpc ecp ecp-paper ecp-stamps">
        <header className="ecp-st-head">
          <div className="min-w-0 flex-1">
            <p className="ecp-st-title">{cal.view.getFullYear()}년 {m + 1}월</p>
            <p className="ecp-st-sub">일정이 있는 날엔 우표가 붙어요</p>
          </div>
          <Nav cal={cal} />
        </header>
        <Weekdays />
        <div className="ecp-sheet">
          <div className="ecp-grid ecp-sheet-grid">
            {cal.cells.map(({ d, inMonth }) => {
              const key = keyOf(d)
              const list = inMonth ? evOf(key) : []
              const isToday = key === TODAY_KEY
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => cal.pick(key)}
                  className={`ecp-stamp ${inMonth ? '' : 'is-out'} ${key === cal.sel ? 'is-sel' : ''} ${isToday ? 'is-today' : ''}`}
                >
                  <span className={`ecp-st-num ${numClass(d)}`}>{d.getDate()}</span>
                  {list.length > 0 ? (
                    <span className="ecp-st-art">
                      <CategoryIcon category={list[0].category} width={18} height={18} />
                      {list.length > 1 && <b>{list.length}</b>}
                    </span>
                  ) : isToday ? (
                    <span className="ecp-st-today">오늘</span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <p className="ecp-selvage">CHAMBIT POST · {cal.view.getFullYear()}.{pad(m + 1)} · 우표 {stampCount}장</p>
        </div>
      </article>

      <article className="wpc ecp ecp-paper ecp-back">
        <DayPanel
          dayKey={cal.shown}
          head={<span className="ecp-back-mark"><Postmark text={`${shownDate.getMonth() + 1}.${shownDate.getDate()}`} /></span>}
        />
        <Upcoming title="곧 도착할 일정" />
      </article>
    </div>
  )
}

// ── C 스티커판 ──
const STICKER: Record<EventCategory, string> = {
  worship: '#3182f6',
  meeting: '#ff7a59',
  service: '#1fb57a',
  special: '#f5a300',
  education: '#12a9c4',
  other: '#7b8798',
}
const STICKER_NAME: [EventCategory, string][] = [
  ['worship', '예배'], ['meeting', '모임'], ['service', '봉사'], ['special', '특별행사'], ['education', '교육'],
]

const Sticker = ({ category, size = 34, className = '' }: { category: EventCategory; size?: number; className?: string }) => (
  <span className={`ecp-sticker ${className}`} style={{ width: size, height: size, background: STICKER[category] }}>
    <CategoryIcon category={category} width={size * 0.58} height={size * 0.58} strokeWidth={2} />
  </span>
)

const StickerBoard = () => {
  const cal = useCal()
  const m = cal.view.getMonth()
  const total = cal.cells.reduce((n, c) => n + (c.inMonth ? evOf(keyOf(c.d)).length : 0), 0)
  return (
    <div className="ecp-stack">
      <article className="ecp ecp-app ecp-board">
        <header className="ecp-bd-head">
          <div className="min-w-0 flex-1">
            <p className="ecp-bd-title">{m + 1}월 스티커판</p>
            <p className="wpc-hand ecp-bd-hand">{total ? `이번 달 스티커 ${total}장!` : '아직 빈 판이에요'}</p>
          </div>
          <Nav cal={cal} />
        </header>
        <Weekdays />
        <div className="ecp-grid ecp-bd-grid">
          {cal.cells.map(({ d, inMonth }, idx) => {
            const key = keyOf(d)
            const list = inMonth ? evOf(key) : []
            return (
              <button
                key={key}
                type="button"
                disabled={!inMonth}
                onClick={() => cal.pick(key)}
                className={`ecp-bcell ${inMonth ? '' : 'is-out'} ${key === cal.sel ? 'is-sel' : ''} ${key === TODAY_KEY ? 'is-today' : ''}`}
              >
                <span className={`ecp-bnum ${numClass(d)}`}>{d.getDate()}</span>
                <span className="ecp-bspot" style={{ animationDelay: `${idx * 18}ms` }}>
                  {list.length > 1 && <Sticker category={list[1].category} className="is-under" />}
                  {list.length > 0 && <Sticker category={list[0].category} />}
                  {list.length > 1 && <b className="ecp-bcount">{list.length}</b>}
                </span>
              </button>
            )
          })}
        </div>
        <ul className="ecp-legend">
          {STICKER_NAME.map(([c, name]) => (
            <li key={c}><Sticker category={c} size={22} />{name}</li>
          ))}
        </ul>
      </article>

      <article className="ecp ecp-app ecp-card">
        <DayPanel dayKey={cal.shown} head={evOf(cal.shown)[0] && <Sticker category={evOf(cal.shown)[0].category} size={40} />} />
      </article>
      <article className="ecp ecp-app ecp-card">
        <Upcoming title="다음에 붙을 스티커" />
      </article>
    </div>
  )
}

// ── D 일력 ──
const DailyPage = () => {
  const cal = useCal()
  const d = dateOf(cal.shown)
  const list = evOf(cal.shown)
  const isSun = d.getDay() === 0
  const step = (n: number) => {
    const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
    cal.setSel(keyOf(nd))
    cal.setView(new Date(nd.getFullYear(), nd.getMonth(), 1))
  }
  return (
    <div className="ecp-stack">
      <article className={`wpc ecp ecp-paper ecp-daily ${isSun ? 'is-sun' : ''}`}>
        <header className="ecp-dl-band">
          <button type="button" onClick={() => step(-1)} className="ecp-dl-step" aria-label="하루 전"><Chevron dir="l" />어제</button>
          <p>{d.getFullYear()}년 {d.getMonth() + 1}월</p>
          <button type="button" onClick={() => step(1)} className="ecp-dl-step" aria-label="하루 뒤">내일<Chevron dir="r" /></button>
        </header>
        <div key={cal.shown} className="ecp-dl-page">
          <div className="ecp-dl-top">
            <span className="ecp-dl-num wpc-serif">{d.getDate()}</span>
            <div className="min-w-0">
              <p className="ecp-dl-wd">
                {isSun ? '주일' : `${WD[d.getDay()]}요일`}
                {cal.shown === TODAY_KEY && <span className="ecp-chip">오늘</span>}
              </p>
              <p className="wpc-hand ecp-dl-hand">{SUNDAY_HAND[d.getDay()]}</p>
            </div>
          </div>
          {list.length ? <DayRows list={list} /> : <NoEvents dayKey={cal.shown} />}
        </div>
      </article>

      <article className="wpc ecp ecp-paper ecp-finder">
        <header className="ecp-fd-head">
          <p>{cal.view.getMonth() + 1}월 <span>날짜 찾기</span></p>
          <Nav cal={cal} />
        </header>
        <Weekdays />
        <div className="ecp-grid ecp-fd-grid">
          {cal.cells.map(({ d: cd, inMonth }) => {
            const key = keyOf(cd)
            const n = inMonth ? evOf(key).length : 0
            return (
              <button
                key={key}
                type="button"
                disabled={!inMonth}
                onClick={() => cal.setSel(key)}
                className={`ecp-fcell ${inMonth ? '' : 'is-out'} ${key === cal.shown ? 'is-sel' : ''} ${key === TODAY_KEY ? 'is-today' : ''}`}
              >
                <span className={`ecp-fnum ${numClass(cd)}`}>{cd.getDate()}</span>
                {n > 0 && <span className="ecp-fcount">{n}개</span>}
              </button>
            )
          })}
        </div>
      </article>
    </div>
  )
}

// ── 적용본: 실제 WallCalendar 에 표본 일정을 넣어 본다 ──
const toEvent = (ev: Ev): Event => {
  const [ampm, hm] = ev.time.split(' ')
  const [h, mm] = hm.split(':').map(Number)
  const hh = (h % 12) + (ampm === '오후' ? 12 : 0)
  const day = `2026-11-${pad(ev.day)}`
  return {
    id: ev.id, title: ev.title, category: ev.category, location: ev.place,
    start_datetime: `${day}T${pad(hh)}:${pad(mm)}:00`, end_datetime: `${day}T${pad(hh + 1)}:${pad(mm)}:00`,
  } as Event
}
const REAL_EVENTS = SAMPLE.map(toEvent)
const REAL_UPCOMING = REAL_EVENTS.filter((e) => e.start_datetime.slice(0, 10) >= TODAY_KEY)
  .slice(0, 5)
  .map((event) => ({ event, key: event.start_datetime.slice(0, 10) }))

const Applied = ({ rail }: { rail: boolean }) => {
  const [view, setView] = useState(() => new Date(2026, 10, 1))
  const [sel, setSel] = useState<string | null>(null)
  const move = (n: number) => {
    setSel(null)
    setView((d) => new Date(d.getFullYear(), d.getMonth() + n, 1))
  }
  return (
    <WallCalendar
      date={view}
      events={REAL_EVENTS}
      selectedKey={sel}
      onPrev={() => move(-1)}
      onNext={() => move(1)}
      onToday={() => { setView(new Date(2026, 10, 1)); setSel(TODAY_KEY) }}
      onSelectDate={(d) => setSel((p) => (p === keyOf(d) ? null : keyOf(d)))}
      onStepDay={(d) => { setSel(keyOf(d)); setView(new Date(d.getFullYear(), d.getMonth(), 1)) }}
      upcoming={rail ? REAL_UPCOMING : undefined}
    />
  )
}

const Variant = ({ v, rail = false }: { v: VKey; rail?: boolean }) =>
  v === 'final' ? <Applied rail={rail} /> : v === 'a' ? <WallDraft /> : v === 'b' ? <StampSheet /> : v === 'c' ? <StickerBoard /> : <DailyPage />

export default function EventsCalendarPreview() {
  const [params, setParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const meta = VARIANTS.find((x) => x.key === params.get('v')) ?? VARIANTS[0]
  useEffect(() => {
    void ensureFontFamily('nanumPen')
  }, [])
  const pill = (on: boolean) =>
    `text-[13px] px-3.5 py-1.5 rounded-full border ${on ? 'bg-[var(--brand)] text-white border-transparent font-bold' : 'text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/[0.1]'}`
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <div className="mx-auto max-w-[1000px] px-5 pt-6">
        <h1 className="text-[18px] font-bold text-ink-strong">/events 달력 영역 개편 시안</h1>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {VARIANTS.map((x) => (
            <button key={x.key} onClick={() => setParams({ v: x.key }, { replace: true })} className={pill(x.key === meta.key)}>
              {x.label}
            </button>
          ))}
          <button onClick={toggleTheme} className="ml-2 text-[13px] underline text-gray-500 dark:text-white/55">
            {theme === 'dark' ? '라이트로' : '다크로'}
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-[1.6] text-gray-500 dark:text-white/55 break-keep max-w-[860px]">{meta.note}</p>
        <div className="mt-6 flex flex-wrap items-start gap-8">
          <figure className="w-[400px] shrink-0">
            <figcaption className="mb-2 text-[12px] text-gray-400">PC 오른쪽 레일 (400)</figcaption>
            <Variant key={`pc-${meta.key}`} v={meta.key} rail />
          </figure>
          <figure className="w-[375px] shrink-0">
            <figcaption className="mb-2 text-[12px] text-gray-400">모바일 (375)</figcaption>
            <div className="rounded-[28px] border border-border-light dark:border-border-dark bg-[var(--app-canvas)] p-4">
              <Variant key={`m-${meta.key}`} v={meta.key} />
            </div>
          </figure>
        </div>
      </div>
    </div>
  )
}
