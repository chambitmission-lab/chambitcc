import type { MannaLive, MannaRival, MannaRunResult, MannaSummary } from '../../../../api/bibleTyping'
import { useMannaBoard, useMannaTeams } from '../../../../hooks/useBibleTyping'
import { parseApiDate } from '../../../../utils/dateUtils'
import { PLACES, type MannaMode, type MannaResult } from './mannaEngine'
import { daysLeftInWeek, isoWeek, mannaPersona } from './mannaSkin'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'

const hhmm = (iso: string) => {
  const d = parseApiDate(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
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
