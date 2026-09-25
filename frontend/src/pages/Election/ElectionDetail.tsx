// 선거 상세 — 후보를 고르고(회차당 최대 max_select 명) 투표한다.
//
// 무기명이라 제출하면 고칠 수 없다(서버도 어느 표가 내 표인지 모른다) → 제출 전에 한 번 더 확인한다.
// 득표는 공개 범위(rules.result_visibility) 안에서만 서버가 내려준다 — round.result 가 없으면
// 투표율만 보여 준다.
//
// PC(lg+)는 어르신이 큰 화면으로 투표하는 자리라 따로 다듬었다: 오른쪽 "내 투표용지" 레일에
// 고른 후보·남은 칸·투표하기가 스크롤과 상관없이 늘 보이고, 후보 카드는 이름·기호를 크게,
// 고른 카드엔 글자로 "선택함"을 붙인다(색·링만으론 구분이 어렵다). 모바일은 하단 고정 바 그대로.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCastVote, useElection } from '../../hooks/useElections'
import { showToast } from '../../utils/toast'
import type { ElectionCandidate, ElectionDetail as ElectionDetailData, ElectionRound } from '../../types/election'
import { CenterNote, CheckIcon, RailCard, Spinner, SurveyShell } from '../Survey/surveyUi'
import { cardCls, phaseLabel, thresholdText } from './electionShared'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { CandidateAvatar, TallyBars, TurnoutBar } from './electionUi'

/** 투표용 후보 카드 — 사진이 주인공, 고르면 브랜드 링 + 체크 (PC 는 "선택함" 띠까지) */
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
    aria-label={`기호 ${candidate.number}번 ${candidate.name}${selected ? ' · 선택함' : ''}`}
    className={`relative text-left rounded-2xl overflow-hidden bg-white dark:bg-card-dark border transition-[box-shadow,border-color,opacity] lg:rounded-3xl ${
      selected
        ? 'border-brand ring-2 ring-brand lg:ring-4'
        : 'border-gray-200/70 dark:border-white/[0.06] disabled:opacity-45 lg:hover:border-brand lg:hover:shadow-md'
    }`}
  >
    <div className="relative aspect-[4/5] bg-gray-100 dark:bg-white/[0.04]">
      {candidate.photo_url ? (
        <img src={candidate.photo_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[44px] lg:text-[64px] font-extrabold text-brand bg-[var(--brand-soft)]">
          {candidate.name.charAt(0)}
        </span>
      )}
      <span className="absolute top-2 left-2 min-w-[1.75rem] h-7 px-2 rounded-full bg-black/65 text-white text-[12.5px] font-extrabold flex items-center justify-center tabular-nums lg:top-3 lg:left-3 lg:h-10 lg:min-w-[2.5rem] lg:px-3 lg:text-[18px]">
        {candidate.number}
        <span className="hidden lg:inline text-[14px] font-bold ml-0.5">번</span>
      </span>
      {selected ? (
        <>
          <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow-md lg:top-3 lg:right-3 lg:w-11 lg:h-11">
            <CheckIcon size={15} />
          </span>
          <span className="hidden lg:flex absolute inset-x-0 bottom-0 items-center justify-center gap-1.5 py-2 bg-brand text-white text-[16px] font-bold">
            <CheckIcon size={18} />
            선택함
          </span>
        </>
      ) : null}
    </div>
    <div className="px-3 py-2.5 lg:px-4 lg:py-3.5">
      <p className="text-[15px] font-bold text-ink-strong truncate lg:text-[21px] lg:tracking-[-0.02em]">{candidate.name}</p>
      {candidate.bio ? (
        <p className="mt-0.5 text-[12px] text-ink-muted leading-snug line-clamp-2 break-keep lg:mt-1 lg:text-[15px] lg:leading-relaxed lg:line-clamp-3">
          {candidate.bio}
        </p>
      ) : null}
    </div>
  </button>
)

