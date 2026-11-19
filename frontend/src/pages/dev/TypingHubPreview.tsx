import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureSerifKr } from '../../utils/deferredFonts'
import Lamp from '../Bible/Typing/home/Lamp'
import '../Bible/Typing/typing.css'
import { TopA1, TopA2, TopA3, TopA4 } from './TypingHubTopsA'
import './typingHubPreview.css'
import './typingHubTopsA.css'

/**
 * /#/dev/typing-hub — /bible/typing 허브 첫 화면(오늘의 필사 + 골라 쓰기) 개편 시안.
 *   ?v=a1|a2|a3|a4 — A 계열 2차(아래는 서재 공통) / 1차: ?v=mix 추천(위 A 말씀이 먼저 + 아래 서재) · b 이어서 카드 + 서재 · c A + 장르 메달
 * 표본 데이터만 쓴다. 왼쪽 = PC 본문 단(640), 오른쪽 = 모바일 폭(375).
 */

/* ───────────────────────── 표본 ───────────────────────── */

const BOOKS: [string, string, number][] = [
  // [이름, 약칭, 전체 절 수]
  ['창세기', '창', 1533], ['출애굽기', '출', 1213], ['레위기', '레', 859], ['민수기', '민', 1288], ['신명기', '신', 959],
  ['여호수아', '수', 658], ['사사기', '삿', 618], ['룻기', '룻', 85], ['사무엘상', '삼상', 810], ['사무엘하', '삼하', 695],
  ['열왕기상', '왕상', 816], ['열왕기하', '왕하', 719], ['역대상', '대상', 942], ['역대하', '대하', 822], ['에스라', '스', 280],
  ['느헤미야', '느', 406], ['에스더', '에', 167], ['욥기', '욥', 1070], ['시편', '시', 2461], ['잠언', '잠', 915],
  ['전도서', '전', 222], ['아가', '아', 117], ['이사야', '사', 1292], ['예레미야', '렘', 1364], ['예레미야애가', '애', 154],
  ['에스겔', '겔', 1273], ['다니엘', '단', 357], ['호세아', '호', 197], ['요엘', '욜', 73], ['아모스', '암', 146],
  ['오바댜', '옵', 21], ['요나', '욘', 48], ['미가', '미', 105], ['나훔', '나', 47], ['하박국', '합', 56],
  ['스바냐', '습', 53], ['학개', '학', 38], ['스가랴', '슥', 211], ['말라기', '말', 55],
  ['마태복음', '마', 1071], ['마가복음', '막', 678], ['누가복음', '눅', 1151], ['요한복음', '요', 879], ['사도행전', '행', 1007],
  ['로마서', '롬', 433], ['고린도전서', '고전', 437], ['고린도후서', '고후', 257], ['갈라디아서', '갈', 149], ['에베소서', '엡', 155],
  ['빌립보서', '빌', 104], ['골로새서', '골', 95], ['데살로니가전서', '살전', 89], ['데살로니가후서', '살후', 47], ['디모데전서', '딤전', 113],
  ['디모데후서', '딤후', 83], ['디도서', '딛', 46], ['빌레몬서', '몬', 25], ['히브리서', '히', 303], ['야고보서', '약', 108],
  ['베드로전서', '벧전', 105], ['베드로후서', '벧후', 61], ['요한일서', '요일', 105], ['요한이서', '요이', 13], ['요한삼서', '요삼', 14],
  ['유다서', '유', 25], ['요한계시록', '계', 404],
]

/** 내가 쓴 절 수 · 마지막으로 쓴 날 (book_number → ) */
const WRITTEN: Record<number, { n: number; last: string; at?: string }> = {
  19: { n: 31, last: '오늘', at: '46편 2절' },
  1: { n: 77, last: '어제', at: '4장 3절' },
  45: { n: 14, last: '3일 전', at: '8장 15절' },
  40: { n: 12, last: '지난주', at: '5장 13절' },
  58: { n: 7, last: '지난주', at: '11장 8절' },
  46: { n: 6, last: '10월 28일', at: '13장 7절' },
  16: { n: 5, last: '10월 21일' },
  20: { n: 10, last: '10월 19일' },
  23: { n: 14, last: '10월 12일' },
  24: { n: 15, last: '10월 9일' },
  26: { n: 13, last: '10월 2일' },
}
const RECENT = [19, 1, 45, 40, 58, 46]

