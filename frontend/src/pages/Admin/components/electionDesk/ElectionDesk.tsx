// PC 선거 관리 — 중계 스코어보드(F3) + 말로 풀기.
//
// 진행 중인 회차마다 "중계 무대"를 크게 띄운다: 숫자 네 칸(투표율·투표한 사람·아직 안 한 사람·마감까지)과
// 그래프 대신 문장 카드 세 장(최근 흐름·마감 때 예상·종이 표). 아래는 모든 선거 목록과 "다음 차례".
// 보는 분이 어르신 선관위원이라 글씨·버튼을 크게, 상태는 한글로, 시각은 말로 쓴다(ElectionDesk.css 머리말).
//
// 이 화면은 lg+ 에서만 마운트된다. 모달(현황판·편집기)·삭제 확인은 ElectionManagement 가 그대로 맡고,
// 여기서는 손잡이만 넘겨받는다. 후보별 득표는 여기에 없다 — 현황판에서만 본다(무기명·득표 가림 정책).
import { useEffect, useMemo, useState } from 'react'
import { useElectionAdminAction } from '../../../../hooks/useElections'
import type { ElectionSummary } from '../../../../types/election'
import { confirmDialog } from '../../../../utils/confirmDialog'
import { toastFeedback } from '../../../../utils/toast'
import { thresholdText } from '../../../Election/electionShared'
import { liveWords, spokenTime } from './liveWords'
import type { WordCard } from './liveWords'
import './ElectionDesk.css'

interface Props {
  elections: ElectionSummary[]
  loadingEdit: number | null
  onNew: () => void
  onBoard: (id: number) => void
  onEdit: (e: ElectionSummary) => void
  onCopyLink: (e: ElectionSummary) => void
  onDelete: (e: ElectionSummary) => void
}

type Phase = 'live' | 'wait' | 'settle' | 'draft' | 'done'

const phaseOf = (e: ElectionSummary): Phase => {
  if (e.status === 'finished') return 'done'
  if (e.current_round_status === 'open') return 'live'
  if (!e.current_round_no) return 'draft'
  return (e.elected_count ?? 0) >= e.seats ? 'settle' : 'wait'
}

const CHIP: Record<Phase, { cls: string; label: (e: ElectionSummary) => string }> = {
  live: { cls: 'eld-chip--live', label: () => '투표 중' },
  wait: { cls: 'eld-chip--wait', label: (e) => `${(e.current_round_no ?? 0) + 1}차 준비` },
  settle: { cls: 'eld-chip--wait', label: () => '마무리' },
  draft: { cls: 'eld-chip--draft', label: () => '준비 중' },
  done: { cls: 'eld-chip--done', label: () => '끝남' },
}

const rowMeta = (e: ElectionSummary, phase: Phase): string => {
  const elected = `당선 ${e.elected_count ?? 0} / ${e.seats}자리`
  if (phase === 'draft') return `후보 ${e.candidate_count}명 · 선거인 ${e.voters_total}명 · 아직 투표 전`
  const round = phase === 'live' ? `${e.current_round_no}차 투표 중` : `${e.current_round_no}차까지 마감`
  return `${round} · 투표 ${e.voted_count} / ${e.voters_total}명 · ${elected}`
}

const mainAction = (phase: Phase, e: ElectionSummary): string => {
  if (phase === 'live') return '현황판 열기'
  if (phase === 'wait') return `${(e.current_round_no ?? 0) + 1}차 시작하기`
  if (phase === 'settle') return '선거 마치기'
  if (phase === 'draft') return '투표 시작하기'
  return '결과 보기'
}

/** 30초마다 다시 그린다 — "마감까지 N분"·"오후 3시 7분 현재" 가 멈춰 보이지 않게 */
const useNow = (enabled: boolean) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [enabled])
  return now
}

const Word = ({ card }: { card: WordCard }) => (
  <div className={`eld-word eld-word--${card.tone}`}>
    <span>{card.label}</span>
    <b className="num">
      {card.value}
      {card.unit ? <small>{card.unit}</small> : null}
    </b>
    <p>{card.text}</p>
  </div>
)

