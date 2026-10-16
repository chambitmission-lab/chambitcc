import { useState, type CSSProperties } from 'react'
import type { MannaTeams } from '../../../../api/bibleTyping'
import { useChooseMannaTeam, useMannaBoard, useMannaTeams } from '../../../../hooks/useBibleTyping'
import { showToast } from '../../../../utils/toast'
import { MANNA_MODES, type MannaMode } from './mannaEngine'

type Tab = 'today' | 'teams'

const MEDALS = ['#f5b301', '#9aa6bb', '#c98a55']

/** 시작·결과 화면 아래 — 오늘의 만나 순위(난이도별) / 이번 주 부서 대항전 */
const MannaBoards = ({ mode, onModeChange }: { mode: MannaMode; onModeChange: (m: MannaMode) => void }) => {
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
      <div className="mn-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'today'} className={`mn-tab${tab === 'today' ? ' is-on' : ''}`} onClick={() => setTab('today')}>
          오늘의 만나 순위
        </button>
        <button type="button" role="tab" aria-selected={tab === 'teams'} className={`mn-tab${tab === 'teams' ? ' is-on' : ''}`} onClick={() => setTab('teams')}>
          부서 대항전
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
          {podium.length === 3 && (
            <div className="mn-podium" aria-label="1~3위">
              {[podium[1], podium[0], podium[2]].map((e) => (
                <div key={e.user_id} className={`mn-podium__col is-${e.rank}`} style={{ '--medal': MEDALS[e.rank - 1] } as CSSProperties}>
                  <span className="mn-podium__ava" aria-hidden>
                    {e.name.trim().charAt(0) || '?'}
                  </span>
                  <span className={`mn-podium__name${e.is_me ? ' is-me' : ''}`}>
                    {e.name}
                    {e.is_me ? ' (나)' : ''}
                  </span>
                  <span className="mn-podium__score">{e.score.toLocaleString('ko-KR')}</span>
                  <span className="mn-podium__base">{e.rank}</span>
                </div>
              ))}
            </div>
          )}
          {board && rest.length > 0 && (
            <ol className="mn-rank">
              {rest.map((e) => {
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
                    <span className="mn-rank__score">{e.score.toLocaleString('ko-KR')}</span>
                  </li>
                )
              })}
            </ol>
          )}
          <p className="mn-board__foot">난이도마다 오늘 가장 좋은 한 판으로 겨뤄요 · 0시에 새 판이 열려요</p>
        </div>
      )}

      {tab === 'teams' &&
        (teamsError ? <p className="mn-empty">부서 대항전을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p> : <TeamsPanel teams={teams} />)}
    </section>
  )
}

const TeamsPanel = ({ teams }: { teams: MannaTeams | undefined }) => {
  const choose = useChooseMannaTeam()
  if (!teams) return <p className="mn-empty">부서 대항전을 불러오는 중…</p>
  const myTeam = teams.team_options.find((t) => t.key === teams.me.team_key)
  const max = Math.max(1, ...teams.teams.map((t) => t.score))

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

      <ol className="mn-teams__list">
        {teams.teams.map((t) => (
          <li key={t.key} className={`mn-teams__row${t.key === teams.me.team_key ? ' is-mine' : ''}`} style={{ '--team': t.color } as CSSProperties}>
            <span className="mn-teams__rank">{t.rank}</span>
            <span className="mn-teams__body">
              <span className="mn-teams__name">
                {t.name}
                {t.key === teams.me.team_key && <em>우리 부서</em>}
              </span>
              <span className="mn-teams__bar" aria-hidden>
                <span style={{ width: `${Math.round((t.score / max) * 100)}%` }} />
              </span>
              <span className="mn-teams__sub">
                {t.participants}명 참여 · 부서 {t.members}명
              </span>
            </span>
            <span className="mn-teams__score">{t.score.toLocaleString('ko-KR')}</span>
          </li>
        ))}
      </ol>

      {myTeam && (
        <div className="mn-teams__mine">
          <p>
            이번 주 내가 {myTeam.name}에 보탠 점수 <b>{teams.me.points.toLocaleString('ko-KR')}</b>
          </p>
          {teams.team_top.length > 0 && (
            <p className="mn-teams__top">
              우리 부서 이번 주 선봉 ·{' '}
              {teams.team_top.map((p, i) => (
                <span key={p.user_id} className={p.is_me ? 'is-me' : ''}>
                  {i > 0 && ', '}
                  {p.name} {p.points.toLocaleString('ko-KR')}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      <p className="mn-board__foot">
        부서 점수 = 이번 주 모은 점수 ÷ 부서 인원 · 하루 가장 좋은 한 판만 들어가요(쉬움 ×{teams.weights.easy} · 어려움 ×{teams.weights.hard}) ·
        주일 밤 12시 마감
      </p>
    </div>
  )
}

export default MannaBoards