type Genre = { key: string; name: string; color: string; from: number; to: number; art?: string }
const GENRES: Genre[] = [
  { key: 'law', name: '율법서', color: 'var(--genre-law)', from: 1, to: 5 },
  { key: 'history', name: '역사서', color: 'var(--genre-history)', from: 6, to: 17 },
  { key: 'poetry', name: '시가서', color: 'var(--genre-poetry)', from: 18, to: 22 },
  { key: 'major', name: '대선지서', color: 'var(--genre-prophets)', from: 23, to: 27 },
  { key: 'minor', name: '소선지서', color: 'var(--genre-prophets)', from: 28, to: 39 },
  { key: 'gospels', name: '복음서', color: 'var(--genre-gospels)', from: 40, to: 43 },
  { key: 'acts', name: '사도행전', color: 'var(--genre-acts)', from: 44, to: 44 },
  { key: 'paul', name: '바울 서신', color: 'var(--genre-epistles)', from: 45, to: 57 },
  { key: 'general', name: '일반 서신', color: 'var(--genre-epistles)', from: 58, to: 65 },
  { key: 'rev', name: '요한계시록', color: 'var(--genre-revelation)', from: 66, to: 66 },
]
const genreOf = (bn: number) => GENRES.find((g) => bn >= g.from && bn <= g.to)!

/** 검색 미리보기용 본문(개역개정) — 없으면 '첫 절부터' */
const VERSES: Record<string, string> = {
  '19:23:1': '여호와는 나의 목자시니 내게 부족함이 없으리로다',
  '43:3:16': '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라',
  '45:8:28':
    '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라',
  '19:1:1': '복 있는 사람은 악인들의 꾀를 따르지 아니하며 죄인들의 길에 서지 아니하며 오만한 자들의 자리에 앉지 아니하고',
}

const NOW = {
  ref: '시편 46편 2절',
  text: '그러므로 땅이 변하든지 산이 흔들려 바다 가운데에 빠지든지',
  next: '바닷물이 솟아나고 뛰놀든지 그것이 넘침으로 산이 흔들릴지라도 (셀라)',
  nextRef: '3절',
  today: 16,
  goal: 5,
  streak: 3,
}
// 월~일: full 목표 채움 · done 조금 · rest 쉼표 · miss · future
const WEEK: { d: string; s: 'full' | 'done' | 'rest' | 'miss' | 'future' | 'today'; n: number }[] = [
  { d: '월', s: 'miss', n: 0 },
  { d: '화', s: 'full', n: 6 },
  { d: '수', s: 'rest', n: 0 },
  { d: '목', s: 'full', n: 16 },
  { d: '금', s: 'future', n: 0 },
  { d: '토', s: 'future', n: 0 },
  { d: '일', s: 'future', n: 0 },
]

const pct = (bn: number) => {
  const w = WRITTEN[bn]?.n ?? 0
  const total = BOOKS[bn - 1][2]
  return w ? Math.max(1, Math.floor((w / total) * 100)) : 0
}

const parseRef = (q: string): { bn: number; ch: number; v?: number } | null => {
  const m = q.trim().replace(/\s+/g, ' ').match(/^([가-힣]+)\s?(\d+)(?:[:\s편장]\s?(\d+))?/)
  if (!m) return null
  const word = m[1].replace(/(편|장)$/, '')
  // 약칭·전체 이름이 딱 맞는 책 먼저('요' = 요한복음, 요엘 아님), 없으면 앞글자로
  const exact = BOOKS.findIndex(([name, ab]) => ab === word || name === word)
  const idx = exact >= 0 ? exact : BOOKS.findIndex(([name]) => name.startsWith(word))
  if (idx < 0) return null
  return { bn: idx + 1, ch: Number(m[2]), v: m[3] ? Number(m[3]) : undefined }
}