const LiveStage = ({
  election: e,
  now,
  onBoard,
}: {
  election: ElectionSummary
  now: number
  onBoard: (id: number) => void
}) => {
  const w = liveWords(e, now)
  const remind = useElectionAdminAction(toastFeedback({ success: '아직 투표하지 않은 분들께 알림을 보냈어요' }))

  const sendRemind = async () => {
    const ok = await confirmDialog({
      title: '미투표자에게 알림을 보낼까요?',
      message: `아직 투표하지 않은 앱 선거인에게 "${e.current_round_no}차 투표가 진행 중"이라는 알림이 가요.`,
      description: '한 번 보내면 몇 분 동안은 다시 보낼 수 없어요.',
      confirmText: '알림 보내기',
      tone: 'brand',
    })
    if (ok) remind.mutate({ kind: 'remind', id: e.id })
  }

  return (
    <section className="eld-stage" aria-label={`${e.title} 진행 상황`}>
      <div className="eld-stage-top">
        <span className="eld-chip eld-chip--live">투표 중</span>
        <h2>
          {e.title} · {e.current_round_no}차 투표
        </h2>
        <span className="eld-now">{spokenTime(new Date(now))} 현재</span>
      </div>

      <div className="eld-cells">
        <div className="eld-cell">
          <span>투표율</span>
          <b className="num">
            {w.percent}
            <small>%</small>
          </b>
        </div>
        <div className="eld-cell">
          <span>투표한 사람</span>
          <b className="num">
            {w.voted}
            <small>명</small>
          </b>
          <em>선거인 {w.total}명 중</em>
        </div>
        <div className="eld-cell">
          <span>아직 안 한 사람</span>
          <b className="num">
            {w.waiting}
            <small>명</small>
          </b>
        </div>
        {w.minutesLeft == null ? (
          <div className="eld-cell eld-cell--word">
            <span>마감</span>
            <b>직접 마감</b>
            <em>예약 마감을 정하지 않았어요</em>
          </div>
        ) : (
          <div className="eld-cell eld-cell--hi">
            <span>마감까지</span>
            <b className="num">
              {w.minutesLeft <= 0 ? (
                '곧'
              ) : w.minutesLeft < 60 ? (
                <>
                  {w.minutesLeft}
                  <small>분</small>
                </>
              ) : (
                <>
                  {Math.floor(w.minutesLeft / 60)}
                  <small>시간</small>
                  {w.minutesLeft % 60 ? (
                    <>
                      {' '}
                      {w.minutesLeft % 60}
                      <small>분</small>
                    </>
                  ) : null}
                </>
              )}
            </b>
            <em>{spokenTime(e.round_closes_at!)}에 자동 마감</em>
          </div>
        )}
      </div>

      <div className="eld-words">
        {w.cards.map((card) => (
          <Word key={card.label} card={card} />
        ))}
      </div>

      <div className="eld-foot">
        {w.quorum > 0 ? (
          <span className={`eld-quorum ${w.quorumMet ? 'eld-quorum--ok' : 'eld-quorum--short'}`}>
            {w.quorumMet
              ? `✓ 성원 ${w.quorum}명을 넘었습니다`
              : `성원까지 ${w.quorum - w.voted}명 더 투표해야 합니다 (${w.quorum}명)`}
          </span>
        ) : null}
        <span className="eld-foot-note">후보별 득표는 현황판에서만 볼 수 있어요</span>
        <div className="eld-foot-acts">
          <button type="button" className="eld-btn eld-btn--onstage" onClick={() => onBoard(e.id)}>
            현황판 열기 →
          </button>
          <button
            type="button"
            className="eld-btn eld-btn--onstage-ghost"
            onClick={() => void sendRemind()}
            disabled={remind.isPending || w.waiting === 0}
          >
            {remind.isPending ? '보내는 중…' : '미투표자 알림'}
          </button>
        </div>
      </div>
    </section>
  )
}

