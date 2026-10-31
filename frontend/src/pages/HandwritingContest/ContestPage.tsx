// 손글씨 성경 필사대회 (/handwriting, /handwriting/:id)
// 지금 막 써지는 누군가의 글씨(히어로) → 초대·참여하기(또는 내 작품) → (발표 뒤) 시상대
// → 이 구절을 고른 이유(사연) → 한 편씩 넘겨 보기·모든 작품 → 아직 아무도 쓰지 않은 구절.
// 작품은 시트 대신 StoryViewer 로 한 편씩 화면 가득 넘겨 본다.
// id 없이 들어오면 진행 중인 대회(없으면 가장 최근 대회)를 보여 준다.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { timeAgo } from '../../utils/dateUtils'
import { RECOMMENDED, type PickedVerse } from '../Bible/PhotoVerse/recommendedVerses'
import { RailCard, SectionTitle, Spinner, SurveyShell } from '../Survey/surveyUi'
import InkReplay from './InkReplay'
import StoryViewer from './StoryViewer'
import { Avatar, CardIcon, CenterNote, HeartIcon, Medal, PaperThumb, PhaseChip, QuillIcon, TrophyIcon } from './contestShared'
import { RANK_META, errorText, periodText, phaseLine } from './contestFormat'
import './contest.css'

const SORTS: { id: EntrySort; label: string }[] = [
  { id: 'shuffle', label: '골고루' },
  { id: 'recent', label: '새로 올라온' },
  { id: 'popular', label: '많이 받은' },
]

type ContestEntries = ReturnType<typeof useContestEntries>

/** 대회 단계에 따른 기본 정렬 — 발표 뒤엔 많이 받은 순, 진행 중엔 골고루 */
const defaultSort = (phase: ContestDetail['phase']): EntrySort => (phase === 'announced' ? 'popular' : 'shuffle')

const ContestPage = () => {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const authed = isAuthenticated()
  const { data: list, isLoading: listLoading } = useContests()
  const contestId = params.id ? Number(params.id) : (list?.items[0]?.id ?? 0)
  const { data: contest, isLoading, error } = useContest(contestId)

  // 갤러리는 상세와 나란히 띄운다(예전엔 상세가 온 뒤 ContestBody 가 마운트되고서야 출발해 직렬).
  // 기본 정렬은 단계에 달렸는데 상세가 아직 없으면 목록(요약)의 단계로 정한다 — 둘은 같은 값이다.
  // 사용자가 고른 정렬은 대회별로 붙잡아 둔다(다른 대회로 가면 기본값으로).
  const [sortChoice, setSortChoice] = useState<{ id: number; sort: EntrySort } | null>(null)
  const phase = contest?.phase ?? list?.items.find((c) => c.id === contestId)?.phase
  const sort: EntrySort | null = (sortChoice?.id === contestId ? sortChoice.sort : null) ?? (phase ? defaultSort(phase) : null)
  const setSort = useCallback((next: EntrySort) => setSortChoice({ id: contestId, sort: next }), [contestId])
  const entries = useContestEntries(contestId, sort)

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
  return (
    <ContestBody
      key={contest.id}
      contest={contest}
      authed={authed}
      onBack={goBack}
      others={(list?.items ?? []).filter((c) => c.id !== contest.id)}
      entries={entries}
      sort={sort ?? defaultSort(contest.phase)}
      setSort={setSort}
    />
  )
}

/** 넘겨 보기를 어느 묶음에서 열었는지 — 목록은 늘 최신 캐시에서 다시 뽑는다(표가 바로 반영되게) */
type StorySource = 'gallery' | 'stories' | 'winners' | 'mine'

const DEFAULT_INVITE = '빠르게 읽던 말씀도 손으로 쓰면 한 글자씩 오래 머물러요.\n마음에 닿는 구절 하나면 충분해요.'
/** 소감이 있는 작품 중 '고른 이유' 칸에 바로 펼쳐 둘 편수 */
const STORY_PREVIEW = 3
const SUGGESTION_COUNT = 3

const sameRef = (a: string, b: string) => a.replace(/\s/g, '') === b.replace(/\s/g, '')