type Size = 'pc' | 'm'

/* ───────────────────────── 공용 조각 ───────────────────────── */

const Ring = ({ value, goal, size = 92 }: { value: number; goal: number; size?: number }) => {
  const r = 42
  const c = 2 * Math.PI * r
  const p = Math.min(1, value / goal)
  return (
    <div className="thp-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} className="thp-ring__track" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="thp-ring__bar"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <Lamp fill={p} lit full={value >= goal} className="thp-ring__lamp" />
    </div>
  )
}

const WeekStrip = () => (
  <>
    <ol className="thp-week">
      {WEEK.map((w) => (
        <li key={w.d} className={`thp-week__day is-${w.s}`}>
          <span className="thp-week__dot">
            {w.s === 'rest' ? (
              <span className="material-icons-round">bedtime</span>
            ) : w.s === 'full' || w.s === 'done' ? (
              <span className="thp-week__n">{w.n}</span>
            ) : null}
          </span>
          <span className="thp-week__label">{w.d}</span>
        </li>
      ))}
    </ol>
    <p className="thp-week__legend">
      <span className="material-icons-round">bedtime</span> 수요일은 <b>쉬어 간 날</b>이에요 — 한 주에 하루는 쉬어도 등불이 꺼지지
      않아요
    </p>
  </>
)

