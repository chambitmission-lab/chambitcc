// 손글씨 성경 필사대회 (/handwriting, /handwriting/:id)
// 대회 소개 → 참여하기(또는 내 작품) → (발표 뒤) 시상대 → 갤러리에서 한 표씩.
// id 없이 들어오면 진행 중인 대회(없으면 가장 최근 대회)를 보여 준다.
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useContest,
  useContestEntries,
  useContestLive,
  useContests,
  useUpdateConsent,
  useVoteEntry,
  useWithdrawEntry,
} from '../../hooks/useHandwritingContest'
import type { ContestDetail, ContestEntry, EntrySort } from '../../types/handwritingContest'
import { can } from '../../utils/access'
import { isAuthenticated } from '../../utils/auth'
import { confirmDialog } from '../../utils/confirmDialog'
import { redirectAfterLogin } from '../../utils/redirectAfterLogin'
import { showToast, toastFeedback } from '../../utils/toast'
import { RailCard, SectionTitle, Spinner, SurveyShell } from '../Survey/surveyUi'
import EntrySheet from './EntrySheet'
import { Avatar, CardIcon, CenterNote, HeartIcon, Medal, PaperThumb, PhaseChip, QuillIcon, TrophyIcon } from './contestShared'
import { RANK_META, errorText, periodText, phaseLine } from './contestFormat'
import './contest.css'

const SORTS: { id: EntrySort; label: string }[] = [
  { id: 'shuffle', label: '골고루' },
  { id: 'recent', label: '새로 올라온' },
  { id: 'popular', label: '많이 받은' },
]

const ContestPage = () => {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const authed = isAuthenticated()
  const { data: list, isLoading: listLoading } = useContests()
  const contestId = params.id ? Number(params.id) : (list?.items[0]?.id ?? 0)
  const { data: contest, isLoading, error } = useContest(contestId)

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  if ((!params.id && listLoading) || (contestId > 0 && isLoading)) {
    return (
      <SurveyShell onBack={goBack} title="손글씨 필사대회">
        <Spinner />
      </SurveyShell>
    )
  }
  if (!contestId) {
    return (
      <SurveyShell onBack={goBack} title="손글씨 필사대회">
        <CenterNote title="아직 열린 필사대회가 없어요" hint={'대회가 열리면 이곳에서\n손글씨로 말씀을 써서 참여할 수 있어요'} />
      </SurveyShell>
    )
  }
  if (!contest) {
    return (
      <SurveyShell onBack={goBack} title="손글씨 필사대회">
        <CenterNote title="대회를 찾을 수 없어요" hint={errorText(error, '잠시 후 다시 시도해주세요')} />
      </SurveyShell>
    )
  }
  return <ContestBody key={contest.id} contest={contest} authed={authed} onBack={goBack} others={(list?.items ?? []).filter((c) => c.id !== contest.id)} />
}