const ContestBody = ({
  contest,
  authed,
  onBack,
  others,
  entries,
  sort,
  setSort,
}: {
  contest: ContestDetail
  authed: boolean
  onBack: () => void
  others: { id: number; title: string; phase: ContestDetail['phase']; starts_at: string; ends_at: string }[]
  entries: ContestEntries
  sort: EntrySort
  setSort: (next: EntrySort) => void
}) => {
  const navigate = useNavigate()
  // 관리자는 서버가 표 수를 늘 내려준다 — 집계 확인용으로 '많이 받은' 정렬도 연다
  const countsVisible = contest.phase === 'announced' || contest.show_ranking || can('admin:access')
  const sorts = countsVisible ? SORTS : SORTS.filter((s) => s.id !== 'popular')
  const [story, setStory] = useState<{ source: StorySource; index: number } | null>(null)
  useContestLive(contest.id) // 다른 성도의 표가 들어오면 하트 수·참여 인원이 바로 바뀐다
  const vote = useVoteEntry(contest.id, toastFeedback({ error: '투표하지 못했어요' }))
  const withdraw = useWithdrawEntry(contest.id, toastFeedback({ success: '출품을 거뒀어요', error: '출품을 거두지 못했어요' }))
  const consent = useUpdateConsent(contest.id, toastFeedback({ error: '동의 설정을 바꾸지 못했어요' }))

  const myEntry = contest.my_entry
  const loaded = useMemo(() => entries.data?.pages.flatMap((p) => p.items) ?? [], [entries.data])
  const total = entries.data?.pages[0]?.total ?? contest.entry_count
  const withStory = useMemo(() => loaded.filter((e) => e.comment?.trim()), [loaded])
  const storyList = (source: StorySource): ContestEntry[] =>
    source === 'gallery' ? loaded : source === 'stories' ? withStory : source === 'winners' ? contest.winners : myEntry ? [myEntry] : []
  const openStory = (source: StorySource, id?: number) => {
    const index = id == null ? 0 : storyList(source).findIndex((e) => e.id === id)
    setStory({ source, index: Math.max(0, index) })
  }
  const openGallery = useCallback(
    (id: number) => {
      const index = loaded.findIndex((e) => e.id === id)
      setStory({ source: 'gallery', index: Math.max(0, index) })
    },
    [loaded, setStory],
  )

  // 함께 쓴 성도 얼굴 몇 개 — 받아 둔 갤러리에서
  const faces = useMemo(() => {
    const seen = new Set<number>()
    return loaded.filter((e) => !seen.has(e.author.id) && seen.add(e.author.id)).slice(0, 4).map((e) => e.author)
  }, [loaded])

  // 아직 아무도 안 쓴 애송 구절 — 갤러리를 다 받았을 때만 '아무도'라고 말한다
  const canEnter = contest.phase === 'open' && !myEntry
  const suggestions = useMemo(
    () => RECOMMENDED.filter((v) => !loaded.some((e) => sameRef(e.verse_ref, v.refLabel))).slice(0, SUGGESTION_COUNT),
    [loaded],
  )

  const requireLogin = (): boolean => {
    if (authed) return true
    redirectAfterLogin.set(`/handwriting/${contest.id}`)
    navigate('/login')
    return false
  }

  // memo 된 EntryCard 에 그대로 내려가므로 참조를 붙잡는다 — 표 하나 바뀔 때 카드 전체가 다시 그리지 않게
  const { mutate: voteMutate } = vote
  const { id: contestIdForVote, votes_left: votesLeft, votes_per_user: votesPerUser } = contest
  const handleVote = useCallback(
    (entry: ContestEntry) => {
      if (!authed) {
        redirectAfterLogin.set(`/handwriting/${contestIdForVote}`)
        navigate('/login')
        return
      }
      if (!entry.voted_by_me && votesLeft <= 0) {
        showToast(`${votesPerUser}표를 모두 썼어요. 다른 작품의 표를 거두면 다시 줄 수 있어요`, 'error')
        return
      }
      voteMutate({ entryId: entry.id, on: !entry.voted_by_me })
    },
    [authed, contestIdForVote, votesLeft, votesPerUser, voteMutate, navigate],
  )

  const startWrite = (verse?: PickedVerse) => {
    if (!requireLogin()) return
    navigate(`/handwriting/${contest.id}/write`, verse ? { state: { verse } } : undefined)
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
          {contest.votes_left > 0 ? (
            <>
              마음에 드는 글씨에 <b className="text-ink-strong tabular-nums">{contest.votes_left}</b>표 더 줄 수 있어요
            </>
          ) : (
            '표를 다 나눴어요'
          )}
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

  const { fetchNextPage, isFetchingNextPage } = entries
  const loadMore = useCallback(() => {
    if (!isFetchingNextPage) fetchNextPage()
  }, [fetchNextPage, isFetchingNextPage])

  const viewerList = story ? storyList(story.source) : []

  return (
    <SurveyShell onBack={onBack} title={contest.title} rail={rail}>
      {/* 히어로 — 지금 막 써지는 누군가의 글씨 */}
      <div className="lg:px-6 lg:pt-6">
        <LiveInkHero contest={contest} entries={loaded} frozen={story != null} onOpen={openGallery} />
      </div>

      <div className="px-4 lg:px-6">
        {/* 초대 */}
        <section className="pt-6">
          <div className="flex items-center gap-2">
            <p className="text-[11.5px] font-bold tracking-[0.04em] text-ink-muted">참빛교회 손글씨 성경 필사대회</p>
            <PhaseChip phase={contest.phase} />
          </div>
          <h2 className="hw-headline mt-2 text-ink-strong">{contest.title}</h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.75] text-ink-muted whitespace-pre-line">{contest.description || DEFAULT_INVITE}</p>
          <p className="mt-3 text-[12.5px] font-semibold text-ink-muted">
            {periodText(contest)} · {phaseLine(contest)}
          </p>
          {contest.phase !== 'upcoming' ? (
            <div className="mt-4 flex items-center gap-2.5">
              {faces.length ? (
                <span className="flex">
                  {faces.map((a, i) => (
                    <span key={a.id} className={`rounded-full ring-2 ring-background-light dark:ring-background-dark ${i ? '-ml-2' : ''}`}>
                      <Avatar name={a.name} url={a.avatar_url} size={26} />
                    </span>
                  ))}
                </span>
              ) : null}
              <p className="text-[13px] text-ink-muted">
                {contest.entry_count > 0 ? (
                  <>
                    벌써 <b className="text-ink-strong tabular-nums">{contest.entry_count}</b>명이 자기 글씨로 말씀을 남겼어요
                    {contest.voter_count > 0 ? <span className="tabular-nums"> · 투표 {contest.voter_count}명</span> : null}
                  </>
                ) : contest.phase === 'open' ? (
                  '첫 번째 글씨의 주인공이 되어 주세요'
                ) : (
                  '출품작이 없었어요'
                )}
              </p>
            </div>
          ) : null}
        </section>

        {/* 참여하기 */}
        {canEnter ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => startWrite()}
              className="relative w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand text-white text-[16px] font-bold seal-chip [--seal-radius:1rem]"
            >
              <QuillIcon />
              {authed ? '나도 한 구절 써 보기' : '로그인하고 한 구절 써 보기'}
            </button>
            <p className="mt-2 text-center text-[12.5px] text-ink-muted">5분이면 충분해요 · 손가락으로도 써져요</p>
          </div>
        ) : null}

        {/* 내 작품 */}
        {myEntry ? (
          <section className="mt-5 rounded-2xl border border-gray-200/70 dark:border-white/[0.07] bg-white dark:bg-card-dark p-3.5">
            <div className="flex gap-3">
              <button type="button" className="w-[84px] shrink-0" onClick={() => openStory('mine')} aria-label="내 작품 크게 보기">
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
                  {withdraw.isPending ? '거두는 중…' : '출품 거두기'}
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 모바일 — 남은 표 */}
        {voteBox ? <div className="lg:hidden mt-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3">{voteBox}</div> : null}

        {/* 시상대 */}
        {contest.phase === 'announced' ? <Podium contest={contest} onOpen={(id) => openStory('winners', id)} /> : null}

        {/* 이 구절을 고른 이유 — 공감이 먼저, 글씨는 옆에 작게 */}
        {contest.phase !== 'upcoming' && withStory.length ? (
          <section className="mt-9">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3 className="text-[17px] font-bold text-ink-strong tracking-[-0.02em]">이 구절을 고른 이유</h3>
              {withStory.length > STORY_PREVIEW ? (
                <button type="button" onClick={() => openStory('stories')} className="text-[12.5px] font-bold text-ink-muted">
                  사연 {withStory.length}편 넘겨 보기 ›
                </button>
              ) : null}
            </div>
            <div className="divide-y divide-border-light dark:divide-border-dark">
              {withStory.slice(0, STORY_PREVIEW).map((entry) => (
                <StoryRow
                  key={entry.id}
                  entry={entry}
                  canVote={contest.phase === 'open' && !entry.is_mine}
                  votesLeft={contest.votes_left}
                  busy={vote.isPending && vote.variables?.entryId === entry.id}
                  onOpen={(id) => openStory('stories', id)}
                  onVote={handleVote}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* 갤러리 */}
        {contest.phase !== 'upcoming' ? (
          <section className="mt-8">
            {loaded.length ? (
              <button
                type="button"
                onClick={() => openStory('gallery')}
                className="hw-play mb-6 w-full grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] px-5 py-[18px] text-left"
              >
                <span className="min-w-0">
                  <span className="block font-['Noto_Serif_KR',serif] text-[16px] font-semibold leading-[1.5]">처음부터 한 편씩 넘겨 보기</span>
                  <span className="block mt-0.5 text-[12px] opacity-60">
                    {total}편 · 쓴 순서대로 다시 써져요 · 탭하면 다음으로
                  </span>
                </span>
                <span className="w-11 h-11 rounded-full bg-[#efe6d4] text-[#16140f] inline-flex items-center justify-center" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />
                  </svg>
                </span>
              </button>
            ) : null}

            <div className="flex items-center justify-between gap-2 mb-3">
              <SectionTitle count={entries.data?.pages[0]?.total}>모든 작품</SectionTitle>
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
                      onOpen={openGallery}
                      onVote={handleVote}
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

        {/* 무엇을 쓸지 고민하는 문턱을 없앤다 */}
        {canEnter && suggestions.length ? (
          <section className="mt-9">
            <h3 className="mb-3 text-[17px] font-bold text-ink-strong tracking-[-0.02em]">
              {entries.hasNextPage ? '이런 구절은 어떠세요' : '아직 아무도 쓰지 않은 구절'}
            </h3>
            <div className="flex flex-col gap-2">
              {suggestions.map((v) => (
                <button
                  key={v.refLabel}
                  type="button"
                  onClick={() => startWrite(v)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/[0.03] px-4 py-3.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-ink-strong">{v.refLabel}</span>
                    <span className="block mt-0.5 text-[12.5px] text-ink-muted truncate">{v.text}</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] font-bold text-brand">이 구절로 ›</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* 모바일 — 안내·다른 대회 */}
        <details className="lg:hidden mt-8 rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3.5 group">
          <summary className="flex items-center justify-between cursor-pointer list-none text-[13px] font-bold text-ink-strong">
            대회 안내
            <span className="text-[12px] font-semibold text-ink-muted">
              1인 1작품 · {contest.votes_per_user}표 <span className="inline-block transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <div className="mt-3">{rules}</div>
        </details>
        {others.length ? (
          <section className="lg:hidden mt-3 mb-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] px-4 py-4">
            <p className="mb-2 text-[12.5px] font-bold text-ink-strong">다른 대회</p>
            <OtherContests others={others} />
          </section>
        ) : null}
      </div>

      {story && viewerList.length ? (
        <StoryViewer
          key={story.source}
          contest={contest}
          entries={viewerList}
          startIndex={story.index}
          total={story.source === 'gallery' ? total : viewerList.length}
          hasMore={story.source === 'gallery' && !!entries.hasNextPage}
          onLoadMore={loadMore}
          invite={story.source === 'gallery' && canEnter}
          onWrite={() => {
            setStory(null)
            startWrite()
          }}
          onClose={() => setStory(null)}
          onVote={handleVote}
          voting={vote.isPending}
        />
      ) : null}
    </SurveyShell>
  )
}

/** 히어로 — 받아 둔 작품 몇 편이 쓴 순서대로 번갈아 다시 써진다. 탭하면 그 작품부터 넘겨 보기 */
const HERO_RATIO = 0.56
const HERO_TURNS = 3
const HERO_REST_MS = 2800

const LiveInkHero = ({
  contest,
  entries,
  frozen,
  onOpen,
}: {
  contest: ContestDetail
  entries: ContestEntry[]
  /** 넘겨 보기가 열려 있으면 다음 편으로 넘어가지 않는다 */
  frozen: boolean
  onOpen: (id: number) => void
}) => {
  const picks = useMemo(() => {
    const withInk = entries.filter((e) => e.has_ink && !e.is_hidden)
    return (withInk.length ? withInk : entries.filter((e) => e.image_url && !e.is_hidden)).slice(0, HERO_TURNS)
  }, [entries])
  const [turn, setTurn] = useState(0)
  const timer = useRef(0)
  const frozenRef = useRef(frozen)
  useEffect(() => {
    frozenRef.current = frozen
  }, [frozen])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // 넘겨 보기를 닫으면 잠깐 쉬었다가 다음 편
  useEffect(() => {
    if (frozen || picks.length < 2) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setTurn((t) => t + 1), HERO_REST_MS)
  }, [frozen, picks.length])

  const handlePlay = useCallback(
    (ms: number) => {
      window.clearTimeout(timer.current)
      // 한 번에 다 그려지는 경우(동작 줄이기·획 없음)는 한 편뿐이면 그대로 둔다
      if (frozenRef.current || (ms === 0 && picks.length < 2)) return
      timer.current = window.setTimeout(() => setTurn((t) => t + 1), ms + (ms ? HERO_REST_MS : HERO_REST_MS * 2))
    },
    [picks.length],
  )

  const current = picks.length ? picks[turn % picks.length] : null

  if (!current) {
    return (
      <div className="hw-live lg:overflow-hidden lg:rounded-3xl">
        <div className="hw-paper hw-paper--lined hw-live__empty" style={{ aspectRatio: `1 / ${HERO_RATIO}` }}>
          {contest.phase === 'upcoming' ? '곧 첫 글씨를 받아요' : '첫 글씨를 기다리고 있어요'}
        </div>
      </div>
    )
  }

  return (
    <button type="button" className="hw-live" onClick={() => onOpen(current.id)} aria-label={`${current.author.name}님의 ${current.verse_ref} 넘겨 보기`}>
      <div className="lg:overflow-hidden lg:rounded-3xl">
        <InkReplay key={`${current.id}-${turn}`} entry={current} bare ratio={HERO_RATIO} onPlay={handlePlay} className="hw-paper--lined" />
      </div>
      <span className="flex items-center gap-2 px-4 pt-2.5 text-[12.5px] text-ink-muted lg:px-1">
        <span className="hw-live__dot" aria-hidden />
        <span className="min-w-0 truncate">
          <b className="font-semibold text-ink-strong">{current.author.name}</b> 님이 {timeAgo(current.created_at)} 쓴 {current.verse_ref}
          {current.has_ink ? ' · 쓴 순서대로 다시 보는 중' : ''}
        </span>
      </span>
    </button>
  )
}

/** 표 하트 — 갤러리 카드·사연 줄이 함께 쓴다 */
const VoteChip = ({
  entry,
  canVote,
  votesLeft,
  busy,
  onVote,
}: {
  entry: ContestEntry
  canVote: boolean
  votesLeft: number
  busy: boolean
  onVote: (entry: ContestEntry) => void
}) =>
  canVote ? (
    <button
      type="button"
      onClick={() => onVote(entry)}
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
  ) : null

/** 사연 한 줄 — 소감이 먼저, 글씨는 옆에 작게 */
const StoryRow = memo(function StoryRow({
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
  onOpen: (id: number) => void
  onVote: (entry: ContestEntry) => void
}) {
  const open = () => onOpen(entry.id)
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3.5 py-4">
      <div className="min-w-0 flex flex-col">
        <button type="button" onClick={open} className="text-left">
          <p className="hw-quote text-ink-strong line-clamp-4">{entry.comment}</p>
        </button>
        <div className="mt-auto pt-2.5 flex items-center gap-2 min-w-0">
          <Avatar name={entry.author.name} url={entry.author.avatar_url} size={22} />
          <p className="min-w-0 flex-1 truncate text-[12.5px] text-ink-muted">
            <b className="font-semibold text-ink-strong">{entry.author.name}</b> · {entry.verse_ref}
          </p>
          <VoteChip entry={entry} canVote={canVote} votesLeft={votesLeft} busy={busy} onVote={onVote} />
        </div>
      </div>
      <button type="button" onClick={open} aria-label={`${entry.author.name}님의 ${entry.verse_ref} 보기`}>
        <PaperThumb entry={entry} maxRatio={1.25} />
      </button>
    </div>
  )
})

// memo — 투표 한 번에 갤러리 캐시가 통째로 갈려도(patchEntryEverywhere 가 안 바뀐 작품은 같은 참조로 둔다)
// 표가 바뀐 카드만 다시 그린다. 콜백은 (id·entry) 인자형이라 부모가 안정된 참조 하나를 내려준다
const EntryCard = memo(function EntryCard({
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
  onOpen: (id: number) => void
  onVote: (entry: ContestEntry) => void
}) {
  const open = () => onOpen(entry.id)
  return (
  <div className="min-w-0">
    <button type="button" onClick={open} className="block w-full text-left" aria-label={`${entry.author.name}님의 ${entry.verse_ref} 보기`}>
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
      <button type="button" onClick={open} className="min-w-0 flex-1 text-left">
        <p className="text-[13px] font-bold text-ink-strong truncate">{entry.verse_ref}</p>
        <p className="text-[12px] text-ink-muted truncate">{entry.author.name}</p>
      </button>
      <VoteChip entry={entry} canVote={canVote} votesLeft={votesLeft} busy={busy} onVote={onVote} />
    </div>
  </div>
  )
})

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