const ElectionDesk = ({ elections, loadingEdit, onNew, onBoard, onEdit, onCopyLink, onDelete }: Props) => {
  const live = useMemo(() => elections.filter((e) => phaseOf(e) === 'live'), [elections])
  const next = useMemo(
    () => elections.filter((e) => ['wait', 'settle', 'draft'].includes(phaseOf(e))),
    [elections],
  )
  const now = useNow(live.length > 0)

  const summary = live.length
    ? `지금 투표가 진행 중인 선거 ${live.length}건`
    : next.length
      ? `진행 중인 투표는 없어요 · 다음 차례 ${next.length}건`
      : '진행 중인 투표가 없어요'

  return (
    <div className="eld">
      <header className="eld-head">
        <div>
          <h1>선거 관리</h1>
          <p>{summary}</p>
        </div>
        <button type="button" className="eld-btn" onClick={onNew}>
          + 새 선거 만들기
        </button>
      </header>

      {live.map((e) => (
        <LiveStage key={e.id} election={e} now={now} onBoard={onBoard} />
      ))}

      <div className="eld-cols">
        <section className="eld-card" aria-label="모든 선거">
          <h2 className="eld-card-h">모든 선거</h2>
          {elections.length ? (
            elections.map((e) => {
              const phase = phaseOf(e)
              const chip = CHIP[phase]
              return (
                <div key={e.id} className="eld-row">
                  <div className="min-w-0">
                    <div className="eld-row-top">
                      <span className={`eld-chip ${chip.cls}`}>{chip.label(e)}</span>
                      <span className="eld-row-title">{e.title}</span>
                    </div>
                    <div className="eld-row-meta">{rowMeta(e, phase)}</div>
                    <div className="eld-row-meta">
                      {e.seats}명 선출 · 당선 기준 {thresholdText(e.rules)}
                    </div>
                  </div>
                  <div className="eld-row-acts">
                    <button
                      type="button"
                      className={`eld-btn eld-btn--sm ${phase === 'done' ? 'eld-btn--ghost' : ''}`}
                      onClick={() => onBoard(e.id)}
                    >
                      {mainAction(phase, e)}
                    </button>
                    <button
                      type="button"
                      className="eld-link"
                      onClick={() => onEdit(e)}
                      disabled={loadingEdit === e.id}
                    >
                      {loadingEdit === e.id ? '여는 중…' : '수정'}
                    </button>
                    <button type="button" className="eld-link" onClick={() => onCopyLink(e)}>
                      링크 복사
                    </button>
                    <button type="button" className="eld-link eld-link--danger" onClick={() => onDelete(e)}>
                      삭제
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="eld-empty">
              <b>등록된 선거가 없습니다</b>
              <p>후보와 선거인 명부만 있으면 바로 시작할 수 있어요</p>
              <button type="button" className="eld-btn" onClick={onNew}>
                + 새 선거 만들기
              </button>
            </div>
          )}
        </section>

        <aside className="eld-card" aria-label="다음 차례">
          <h2 className="eld-card-h">다음 차례</h2>
          {next.length ? (
            next.map((e) => {
              const phase = phaseOf(e)
              const left = Math.max(0, e.seats - (e.elected_count ?? 0))
              const copy =
                phase === 'wait'
                  ? {
                      label: `${(e.current_round_no ?? 0) + 1}차 투표를 시작해 주세요`,
                      text: `${e.current_round_no}차에서 ${e.elected_count ?? 0}명 당선, ${left}자리가 남았습니다.`,
                    }
                  : phase === 'settle'
                    ? { label: '선거를 마쳐 주세요', text: '당선자가 모두 정해졌어요. 현황판에서 선거 종료와 발표를 해 주세요.' }
                    : {
                        label: '준비 중',
                        text: `후보 ${e.candidate_count}명 · 선거인 ${e.voters_total}명. 준비가 끝났으면 현황판에서 1차 투표를 시작하세요.`,
                      }
              return (
                <div key={e.id} className="eld-next">
                  <span className={`eld-next-label ${phase === 'draft' ? 'eld-next-label--draft' : ''}`}>
                    {copy.label}
                  </span>
                  <b>{e.title}</b>
                  <p>{copy.text}</p>
                  <button
                    type="button"
                    className={`eld-btn eld-btn--sm ${phase === 'draft' ? 'eld-btn--ghost' : ''}`}
                    onClick={() => onBoard(e.id)}
                  >
                    {mainAction(phase, e)} →
                  </button>
                </div>
              )
            })
          ) : (
            <div className="eld-next">
              <p>지금 손을 써야 할 선거가 없어요.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default ElectionDesk