/** PC 레일 — 내 투표용지. 고른 후보·남은 칸·투표하기가 스크롤과 상관없이 늘 보인다 */
const BallotRail = ({
  roundNo,
  max,
  picked,
  pending,
  onRemove,
  onSubmit,
}: {
  roundNo: number
  max: number
  picked: ElectionCandidate[]
  pending: boolean
  onRemove: (id: number) => void
  onSubmit: () => void
}) => {
  const empty = Math.max(0, max - picked.length)
  return (
    <RailCard>
      <p className="text-[15px] font-bold text-ink-muted">{roundNo}차 · 내 투표용지</p>
      <p className="mt-1 text-ink-strong tabular-nums">
        <b className="text-[40px] font-extrabold text-brand leading-none">{picked.length}</b>
        <span className="text-[20px] font-bold"> / {max}명</span>
      </p>
      <ul className="mt-4 space-y-2">
        {picked.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-[var(--brand-soft)] pl-2 pr-1.5 py-2">
            <CandidateAvatar candidate={c} size={44} showNumber={false} />
            <p className="min-w-0 flex-1 text-[17px] font-bold text-ink-strong truncate">
              <span className="text-brand tabular-nums">{c.number}번</span> {c.name}
            </p>
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              aria-label={`${c.name} 빼기`}
              className="shrink-0 h-10 px-3 rounded-xl text-[14px] font-semibold text-ink-muted hover:bg-white hover:text-ink-strong dark:hover:bg-white/10 transition-colors"
            >
              빼기
            </button>
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li
            key={`empty-${i}`}
            className="flex items-center h-[60px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 px-4 text-[15px] text-ink-muted"
          >
            빈 칸
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[15px] leading-relaxed text-ink break-keep">
        {!picked.length
          ? '왼쪽 후보 사진을 눌러 고르세요.'
          : empty
            ? `${empty}명 더 고를 수 있어요. 덜 골라도 투표할 수 있어요.`
            : '다 골랐어요. 바꾸려면 고른 후보를 다시 누르세요.'}
      </p>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!picked.length || pending}
        className="mt-4 w-full h-14 rounded-2xl bg-brand text-white text-[19px] font-bold disabled:opacity-40 transition-opacity"
      >
        {pending ? '제출하는 중…' : '투표하기'}
      </button>
      <p className="mt-2.5 text-[13.5px] text-ink-muted text-center">무기명이라 제출하면 고칠 수 없어요</p>
    </RailCard>
  )
}

/**
 * 제출 전 마지막 확인 — 공용 confirmDialog 대신 이름만이 아니라 사진·기호로 한 번 더 보여 준다.
 * 포털이 아니라 페이지 안에 그려 PC 글씨 크기(zoom)도 함께 받는다. Enter 로 제출되지 않게 버튼만 받는다.
 */