const SettingsSheet = ({ onClose }: { onClose: () => void }) => {
  const [punct, setPunct] = useState(true)
  const [goal, setGoal] = useState(5)
  return (
    <div className="thp-sheet" role="dialog" aria-label="쓰기 설정">
      <div className="thp-sheet__head">
        <b>쓰기 설정</b>
        <button type="button" onClick={onClose} aria-label="닫기">
          <span className="material-icons-round">close</span>
        </button>
      </div>
      <label className="thp-sheet__row">
        <span>
          <b>문장부호 건너뛰기</b>
          <small>쉼표·마침표는 안 쳐도 돼요</small>
        </span>
        <button type="button" className={`thp-switch${punct ? ' is-on' : ''}`} onClick={() => setPunct(!punct)} aria-pressed={punct}>
          <i />
        </button>
      </label>
      <div className="thp-sheet__row thp-sheet__row--col">
        <span>
          <b>하루 목표</b>
          <small>등잔에 기름이 차는 기준이에요</small>
        </span>
        <div className="thp-seg thp-seg--goal">
          {[1, 3, 5, 10].map((g) => (
            <button key={g} type="button" className={goal === g ? 'is-on' : ''} onClick={() => setGoal(g)}>
              {g}절
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 위: A 말씀이 먼저 ───────────────────────── */

const TopVerseFirst = ({ size }: { size: Size }) => {
  const [mode, setMode] = useState<'copy' | 'memo'>('copy')
  const [weekOpen, setWeekOpen] = useState(false)
  const [settings, setSettings] = useState(false)
  const [typed, setTyped] = useState(0)
  const chars = [...NOW.text]

  // PC: 카드 안에 포커스가 있으면 아무 키나 → 바로 글자가 새겨진다(시안 흉내)
  const onKey = (e: React.KeyboardEvent) => {
    if (size !== 'pc') return
    if (e.key === 'Escape') return setTyped(0)
    if (e.key.length === 1 || e.key === 'Process') {
      e.preventDefault()
      setTyped((t) => Math.min(chars.length, t + 1))
    }
  }

  return (
    <section className={`thp-card thp-a is-${size}`} tabIndex={size === 'pc' ? 0 : -1} onKeyDown={onKey}>
      <header className="thp-a__head">
        <div className="thp-a__title">
          <p className="thp-eyebrow">오늘의 필사</p>
          <h2>
            오늘 <em>{NOW.today}</em>절 썼어요
          </h2>
          <button type="button" className="thp-a__streak" onClick={() => setWeekOpen(!weekOpen)} aria-expanded={weekOpen}>
            <span className="thp-flame" aria-hidden />
            {NOW.streak}일째 등불이 켜져 있어요
            <span className="material-icons-round">{weekOpen ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>
        <div className="thp-a__ring">
          <Ring value={NOW.today} goal={NOW.goal} size={size === 'pc' ? 96 : 76} />
          <span className="thp-a__ringlabel">
            목표 {NOW.goal}절 <b>달성</b>
          </span>
        </div>
      </header>

      {weekOpen && (
        <div className="thp-a__week">
          <WeekStrip />
        </div>
      )}

      <div className="thp-a__stage">
        <div className="thp-a__bar">
          <div className="thp-seg" role="tablist">
            <button type="button" className={mode === 'copy' ? 'is-on' : ''} onClick={() => setMode('copy')}>
              따라 쓰기
            </button>
            <button type="button" className={mode === 'memo' ? 'is-on' : ''} onClick={() => setMode('memo')}>
              암송 쓰기
            </button>
          </div>
          <span className="thp-a__ref">이어서 · {NOW.ref}</span>
          <button type="button" className="thp-icon-btn" aria-label="쓰기 설정" onClick={() => setSettings(!settings)}>
            <span className="material-icons-round">tune</span>
          </button>
        </div>

        <p className={`thp-a__verse${mode === 'memo' ? ' is-memo' : ''}`}>
          {chars.map((ch, i) => (
            <span key={i} className={i < typed ? 'is-ink' : ''}>
              {i === typed && size === 'pc' && <i className="thp-caret" />}
              {mode === 'memo' && i >= typed && ch !== ' ' && i > 3 ? '○' : ch}
            </span>
          ))}
        </p>
        <p className="thp-a__next">
          <b>{NOW.nextRef}</b> {NOW.next}
        </p>

        {settings && <SettingsSheet onClose={() => setSettings(false)} />}
      </div>

      {size === 'pc' ? (
        <footer className="thp-a__foot">
          <span className="thp-kbd">아무 키</span>나 누르면 바로 시작돼요
          <span className="thp-a__dot">·</span>
          <span className="thp-kbd">Tab</span> 다음 절
          <span className="thp-a__dot">·</span>
          <span className="thp-kbd">Esc</span> 처음부터
          <button type="button" className="thp-link thp-a__other">
            다른 말씀 고르기 <span className="material-icons-round">south</span>
          </button>
        </footer>
      ) : (
        <footer className="thp-a__foot thp-a__foot--m">
          <button type="button" className="thp-cta">
            <span className="material-icons-round">edit</span> 이 절부터 쓰기
          </button>
          <button type="button" className="thp-link">다른 말씀 고르기</button>
        </footer>
      )}
    </section>
  )
}

/* ───────────────────────── 위: B 이어서 카드(Kindle) ───────────────────────── */

const BookCover = ({ bn, small }: { bn: number; small?: boolean }) => {
  const g = genreOf(bn)
  return (
    <span className={`thp-cover${small ? ' is-small' : ''}`} style={{ ['--g' as string]: g.color }}>
      <span className="thp-cover__name">{BOOKS[bn - 1][0]}</span>
      <span className="thp-cover__genre">{g.name}</span>
    </span>
  )
}

const TopContinue = ({ size }: { size: Size }) => {
  const [settings, setSettings] = useState(false)
  return (
    <section className={`thp-card thp-b is-${size}`}>
      <header className="thp-b__head">
        <p className="thp-eyebrow">이어서 쓰기</p>
        <span className="thp-b__streak">
          <Lamp fill={1} lit full className="thp-b__lamp" />
          <b>{NOW.streak}일</b> 연속
        </span>
      </header>
      <div className="thp-b__body">
        <BookCover bn={19} />
        <div className="thp-b__main">
          <p className="thp-b__ref">{NOW.ref}</p>
          <p className="thp-b__verse">{NOW.text}</p>
          <div className="thp-b__progress">
            <span className="thp-bar">
              <i style={{ width: `${(WRITTEN[19].n / BOOKS[18][2]) * 100 * 8}%` }} />
            </span>
            <span>
              시편 <b>{WRITTEN[19].n}</b>/{BOOKS[18][2].toLocaleString()}절
            </span>
          </div>
        </div>
      </div>
      <button type="button" className="thp-cta">
        목표 달성! 3절 더 써서 3편 끝내기 <span className="material-icons-round">arrow_forward</span>
      </button>
      <div className="thp-b__meta">
        <span>오늘 {NOW.today}/{NOW.goal}절</span>
        <span>·</span>
        <span>따라 쓰기</span>
        <button type="button" className="thp-link" onClick={() => setSettings(!settings)}>
          설정 바꾸기
        </button>
      </div>
      {settings && <SettingsSheet onClose={() => setSettings(false)} />}
    </section>
  )
}

/* ───────────────────────── 아래: B 서재(검색 + 필터 목록) ───────────────────────── */

type Filter = 'recent' | 'ot' | 'nt'

const SearchPreview = ({ q }: { q: string }) => {
  const r = parseRef(q)
  if (!q.trim()) return null
  if (!r) {
    const hits = BOOKS.map((b, i) => ({ b, bn: i + 1 })).filter(({ b }) => b[0].includes(q.trim())).slice(0, 4)
    if (!hits.length) return <p className="thp-search__empty">‘시 23’, ‘요 3:16’처럼 적어 보세요</p>
    return (
      <ul className="thp-search__books">
        {hits.map(({ b, bn }) => (
          <li key={bn}>
            <span className="thp-gdot" style={{ background: genreOf(bn).color }} />
            {b[0]}
          </li>
        ))}
      </ul>
    )
  }
  const [name] = BOOKS[r.bn - 1]
  const unit = r.bn === 19 ? '편' : '장'
  const text = VERSES[`${r.bn}:${r.ch}:${r.v ?? 1}`]
  return (
    <button type="button" className="thp-search__hit">
      <span className="thp-search__ref">
        {name} {r.ch}
        {unit} {r.v ?? 1}절{!r.v && '부터'}
      </span>
      <span className="thp-search__text">{text ?? '이 장 첫 절부터 써요'}</span>
      <span className="thp-kbd">Enter</span>
    </button>
  )
}

const BookRow = ({ bn, detail }: { bn: number; detail?: boolean }) => {
  const w = WRITTEN[bn]
  const p = pct(bn)
  return (
    <li>
      <button type="button" className="thp-row">
        <span className="thp-gdot" style={{ background: genreOf(bn).color }} />
        <span className="thp-row__name">{BOOKS[bn - 1][0]}</span>
        {detail && w?.at && <span className="thp-row__at">{w.at}까지</span>}
        <span className="thp-row__bar">{p > 0 && <i style={{ width: `${Math.max(4, p)}%`, background: genreOf(bn).color }} />}</span>
        <span className="thp-row__pct">{p > 0 ? `${w!.n}절` : ''}</span>
        {detail && <span className="thp-row__last">{w?.last}</span>}
        <span className="material-icons-round thp-row__chev">chevron_right</span>
      </button>
    </li>
  )
}

const Library = ({ size }: { size: Size }) => {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('recent')
  const list = useMemo(() => {
    if (filter === 'recent') return Object.keys(WRITTEN).map(Number).sort((a, b) => RECENT.indexOf(a) - RECENT.indexOf(b) || 0)
    const range = filter === 'ot' ? [1, 39] : [40, 66]
    return Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i)
  }, [filter])
  const sorted = filter === 'recent' ? [...RECENT, ...list.filter((b) => !RECENT.includes(b))] : list

  return (
    <section className={`thp-card thp-lib is-${size}`}>
      <h3 className="thp-h3">원하는 말씀 골라 쓰기</h3>
      <label className="thp-search">
        <span className="material-icons-round">search</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="시 23, 요 3:16, 로마서" />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="지우기">
            <span className="material-icons-round">cancel</span>
          </button>
        )}
      </label>
      <SearchPreview q={q} />
      {!q && (
        <div className="thp-quick">
          {['시 23', '요 3:16', '롬 8:28', '시 1'].map((s) => (
            <button key={s} type="button" onClick={() => setQ(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="thp-chips" role="tablist">
        {(
          [
            ['recent', `쓰던 책 ${Object.keys(WRITTEN).length}`],
            ['ot', '구약 39'],
            ['nt', '신약 27'],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>

      <ul className={`thp-rows${size === 'pc' && filter !== 'recent' ? ' is-two' : ''}`}>
        {sorted.map((bn) => (
          <BookRow key={bn} bn={bn} detail={filter === 'recent'} />
        ))}
      </ul>
    </section>
  )
}

/* ───────────────────────── 아래: C 장르 메달 ───────────────────────── */

const Medal = ({ g, on, onClick }: { g: Genre; on: boolean; onClick: () => void }) => {
  const books = Array.from({ length: g.to - g.from + 1 }, (_, i) => g.from + i)
  const total = books.reduce((s, b) => s + BOOKS[b - 1][2], 0)
  const w = books.reduce((s, b) => s + (WRITTEN[b]?.n ?? 0), 0)
  const started = books.filter((b) => WRITTEN[b]).length
  const r = 40
  const c = 2 * Math.PI * r
  const p = Math.min(1, (w / total) * 12) // 시안: 눈에 보이게 과장(실제는 절 기준 그대로)
  return (
    <button type="button" className={`thp-medal${on ? ' is-on' : ''}${w ? '' : ' is-empty'}`} style={{ ['--g' as string]: g.color }} onClick={onClick}>
      <span className="thp-medal__disc">
        <svg viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r={r} className="thp-medal__track" />
          {w > 0 && (
            <circle cx="50" cy="50" r={r} className="thp-medal__bar" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 50 50)" />
          )}
        </svg>
        <span className="thp-medal__n">{w || '·'}</span>
      </span>
      <span className="thp-medal__name">{g.name}</span>
      <span className="thp-medal__sub">
        {started ? `${started}/${books.length}권` : `${books.length}권`}
      </span>
    </button>
  )
}

const GenreMedals = ({ size }: { size: Size }) => {
  const [open, setOpen] = useState<string>('poetry')
  const [q, setQ] = useState('')
  const g = GENRES.find((x) => x.key === open)
  const books = g ? Array.from({ length: g.to - g.from + 1 }, (_, i) => g.from + i) : []
  return (
    <section className={`thp-card thp-c is-${size}`}>
      <h3 className="thp-h3">원하는 말씀 골라 쓰기</h3>
      <label className="thp-search">
        <span className="material-icons-round">search</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="시 23, 요 3:16, 로마서" />
      </label>
      <SearchPreview q={q} />

      <p className="thp-c__label">구약</p>
      <div className="thp-medals">
        {GENRES.slice(0, 5).map((x) => (
          <Medal key={x.key} g={x} on={open === x.key} onClick={() => setOpen(open === x.key ? '' : x.key)} />
        ))}
      </div>
      {g && GENRES.indexOf(g) < 5 && <GenreBooks g={g} books={books} />}
      <p className="thp-c__label">신약</p>
      <div className="thp-medals">
        {GENRES.slice(5).map((x) => (
          <Medal key={x.key} g={x} on={open === x.key} onClick={() => setOpen(open === x.key ? '' : x.key)} />
        ))}
      </div>
      {g && GENRES.indexOf(g) >= 5 && <GenreBooks g={g} books={books} />}
    </section>
  )
}

const GenreBooks = ({ g, books }: { g: Genre; books: number[] }) => (
  <div className="thp-gbooks" style={{ ['--g' as string]: g.color }}>
    {books.map((bn) => (
      <button key={bn} type="button" className={WRITTEN[bn] ? 'is-started' : ''}>
        {BOOKS[bn - 1][0]}
        {WRITTEN[bn] && <small>{WRITTEN[bn].n}절</small>}
      </button>
    ))}
  </div>
)

/* ───────────────────────── 조립 ───────────────────────── */

const VARIANTS = {
  a1: { label: 'A1 원고지 다듬기', desc: '1차 A 뼈대 그대로 — 머리 한 줄(작은 등잔 + 오늘 숫자 + 이번 주 7칸 늘 보임), 무대가 카드 대부분' },
  a2: { label: 'A2 몰입 무대', desc: 'Monkeytype식 — 위아래 가는 줄에만 숫자·버튼, 가운데는 말씀뿐. 아래 이 편 진행선' },
  a3: { label: 'A3 장 흐름', desc: '“이 편 안의 나” — 절 번호 줄(쓴 절 ✓) + 쓴 앞 절·지금 절·다음 절이 이어지는 무대' },
  a4: { label: 'A4 등불 빛', desc: '시 119:105 — 등잔 빛이 말씀 위로 번지고 친 글자가 따뜻하게 남음. 이번 주 = 작은 등잔 7개' },
  mix: {
    label: '1차 A + 서재',
    desc: '위 A(말씀이 먼저: Monkeytype + Apple Books 목표 링) · 아래 서재(Spotlight 검색 + Spotify 필터 목록)',
  },
  b: { label: '1차 B', desc: '위 Kindle식 이어서 카드(책 표지·진행 막대·버튼 하나) · 아래 서재 목록' },
  c: { label: '1차 C', desc: '위 A · 아래 성경 지도(E4)와 같은 장르 메달 10개 — 누르면 그 장르 책 칩이 펼쳐짐' },
} as const
type V = keyof typeof VARIANTS

const Column = ({ v, size }: { v: V; size: Size }) => (
  <div className={`thp-col is-${size}`}>
    {v === 'a1' ? (
      <TopA1 size={size} />
    ) : v === 'a2' ? (
      <TopA2 size={size} />
    ) : v === 'a3' ? (
      <TopA3 size={size} />
    ) : v === 'a4' ? (
      <TopA4 size={size} />
    ) : v === 'b' ? (
      <TopContinue size={size} />
    ) : (
      <TopVerseFirst size={size} />
    )}
    {v === 'c' ? <GenreMedals size={size} /> : <Library size={size} />}
  </div>
)

const TypingHubPreview = () => {
  const [params, setParams] = useSearchParams()
  const v = (params.get('v') as V) in VARIANTS ? (params.get('v') as V) : 'a1'
  const { theme, toggleTheme } = useTheme()
  useEffect(() => {
    void ensureSerifKr()
  }, [])

  return (
    <div className="bt-page thp-page">
      <nav className="thp-nav">
        <strong>/bible/typing 첫 화면 시안</strong>
        {(Object.keys(VARIANTS) as V[]).map((k) => (
          <button key={k} type="button" className={v === k ? 'is-on' : ''} onClick={() => setParams({ v: k })}>
            {VARIANTS[k].label}
          </button>
        ))}
        <button type="button" className="thp-nav__theme" onClick={toggleTheme}>
          <span className="material-icons-round">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </nav>
      <p className="thp-desc">{VARIANTS[v].desc}</p>
      <div className="thp-stage">
        <div>
          <p className="thp-frame-label">PC 본문 단</p>
          <Column v={v} size="pc" />
        </div>
        <div>
          <p className="thp-frame-label">모바일 375</p>
          <div className="thp-phone">
            <Column v={v} size="m" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypingHubPreview
