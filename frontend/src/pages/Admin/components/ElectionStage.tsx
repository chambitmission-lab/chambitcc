// 선거 발표 화면(프로젝터) — 관리자 현황판(ElectionBoard)의 '발표 화면' 을 켜면 이 화면이 뜬다.
//
// 현황판은 일하는 화면이고, 여기는 **회중이 같이 보는 화면**이다. 그래서 도구가 하나도 없다 —
// 손에 쥐고 있어야 하는 '득표 가리기'·'발표 화면' 두 개만 오른쪽 위에 남고, 나머지는
// 큰 숫자와 여백이다. 좌우 여백(프로젝터에서 원래 버려지는 자리)에는 삽화와 손글씨를 둔다.
//
// 데이터·집계는 현황판이 이미 갖고 있는 것을 그대로 받는다(SSE + 폴링은 hooks/useElections.ts).
// 막대 길이·기준선 계산은 성도 화면의 TallyBars(pages/Election/electionUi.tsx)와 **같은 식**이다 —
// 분모가 당선 기준의 분모(result.base)라, 기준선(required/base)을 넘는 순간이 곧 기준 통과다.
// 한쪽만 고치면 같은 표가 두 화면에서 다르게 보인다.
import { useEffect, useMemo, useState } from 'react'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import { useThemeArt } from '../../../hooks/useThemeArt'
import { ELECTION_STAGE_LEFT, ELECTION_STAGE_RIGHT } from '../../../utils/themeAssets'
import { thresholdText, turnoutPercent } from '../../Election/electionShared'
import { CandidateAvatar } from '../../Election/electionUi'
import type { ElectionAdminDetail, ElectionRound } from '../../../types/election'
import './ElectionStage.css'

// 여백의 손글씨 — 이 모듈이 로드될 때 한 번만 붙는다(deferredFonts.ts)
ensureFontFamily('nanumPen')

// ── 선화 아이콘 ────────────────────────────────────────────────────────

const ChurchMark = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 2.4v4.2" />
    <path d="M10.1 4.3h3.8" />
    <path d="M12 6.6 5.4 11.3V21h13.2v-9.7z" />
    <path d="M9.7 21v-4.1a2.3 2.3 0 0 1 4.6 0V21" />
  </svg>
)

const BallotMark = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 11.5h16V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    <path d="M8.5 11.5V5A1.5 1.5 0 0 1 10 3.5h4A1.5 1.5 0 0 1 15.5 5v6.5" />
    <polyline points="10.3 7.6 11.6 8.9 13.9 6.4" />
  </svg>
)

const ChartMark = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
    <path d="M5.5 20V12.5" />
    <path d="M12 20V4.5" />
    <path d="M18.5 20v-5" />
  </svg>
)

const VeilMark = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 12s3.4-5.6 9-5.6 9 5.6 9 5.6-3.4 5.6-9 5.6S3 12 3 12z" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M4 20 20 4" />
  </svg>
)

/** 형광펜 자국 — 손글씨 아래를 한 번 긋는다 */
const Swash = () => (
  <svg className="els-swash" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden>
    <path d="M3 7.2C42 2.6 96 1.8 197 4.4" fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
  </svg>
)

/** 손글씨 옆의 작은 빗금 — 노트에 그어 둔 강조 표시 */
const Sparks = () => (
  <svg className="els-sparks" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <path d="M4 14 1.5 19" />
    <path d="M11 16.5 10.2 22" />
    <path d="M18 14.5 20.3 19.5" />
  </svg>
)

// ── 발표 화면 ──────────────────────────────────────────────────────────

interface Props {
  election: ElectionAdminDetail
  /** 지금 보고 있는 회차 — 현황판이 고른 것을 그대로 받는다 */
  round: ElectionRound | null
  hideTally: boolean
  onToggleHideTally: () => void
  /** '발표 화면' 을 끈다 (전체 화면 해제까지 현황판이 처리) */
  onExit: () => void
  onPickRound: (roundNo: number) => void
}

const ElectionStage = ({ election, round, hideTally, onToggleHideTally, onExit, onPickRound }: Props) => {
  // 좌우 둘 다 도착해야 켠다 — 한쪽만 먼저 뜨면 화면이 한쪽으로 기울어 보인다
  const leftReady = useThemeArt(ELECTION_STAGE_LEFT)
  const rightReady = useThemeArt(ELECTION_STAGE_RIGHT)
  const artReady = leftReady && rightReady

  const isOpen = round?.status === 'open'
  const turnout = round ? turnoutPercent(round.voted_count, round.voters_total) : 0
  const waiting = round ? Math.max(0, round.voters_total - round.voted_count) : 0
  const result = round?.result ?? null
  const veiled = hideTally && round?.status === 'open'

  // 방금 들어온 표 — 숫자만 조용히 바뀌면 프로젝터 앞에서는 아무도 못 본다.
  // 득표 문자열이 바뀐 회차에만 +n 칩을 잠깐 띄운다(첫 렌더는 건너뛴다).
  // 키에 회차 id 를 같이 묶는다 — 회차 탭을 옮겼을 뿐인데 +n 이 뜨면 거짓말이 된다
  const votesKey = useMemo(
    () => (result && round ? `${round.id}#${result.tallies.map((t) => `${t.candidate_id}:${t.votes}`).join(',')}` : ''),
    [result, round]
  )
  const [bumpState, setBumpState] = useState<{ key: string; bumps: Record<number, number> }>({ key: '', bumps: {} })

  // 렌더 중 상태 조정 — 득표가 바뀐 그 렌더에서 바로 계산한다(effect 를 한 바퀴 더 돌 이유가 없다).
  // 직전 득표는 따로 들고 있지 않고 **이전 키를 되읽는다** — 상태가 하나면 어긋날 일도 없다.
  if (bumpState.key !== votesKey) {
    const [wasRound, wasList] = bumpState.key.split('#')
    const [nowRound, nowList] = votesKey.split('#')
    const gained: Record<number, number> = {}
    if (wasRound && wasRound === nowRound) {
      const before = new Map<number, number>()
      for (const part of wasList.split(',')) {
        const [id, votes] = part.split(':').map(Number)
        before.set(id, votes)
      }
      for (const part of nowList.split(',')) {
        const [id, votes] = part.split(':').map(Number)
        const was = before.get(id)
        if (was != null && votes > was) gained[id] = votes - was
      }
    }
    setBumpState({ key: votesKey, bumps: gained })
  }

  const bumps = bumpState.bumps
  useEffect(() => {
    if (!Object.keys(bumps).length) return
    const timer = window.setTimeout(() => setBumpState((s) => ({ ...s, bumps: {} })), 2600)
    return () => window.clearTimeout(timer)
  }, [bumps])

  // 후보가 많으면 한 화면에 안 들어온다 — 아바타만 줄여 행 높이를 낮춘다
  const rowCount = result?.tallies.length ?? 0
  const avatarSize = rowCount <= 4 ? 60 : rowCount <= 6 ? 50 : rowCount <= 9 ? 42 : 34

  const base = result ? Math.max(result.base, 1) : 1
  const linePercent = result && result.base > 0 ? Math.min(100, (result.required / base) * 100) : null

  return (
    <div className={`els-stage${artReady ? ' is-art-ready' : ''}`}>
      {/* ── 상단 띠 ── */}
      <div className="els-top">
        <span className="els-brand">
          <ChurchMark />
          <span className="els-brand-name">참빛교회</span>
        </span>
        {isOpen ? (
          <span className="els-live">
            <span className="els-live-dot" />
            LIVE
          </span>
        ) : null}

        <div className="els-actions">
          <button type="button" onClick={onToggleHideTally} className={`els-pill${hideTally ? ' is-on' : ''}`}>
            득표 가리기
          </button>
          <button type="button" onClick={onExit} className="els-pill is-on">
            발표 화면 끄기
          </button>
        </div>
      </div>

      {/* ── 본문 3단 ── */}
      <div className="els-body">
        {/* 왼쪽 여백 — 제목과 손글씨 */}
        <div className="els-side els-side--left">
          <span className="els-eyebrow">
            {!round
              ? '투표 준비 중'
              : round.status === 'open'
                ? `${round.round_no}차 투표 중`
                : `${round.round_no}차 개표 결과`}
          </span>
          <h1 className="els-title">{election.title}</h1>
          <div className="els-sub">
            <p className="els-hand">{'함께 선택하고,\n함께 세워가는 우리 공동체 ♡'}</p>
            <Swash />
          </div>

          {election.rounds.length > 1 ? (
            <div className="els-rounds">
              {election.rounds.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onPickRound(r.round_no)}
                  className={`els-round${round?.id === r.id ? ' is-on' : ''}`}
                >
                  {r.round_no}차
                </button>
              ))}
            </div>
          ) : null}

          <div className="els-note">
            <Sparks />
            <p className="els-hand">{'한 표가\n우리 교회를\n더 빛나게 해요!'}</p>
          </div>
        </div>

        {/* 가운데 — 카드 */}
        <div className="els-center">
          {!round ? (
            <div className="els-card">
              <div className="els-blank">
                <span className="els-blank-icon">
                  <BallotMark size={40} />
                </span>
                <p className="els-blank-title">아직 투표를 시작하지 않았어요</p>
                <p className="els-blank-sub">
                  후보 {election.candidate_count}명 · 선거인 {election.voter_count + election.offline_voter_count}명 ·{' '}
                  {thresholdText(election.rules)}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 투표율 */}
              <section className="els-card els-card--turnout">
                <div className="els-card-head">
                  <span className="els-badge">
                    <BallotMark />
                  </span>
                  <div>
                    <div className="els-card-title">투표 현황</div>
                    <div className="els-card-sub">
                      {round.round_no}차 · {round.seats_open}명 선출 · 한 표에 {round.max_select}명까지
                    </div>
                  </div>
                  <span className={`els-card-aside${isOpen ? ' is-live' : ''}`}>
                    {isOpen ? '지금도 표가 들어오고 있어요' : '투표 마감'}
                  </span>
                </div>

                <div className="els-turnout-row">
                  <span className="els-turnout-num">{round.voted_count}</span>
                  <span className="els-turnout-den">/ {round.voters_total}명</span>
                  <span className="els-turnout-say">
                    {waiting === 0 ? '모두 투표했어요!' : isOpen ? `${waiting}명 남았어요` : `미투표 ${waiting}명`}
                  </span>
                </div>

                <div className="els-progress-row">
                  <div className="els-progress">
                    <div className="els-progress-fill" style={{ width: `${turnout}%` }} />
                  </div>
                  <span className="els-progress-pct">{turnout}%</span>
                </div>
              </section>

              {/* 득표 */}
              <section className="els-card els-card--tally">
                <div className="els-card-head">
                  <span className="els-badge">
                    <ChartMark />
                  </span>
                  <div>
                    <div className="els-card-title">{round.status === 'closed' ? '개표 결과' : '실시간 득표'}</div>
                    <div className="els-card-sub">당선 기준 · {thresholdText(round.rules)}</div>
                  </div>
                  {isOpen && !veiled ? <span className="els-card-aside is-live">실시간 업데이트</span> : null}
                </div>

                {veiled ? (
                  <div className="els-blank">
                    <span className="els-blank-icon">
                      <VeilMark />
                    </span>
                    <p className="els-blank-title">투표가 끝나면 함께 확인해요</p>
                    <p className="els-blank-sub">지금은 투표율만 보여 드려요 — 표가 한쪽으로 쏠리지 않도록요</p>
                  </div>
                ) : result ? (
                  <>
                    <div className="els-rows">
                      {result.tallies.map((row) => {
                        const cand = election.candidates.find((c) => c.id === row.candidate_id)
                        if (!cand) return null
                        const percent = Math.min(100, (row.votes / base) * 100)
                        // 색이 곧 위계다 — 당선(진한 브랜드) > 기준 통과(옅은 브랜드) > 아직(회색).
                        // 회색은 TallyBars 보다 한 단계 진하다: 프로젝터에서 옅은 회색은 아예 안 보인다.
                        const tone = row.elected
                          ? 'var(--brand)'
                          : row.passed
                            ? 'color-mix(in srgb, var(--brand) 60%, transparent)'
                            : 'color-mix(in srgb, var(--text-muted) 52%, transparent)'
                        const bump = bumps[row.candidate_id]
                        return (
                          <div key={row.candidate_id} className={`els-row${row.elected ? ' is-elected' : ''}`}>
                            <span className="els-rank">{cand.number}</span>
                            <CandidateAvatar candidate={cand} size={avatarSize} showNumber={false} />
                            <div className="els-row-main">
                              <div className="els-row-head">
                                <span className="els-name">{cand.name}</span>
                                {row.elected ? (
                                  <span className="els-tag els-tag--elected">
                                    {result.is_final ? '당선' : '기준 통과'}
                                  </span>
                                ) : row.tied ? (
                                  <span className="els-tag els-tag--tied">동률</span>
                                ) : null}
                                {bump ? <span className="els-bump">+{bump}</span> : null}
                                <span className="els-votes">
                                  {row.votes}
                                  <span className="els-votes-unit">표</span>
                                </span>
                              </div>
                              <div className="els-bar">
                                <div className="els-bar-fill" style={{ width: `${percent}%`, ['--bar-tone' as string]: tone }} />
                                {linePercent !== null ? (
                                  <span className="els-bar-line" style={{ left: `${linePercent}%` }} aria-hidden />
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="els-foot">
                      <p className="els-foot-note">
                        {result.base > 0
                          ? `주황색 선을 넘으면 당선 기준 통과예요${
                              result.is_final ? '' : ' — 표가 들어오면 기준선도 함께 움직여요'
                            }`
                          : '아직 표가 없어요 — 첫 표가 들어오면 당선 기준선이 나타나요'}
                      </p>
                      {result.base > 0 ? <span className="els-foot-chip">▲ 당선 기준 {result.required}표</span> : null}
                    </div>
                  </>
                ) : null}
              </section>
            </>
          )}
        </div>

        {/* 오른쪽 여백 — 손글씨만 */}
        <div className="els-side els-side--right">
          <div className="els-note">
            <Sparks />
            <p className="els-hand">{'함께하는\n우리가\n더 좋은 교회 ♡'}</p>
          </div>
          <p className="els-hand">{'오늘도\n감사합니다'}</p>
        </div>
      </div>
    </div>
  )
}

export default ElectionStage
