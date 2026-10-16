// 말씀 리그 탭 — 부서 대항 막대 + 60초 스피드 라운드 + 주간 순위·미션.
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { useChooseTeam, useFinishRound, useLeague, useStartRound } from '../../../hooks/useBibleLeague'
import { useSfx } from '../../../hooks/useSfx'
import type { LeagueOverview, LeagueRoundResult, LeagueRoundStart, LeagueTeamOption } from '../../../types/bibleLeague'
import BmIcon from '../components/BluemarbleIcons'
import SpeedRound from './SpeedRound'
import RoundResult from './RoundResult'

const WEEK_ORD = ['첫째', '둘째', '셋째', '넷째', '다섯째']

const weekLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getMonth() + 1}월 ${WEEK_ORD[Math.floor((d.getDate() - 1) / 7)] ?? ''} 주`
}

const leftLabel = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return '곧 마감'
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  return d > 0 ? `${d}일 ${h}시간` : `${h}시간 ${Math.floor((ms % 3_600_000) / 60_000)}분`
}

export default function LeagueView() {
  const league = useLeague()
  const choose = useChooseTeam()
  const start = useStartRound()
  const finish = useFinishRound()
  const sfx = useSfx()
  const [round, setRound] = useState<LeagueRoundStart | null>(null)
  const [result, setResult] = useState<LeagueRoundResult | null>(null)
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const data = league.data
  if (league.isLoading || !data) {
    return <div className="ql-loading">{league.isError ? '말씀 리그를 불러오지 못했어요.' : '리그를 준비하고 있어요…'}</div>
  }

  const teamOf = (key: string | null | undefined) => data.team_options.find((t) => t.key === key)

  const onStart = async () => {
    setError(null)
    sfx.play('click')
    try {
      setRound(await start.mutateAsync())
      setResult(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '라운드를 시작하지 못했어요.')
    }
  }

  const onEnd = async (roundId: number) => {
    try {
      const r = await finish.mutateAsync(roundId)
      setResult(r)
      sfx.play('fanfare')
      if (r.rank_after != null && (r.rank_before == null || r.rank_after < r.rank_before)) {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.4 }, colors: ['#3182f6', '#4593fc', '#ffe08a', '#ffffff'] })
      }
    } finally {
      setRound(null)
    }
  }

  if (round) return <SpeedRound round={round} onEnd={onEnd} />
  if (result)
    return (
      <RoundResult
        result={result}
        team={teamOf(result.team_key)}
        triesLeft={data.me.rounds_limit - data.me.rounds_today}
        onHome={() => setResult(null)}
        onAgain={onStart}
      />
    )

  const needsTeam = !data.me.team_key || picking

  return (
    <div className="ql-home">
      {needsTeam ? (
        <TeamPicker
          options={data.team_options}
          current={data.me.team_key}
          canChange={data.me.can_change_team}
          busy={choose.isPending}
          onPick={async (k) => {
            setError(null)
            try {
              await choose.mutateAsync(k)
              setPicking(false)
            } catch (e) {
              setError(e instanceof Error ? e.message : '팀을 정하지 못했어요.')
            }
          }}
          onCancel={data.me.team_key ? () => setPicking(false) : undefined}
        />
      ) : (
        <RaceHero data={data} onChangeTeam={data.me.can_change_team ? () => setPicking(true) : undefined} />
      )}
      {error && <p className="ql-error">{error}</p>}

      {!needsTeam && (
        <div className="ql-grid">
          <section className="ql-card ql-play-card">
            <div className="ql-bolt">
              <BmIcon name="bolt" size={30} strokeWidth={2} />
            </div>
            <h2>60초 스피드 라운드</h2>
            <p>빠르게 맞힐수록 콤보가 쌓여요. 연속 4개부터 점수 2배!</p>
            <button
              type="button"
              className="ql-cta"
              onClick={onStart}
              disabled={start.isPending || data.me.rounds_today >= data.me.rounds_limit}
            >
              {data.me.rounds_today >= data.me.rounds_limit ? '오늘 도전 끝 · 내일 다시' : start.isPending ? '준비 중…' : '라운드 시작'}
            </button>
            <p className="ql-tries">
              오늘 남은 도전 <b>{Math.max(0, data.me.rounds_limit - data.me.rounds_today)}</b>/{data.me.rounds_limit}
              {data.me.best_today > 0 && ` · 오늘 최고 ${data.me.best_today.toLocaleString()}점`}
            </p>
          </section>

          <section className="ql-card">
            <div className="ql-card-head">
              <p className="ql-card-title">
                <BmIcon name="trophy" size={17} /> 이번 주 순위
              </p>
              <span className="ql-zone">상위 3명 이번 주 메달</span>
            </div>
            {data.ladder.length === 0 ? (
              <p className="ql-empty">이번 주 첫 점수의 주인공이 되어 보세요!</p>
            ) : (
              <ol className="ql-ladder">
                {data.ladder.map((p) => {
                  const team = teamOf(p.team_key)
                  return (
                    <li key={p.user_id} className={`${p.is_me ? 'is-me' : ''} ${p.rank <= 3 ? 'is-promo' : ''}`}>
                      <span className="ql-ladder-rank">{p.rank}</span>
                      <span className="ql-ladder-avatar" style={{ background: team?.color ?? '#94a3b8' }}>
                        {p.name.slice(0, 1)}
                      </span>
                      <span className="ql-ladder-name">
                        {p.is_me ? '나' : p.name}
                        <small>{team?.name ?? '팀 없음'}</small>
                      </span>
                      <span className="ql-ladder-xp">{p.score.toLocaleString()}</span>
                    </li>
                  )
                })}
              </ol>
            )}
            {data.me.rank == null && data.ladder.length > 0 && <p className="ql-ladder-foot">한 라운드만 풀어도 순위에 올라요</p>}
          </section>

          <section className="ql-card">
            <p className="ql-card-title">
              <BmIcon name="sparkle" size={17} /> 이번 주 미션
            </p>
            {data.missions.map((m) => (
              <div key={m.key} className={`ql-mission ${m.done ? 'is-done' : ''}`}>
                <div className="ql-mission-row">
                  <span>
                    {m.done && <BmIcon name="star" size={14} />} {m.title}
                  </span>
                  <b>
                    {m.progress}/{m.goal}
                  </b>
                </div>
                <span className="ql-mission-bar">
                  <span style={{ width: `${(m.progress / m.goal) * 100}%` }} />
                </span>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}

function RaceHero({ data, onChangeTeam }: { data: LeagueOverview; onChangeTeam?: () => void }) {
  const [grow, setGrow] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setGrow(true))
    return () => cancelAnimationFrame(t)
  }, [])
  const max = Math.max(1, ...data.teams.map((t) => t.score))
  const mine = data.teams.find((t) => t.key === data.me.team_key)
  const leader = data.teams[0]
  const runner = data.teams[1]

  let foot = '이번 주 첫 점수를 우리 부서에 보태 보세요'
  if (mine && leader && leader.score > 0) {
    if (mine.key === leader.key) {
      const gap = leader.score - (runner?.score ?? 0)
      foot = gap > 0 ? `${mine.name}가 ${runner?.name ?? ''}보다 ${gap.toLocaleString()}점 앞서고 있어요` : `${mine.name}가 공동 1위예요`
    } else {
      foot = `1위 ${leader.name}까지 ${(leader.score - mine.score).toLocaleString()}점 남았어요`
    }
  }

  return (
    <section className="ql-hero">
      <div className="ql-hero-top">
        <div>
          <p className="ql-kicker">{weekLabel(data.week_start)} · 부서 대항전</p>
          <h1>말씀 리그</h1>
        </div>
        <div className="ql-countdown">
          <BmIcon name="timer" size={15} />
          <span>
            주일 밤 12시 마감 <b>{leftLabel(data.week_ends_at)}</b>
          </span>
        </div>
      </div>
      <ol className="ql-race">
        {data.teams.map((t, i) => (
          <li key={t.key} className={t.key === data.me.team_key ? 'is-mine' : ''}>
            <span className="ql-race-rank">{t.rank}</span>
            <span className="ql-race-name">
              {t.name}
              {t.key === data.me.team_key && <em>우리 부서</em>}
            </span>
            <span className="ql-race-track">
              <span
                className="ql-race-fill"
                style={{ width: grow ? `${Math.max(3, (t.score / max) * 100)}%` : '3%', background: t.color, transitionDelay: `${i * 80}ms` }}
              />
            </span>
            <span className="ql-race-score">{t.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>
      <p className="ql-hero-foot">
        {foot} · 부서 점수는 1인당 평균이라 인원이 적은 부서도 공평해요
        {onChangeTeam && (
          <button type="button" className="ql-link" onClick={onChangeTeam}>
            팀 바꾸기
          </button>
        )}
      </p>
    </section>
  )
}

function TeamPicker({
  options,
  current,
  canChange,
  busy,
  onPick,
  onCancel,
}: {
  options: LeagueTeamOption[]
  current: string | null
  canChange: boolean
  busy: boolean
  onPick: (key: string) => void
  onCancel?: () => void
}) {
  return (
    <section className="ql-hero ql-picker">
      <p className="ql-kicker">말씀 리그 · 부서 대항전</p>
      <h1>어느 부서와 함께할까요?</h1>
      <p className="ql-picker-sub">내가 푼 점수가 우리 부서 점수가 돼요. 팀은 한 주에 한 번 바꿀 수 있어요.</p>
      <div className="ql-team-grid">
        {options.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`ql-team ${t.key === current ? 'is-current' : ''}`}
            style={{ ['--team' as string]: t.color }}
            disabled={busy || (!canChange && t.key !== current)}
            onClick={() => onPick(t.key)}
          >
            <span className="ql-team-dot" />
            {t.name}
          </button>
        ))}
      </div>
      {!canChange && <p className="ql-picker-sub">이번 주에는 이미 팀을 바꿨어요. 다음 주 월요일에 바꿀 수 있어요.</p>}
      {onCancel && (
        <button type="button" className="ql-link" onClick={onCancel}>
          그대로 두기
        </button>
      )}
    </section>
  )
}
