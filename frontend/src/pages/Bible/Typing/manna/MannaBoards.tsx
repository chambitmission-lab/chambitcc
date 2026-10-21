import { useState, type CSSProperties } from 'react'
import type { MannaBoardEntry, MannaLive, MannaLiveBoard, MannaTeams } from '../../../../api/bibleTyping'
import { useChooseMannaTeam, useMannaBoard, useMannaTeams } from '../../../../hooks/useBibleTyping'
import { useTickingNow } from '../../../../hooks/useTickingNow'
import { parseApiDate } from '../../../../utils/dateUtils'
import { showToast } from '../../../../utils/toast'
import { MANNA_MODES, PLACES, type MannaMode } from './mannaEngine'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'

type Tab = 'today' | 'teams' | 'live'

const MEDALS = ['#f5b301', '#9aa6bb', '#c98a55']
const hhmm = (iso: string) => {
  const d = parseApiDate(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 시작·결과 화면 아래 — 오늘의 만나 순위(난이도별) / 이번 주 부서 대항전(광야 지도) / 라이브 한 판 */
const MannaBoards = ({ mode, onModeChange, live }: { mode: MannaMode; onModeChange: (m: MannaMode) => void; live: MannaLive | null }) => {
  const [tab, setTab] = useState<Tab>('today')
  const { data: board, isLoading: boardLoading, isError: boardError } = useMannaBoard(mode, tab === 'today')
  // 부서 이름·색은 두 탭 모두 쓰니 늘 받는다
  const { data: teams, isError: teamsError } = useMannaTeams()
  const teamOf = (key: string | null) => teams?.team_options.find((t) => t.key === key)
  // 1~3위가 다 찼을 때만 단상으로 — 나머지는 목록
  const entries = board?.entries ?? []
  const podium = entries.length >= 3 && entries.slice(0, 3).every((e, i) => e.rank === i + 1) ? entries.slice(0, 3) : []
  const rest = podium.length ? entries.slice(3) : entries

  return (
    <section className="bt-card mn-boards">
      <div className="mn-boards__head">
        <span className="material-icons-round" aria-hidden>
          leaderboard
        </span>
        <h3>오늘의 광야 순위</h3>
      </div>
      <div className="mn-tabs mn-tabs--3" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'today'} className={`mn-tab${tab === 'today' ? ' is-on' : ''}`} onClick={() => setTab('today')}>
          오늘의 만나
        </button>
        <button type="button" role="tab" aria-selected={tab === 'teams'} className={`mn-tab${tab === 'teams' ? ' is-on' : ''}`} onClick={() => setTab('teams')}>
          부서 대항전
        </button>
        <button type="button" role="tab" aria-selected={tab === 'live'} className={`mn-tab${tab === 'live' ? ' is-on' : ''}${live?.current ? ' is-live' : ''}`} onClick={() => setTab('live')}>
          라이브
        </button>
      </div>

      {tab === 'today' && (
        <div className="mn-board">
          <div className="mn-board__modes" role="radiogroup" aria-label="순위 난이도">
            {MANNA_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={mode === m.key}
                className={`mn-chip-btn${mode === m.key ? ' is-on' : ''}`}
                onClick={() => onModeChange(m.key)}
              >
                {m.label}
              </button>
            ))}
            {board && <span className="mn-board__count">오늘 {board.players}명</span>}
          </div>
          {boardLoading && <p className="mn-empty">순위를 불러오는 중…</p>}
          {boardError && <p className="mn-empty">순위를 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p>}
          {board && board.entries.length === 0 && <p className="mn-empty">아직 아무도 거두지 않았어요. 오늘 첫 만나를 거둬 보세요!</p>}
          {podium.length === 3 && <Podium entries={podium} />}
          {board && rest.length > 0 && <RankList entries={rest} teamOf={teamOf} />}
          <p className="mn-board__foot">난이도마다 오늘 가장 좋은 한 판으로 겨뤄요 · 0시에 새 판이 열려요 · 누군가를 앞지르면 그 사람에게 알림이 가요</p>
        </div>
      )}

      {tab === 'teams' &&
        (teamsError ? <p className="mn-empty">부서 대항전을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p> : <TeamsPanel teams={teams} />)}

      {tab === 'live' && <LivePanel live={live} teamOf={teamOf} />}
    </section>
  )
}

