// 선거 상세 — 후보를 고르고(회차당 최대 max_select 명) 투표한다.
//
// 무기명이라 제출하면 고칠 수 없다(서버도 어느 표가 내 표인지 모른다) → 제출 전에 한 번 더 확인한다.
// 득표는 공개 범위(rules.result_visibility) 안에서만 서버가 내려준다 — round.result 가 없으면
// 투표율만 보여 준다.
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCastVote, useElection } from '../../hooks/useElections'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast } from '../../utils/toast'
import type { ElectionCandidate, ElectionDetail as ElectionDetailData, ElectionRound } from '../../types/election'
import { CenterNote, CheckIcon, SectionTitle, Spinner, SurveyShell } from '../Survey/surveyUi'
import { cardCls, phaseLabel, thresholdText } from './electionShared'
import { CandidateAvatar, TallyBars, TurnoutBar } from './electionUi'

/** 투표용 후보 카드 — 사진이 주인공, 고르면 브랜드 링 + 체크 */
const CandidateBallotCard = ({
  candidate,
  selected,
  disabled,
  onToggle,
}: {
  candidate: ElectionCandidate
  selected: boolean
  disabled: boolean
  onToggle: () => void
}) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    aria-pressed={selected}
    className={`relative text-left rounded-2xl overflow-hidden bg-white dark:bg-card-dark border transition-[box-shadow,border-color,opacity] ${
      selected
        ? 'border-brand ring-2 ring-brand'
        : 'border-gray-200/70 dark:border-white/[0.06] disabled:opacity-45'
    }`}
  >
    <div className="relative aspect-[4/5] bg-gray-100 dark:bg-white/[0.04]">
      {candidate.photo_url ? (
        <img src={candidate.photo_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[44px] font-extrabold text-brand bg-[var(--brand-soft)]">
          {candidate.name.charAt(0)}
        </span>
      )}
      <span className="absolute top-2 left-2 min-w-[1.75rem] h-7 px-2 rounded-full bg-black/65 text-white text-[12.5px] font-extrabold flex items-center justify-center tabular-nums">
        {candidate.number}
      </span>
      {selected ? (
        <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow-md">
          <CheckIcon size={15} />
        </span>
      ) : null}
    </div>
    <div className="px-3 py-2.5">
      <p className="text-[15px] font-bold text-ink-strong truncate">{candidate.name}</p>
      {candidate.bio ? (
        <p className="mt-0.5 text-[12px] text-ink-muted leading-snug line-clamp-2 break-keep">{candidate.bio}</p>
      ) : null}
    </div>
  </button>
)

/** 마감된(또는 실시간 공개인) 회차 한 장 */
const RoundResultCard = ({ round, candidates }: { round: ElectionRound; candidates: ElectionCandidate[] }) => (
  <section className={`${cardCls} p-4`}>
    <div className="flex items-baseline justify-between gap-2 mb-3">
      <h3 className="text-[14.5px] font-extrabold text-ink-strong">
        {round.round_no}차 {round.status === 'closed' ? '결과' : '현황'}
      </h3>
      <span className="text-[11.5px] text-ink-muted tabular-nums">
        투표 {round.voted_count} / {round.voters_total}명 · {thresholdText(round.rules)}
      </span>
    </div>
    {round.result ? (
      <TallyBars result={round.result} candidates={candidates} />
    ) : (
      <TurnoutBar voted={round.voted_count} total={round.voters_total} />
    )}
  </section>
)