const ContestBody = ({
  contest,
  authed,
  onBack,
  others,
}: {
  contest: ContestDetail
  authed: boolean
  onBack: () => void
  others: { id: number; title: string; phase: ContestDetail['phase']; starts_at: string; ends_at: string }[]
}) => {
  const navigate = useNavigate()
  // 관리자는 서버가 표 수를 늘 내려준다 — 집계 확인용으로 '많이 받은' 정렬도 연다
  const countsVisible = contest.phase === 'announced' || contest.show_ranking || can('admin:access')
  const sorts = countsVisible ? SORTS : SORTS.filter((s) => s.id !== 'popular')
  const [sort, setSort] = useState<EntrySort>(contest.phase === 'announced' ? 'popular' : 'shuffle')
  const entries = useContestEntries(contest.id, sort)
  const [openId, setOpenId] = useState<number | null>(null)
  useContestLive(contest.id) // 다른 성도의 표가 들어오면 하트 수·참여 인원이 바로 바뀐다
  const vote = useVoteEntry(contest.id, toastFeedback({ error: '투표하지 못했어요' }))
  const withdraw = useWithdrawEntry(contest.id, toastFeedback({ success: '출품을 거뒀어요', error: '출품을 거두지 못했어요' }))
  const consent = useUpdateConsent(contest.id, toastFeedback({ error: '동의 설정을 바꾸지 못했어요' }))

  const loaded = useMemo(() => entries.data?.pages.flatMap((p) => p.items) ?? [], [entries.data])
  const findEntry = (id: number): ContestEntry | undefined =>
    loaded.find((e) => e.id === id) ??
    contest.winners.find((e) => e.id === id) ??
    (contest.my_entry?.id === id ? contest.my_entry : undefined)
  const opened = openId != null ? findEntry(openId) : undefined

  const requireLogin = (): boolean => {
    if (authed) return true
    redirectAfterLogin.set(`/handwriting/${contest.id}`)
    navigate('/login')
    return false
  }

  const handleVote = (entry: ContestEntry) => {
    if (!requireLogin()) return
    if (!entry.voted_by_me && contest.votes_left <= 0) {
      showToast(`${contest.votes_per_user}표를 모두 썼어요. 다른 작품의 표를 거두면 다시 줄 수 있어요`, 'error')
      return
    }
    vote.mutate({ entryId: entry.id, on: !entry.voted_by_me })
  }

  const startWrite = () => {
    if (!requireLogin()) return
    navigate(`/handwriting/${contest.id}/write`)
  }

  const handleWithdraw = async () => {
    const ok = await confirmDialog({
      title: '출품을 거둘까요?',
      message: '지금까지 받은 표도 함께 사라져요.\n기간 안에는 다시 써서 낼 수 있어요.',
      confirmText: '거두기',
      cancelText: '두기',
      tone: 'danger',
    })
    if (ok) withdraw.mutate()
  }

  const myEntry = contest.my_entry

  const rules = (
    <ul className="space-y-1.5 text-[12.5px] leading-[1.6] text-ink-muted">
      <li>· 성경에서 마음에 닿는 구절을 골라 손글씨로 한 작품만 낼 수 있어요</li>
      <li>· 로그인한 성도는 마음에 드는 글씨 {contest.votes_per_user}개에 한 표씩 줄 수 있어요 (내 작품 제외)</li>
      <li>· 표를 많이 받은 순서로 1·2·3등을 뽑아요. 표가 같으면 먼저 낸 작품이 앞서요</li>
      <li>· {contest.show_ranking ? '진행 중에도 표 수와 순위가 공개돼요' : '표 수와 순위는 발표 때 공개돼요'}</li>
      <li>· 입상작은 동의한 경우 성도들이 말씀카드로 만들어 나눌 수 있어요</li>
    </ul>
  )

  const voteBox =
    contest.phase === 'open' && authed ? (
      <div className="flex items-center gap-3">
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: contest.votes_per_user }, (_, i) => (
            <span key={i} className={i < contest.votes_per_user - contest.votes_left ? 'text-rose-500' : 'text-gray-300 dark:text-white/20'}>
              <HeartIcon filled size={20} />
            </span>
          ))}
        </div>
        <p className="text-[13px] text-ink-muted">
          남은 표 <b className="text-ink-strong tabular-nums">{contest.votes_left}</b> / {contest.votes_per_user}
        </p>
      </div>
    ) : null

  const rail = (
    <>
      {voteBox ? <RailCard title="내 표">{voteBox}</RailCard> : null}
      <RailCard title="대회 안내">{rules}</RailCard>
      {others.length ? (
        <RailCard title="다른 대회">
          <OtherContests others={others} />
        </RailCard>
      ) : null}
    </>
  )

  return (
    <SurveyShell onBack={onBack} title={contest.title} rail={rail}>
      <div className="px-4 pt-4 lg:px-6 lg:pt-6">
        {/* 히어로 */}
        <section className="hw-hero">
          <span className="hw-hero__quill">
            <QuillIcon size={112} />
          </span>
          <div className="flex items-center gap-2">
            <p className="hw-hero__eyebrow">참빛교회 손글씨 성경 필사대회</p>
            <PhaseChip phase={contest.phase} />
          </div>
          <h2 className="hw-hero__title">{contest.title}</h2>
          <p className="mt-2 text-[13px] font-semibold opacity-75">
            {periodText(contest)} · {phaseLine(contest)}
          </p>
          {contest.description ? (
            <p className="mt-3 text-[13.5px] leading-[1.7] opacity-85 whitespace-pre-line">{contest.description}</p>
          ) : null}
          <div className="mt-4 flex gap-4 text-[12.5px] font-semibold opacity-75">
            <span>
              출품 <b className="tabular-nums">{contest.entry_count}</b>작품
            </span>
            <span>
              투표 참여 <b className="tabular-nums">{contest.voter_count}</b>명
            </span>
          </div>
        </section>

        {/* 참여하기 / 내 작품 */}
        {contest.phase === 'open' && !myEntry ? (
          <button
            type="button"
            onClick={startWrite}
            className="relative mt-4 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold seal-chip [--seal-radius:1rem]"
          >
            <QuillIcon />
            {authed ? '참여하기 · 구절 골라 손글씨로 쓰기' : '로그인하고 참여하기'}
          </button>
        ) : null}

        {myEntry ? (
          <section className="mt-4 rounded-2xl border border-gray-200/70 dark:border-white/[0.07] bg-white dark:bg-card-dark p-3.5">
            <div className="flex gap-3">
              <button type="button" className="w-[84px] shrink-0" onClick={() => setOpenId(myEntry.id)} aria-label="내 작품 크게 보기">
                <PaperThumb entry={myEntry} maxRatio={1.2} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-bold text-brand">
                  {myEntry.rank ? `${RANK_META[myEntry.rank]?.label} 입상` : contest.phase === 'open' ? '출품 완료' : '내 작품'}
                  {myEntry.is_hidden ? ' · 숨김 처리됨' : ''}
                </p>
                <p className="mt-0.5 text-[14px] font-bold text-ink-strong truncate">{myEntry.verse_ref}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">
                  {myEntry.vote_count != null ? `${myEntry.vote_count}표 받았어요` : '받은 표는 발표 때 공개돼요'}
                </p>
                <label className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[var(--brand)]"
                    checked={myEntry.card_consent}
                    disabled={consent.isPending}
                    onChange={(e) => consent.mutate(e.target.checked)}
                  />
                  입상하면 성도들이 내 글씨로 말씀카드를 만들어도 좋아요
                </label>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/handwriting/${contest.id}/card/${myEntry.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
              >
                <CardIcon size={16} />
                내 글씨로 말씀카드
              </button>
              {contest.phase === 'open' ? (
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={withdraw.isPending}
                  className="px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-ink-muted border border-gray-200 dark:border-white/10"
                >
                  출품 거두기
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 모바일 — 남은 표 */}
        {voteBox ? <div className="lg:hidden mt-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3">{voteBox}</div> : null}

        {/* 시상대 */}
        {contest.phase === 'announced' ? <Podium contest={contest} onOpen={setOpenId} /> : null}

        {/* 갤러리 */}
        {contest.phase !== 'upcoming' ? (
          <section className="mt-7">
            <div className="flex items-center justify-between gap-2 mb-3">
              <SectionTitle count={entries.data?.pages[0]?.total}>출품작</SectionTitle>
              <div className="flex gap-1 -mt-3" role="tablist" aria-label="정렬">
                {sorts.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={sort === s.id}
                    onClick={() => setSort(s.id)}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-bold transition-colors ${
                      sort === s.id ? 'bg-ink-strong text-white dark:bg-white dark:text-gray-900' : 'text-ink-muted'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {entries.isLoading ? (
              <Spinner />
            ) : loaded.length === 0 ? (
              <CenterNote
                title="아직 출품작이 없어요"
                hint={contest.phase === 'open' ? '첫 번째 손글씨의 주인공이 되어 주세요' : undefined}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-5">
                  {loaded.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      canVote={contest.phase === 'open' && !entry.is_mine}
                      votesLeft={contest.votes_left}
                      busy={vote.isPending && vote.variables?.entryId === entry.id}
                      onOpen={() => setOpenId(entry.id)}
                      onVote={() => handleVote(entry)}
                    />
                  ))}
                </div>
                {entries.hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => entries.fetchNextPage()}
                    disabled={entries.isFetchingNextPage}
                    className="mt-5 w-full py-3 rounded-2xl text-[13.5px] font-bold text-ink-muted bg-gray-50 dark:bg-white/[0.04]"
                  >
                    {entries.isFetchingNextPage ? '불러오는 중…' : '더 보기'}
                  </button>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {/* 모바일 — 안내·다른 대회 */}
        <section className="lg:hidden mt-8 rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-4">
          <p className="mb-2 text-[12.5px] font-bold text-ink-strong">대회 안내</p>
          {rules}
        </section>
        {others.length ? (
          <section className="lg:hidden mt-3 mb-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-4">
            <p className="mb-2 text-[12.5px] font-bold text-ink-strong">다른 대회</p>
            <OtherContests others={others} />
          </section>
        ) : null}
      </div>

      {opened ? (
        <EntrySheet
          contest={contest}
          entry={opened}
          onClose={() => setOpenId(null)}
          onVote={handleVote}
          voting={vote.isPending}
        />
      ) : null}
    </SurveyShell>
  )
}

const EntryCard = ({
  entry,
  canVote,
  votesLeft,
  busy,
  onOpen,
  onVote,
}: {
  entry: ContestEntry
  canVote: boolean
  votesLeft: number
  busy: boolean
  onOpen: () => void
  onVote: () => void
}) => (
  <div className="min-w-0">
    <button type="button" onClick={onOpen} className="block w-full text-left" aria-label={`${entry.author.name}님의 ${entry.verse_ref} 보기`}>
      <div className="relative">
        <PaperThumb entry={entry} className={entry.rank ? `ring-2 ${RANK_META[entry.rank]?.ring ?? ''}` : ''} />
        {entry.rank ? (
          <span className="absolute left-2 top-2">
            <Medal rank={entry.rank} size={24} />
          </span>
        ) : null}
        {entry.is_mine ? (
          <span className="absolute right-2 top-2 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-brand text-white">내 작품</span>
        ) : null}
      </div>
    </button>
    <div className="mt-2 flex items-start gap-1.5">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="text-[13px] font-bold text-ink-strong truncate">{entry.verse_ref}</p>
        <p className="text-[12px] text-ink-muted truncate">{entry.author.name}</p>
      </button>
      {canVote ? (
        <button
          type="button"
          onClick={onVote}
          disabled={busy}
          aria-pressed={entry.voted_by_me}
          aria-label={entry.voted_by_me ? '한 표 거두기' : '한 표 주기'}
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-bold transition-colors ${
            entry.voted_by_me
              ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'
              : votesLeft > 0
                ? 'text-gray-400 hover:text-rose-500 dark:text-white/40'
                : 'text-gray-300 dark:text-white/20'
          }`}
        >
          <HeartIcon filled={entry.voted_by_me} size={17} />
          {entry.vote_count != null ? <span className="tabular-nums">{entry.vote_count}</span> : null}
        </button>
      ) : entry.vote_count != null ? (
        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[12px] font-bold text-gray-400 dark:text-white/40">
          <HeartIcon size={15} />
          <span className="tabular-nums">{entry.vote_count}</span>
        </span>
      ) : null}
    </div>
  </div>
)

const Podium = ({ contest, onOpen }: { contest: ContestDetail; onOpen: (id: number) => void }) => {
  const byRank = new Map(contest.winners.map((w) => [w.rank ?? 0, w]))
  const order = [2, 1, 3]
  return (
    <section className="mt-7">
      <SectionTitle>
        <span className="inline-flex items-center gap-1.5">
          <TrophyIcon size={17} />
          입상작
        </span>
      </SectionTitle>
      {contest.winners.length === 0 ? (
        <p className="text-[13px] text-ink-muted">표를 받은 작품이 없어 입상작이 없어요.</p>
      ) : (
        <div className="hw-podium">
          {order.map((rank) => {
            const w = byRank.get(rank)
            const meta = RANK_META[rank]
            if (!w) return <div key={rank} />
            return (
              <button key={rank} type="button" className="hw-podium__slot text-left" onClick={() => onOpen(w.id)}>
                <PaperThumb entry={w} maxRatio={rank === 1 ? 1.25 : 1.1} className={`ring-2 ${meta.ring}`} />
                <div className="mt-2 flex items-center gap-1.5 min-w-0">
                  <Avatar name={w.author.name} url={w.author.avatar_url} size={20} />
                  <p className="text-[12.5px] font-bold text-ink-strong truncate">{w.author.name}</p>
                </div>
                <p className="text-[11.5px] text-ink-muted truncate">
                  {w.verse_ref}
                  {w.vote_count != null ? ` · ${w.vote_count}표` : ''}
                </p>
                <div className="hw-podium__step" style={{ background: meta.medal, height: rank === 1 ? 40 : rank === 2 ? 30 : 22 }}>
                  {meta.label}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

const OtherContests = ({
  others,
}: {
  others: { id: number; title: string; phase: ContestDetail['phase']; starts_at: string; ends_at: string }[]
}) => {
  const navigate = useNavigate()
  return (
    <ul className="space-y-1">
      {others.slice(0, 6).map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => navigate(`/handwriting/${c.id}`)}
            className="w-full flex items-center gap-2 py-1.5 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink-strong truncate">{c.title}</span>
              <span className="block text-[11.5px] text-ink-muted">{periodText(c)}</span>
            </span>
            <PhaseChip phase={c.phase} />
          </button>
        </li>
      ))}
    </ul>
  )
}

export default ContestPage