const Podium = ({ entries }: { entries: MannaBoardEntry[] }) => (
  <div className="mn-podium" aria-label="1~3위">
    {[entries[1], entries[0], entries[2]].map((e) => (
      <div key={e.user_id} className={`mn-podium__col is-${e.rank}`} style={{ '--medal': MEDALS[e.rank - 1] } as CSSProperties}>
        {e.avatar_url ? (
          <img className="mn-podium__ava" src={e.avatar_url} alt="" loading="lazy" />
        ) : (
          <span className="mn-podium__ava" aria-hidden>
            {e.name.trim().charAt(0) || '?'}
          </span>
        )}
        <span className={`mn-podium__name${e.is_me ? ' is-me' : ''}`}>
          {e.name}
          {e.is_me ? ' (나)' : ''}
        </span>
        <span className="mn-podium__score">{fmt(e.score)}</span>
        <span className="mn-podium__base">{e.rank}</span>
      </div>
    ))}
  </div>
)

const RankList = ({ entries, teamOf }: { entries: MannaBoardEntry[]; teamOf: (key: string | null) => { name: string; color: string } | undefined }) => (
  <ol className="mn-rank">
    {entries.map((e) => {
      const team = teamOf(e.team_key)
      return (
        <li key={e.user_id} className={`mn-rank__row${e.is_me ? ' is-me' : ''}`}>
          <span className={`mn-rank__no${e.rank <= 3 ? ` is-top${e.rank}` : ''}`}>{e.rank}</span>
          <span className="mn-rank__who">
            <span className="mn-rank__name">
              {e.name}
              {e.is_me && <em>나</em>}
            </span>
            <span className="mn-rank__sub">
              {team && (
                <span className="mn-team-dot" style={{ '--team': team.color } as CSSProperties}>
                  {team.name}
                </span>
              )}
              {e.reached_canaan ? '가나안 도착' : `${e.verses_done}절`}
            </span>
          </span>
          <span className="mn-rank__score">{fmt(e.score)}</span>
        </li>
      )
    })}
  </ol>
)

// ── 부서 대항전 — 광야 지도 ─────────────────────────────
// 선두는 '이번 주가 얼마나 흘렀나'만큼 라암셋→가나안 노정을 간다(주일 밤 12시에 가나안).
// 나머지 부서는 선두 점수 대비 비율만큼 뒤에서 따라간다 — 바로 앞 부서와의 거리가 한눈에 보인다.

const SHORT_NAME: Record<string, string> = { kids: '주일학교', teen: '중고등', youth: '청년', men: '남전도', women: '여전도', family: '새가족' }