const ElectedStrip = ({ election }: { election: ElectionDetailData }) => {
  const elected = election.candidates.filter((c) => c.elected_round_no != null)
  if (!elected.length) return null
  return (
    <section className={`${cardCls} p-4`}>
      <h3 className="text-[14.5px] font-extrabold text-ink-strong mb-3">
        당선 <span className="text-brand tabular-nums">{elected.length}</span>
        <span className="text-ink-muted font-semibold"> / {election.seats}명</span>
      </h3>
      <div className="flex flex-wrap gap-3">
        {elected.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <CandidateAvatar candidate={c} size={44} />
            <div>
              <p className="text-[14px] font-bold text-ink-strong leading-tight">{c.name}</p>
              <p className="text-[11.5px] text-ink-muted">{c.elected_round_no}차 당선</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const ElectionDetail = () => {
  const navigate = useNavigate()
  const id = Number(useParams().id) || 0
  const { data: election, isLoading, error } = useElection(id)
  const [selected, setSelected] = useState<number[]>([])

  const round = election?.rounds.length ? election.rounds[election.rounds.length - 1] : null
  const openRound = round?.status === 'open' ? round : null

  // 회차가 바뀌면(1차 → 2차) 앞 회차에서 고르던 선택을 비운다 — 렌더 중 상태 조정(effect 불필요)
  const [selectedFor, setSelectedFor] = useState(openRound?.id)
  if (selectedFor !== openRound?.id) {
    setSelectedFor(openRound?.id)
    setSelected([])
  }

  const ballotCandidates = useMemo(() => {
    if (!election || !openRound) return []
    const ids = new Set(openRound.candidate_ids)
    return election.candidates.filter((c) => ids.has(c.id))
  }, [election, openRound])

  const vote = useCastVote({
    onSuccess: () => {
      setSelected([])
      showToast('투표를 마쳤어요. 참여해 주셔서 감사합니다', 'success')
    },
    onError: (e) => showToast(e.message, 'error'),
  })

  const back = () => navigate('/elections')

  if (isLoading) {
    return (
      <SurveyShell onBack={back} title="선거">
        <Spinner />
      </SurveyShell>
    )
  }
  if (!election) {
    return (
      <SurveyShell onBack={back} title="선거">
        <CenterNote
          title="이 선거에 참여할 수 없어요"
          hint={error instanceof Error ? error.message : '선거인 명부에 있는 성도만 볼 수 있어요.'}
          actionLabel="돌아가기"
          onAction={back}
        />
      </SurveyShell>
    )
  }

  const max = openRound?.max_select ?? 0
  const toggle = (cid: number) =>
    setSelected((prev) => {
      if (prev.includes(cid)) return prev.filter((x) => x !== cid)
      if (max === 1) return [cid] // 한 명만 고르는 회차는 누르는 대로 바꿔 준다
      return prev.length >= max ? prev : [...prev, cid]
    })

  const submit = async () => {
    if (!openRound || !selected.length) return
    const names = ballotCandidates
      .filter((c) => selected.includes(c.id))
      .map((c) => `${c.number}번 ${c.name}`)
      .join(', ')
    const ok = await confirmDialog({
      title: '이대로 투표할까요?',
      message: names,
      description:
        selected.length < max
          ? `${max}명까지 고를 수 있는데 ${selected.length}명만 골랐어요. 무기명 투표라 제출하면 고칠 수 없어요.`
          : '무기명 투표라 제출하면 고칠 수 없어요.',
      confirmText: '투표하기',
      tone: 'brand',
    })
    if (ok) vote.mutate({ id: election.id, candidateIds: selected })
  }

  const canVote = election.can_vote && !!openRound
  const pastRounds = election.rounds.filter((r) => r !== openRound)

  return (
    <SurveyShell onBack={back} title={election.title}>
      <div className={`px-4 pt-5 space-y-4 ${canVote ? 'pb-28 lg:pb-0' : ''}`}>
        <section className={`${cardCls} p-4`}>
          <p className="text-[11px] font-bold tracking-[0.1em] text-brand uppercase">{phaseLabel(election)}</p>
          <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.02em] text-ink-strong leading-snug break-keep">
            {election.title}
          </h2>
          {election.description ? (
            <p className="mt-2 text-[13.5px] text-ink leading-relaxed whitespace-pre-line break-keep">
              {election.description}
            </p>
          ) : null}
          <p className="mt-3 text-[12.5px] text-ink-muted leading-relaxed">
            {election.seats}명 선출 · 당선 기준은 <b className="text-ink-strong">{thresholdText(election.rules)}</b> 득표
          </p>
          {election.notice ? (
            <p className="mt-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-[12.5px] text-ink-muted leading-relaxed whitespace-pre-line break-keep">
              {election.notice}
            </p>
          ) : null}
        </section>

        <ElectedStrip election={election} />

        {openRound ? (
          canVote ? (
            <section>
              <SectionTitle>{openRound.round_no}차 투표 — {max}명까지 골라주세요</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ballotCandidates.map((c) => (
                  <CandidateBallotCard
                    key={c.id}
                    candidate={c}
                    selected={selected.includes(c.id)}
                    disabled={max > 1 && selected.length >= max && !selected.includes(c.id)}
                    onToggle={() => toggle(c.id)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <>
              {election.has_voted ? (
                <section className={`${cardCls} p-5 text-center`}>
                  <span className="mx-auto mb-2.5 flex w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 items-center justify-center">
                    <CheckIcon size={22} />
                  </span>
                  <p className="text-[15.5px] font-bold text-ink-strong">{openRound.round_no}차 투표를 마쳤어요</p>
                  <p className="mt-1 text-[12.5px] text-ink-muted leading-relaxed break-keep">
                    누구를 골랐는지는 어디에도 남지 않아요. 결과는 투표가 마감되면 알려드릴게요.
                  </p>
                </section>
              ) : null}
              <RoundResultCard round={openRound} candidates={election.candidates} />
            </>
          )
        ) : election.status === 'active' ? (
          <section className={`${cardCls} p-5 text-center`}>
            <p className="text-[15px] font-bold text-ink-strong">
              {round ? `${round.round_no + 1}차 투표를 준비하고 있어요` : '곧 투표가 시작돼요'}
            </p>
            <p className="mt-1 text-[12.5px] text-ink-muted">시작되면 이 화면이 바로 바뀌어요.</p>
          </section>
        ) : null}

        {pastRounds
          .slice()
          .reverse()
          .map((r) => (
            <RoundResultCard key={r.id} round={r} candidates={election.candidates} />
          ))}
      </div>

      {canVote ? (
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark lg:static lg:mt-4 lg:px-4 lg:pb-6 lg:pt-0 lg:bg-transparent lg:dark:bg-transparent lg:backdrop-blur-none lg:border-0">
          <div className="max-w-md mx-auto lg:max-w-none flex items-center gap-3">
            <p className="shrink-0 text-[13px] font-semibold text-ink-muted tabular-nums">
              <b className="text-[17px] text-brand">{selected.length}</b> / {max}명
            </p>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!selected.length || vote.isPending}
              className="flex-1 py-3 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40 transition-opacity"
            >
              {vote.isPending ? '제출하는 중…' : '투표하기'}
            </button>
          </div>
        </div>
      ) : null}
    </SurveyShell>
  )
}

export default ElectionDetail
