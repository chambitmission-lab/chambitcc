// 선거 목록 — 내가 선거인 명부에 있는 선거만 보인다 (명부 밖 성도에게는 빈 화면)
import { useNavigate } from 'react-router-dom'
import { useElections } from '../../hooks/useElections'
import { isAuthenticated } from '../../utils/auth'
import { preloadRoute } from '../../utils/routePreload'
import type { ElectionSummary } from '../../types/election'
import { CenterNote, ChevronRight, DoneChip, SectionTitle, Spinner, SurveyShell } from '../Survey/surveyUi'
import { STATUS_META, cardCls, phaseLabel, thresholdText } from './electionShared'
import { BallotIcon, TurnoutBar } from './electionUi'

const chipCls = 'inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border leading-[1.5]'

const ElectionCard = ({ election, onOpen }: { election: ElectionSummary; onOpen: () => void }) => (
  <button
    type="button"
    onClick={onOpen}
    onMouseEnter={() => void preloadRoute(`/elections/${election.id}`)}
    onTouchStart={() => void preloadRoute(`/elections/${election.id}`)}
    className={`${cardCls} w-full text-left p-4 transition-transform active:scale-[0.99] lg:p-6 lg:hover:border-brand`}
  >
    <div className="flex items-start gap-3 lg:gap-4">
      <span className="shrink-0 w-11 h-11 rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center lg:w-14 lg:h-14">
        <BallotIcon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {election.has_voted && election.current_round_status === 'open' ? (
            <DoneChip />
          ) : (
            <span className={`${chipCls} ${STATUS_META[election.status].badge}`}>{phaseLabel(election)}</span>
          )}
        </div>
        <h3 className="text-[15.5px] font-bold text-ink-strong leading-snug lg:text-[21px]">{election.title}</h3>
        <p className="mt-1 text-[12px] text-ink-muted lg:mt-1.5 lg:text-[15.5px]">
          {election.seats}명 선출 · 후보 {election.candidate_count}명 · {thresholdText(election.rules)}
        </p>
      </div>
      <span className="shrink-0 self-center text-gray-300 dark:text-white/30">
        <ChevronRight />
      </span>
    </div>
    {election.current_round_no ? (
      <div className="mt-3 lg:mt-4">
        <TurnoutBar voted={election.voted_count} total={election.voters_total} large />
      </div>
    ) : null}
    {election.can_vote ? (
      <p className="mt-3 py-2 rounded-xl bg-brand text-white text-center text-[13.5px] font-bold lg:mt-4 lg:py-3.5 lg:rounded-2xl lg:text-[18px]">
        지금 투표하기
      </p>
    ) : null}
  </button>
)

const ElectionList = () => {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const { data, isLoading } = useElections(loggedIn)

  const live = (data ?? []).filter((e) => e.status !== 'finished')
  const past = (data ?? []).filter((e) => e.status === 'finished')
  const open = (id: number) => navigate(`/elections/${id}`)

  return (
    <SurveyShell onBack={() => navigate('/')} title="선거">
      <div className="px-4 pt-5 lg:px-6 lg:pt-6">
        {!loggedIn ? (
          <CenterNote
            title="로그인이 필요해요"
            hint="선거는 선거인 명부에 있는 성도만 참여할 수 있어요."
            actionLabel="로그인"
            onAction={() => navigate('/login')}
          />
        ) : isLoading ? (
          <Spinner />
        ) : !live.length && !past.length ? (
          <CenterNote
            title="참여할 수 있는 선거가 없어요"
            hint="선거인 명부에 오르면 투표가 시작될 때 홈 화면에서 알려드릴게요."
          />
        ) : (
          <>
            {live.length ? (
              <section>
                <SectionTitle count={live.length}>진행 중인 선거</SectionTitle>
                <div className="space-y-3">
                  {live.map((e) => (
                    <ElectionCard key={e.id} election={e} onOpen={() => open(e.id)} />
                  ))}
                </div>
              </section>
            ) : null}
            {past.length ? (
              <section className={live.length ? 'pt-8' : ''}>
                <SectionTitle count={past.length}>지난 선거</SectionTitle>
                <div className="space-y-3">
                  {past.map((e) => (
                    <ElectionCard key={e.id} election={e} onOpen={() => open(e.id)} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </SurveyShell>
  )
}

export default ElectionList