const TeamsPanel = ({ teams }: { teams: MannaTeams | undefined }) => {
  const choose = useChooseMannaTeam()
  // 배포가 엇갈린 잠깐은 서버 시각이 없을 수 있다 — 그땐 기기 시각(렌더 밖에서 한 번)
  const [fallbackNow] = useState(() => Date.now())
  if (!teams) return <p className="mn-empty">부서 대항전을 불러오는 중…</p>
  const myTeam = teams.team_options.find((t) => t.key === teams.me.team_key)
  const leader = teams.teams[0]
  const leaderScore = Math.max(0, leader?.score ?? 0)
  const start = parseApiDate(`${teams.week_start}T00:00:00`).getTime()
  const end = parseApiDate(teams.week_ends_at).getTime()
  const now = teams.now ? parseApiDate(teams.now).getTime() : fallbackNow
  const elapsed = Math.min(1, Math.max(0, (now - start) / Math.max(1, end - start)))
  const leaderPos = leaderScore > 0 ? Math.max(0.1, elapsed) : 0
  const posOf = (score: number) => (leaderScore > 0 ? leaderPos * Math.min(1, Math.max(0, score) / leaderScore) : 0)
  const placeOf = (score: number) => PLACES[Math.min(PLACES.length - 1, Math.round(posOf(score) * (PLACES.length - 1)))]
  const mine = teams.teams.find((t) => t.key === teams.me.team_key)
  const ahead = mine && mine.rank > 1 ? teams.teams[mine.rank - 2] : null
  const chaser = mine && mine.rank === 1 ? teams.teams[1] : null

  const pick = (key: string) =>
    choose.mutate(key, {
      onError: (e) => showToast(e instanceof Error ? e.message : '부서를 정하지 못했어요', 'error'),
    })

  return (
    <div className="mn-teams">
      {!myTeam && (
        <div className="mn-teams__pick">
          <p className="mn-teams__lead">
            우리 부서를 골라 주세요. 이번 주 <b>오늘의 만나</b> 점수가 부서 점수로 모여요.
          </p>
          <div className="mn-teams__options">
            {teams.team_options.map((t) => (
              <button
                key={t.key}
                type="button"
                className="mn-team-opt"
                style={{ '--team': t.color } as CSSProperties}
                disabled={choose.isPending}
                onClick={() => pick(t.key)}
              >
                {t.name}
              </button>
            ))}
          </div>
          <p className="mn-board__foot">바이블 퀘스트 말씀 리그와 같은 부서예요 · 한 주에 한 번 바꿀 수 있어요</p>
        </div>
      )}

      <div className="mn-race" role="img" aria-label="이번 주 부서별 광야 노정">
        <div className="mn-race__axis" aria-hidden>
          {PLACES.map((p, i) => (
            <span key={p} className={`mn-race__place${i % 2 ? ' is-low' : ''}`} style={{ left: `${(i / (PLACES.length - 1)) * 100}%` }}>
              <i />
              {p}
            </span>
          ))}
        </div>
        {teams.teams.map((t) => {
          const pos = posOf(t.score)
          const isMine = t.key === teams.me.team_key
          return (
            <div key={t.key} className={`mn-race__lane${isMine ? ' is-mine' : ''}`} style={{ '--team': t.color } as CSSProperties}>
              <span className="mn-race__team">{SHORT_NAME[t.key] ?? t.name}</span>
              <div className="mn-race__road">
                <span className="mn-race__trail" style={{ width: `${pos * 100}%` }} />
                <span className="mn-race__runner" style={{ left: `${pos * 100}%` }} title={`${t.name} ${placeOf(t.score)} · ${fmt(t.score)}점`}>
                  {t.rank}
                </span>
              </div>
              <span className="mn-race__score">{t.score > 0 ? fmt(t.score) : '–'}</span>
            </div>
          )
        })}
      </div>

      {mine && (
        <p className="mn-race__story">
          {ahead ? (
            <>
              <b style={{ color: ahead.color }}>{ahead.name}</b>가 <b>{placeOf(ahead.score)}</b>, 우리는 <b>{placeOf(mine.score)}</b>
              {ahead.score > mine.score ? ` · ${fmt(ahead.score - mine.score)}점 차` : ' · 나란히'}
            </>
          ) : chaser ? (
            <>
              우리 부서가 <b>선두</b>예요 · 2위 <b style={{ color: chaser.color }}>{chaser.name}</b>가 {fmt(Math.max(0, mine.score - chaser.score))}점 뒤에서 쫓아와요
            </>
          ) : (
            <>이번 주 첫 발을 떼 보세요 — 우리 부서가 라암셋을 떠나요</>
          )}
        </p>
      )}

      <ol className="mn-teams__list mn-teams__list--compact">
        {teams.teams.map((t) => (
          <li key={t.key} className={`mn-teams__row${t.key === teams.me.team_key ? ' is-mine' : ''}`} style={{ '--team': t.color } as CSSProperties}>
            <span className="mn-teams__rank">{t.rank}</span>
            <span className="mn-teams__body">
              <span className="mn-teams__name">
                {t.name}
                {t.key === teams.me.team_key && <em>우리 부서</em>}
              </span>
              <span className="mn-teams__sub">
                {placeOf(t.score)} · {t.participants}명 참여 · 부서 {t.members}명
              </span>
            </span>
            <span className="mn-teams__score">{fmt(t.score)}</span>
          </li>
        ))}
      </ol>

      {myTeam && (
        <div className="mn-teams__mine">
          <p>
            이번 주 내가 {myTeam.name}에 보탠 점수 <b>{fmt(teams.me.points)}</b>
          </p>
          {teams.team_top.length > 0 && (
            <p className="mn-teams__top">
              우리 부서 이번 주 선봉 ·{' '}
              {teams.team_top.map((p, i) => (
                <span key={p.user_id} className={p.is_me ? 'is-me' : ''}>
                  {i > 0 && ', '}
                  {p.name} {fmt(p.points)}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      <p className="mn-board__foot">
        부서 점수 = 이번 주 모은 점수 ÷ 부서 인원 · 하루 가장 좋은 한 판만 들어가요(쉬움 ×{teams.weights.easy} · 어려움 ×{teams.weights.hard}) ·
        선두는 주일 밤 12시에 가나안에 닿아요 · 지난주 1위는 월요일 홈에 걸려요
      </p>
    </div>
  )
}

// ── 라이브 한 판 ─────────────────────────────────────

const LivePanel = ({ live, teamOf }: { live: MannaLive | null; teamOf: (key: string | null) => { name: string; color: string } | undefined }) => {
  const now = useTickingNow(1000, !!live?.current)
  if (!live) return <p className="mn-empty">라이브 정보를 불러오는 중…</p>
  const cur = live.current
  const last = live.last
  return (
    <div className="mn-livepanel">
      {cur ? (
        <div className="mn-live mn-live--on">
          <span className="mn-live__dot" aria-hidden />
          <div className="mn-live__body">
            <strong>지금 진행 중 · {Math.max(0, Math.ceil((parseApiDate(cur.ends_at).getTime() - now) / 60000))}분 남음</strong>
            <span>
              {cur.weekday}요일 {hhmm(cur.starts_at)}~{hhmm(cur.ends_at)} · {cur.board.players}명이 마쳤어요
            </span>
          </div>
        </div>
      ) : (
        <div className="mn-live">
          <span className="material-icons-round mn-live__icon" aria-hidden>
            podcasts
          </span>
          <div className="mn-live__body">
            <strong>{live.next ? `다음 라이브 · ${live.next.weekday}요일 ${hhmm(live.next.starts_at)}` : '다음 라이브를 준비 중'}</strong>
            <span>
              {live.minutes}분 동안 교회 전체가 같은 판을 쳐요(오늘의 만나 · 보통) · 시작하면 알림으로 불러 드려요
            </span>
          </div>
        </div>
      )}

      {cur && <LiveBoard board={cur.board} teamOf={teamOf} title="실시간 순위" />}
      {!cur && last && <LiveBoard board={last.board} teamOf={teamOf} title={`오늘 ${hhmm(last.starts_at)} 라이브 결과`} />}
      {!cur && !last && (
        <p className="mn-board__foot">수요일 저녁과 주일 점심, 20분 창이 열려요. 그 안에 마친 오늘의 만나(보통) 한 판이 라이브 순위에 올라가요.</p>
      )}
    </div>
  )
}

const LiveBoard = ({ board, teamOf, title }: { board: MannaLiveBoard; teamOf: (key: string | null) => { name: string; color: string } | undefined; title: string }) => {
  const podium = board.entries.length >= 3 && board.entries.slice(0, 3).every((e, i) => e.rank === i + 1) ? board.entries.slice(0, 3) : []
  const rest = podium.length ? board.entries.slice(3) : board.entries
  return (
    <div className="mn-board">
      <div className="mn-board__modes">
        <span className="mn-livepanel__title">{title}</span>
        <span className="mn-board__count">{board.players}명</span>
      </div>
      {board.entries.length === 0 && <p className="mn-empty">아직 아무도 마치지 않았어요 — 첫 가나안을 밟아 보세요!</p>}
      {podium.length === 3 && <Podium entries={podium} />}
      {rest.length > 0 && <RankList entries={rest} teamOf={teamOf} />}
    </div>
  )
}

export default MannaBoards