const BallotConfirm = ({
  picked,
  max,
  pending,
  onCancel,
  onConfirm,
}: {
  picked: ElectionCandidate[]
  max: number
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ballot-confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md lg:max-w-[560px] max-h-[calc(90vh/var(--az,1))] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5 lg:p-8 shadow-2xl animate-pop-in"
      >
        <h3 id="ballot-confirm-title" className="text-[19px] lg:text-[26px] font-extrabold text-ink-strong tracking-[-0.02em]">
          이대로 투표할까요?
        </h3>
        <p className="mt-1.5 text-[13.5px] lg:text-[16px] text-ink-muted leading-relaxed break-keep">
          {picked.length < max
            ? `${max}명까지 고를 수 있는데 ${picked.length}명만 골랐어요. `
            : ''}
          무기명 투표라 제출하면 고칠 수 없어요.
        </p>
        <ul className="mt-4 lg:mt-6 space-y-2 lg:space-y-3">
          {picked.map((c) => (
            <li key={c.id} className="flex items-center gap-3 lg:gap-4 rounded-2xl bg-[var(--brand-soft)] p-2.5 lg:p-3">
              <CandidateAvatar candidate={c} size={52} showNumber={false} />
              <p className="text-[17px] lg:text-[22px] font-bold text-ink-strong">
                <span className="text-brand tabular-nums">{c.number}번</span> {c.name}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-5 lg:mt-7 grid grid-cols-2 gap-2.5 lg:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 lg:h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.08] text-ink-strong text-[15px] lg:text-[19px] font-bold"
          >
            다시 고를게요
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="h-12 lg:h-16 rounded-2xl bg-brand text-white text-[15px] lg:text-[19px] font-bold disabled:opacity-50"
          >
            {pending ? '제출하는 중…' : '투표하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** 마감된(또는 실시간 공개인) 회차 한 장 */
const RoundResultCard = ({ round, candidates }: { round: ElectionRound; candidates: ElectionCandidate[] }) => (
  <section className={`${cardCls} p-4 lg:p-6`}>
    <div className="flex items-baseline justify-between gap-2 mb-3 lg:mb-5">
      <h3 className="text-[14.5px] font-extrabold text-ink-strong lg:text-[20px]">
        {round.round_no}차 {round.status === 'closed' ? '결과' : '현황'}
      </h3>
      <span className="text-[11.5px] text-ink-muted tabular-nums lg:text-[14.5px]">
        투표 {round.voted_count} / {round.voters_total}명 · {thresholdText(round.rules)}
      </span>
    </div>
    {round.result ? (
      <TallyBars result={round.result} candidates={candidates} large />
    ) : (
      <TurnoutBar voted={round.voted_count} total={round.voters_total} large />
    )}
  </section>
)

const ElectedStrip = ({ election }: { election: ElectionDetailData }) => {
  const isLg = useMediaQuery('(min-width: 1024px)')
  const elected = election.candidates.filter((c) => c.elected_round_no != null)
  if (!elected.length) return null
  return (
    <section className={`${cardCls} p-4 lg:p-6`}>
      <h3 className="text-[14.5px] font-extrabold text-ink-strong mb-3 lg:text-[20px] lg:mb-4">
        당선 <span className="text-brand tabular-nums">{elected.length}</span>
        <span className="text-ink-muted font-semibold"> / {election.seats}명</span>
      </h3>
      <div className="flex flex-wrap gap-3 lg:gap-5">
        {elected.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5 lg:gap-3">
            <CandidateAvatar candidate={c} size={isLg ? 60 : 44} />
            <div>
              <p className="text-[14px] font-bold text-ink-strong leading-tight lg:text-[19px]">{c.name}</p>
              <p className="text-[11.5px] text-ink-muted lg:text-[14px] lg:mt-0.5">{c.elected_round_no}차 당선</p>
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
  const [confirming, setConfirming] = useState(false)
  const isLg = useMediaQuery('(min-width: 1024px)')

  const round = election?.rounds.length ? election.rounds[election.rounds.length - 1] : null
  const openRound = round?.status === 'open' ? round : null

  // 회차가 바뀌면(1차 → 2차) 앞 회차에서 고르던 선택을 비운다 — 렌더 중 상태 조정(effect 불필요)
  const [selectedFor, setSelectedFor] = useState(openRound?.id)
  if (selectedFor !== openRound?.id) {
    setSelectedFor(openRound?.id)
    setSelected([])
    setConfirming(false) // 확인 창을 띄운 채 회차가 닫혔다가 다음 회차가 열려도 저절로 뜨지 않게
  }

  const ballotCandidates = useMemo(() => {
    if (!election || !openRound) return []
    const ids = new Set(openRound.candidate_ids)
    return election.candidates.filter((c) => ids.has(c.id))
  }, [election, openRound])

  const vote = useCastVote({
    onSuccess: () => {
      setConfirming(false)
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

  // 고른 순서가 아니라 기호 순서로 — 투표용지를 위에서부터 읽는 것과 같게
  const picked = ballotCandidates.filter((c) => selected.includes(c.id))
  const submit = () => {
    if (!openRound || !selected.length) return
    setConfirming(true)
  }

  const canVote = election.can_vote && !!openRound
  const pastRounds = election.rounds.filter((r) => r !== openRound)

  return (
    <SurveyShell
      onBack={back}
      title={election.title}
      // PC 에서 페이지가 스스로 스크롤해야 투표용지 레일이 화면에 붙는다(#root overflow 로 sticky 가 전역에서 죽어 있음)
      pinRail={canVote}
      rail={
        canVote && openRound ? (
          <BallotRail
            roundNo={openRound.round_no}
            max={max}
            picked={picked}
            pending={vote.isPending}
            onRemove={toggle}
            onSubmit={submit}
          />
        ) : undefined
      }
    >
      <div className={`px-4 pt-5 space-y-4 lg:px-6 lg:pt-6 lg:space-y-5 ${canVote ? 'pb-28 lg:pb-8' : 'lg:pb-4'}`}>
        <section className={`${cardCls} p-4 lg:p-6`}>
          <p className="text-[11px] font-bold tracking-[0.1em] text-brand uppercase lg:text-[14px]">{phaseLabel(election)}</p>
          <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.02em] text-ink-strong leading-snug break-keep lg:mt-1.5 lg:text-[28px]">
            {election.title}
          </h2>
          {election.description ? (
            <p className="mt-2 text-[13.5px] text-ink leading-relaxed whitespace-pre-line break-keep lg:mt-3 lg:text-[17px] lg:leading-[1.75]">
              {election.description}
            </p>
          ) : null}
          <p className="mt-3 text-[12.5px] text-ink-muted leading-relaxed lg:mt-4 lg:text-[16px]">
            {election.seats}명 선출 · 당선 기준은 <b className="text-ink-strong">{thresholdText(election.rules)}</b> 득표
          </p>
          {election.notice ? (
            <p className="mt-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-[12.5px] text-ink-muted leading-relaxed whitespace-pre-line break-keep lg:mt-4 lg:px-4 lg:py-3.5 lg:text-[15.5px]">
              {election.notice}
            </p>
          ) : null}
        </section>

        <ElectedStrip election={election} />

        {openRound ? (
          canVote ? (
            <section>
              <div className="px-0.5 mb-3 lg:mb-5">
                <h2 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] lg:text-[24px]">
                  {openRound.round_no}차 투표 — {max}명까지 골라주세요
                </h2>
                <p className="hidden lg:block mt-1.5 text-[16px] text-ink-muted break-keep">
                  후보 사진을 누르면 골라지고, 다시 누르면 빠져요. 다 고르면 오른쪽 <b className="text-ink-strong">투표하기</b>를 누르세요.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:gap-4">
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
                <section className={`${cardCls} p-5 text-center lg:p-8`}>
                  <span className="mx-auto mb-2.5 flex w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 items-center justify-center lg:w-16 lg:h-16 lg:mb-4">
                    <CheckIcon size={isLg ? 30 : 22} />
                  </span>
                  <p className="text-[15.5px] font-bold text-ink-strong lg:text-[22px]">{openRound.round_no}차 투표를 마쳤어요</p>
                  <p className="mt-1 text-[12.5px] text-ink-muted leading-relaxed break-keep lg:mt-2 lg:text-[16px]">
                    누구를 골랐는지는 어디에도 남지 않아요. 결과는 투표가 마감되면 알려드릴게요.
                  </p>
                </section>
              ) : null}
              <RoundResultCard round={openRound} candidates={election.candidates} />
            </>
          )
        ) : election.status === 'active' ? (
          <section className={`${cardCls} p-5 text-center lg:p-8`}>
            <p className="text-[15px] font-bold text-ink-strong lg:text-[22px]">
              {round ? `${round.round_no + 1}차 투표를 준비하고 있어요` : '곧 투표가 시작돼요'}
            </p>
            <p className="mt-1 text-[12.5px] text-ink-muted lg:mt-2 lg:text-[16px]">시작되면 이 화면이 바로 바뀌어요.</p>
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
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark lg:hidden">
          {/* PC 는 오른쪽 BallotRail 이 같은 역할을 한다 */}
          <div className="max-w-md mx-auto flex items-center gap-3">
            <p className="shrink-0 text-[13px] font-semibold text-ink-muted tabular-nums">
              <b className="text-[17px] text-brand">{selected.length}</b> / {max}명
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={!selected.length || vote.isPending}
              className="flex-1 py-3 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40 transition-opacity"
            >
              {vote.isPending ? '제출하는 중…' : '투표하기'}
            </button>
          </div>
        </div>
      ) : null}

      {confirming && canVote ? (
        <BallotConfirm
          picked={picked}
          max={max}
          pending={vote.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={() => vote.mutate({ id: election.id, candidateIds: selected })}
        />
      ) : null}
    </SurveyShell>
  )
}

export default ElectionDetail
