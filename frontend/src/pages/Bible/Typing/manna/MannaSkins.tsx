import type { MannaLive, MannaRival, MannaRunResult, MannaSummary } from '../../../../api/bibleTyping'
import { useMannaBoard, useMannaTeams } from '../../../../hooks/useBibleTyping'
import { parseApiDate } from '../../../../utils/dateUtils'
import { PLACES, type MannaMode, type MannaResult } from './mannaEngine'
import { MANNA_SKINS, dayOfYear, daysLeftInWeek, isoWeek, mannaPersona, type MannaSkin } from './mannaSkin'

const fmt = (n: number) => n.toLocaleString('ko-KR')
const hhmm = (iso: string) => {
  const d = parseApiDate(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 시작 화면 맨 위 — 화면 스타일 고르기(기기에 기억) */
export const SkinPicker = ({ skin, onChange }: { skin: MannaSkin; onChange: (s: MannaSkin) => void }) => (
  <div className="mn-skinpick" role="radiogroup" aria-label="화면 스타일">
    <span className="mn-skinpick__label">화면 스타일</span>
    {MANNA_SKINS.map((s) => (
      <button
        key={s.key}
        type="button"
        role="radio"
        aria-checked={skin === s.key}
        className={`mn-skinpick__btn is-${s.key}${skin === s.key ? ' is-on' : ''}`}
        onClick={() => onChange(s.key)}
      >
        <i aria-hidden />
        <strong>{s.label}</strong>
        <span>{s.desc}</span>
      </button>
    ))}
  </div>
)

// ── 아케이드 ─────────────────────────────────────────

/** 오락실 로고 + 오늘의 하이스코어(그 난이도 TOP 3 + 내 자리) */
export const ArcadeTop = ({ mode, loggedIn, summary }: { mode: MannaMode; loggedIn: boolean; summary: MannaSummary | undefined }) => {
  const { data: board } = useMannaBoard(mode, loggedIn)
  const top = board?.entries.slice(0, 3) ?? []
  const me = board?.me && board.me.rank > 3 ? board.me : null
  return (
    <div className="mn-arc">
      <div className="mn-arc__logo">
        <span className="mn-arc__eyebrow">EXODUS 16 · STAGE {dayOfYear()}</span>
        <h2 className="mn-arc__title">
          만나
          <br />
          내리기
        </h2>
        <p className="mn-arc__sub">순서대로 떨어지는 말씀을 쳐서 거둬요</p>
      </div>
      {loggedIn && (
        <div className="mn-arc__hs">
          <p className="mn-arc__hs-title">TODAY&apos;S HI-SCORE</p>
          {top.length === 0 ? (
            <p className="mn-arc__hs-empty">{board ? 'NO RECORD — 첫 기록의 주인공이 되어 보세요' : 'LOADING…'}</p>
          ) : (
            <ol className="mn-arc__hs-list">
              {top.map((e) => (
                <li key={e.user_id} className={`is-${e.rank}${e.is_me ? ' is-me' : ''}`}>
                  <span>{['1ST', '2ND', '3RD'][e.rank - 1] ?? `${e.rank}TH`}</span>
                  <span className="mn-arc__hs-name">{e.is_me ? 'YOU' : e.name}</span>
                  <span>{fmt(e.score)}</span>
                </li>
              ))}
              {me && (
                <li className="is-me">
                  <span>{me.rank}TH</span>
                  <span className="mn-arc__hs-name">YOU</span>
                  <span>{fmt(me.score)}</span>
                </li>
              )}
            </ol>
          )}
          {summary && summary.players_today > 0 && <p className="mn-arc__hs-foot">PLAYERS {summary.players_today}</p>}
        </div>
      )}
    </div>
  )
}

/** 결과 — STAGE CLEAR / GAME OVER + 정산 줄 */
export const ArcadeResultHero = ({
  result,
  saved,
  verses,
  shownScore,
  prevRank,
  rivalLine,
}: {
  result: MannaResult
  saved: MannaRunResult | null
  verses: number
  shownScore: number
  prevRank: number | null
  rivalLine: string | null
}) => {
  const place = PLACES[Math.min(result.versesDone, PLACES.length - 1)]
  const rank = saved?.kind === 'daily' ? saved.rank : null
  const rows: [string, string][] = [
    ['거둔 만나', `×${result.wordsCaught}`],
    ['온전히 새김', `×${result.perfectVerses}`],
    ['최고 콤보', `${result.maxCombo}`],
  ]
  if (result.goldCaught > 0) rows.push(['핵심 말씀', `×${result.goldCaught}`])
  if (result.closeCalls > 0) rows.push(['아슬아슬', `×${result.closeCalls}`])
  if (result.wordsMissed > 0) rows.push(['놓친 만나', `×${result.wordsMissed}`])
  return (
    <div className="mn-arcres">
      <p className={`mn-arcres__big${result.reachedCanaan ? '' : ' is-over'}`}>
        {result.reachedCanaan ? (
          <>
            STAGE
            <br />
            CLEAR!
          </>
        ) : (
          <>
            GAME
            <br />
            OVER
          </>
        )}
      </p>
      <p className="mn-arcres__sub">
        {result.reachedCanaan ? `가나안 도착 · ${verses}절 모두 새김` : `${place}까지 · ${result.versesDone}/${verses}절`}
      </p>
      {saved?.is_best && <p className="mn-arcres__new">NEW RECORD!</p>}
      <div className="mn-arcres__tally">
        {rows.map(([k, v]) => (
          <div key={k}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
        <div className="is-total">
          <span>TOTAL</span>
          <span>{fmt(shownScore)}</span>
        </div>
      </div>
      {rank && (
        <p className="mn-arcres__rank">
          {prevRank && prevRank > rank ? (
            <>
              ▲ {prevRank}위 → <b>{rank}위</b>
            </>
          ) : (
            <>
              오늘 <b>{rank}위</b>
            </>
          )}
          {saved && ` · ${saved.players}명 중`}
          {saved && saved.overtook.length > 0 && <span className="mn-arcres__push">{saved.overtook.join(', ')}님을 밀어냈어요</span>}
        </p>
      )}
      {rivalLine && <p className="mn-arcres__rival">{rivalLine}</p>}
    </div>
  )
}

// ── 드롭 ─────────────────────────────────────────────

const Jar = () => (
  <svg viewBox="0 0 16 20" aria-hidden>
    <path d="M5 1.5h6M5.5 1.5v3C2.5 6 1.5 8.5 1.5 12c0 4 2.5 6.5 6.5 6.5s6.5-2.5 6.5-6.5c0-3.5-1-6-4-7.5v-3" />
  </svg>
)

/** 흐르는 소식 띠 + 시즌 + 오렌지 히어로(스티커) + 오늘의 1위·부서 선두 포스터 */
export const DropTop = ({
  mode,
  loggedIn,
  summary,
  live,
  rival,
}: {
  mode: MannaMode
  loggedIn: boolean
  summary: MannaSummary | undefined
  live: MannaLive | null | undefined
  rival: MannaRival['rival'] | null
}) => {
  const { data: board } = useMannaBoard(mode, loggedIn)
  const { data: teams } = useMannaTeams(loggedIn)
  const leader = board?.entries[0] ?? null
  const team = teams?.teams[0] ?? null
  const left = daysLeftInWeek()

  const news: string[] = []
  if (summary && summary.players_today > 0) news.push(`오늘 ${summary.players_today}명 참여 중`)
  if (leader) news.push(`${leader.is_me ? '내가' : `${leader.name}님이`} ${fmt(leader.score)}점으로 1위`)
  if (team && team.score > 0) news.push(`${team.name} 이번 주 선두`)
  if (live?.current) news.push(`지금 라이브 드롭 · ${live.current.board.players}명`)
  else if (live?.next) news.push(`${live.next.weekday}요일 ${hhmm(live.next.starts_at)} 라이브 드롭`)
  if (rival && !rival.is_me) news.push(`오늘의 라이벌 ${rival.name}님 ${fmt(rival.score)}점`)
  if (news.length < 2) news.push('단어는 순서대로 내려와요', '여덟 절 다 거두면 가나안')

  return (
    <div className="mn-drop">
      <div className="mn-drop__marq" aria-hidden>
        <div className="mn-drop__marq-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {news.map((n) => (
                <span key={n}>● {n}</span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="mn-drop__season">
        <span>SEASON {isoWeek()} · 광야</span>
        <span>{left === 0 ? 'D-DAY' : `D-${left}`}</span>
      </div>
      <div className="mn-drop__hero">
        <h2 className="mn-drop__title">
          만나
          <br />
          <span>드롭</span>
        </h2>
        <p className="mn-drop__lede">오늘 내려오는 말씀 여덟 절. 순서대로 쳐서 다 거두면 가나안.</p>
        {summary && summary.players_today > 0 && <span className="mn-stk mn-stk--1">오늘 {summary.players_today}명</span>}
        <span className="mn-stk mn-stk--2">8절 · 순서대로</span>
        <span className="mn-stk mn-stk--3">
          <Jar />
        </span>
      </div>
      {loggedIn && (leader || team) && (
        <div className="mn-drop__champs">
          <div>
            <small>오늘의 1위</small>
            <b>{leader ? (leader.is_me ? '나' : leader.name) : '–'}</b>
            <em>{leader ? `${fmt(leader.score)}점` : '아직 없어요'}</em>
          </div>
          <div className="is-lime">
            <small>이번 주 부서 1위</small>
            <b>{team && team.score > 0 ? team.name : '–'}</b>
            <em>{team && team.score > 0 ? `1인당 ${fmt(Math.round(team.score))}점` : '첫 점수를 기다려요'}</em>
          </div>
        </div>
      )}
    </div>
  )
}

/** 결과 — 9:16 스토리 카드 같은 '오늘의 만나 유형' */
export const DropResultHero = ({
  result,
  saved,
  verses,
  shownScore,
  rivalDelta,
  rivalName,
  dateLabel,
  live,
}: {
  result: MannaResult
  saved: MannaRunResult | null
  verses: number
  shownScore: number
  rivalDelta: number | null
  rivalName: string | null
  dateLabel: string
  live: boolean
}) => {
  const p = mannaPersona(result, verses)
  const rank = saved?.kind === 'daily' ? saved.rank : null
  const tags = [
    result.reachedCanaan ? '#가나안도착' : `#${PLACES[Math.min(result.versesDone, PLACES.length - 1)].replace(/\s/g, '')}까지`,
    result.maxCombo >= 5 ? `#콤보${result.maxCombo}` : null,
    saved?.is_best ? '#최고기록' : null,
    live ? '#라이브' : null,
  ].filter(Boolean) as string[]
  return (
    <div className={`mn-story is-${p.key}`}>
      <small className="mn-story__eyebrow">MY MANNA TYPE · {dateLabel}</small>
      <h2 className="mn-story__title">
        오늘의 나는
        <br />
        <span>{p.title}</span>
      </h2>
      <p className="mn-story__desc">{p.desc}</p>
      <div className="mn-story__tags">
        {tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <span className="mn-story__blob" aria-hidden>
        <span className="material-icons-round">{p.icon}</span>
      </span>
      <div className="mn-story__grid">
        <div className="is-lime">
          <small>점수</small>
          <b>{fmt(shownScore)}</b>
        </div>
        <div>
          <small>오늘 순위</small>
          <b>{rank ? `${rank}위` : '–'}</b>
        </div>
        <div>
          <small>{p.stat.label}</small>
          <b>{p.stat.value}</b>
        </div>
        <div>
          {rivalDelta !== null && rivalName ? (
            <>
              <small>{rivalName}님보다</small>
              <b>
                {rivalDelta >= 0 ? '+' : '−'}
                {fmt(Math.abs(rivalDelta))}
              </b>
            </>
          ) : (
            <>
              <small>새긴 말씀</small>
              <b>
                {result.versesDone}/{verses}
              </b>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
