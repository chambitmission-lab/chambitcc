import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import type { TodayChurch, TodayMemory } from '../../api/todayChurch'
import { MemoryPath } from '../TodayChurch/MemoryPath'
import './todayMemoryPreview.css'

/**
 * /#/dev/today-memory — /today '작년 오늘의 나' 탭 개편 시안.
 *   ?v=a 그날의 일기 한 장 · b 걸어온 길(채택 — 실제 컴포넌트 MemoryPath 를 표본으로 그린다) · c 그날의 사진 한 장
 *   &data=one  기록이 필사 하나뿐인 성도(지금 운영 화면과 같은 상황) / rich 기록이 여럿
 * 표본 데이터만 쓴다. 위 = PC 폭, 아래 = 모바일 폭(375).
 *
 * 지금은 '그날 남긴 글 한 줄'만 보여 준다. 시안은 이미 DB 에 있는 것으로 그 하루를 채운다:
 *   그날 하루  — 남긴 시각(created_at) · 읽은 장(bible_chapter_visits) · 필사 절 · 밑줄(verse_bookmarks)
 *                · 누군가를 위해 누른 기도(prayer_reactions) · 그 주 주일 설교(sermons)
 *   그날→오늘 — 그 뒤로 읽은 장·필사 절·기도 수, 지금 읽는 곳, 그 사이 얻은 칭호(user_titles)
 */

/* ───────────────────────── 표본 ───────────────────────── */

type Kind = 'prayer' | 'meditation' | 'thanks' | 'typing'
const KIND: Record<Kind, string> = { prayer: '기도', meditation: '묵상', thanks: '감사', typing: '필사' }

interface Memory {
  key: string
  ago: string
  /** 큰 날짜 */
  day: string
  /** 연도 · 요일 · 시각 */
  when: string
  ymd: string
  film: string
  kind: Kind
  title?: string
  reference?: string
  text: string
  answered?: string
  askAnswer?: boolean
  /** 그날 하루 */
  read?: string
  typed?: string
  underline?: { ref: string; text: string }
  prayedFor?: number
  sermon?: { title: string; ref: string }
  /** 그날부터 오늘까지 */
  days: number
  since: { n: string; label: string }[]
  nowReading: string
  /** C: 그때 ↔ 지금 */
  versus: { k: string; then: string; now: string; delta?: string }[]
  caption: string
  season: 'autumn' | 'spring'
}

const TYPING: Memory = {
  key: 'month',
  ago: '한 달 전 오늘',
  day: '10월 17일',
  when: '2026년 · 토요일 · 밤 9:42',
  ymd: '2026.10.17',
  film: "'26 10 17",
  kind: 'typing',
  reference: '창세기 2:8–17 · 10절',
  text: '여호와 하나님이 동방의 에덴에 동산을 창설하시고 그 지으신 사람을 거기 두시니라',
  read: '창세기 1 · 2 · 3장',
  typed: '창세기 2장 10절',
  underline: { ref: '창세기 2:7', text: '생기를 그 코에 불어넣으시니 사람이 생령이 되니라' },
  prayedFor: 2,
  sermon: { title: '보시기에 좋았더라', ref: '창세기 1:26–31' },
  days: 31,
  since: [
    { n: '46', label: '읽은 장' },
    { n: '128', label: '필사한 절' },
    { n: '9', label: '함께한 기도' },
  ],
  nowReading: '출애굽기 12장',
  versus: [
    { k: '읽던 곳', then: '창세기 2장', now: '출애굽기 12장', delta: '그 사이 46장' },
    { k: '필사', then: '첫 10절', now: '138절', delta: '128절 더' },
    { k: '칭호', then: '첫걸음', now: '새벽을 깨우는 사람', delta: '11월 2일에 얻음' },
  ],
  caption: '창세기 2장을 쓰던 밤',
  season: 'autumn',
}

const PRAYER: Memory = {
  key: 'year',
  ago: '1년 전 오늘',
  day: '11월 17일',
  when: '2025년 · 월요일 · 아침 6:53',
  ymd: '2025.11.17',
  film: "'25 11 17",
  kind: 'prayer',
  title: '어머니 무릎 수술',
  text: '주님, 어머니가 다음 주에 수술을 받으십니다. 두려운 마음보다 주님을 의지하는 마음을 주옵소서.',
  answered: '16일 뒤, 12월 3일에 응답으로 기록하셨어요',
  read: '시편 121편',
  underline: { ref: '시편 121:2', text: '나의 도움은 천지를 지으신 여호와에게서로다' },
  prayedFor: 5,
  sermon: { title: '눈을 들어 산을 보라', ref: '시편 121:1–8' },
  days: 365,
  since: [
    { n: '412', label: '읽은 장' },
    { n: '7', label: '응답받은 기도' },
    { n: '63', label: '함께한 기도' },
  ],
  nowReading: '출애굽기 12장',
  versus: [
    { k: '읽던 곳', then: '시편 121편', now: '출애굽기 12장', delta: '2독째 걷는 중' },
    { k: '기도', then: '수술을 앞둔 기도', now: '응답 7번', delta: '성도 12명이 함께' },
    { k: '칭호', then: '첫걸음', now: '새벽을 깨우는 사람', delta: '그 사이 칭호 5개' },
  ],
  caption: '어머니를 위해 기도한 아침',
  season: 'autumn',
}

const THANKS: Memory = {
  key: 'half',
  ago: '6개월 전 이맘때',
  day: '5월 16일',
  when: '2026년 · 토요일 · 밤 10:05',
  ymd: '2026.05.16',
  film: "'26 05 16",
  kind: 'thanks',
  text: '아이가 처음으로 식사 기도를 했어요. "하나님 고맙습니다" 그 한마디에 하루 피곤이 다 녹았습니다.',
  read: '마가복음 10장',
  prayedFor: 1,
  sermon: { title: '어린아이와 같이', ref: '마가복음 10:13–16' },
  days: 185,
  since: [
    { n: '203', label: '읽은 장' },
    { n: '41', label: '감사 한 줄' },
    { n: '28', label: '함께한 기도' },
  ],
  nowReading: '출애굽기 12장',
  versus: [
    { k: '읽던 곳', then: '마가복음 10장', now: '출애굽기 12장', delta: '그 사이 203장' },
    { k: '감사', then: '아이의 첫 기도', now: '감사 41번', delta: '일주일에 한두 번' },
    { k: '칭호', then: '감사의 사람', now: '새벽을 깨우는 사람' },
  ],
  caption: '아이가 처음 기도한 날',
  season: 'spring',
}

const SETS: Record<string, Memory[]> = { one: [TYPING], rich: [PRAYER, THANKS, TYPING] }

/** B: 기록이 없는 정거장도 그 주에 읽던 말씀으로 채운다 */
const QUIET: Record<string, { label: string; ymd: string; note: string }[]> = {
  one: [
    { label: '1년 전 오늘', ymd: '2025.11.17', note: '아직 이 길을 걷기 전이에요. 첫 기록은 2026년 9월 28일이에요.' },
    { label: '6개월 전 오늘', ymd: '2026.05.17', note: '아직 이 길을 걷기 전이에요.' },
  ],
  rich: [],
}

/* ───────────────────────── 조각 ───────────────────────── */

const ICON = {
  book: 'M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5zM12 6v13',
  pen: 'M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1zM14.5 6.5l3 3',
  mark: 'M5 20h14M8 4v7a4 4 0 0 0 8 0V4',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  church: 'M12 3v5M10 5h4M6 21v-9l6-4 6 4v9M3 21h18M10 21v-4a2 2 0 0 1 4 0v4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
} as const

const Ico = ({ name, size = 18 }: { name: keyof typeof ICON; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={ICON[name]} />
  </svg>
)

const Art = ({ light, dark }: { light: string; dark: string }) => (
  <>
    <img src={light} alt="" className="dark:hidden" />
    <img src={dark} alt="" className="hidden dark:block" />
  </>
)

const Quote = ({ m, verse, pen }: { m: Memory; verse: string; pen: string }) =>
  m.kind === 'typing' ? <p className={`font-serif-kr ${verse}`}>{m.text}</p> : <p className={`tmr-pen ${pen}`}>{m.text}</p>

const KindLine = ({ m }: { m: Memory }) => (
  <p className="tmr-eyebrow">
    <b style={{ color: 'var(--brand)' }}>{KIND[m.kind]}</b>
    {(m.title || m.reference) && <> · {m.title ?? m.reference}</>}
  </p>
)

const Actions = ({ m }: { m: Memory }) => (
  <div className="mt-4 flex flex-wrap items-center gap-2">
    {m.answered && (
      <span className="tmr-answered">
        <Ico name="check" size={14} /> {m.answered}
      </span>
    )}
    {m.kind === 'typing' && <button className="tmr-btn">그 장 다시 읽기</button>}
    {m.kind === 'typing' && <button className="tmr-btn-ghost">이어서 필사하기</button>}
    {m.kind === 'thanks' && <button className="tmr-btn-ghost">오늘의 감사 남기기</button>}
  </div>
)

const Chips = ({ list, idx, onPick }: { list: Memory[]; idx: number; onPick: (i: number) => void }) =>
  list.length > 1 ? (
    <div className="tmr-chips" role="tablist" aria-label="다시 볼 날">
      {list.map((m, i) => (
        <button key={m.key} role="tab" aria-selected={i === idx} className="tmr-chip" onClick={() => onPick(i)}>
          {m.ago}
        </button>
      ))}
    </div>
  ) : null

/** 그날 하루 — 글 말고도 그날 있었던 일 */
const DayRows = ({ m }: { m: Memory }) => (
  <div className="tmr-rows">
    {m.read && (
      <div className="tmr-row">
        <span className="tmr-row-ico"><Ico name="book" /></span>
        <div>
          <p className="tmr-row-k">그날 읽은 말씀</p>
          <p className="tmr-row-v">{m.read}</p>
        </div>
      </div>
    )}
    {m.underline && (
      <div className="tmr-row">
        <span className="tmr-row-ico"><Ico name="mark" /></span>
        <div>
          <p className="tmr-row-k">밑줄 그은 말씀 · {m.underline.ref}</p>
          <p className="tmr-row-sub font-serif-kr">{m.underline.text}</p>
        </div>
      </div>
    )}
    {!!m.prayedFor && (
      <div className="tmr-row">
        <span className="tmr-row-ico"><Ico name="heart" /></span>
        <div>
          <p className="tmr-row-k">누군가를 위한 기도</p>
          <p className="tmr-row-v">성도 {m.prayedFor}명의 기도에 함께하셨어요</p>
        </div>
      </div>
    )}
    {m.sermon && (
      <div className="tmr-row">
        <span className="tmr-row-ico"><Ico name="church" /></span>
        <div>
          <p className="tmr-row-k">그 주 주일 말씀</p>
          <p className="tmr-row-v">{m.sermon.title}</p>
          <p className="tmr-row-sub">{m.sermon.ref}</p>
        </div>
      </div>
    )}
  </div>
)

const Since = ({ m }: { m: Memory }) => (
  <>
    <div className="tmr-since">
      {m.since.map((s) => (
        <div key={s.label}>
          <b>{s.n}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
    <p className="mt-3 text-[14px] leading-[1.6] break-keep" style={{ color: 'var(--text-body)' }}>
      지금은 <b style={{ color: 'var(--text-strong)' }}>{m.nowReading}</b>을 읽고 계세요.
    </p>
  </>
)

/* ───────────── A. 그날의 일기 한 장 ───────────── */

const VariantA = ({ list }: { list: Memory[] }) => {
  const [idx, setIdx] = useState(0)
  const m = list[Math.min(idx, list.length - 1)]
  return (
    <div className="grid gap-3">
      <Chips list={list} idx={idx} onPick={setIdx} />
      <div className="tmr-a tmr-fade" key={m.key}>
        <article className="tmr-card">
          <div className="tmr-a-art">
            <Art light="/images/bible/reading-walk-light.webp" dark="/images/bible/reading-walk-dark.webp" />
            <div className="tmr-a-date">
              <span className="ago">{m.ago}</span>
              <p className="day">{m.day}</p>
              <p className="when">{m.when}</p>
            </div>
          </div>
          <div className="tmr-a-body">
            <KindLine m={m} />
            <div className="mt-2">
              <Quote m={m} verse="tmr-a-quote-verse" pen="tmr-a-quote-pen" />
            </div>
            <Actions m={m} />
          </div>
        </article>

        <div className="tmr-a-side">
          <section className="tmr-card tmr-pad">
            <p className="tmr-eyebrow mb-2">그날 하루</p>
            <DayRows m={m} />
          </section>
          <section className="tmr-card tmr-pad">
            <p className="tmr-eyebrow mb-3">그날부터 오늘까지 {m.days}일</p>
            <Since m={m} />
          </section>
        </div>
      </div>
    </div>
  )
}

/* ───────────── B. 걸어온 길 ───────────── */

const VariantB = ({ list, quiet }: { list: Memory[]; quiet: (typeof QUIET)[string] }) => {
  const oldest = list[0]
  return (
    <div className="tmr-b">
      <div className="tmr-card tmr-b-hero">
        <Art light="/images/home/verse-scene-light.webp" dark="/images/home/verse-scene-dark.webp" />
        <div className="tmr-b-hero-text">
          <p className="tmr-eyebrow" style={{ color: 'var(--tmr-gold)' }}>걸어온 길</p>
          <h3 className="mt-1">
            {oldest.days}일 동안
            <br />
            {oldest.since[0].n}장을 걸어오셨어요
          </h3>
          <p>오늘과 같은 날짜에 서 있던 나를 길 위에서 다시 만나요.</p>
        </div>
      </div>

      <div className="tmr-path">
        {quiet.map((q) => (
          <div key={q.label} className="tmr-stop is-quiet">
            <div className="tmr-stop-head">
              <b>{q.label}</b>
              <span>{q.ymd}</span>
            </div>
            <p className="tmr-stop-quiet">{q.note}</p>
          </div>
        ))}

        {list.map((m) => (
          <div key={m.key} className="tmr-stop">
            <div className="tmr-stop-head">
              <b>{m.ago}</b>
              <span>{m.when.split(' · ').slice(1).join(' · ')} · {m.ymd}</span>
            </div>
            <article className="tmr-card tmr-pad tmr-stop-card">
              <KindLine m={m} />
              <div className="mt-2">
                <Quote m={m} verse="tmr-a-quote-verse" pen="tmr-a-quote-pen" />
              </div>
              <div className="tmr-tags">
                {m.read && <span className="tmr-tag"><Ico name="book" size={14} /> {m.read} 읽음</span>}
                {m.underline && <span className="tmr-tag"><Ico name="mark" size={14} /> {m.underline.ref} 밑줄</span>}
                {!!m.prayedFor && <span className="tmr-tag"><Ico name="heart" size={14} /> 함께 기도 {m.prayedFor}번</span>}
                {m.sermon && <span className="tmr-tag"><Ico name="church" size={14} /> 주일 말씀 「{m.sermon.title}」</span>}
              </div>
              <Actions m={m} />
            </article>
          </div>
        ))}

        <div className="tmr-stop is-today">
          <div className="tmr-stop-head">
            <b>오늘</b>
            <span>2026.11.17 · {list[list.length - 1].nowReading}을 읽는 중</span>
          </div>
          <div className="tmr-b-today">
            <p className="tmr-pen text-[25px] leading-[1.25]" style={{ color: 'var(--text-strong)' }}>
              오늘 남긴 한 줄은 내년 오늘, 이 길 위에서 다시 만나요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="tmr-btn">기도 남기기</button>
              <button className="tmr-btn-ghost">감사 한 줄</button>
              <button className="tmr-btn-ghost">말씀 필사</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────── C. 그날의 사진 한 장 ───────────── */

const VariantC = ({ list }: { list: Memory[] }) => {
  const [idx, setIdx] = useState(0)
  const [reply, setReply] = useState('')
  const [sent, setSent] = useState(false)
  const m = list[Math.min(idx, list.length - 1)]
  return (
    <div className="grid gap-3">
      <Chips list={list} idx={idx} onPick={(i) => { setIdx(i); setSent(false) }} />
      <div className="tmr-c tmr-fade" key={m.key}>
        <article className="tmr-card tmr-c-top">
          <figure className="tmr-polaroid">
            <div className="tmr-polaroid-photo">
              <Art light={`/images/visit/scene-${m.season}-day.webp`} dark={`/images/visit/scene-${m.season}-night.webp`} />
              <span className="tmr-film-date">{m.film}</span>
            </div>
            <figcaption className="tmr-pen">{m.caption}</figcaption>
          </figure>
          <div className="tmr-c-note">
            <p className="tmr-eyebrow" style={{ color: 'var(--tmr-gold)' }}>{m.ago} · {m.when.split(' · ').slice(1).join(' ')}</p>
            <div className="mt-2">
              <KindLine m={m} />
            </div>
            <div className="mt-2">
              <Quote m={m} verse="quote-verse" pen="quote-pen" />
            </div>
            <Actions m={m} />
          </div>
        </article>

        <div className="tmr-c-side">
          <section className="tmr-card tmr-pad">
            <table className="tmr-vs">
              <thead>
                <tr>
                  <th />
                  <th>그날의 나</th>
                  <th>오늘의 나</th>
                </tr>
              </thead>
              <tbody>
                {m.versus.map((r) => (
                  <tr key={r.k}>
                    <td className="k">{r.k}</td>
                    <td className="then">{r.then}</td>
                    <td className="now">
                      {r.now}
                      {r.delta && <small>{r.delta}</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="tmr-card tmr-pad">
            <p className="tmr-eyebrow mb-2">그날의 나에게 한마디</p>
            {sent ? (
              <p className="tmr-fade text-[14.5px] leading-[1.65] break-keep" style={{ color: 'var(--text-body)' }}>
                적어 두었어요. 내년 오늘, 이 사진 옆에 함께 꺼내 드릴게요.
                <button className="ml-2 text-[12px] underline" style={{ color: 'var(--text-muted)' }} onClick={() => setSent(false)}>(시안) 다시</button>
              </p>
            ) : (
              <>
                <textarea
                  className="tmr-reply tmr-pen"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="그때는 몰랐지만, 지금은…"
                  maxLength={80}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>나만 볼 수 있어요</span>
                  <button className="tmr-btn" onClick={() => setSent(true)}>남겨 두기</button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

/* ───────────── B 채택본 — 실제 화면 컴포넌트에 표본을 넣는다 ───────────── */

const LIVE_TYPING: TodayMemory = {
  kind: 'typing', id: 1, offset: 'month', exact: true, date: '2026-10-17', time: '21:42',
  text: TYPING.text, reference: '창세기 2:8', verse_count: 10, book_number: 1, chapter: 2,
  day: {
    read: [{ book_number: 1, book_name: '창세기', chapters: [1, 2, 3] }],
    underline: { reference: '창세기 2:7', text: '생기를 그 코에 불어넣으시니 사람이 생령이 되니라' },
    prayed_for: 2,
    sermon: { title: '보시기에 좋았더라', bible_verse: '창세기 1:26–31' },
  },
}
const LIVE_PRAYER: TodayMemory = {
  kind: 'prayer', id: 2, offset: 'year', exact: true, date: '2025-11-17', time: '06:53',
  title: PRAYER.title, text: PRAYER.text, is_answered: false, prayer_count: 12,
  day: {
    read: [{ book_number: 19, book_name: '시편', chapters: [121] }],
    underline: null,
    prayed_for: 5,
    sermon: { title: '눈을 들어 산을 보라', bible_verse: '시편 121:1–8' },
  },
}
const LIVE_THANKS: TodayMemory = {
  kind: 'thanks', id: 3, offset: 'half', exact: false, date: '2026-05-16', time: '22:05',
  text: THANKS.text,
  day: { read: [], underline: null, prayed_for: 0, sermon: null },
}
const NOW_READING = { book_number: 2, chapter: 12, book_name: '출애굽기' }
const LIVE: Record<string, TodayChurch> = {
  one: {
    date: '2026-11-17',
    memories: [LIVE_TYPING],
    path: {
      joined_date: '2026-09-28',
      stops: [
        { offset: 'year', date: '2025-11-17', state: 'before' },
        { offset: 'half', date: '2026-05-17', state: 'before' },
      ],
      since: { from: '2026-10-17', days: 31, chapters: 46 },
      now_reading: NOW_READING,
    },
    answered_echo: null,
    church: null as unknown as TodayChurch['church'],
  },
  rich: {
    date: '2026-11-17',
    memories: [LIVE_PRAYER, LIVE_THANKS, LIVE_TYPING],
    path: { joined_date: '2024-03-03', stops: [], since: { from: '2025-11-17', days: 365, chapters: 412 }, now_reading: NOW_READING },
    answered_echo: null,
    church: null as unknown as TodayChurch['church'],
  },
}

/* ───────────────────────── 미리보기 틀 ───────────────────────── */

const VARIANTS = [
  { key: 'a', label: 'A 그날의 일기 한 장', note: '일기 앱(Day One·Apple 일기)처럼 큰 날짜와 시각 + 오른쪽에 그날 하루·그날부터 오늘까지' },
  { key: 'b', label: 'B 걸어온 길', note: 'Timehop·구글 포토 추억처럼 1년 전→오늘을 한 길로. 기록 없는 날도 정거장으로 남고, 끝은 "오늘 남기기"' },
  { key: 'c', label: 'C 그날의 사진 한 장', note: '그 계절 참빛교회 사진 폴라로이드 + 그날의 나 ↔ 오늘의 나 + 그날의 나에게 한마디' },
] as const

const Body = ({ v, data }: { v: string; data: string }) => {
  const list = SETS[data] ?? SETS.one
  if (v === 'b') return <VariantB list={list} quiet={QUIET[data] ?? []} />
  if (v === 'c') return <VariantC key={data} list={list} />
  return <VariantA key={data} list={list} />
}

const Frame = ({ title, width, children }: { title: string; width: number; children: ReactNode }) => (
  <figure className="mt-8">
    <figcaption className="mb-2 text-[12px] text-gray-400">{title}</figcaption>
    <div
      className="tmr-stage rounded-[24px] border border-gray-200 dark:border-white/[0.08] p-4"
      style={{ width, maxWidth: '100%', background: 'var(--app-canvas)' }}
    >
      {children}
    </div>
  </figure>
)

export default function TodayMemoryPreview() {
  const [params, setParams] = useSearchParams()
  const v = params.get('v') ?? 'a'
  const data = params.get('data') === 'rich' ? 'rich' : 'one'
  const { theme, toggleTheme } = useTheme()
  const meta = VARIANTS.find((x) => x.key === v) ?? VARIANTS[0]

  useEffect(() => {
    void ensureFontFamily('nanumPen')
  }, [])

  const set = (k: string, val: string) => {
    const next = new URLSearchParams(params)
    next.set(k, val)
    setParams(next, { replace: true })
  }
  const pill = (on: boolean) =>
    `text-[13px] px-3.5 py-1.5 rounded-full border ${
      on ? 'bg-[var(--brand)] text-white border-transparent font-bold' : 'text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/[0.1]'
    }`

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <div className="mx-auto max-w-[1240px] px-5 pt-6">
        <h1 className="text-[18px] font-bold text-ink-strong">/today 작년 오늘의 나 — 개편 시안</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VARIANTS.map((x) => (
            <button key={x.key} onClick={() => set('v', x.key)} className={pill(x.key === meta.key)}>{x.label}</button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button onClick={() => set('data', 'one')} className={pill(data === 'one')}>기록 하나뿐 (지금 내 화면)</button>
          <button onClick={() => set('data', 'rich')} className={pill(data === 'rich')}>기록이 여럿</button>
          <button onClick={toggleTheme} className="ml-2 text-[13px] underline text-gray-500 dark:text-white/55">
            {theme === 'dark' ? '라이트로' : '다크로'}
          </button>
        </div>
        <p className="mt-2 text-[13px] text-gray-500 dark:text-white/55">{meta.note}</p>

        {meta.key === 'b' ? (
          // 실제 컴포넌트는 화면 폭(lg)으로 갈린다 — 모바일은 창을 좁혀서 본다
          <div className="mt-6">
            <MemoryPath data={LIVE[data]} />
          </div>
        ) : (
          <>
            <Frame title="PC" width={1200}>
              <Body v={meta.key} data={data} />
            </Frame>
            <Frame title="모바일 (375)" width={375}>
              <Body v={meta.key} data={data} />
            </Frame>
          </>
        )}
      </div>
    </div>
  )
}
