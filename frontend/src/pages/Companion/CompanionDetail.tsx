// 동행 상세 (/companion/:id) — 이번 주 합산 발자국 + 등불 + 지나온 주
// 쉬어간 짝은 읽기 전용 '지난 길' + 다시 걷자고 하기
import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useCompanion, useLeaveCompanion, useUpdateCompanionGoal } from '../../hooks/useCompanion'
import type { CompanionDetail as CompanionDetailData, CompanionGoal, CompanionWeek } from '../../types/companion'
import { confirmDialog } from '../../utils/confirmDialog'
import { safeStorage } from '../../utils/safeStorage'
import { sessionStore } from '../../utils/tokenStore'
import { showToast } from '../../utils/toast'
import { scheduleTitleEvaluation } from '../../utils/titleUnlockBus'
import CompanionMilestones from './CompanionMilestones'
import { Avatar, CompanionShell, RailCard, RailStat, Sheet } from './CompanionParts'
import CompanionPrayer from './CompanionPrayer'
import { markCheerSeen } from './cheerSeen'
import FootprintPath from './FootprintPath'
import GoalPicker from './GoalPicker'
import InviteSheet from './InviteSheet'
import { GOAL_SPECS, goalText } from './companionGoals'

const weekRange = (weekStart: string) => {
  const [y, m, d] = weekStart.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(y, m - 1, d + 6)
  return `${start.getMonth() + 1}.${start.getDate()} – ${end.getMonth() + 1}.${end.getDate()}`
}

const CompanionDetail = () => {
  const navigate = useNavigate()
  const id = Number(useParams().id) || 0
  const { data: c, isLoading, error } = useCompanion(id)
  const leave = useLeaveCompanion()
  const [goalOpen, setGoalOpen] = useState(false)

  // 이번 주 등불이 켜진 걸 이 기기에서 처음 보는 순간 한 번만 축하
  const litKey = c?.week?.achieved ? `companion-lit-${c.id}-${c.week.week_start}` : null
  useEffect(() => {
    if (!litKey || safeStorage.get(litKey)) return
    safeStorage.set(litKey, '1')
    void confetti({ particleCount: 70, spread: 70, origin: { y: 0.45 }, colors: ['#3182f6', '#f0a23b', '#ffd27a'] })
    // 등불 칭호(동역자·길동무) 판정 — 전역 TitleUnlockHost 가 팝업을 띄운다
    scheduleTitleEvaluation()
  }, [litKey])

  // 짝의 기도를 여기서 봤으면 홈 발자국 버튼은 오늘 다시 띄우지 않는다
  const partnerPrayed = !!c?.cheer?.by_partner_today
  useEffect(() => {
    if (partnerPrayed) markCheerSeen(id)
  }, [partnerPrayed, id])

  if (isLoading) {
    return (
      <CompanionShell title="동행" backTo="/companion" backLabel="동행">
        <div className="px-4 pt-6 space-y-3">
          <div className="h-56 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        </div>
      </CompanionShell>
    )
  }

  if (error || !c) {
    return (
      <CompanionShell title="동행" backTo="/companion" backLabel="동행">
        <p className="px-5 pt-14 text-center text-[13.5px] text-gray-500 dark:text-white/55">
          이 동행을 찾을 수 없어요.
        </p>
      </CompanionShell>
    )
  }

  if (c.status === 'ended') return <RestedView c={c} />

  if (c.status !== 'active' || !c.week) {
    return (
      <CompanionShell title="동행" backTo="/companion" backLabel="동행">
        <p className="px-5 pt-14 text-center text-[13.5px] text-gray-500 dark:text-white/55">
          {c.partner.name}님이 초대를 받으면 이곳에 함께 걷는 길이 생겨요.
        </p>
      </CompanionShell>
    )
  }

  const week = c.week
  const spec = GOAL_SPECS[week.goal_type]
  const remaining = Math.max(0, week.goal_amount - week.total)
  const myName = sessionStore.get('fullName') || '나'

  const handleLeave = async () => {
    const ok = await confirmDialog({
      title: '잠시 쉬어가기',
      message: `${c.partner.name}님과의 동행을 멈출까요?`,
      description: '함께 걸은 기록은 남아요. 다시 초대하면 그 길에 이어서 걸어요.',
      confirmText: '쉬어가기',
      cancelText: '계속 걸을게요',
      tone: 'warning',
    })
    if (!ok) return
    try {
      await leave.mutateAsync(c.id)
      navigate('/companion', { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '처리하지 못했어요', 'error')
    }
  }

  const goToFill = () => navigate(spec.to)

  // 우측 레일(lg+) — 짝 한눈에 + 이번 주 채우러 가기·목표 바꾸기 + 쉬어가기
  const rail = (
    <>
      <RailCard>
        <div className="flex items-center gap-3">
          <Avatar name={c.partner.name} url={c.partner.avatar_url} tone="you" size={44} />
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-ink-strong truncate">{c.partner.name}</div>
            <div className="text-[12px] text-gray-500 dark:text-white/50 mt-0.5">함께 걸은 지 {c.together_weeks}주째</div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <RailStat label="켠 등불" value={c.lit_weeks} accent />
          <RailStat label="서로를 위한 기도" value={`${c.cheer?.total ?? 0}번`} />
        </div>
      </RailCard>
      <RailCard title="이번 주">
        <div className="text-[14px] font-bold text-ink-strong">둘이 합쳐 {goalText(week.goal_type, week.goal_amount)}</div>
        <div className="text-[12.5px] text-gray-500 dark:text-white/50 mt-1">
          {week.achieved ? '등불이 켜졌어요' : `${remaining}${spec.unit} 남음 · ${c.days_left}일 남음`}
        </div>
        <button
          type="button"
          onClick={goToFill}
          className="mt-3.5 w-full py-3 rounded-2xl bg-brand text-white text-[14px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
        >
          {spec.cta}
        </button>
        <button
          type="button"
          onClick={() => setGoalOpen(true)}
          className="mt-2 w-full py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold"
        >
          목표 바꾸기
        </button>
      </RailCard>
      <button
        type="button"
        onClick={handleLeave}
        className="py-2 text-[12px] font-semibold text-gray-400 dark:text-white/40 underline underline-offset-4"
      >
        잠시 쉬어가기
      </button>
    </>
  )

  return (
    <CompanionShell title={`${c.partner.name}님과 동행`} backTo="/companion" backLabel="동행" rail={rail}>
      {/* 이번 주 — lg 에선 숫자·메시지(좌)와 발자국 길(우) 가로 2단 */}
      <section className="mx-4 lg:mx-6 mt-5 lg:mt-6 rounded-[26px] bg-white dark:bg-card-dark border border-border-light dark:border-border-dark px-5 pt-5 pb-6 lg:px-8 lg:py-8 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10">
        <div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar name={myName} url={sessionStore.get('avatarUrl')} tone="me" size={34} />
            <Avatar name={c.partner.name} url={c.partner.avatar_url} tone="you" size={34} />
          </div>
          <div className="text-[12.5px] text-gray-500 dark:text-white/55 leading-snug">
            함께 걸은 지 <b className="font-bold text-ink-strong">{c.together_weeks}주째</b>
            <br />
            등불 {c.lit_weeks}개를 켰어요
          </div>
        </div>

        <div className="mt-6 text-[13px] font-semibold text-gray-500 dark:text-white/55">이번 주 둘이 합쳐</div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div className="text-[30px] font-extrabold tracking-[-0.03em] text-ink-strong tabular-nums leading-none">
            {week.total}
            <span className="text-[18px] text-gray-400 dark:text-white/40 font-bold">
              {' '}
              / {week.goal_amount}
              {spec.unit}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setGoalOpen(true)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12px] font-bold text-gray-600 dark:text-white/70"
          >
            {spec.label} · 목표 바꾸기
          </button>
        </div>

        <FootprintPath week={week} myName={myName} partnerName={c.partner.name} className="mt-5 lg:hidden" />

        <div className="mt-2 lg:mt-4 flex items-center gap-4 text-[12px] text-gray-500 dark:text-white/55">
          <span className="flex items-center gap-1.5">
            <i className="cp-dot is-me" /> 나
          </span>
          <span className="flex items-center gap-1.5">
            <i className="cp-dot is-you" /> {c.partner.name}
          </span>
        </div>

        <p className="mt-5 text-[14px] leading-[1.6] text-ink-strong font-semibold">
          {week.achieved
            ? `등불이 켜졌어요. ${c.partner.name}님과 함께 채운 한 주예요.`
            : `${remaining}${spec.unit} 남았어요 · 이번 주 ${c.days_left}일 남음`}
        </p>
        {!week.achieved && (
          <p className="mt-1 text-[12.5px] text-gray-500 dark:text-white/50">
            {spec.hint}. 누가 채워도 둘의 걸음이에요.
          </p>
        )}

        {/* lg 에선 우측 레일의 같은 버튼이 대신한다 */}
        <button
          type="button"
          onClick={goToFill}
          className="lg:hidden mt-5 w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] active:scale-[0.99] transition-transform"
        >
          {spec.cta}
        </button>
        </div>
        <FootprintPath week={week} myName={myName} partnerName={c.partner.name} className="hidden lg:block" />
      </section>

      {/* lg: 서로를 위한 기도(좌) · 지나온 주(우) 2열, 마일스톤은 그 아래 한 줄 */}
      <div className="lg:px-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
      <CompanionPrayer c={c} />

      {/* 지나온 주 — 끊김 대신 누적. 못 채운 주는 '쉼표' */}
      {c.history.length > 0 ? (
        <HistoryList history={c.history} restedBefore={week.rested_before} />
      ) : (
        <section className="hidden lg:block pt-8">
          <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-3 px-0.5">지나온 주</h3>
          <p className="rounded-2xl border border-dashed border-border-light dark:border-border-dark px-4 py-6 text-center text-[13px] text-gray-500 dark:text-white/50">
            첫 주를 함께 걷는 중이에요. 다음 주부터 지나온 길이 여기 쌓여요.
          </p>
        </section>
      )}
      </div>

      <div className="lg:px-6">
        <CompanionMilestones c={c} />
      </div>

      {/* lg 에선 우측 레일 아래에 같은 링크가 있다 */}
      <div className="px-4 pt-10 text-center lg:hidden">
        <button
          type="button"
          onClick={handleLeave}
          className="text-[12.5px] font-semibold text-gray-400 dark:text-white/40 underline underline-offset-4"
        >
          잠시 쉬어가기
        </button>
      </div>

      {goalOpen && <GoalSheet id={c.id} initial={{ goal_type: week.goal_type, goal_amount: week.goal_amount }} onClose={() => setGoalOpen(false)} />}
    </CompanionShell>
  )
}

// 쉬어간 짝 — 둘 다 지난 길을 볼 수 있다. 기도제목은 걷는 동안만, 여기선 숫자와 길만
const RestedView = ({ c }: { c: CompanionDetailData }) => {
  const navigate = useNavigate()
  const [resumeOpen, setResumeOpen] = useState(false)
  const myName = sessionStore.get('fullName') || '나'
  const ended = c.ended_at ? new Date(c.ended_at) : null
  const resumeButton = (
    <button
      type="button"
      onClick={() => setResumeOpen(true)}
      className="w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] active:scale-[0.99] transition-transform"
    >
      다시 함께 걷자고 하기
    </button>
  )
  const rail = (
    <>
      <RailCard>
        <div className="flex items-center gap-3">
          <Avatar name={c.partner.name} url={c.partner.avatar_url} tone="you" size={44} />
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-ink-strong truncate">{c.partner.name}</div>
            <div className="text-[12px] text-gray-500 dark:text-white/50 mt-0.5">쉬어가는 중</div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <RailStat label="함께 걸은 주" value={`${c.together_weeks}주`} />
          <RailStat label="켠 등불" value={c.lit_weeks} accent />
          <RailStat label="서로를 위한 기도" value={`${c.cheer?.total ?? 0}번`} />
        </div>
      </RailCard>
      <RailCard>
        {resumeButton}
        <p className="mt-2.5 text-[12px] leading-[1.6] text-gray-500 dark:text-white/50">
          받으면 이 길에 이어서 걸어요. 쉬어간 주는 빈칸이 아니라 쉼으로 남아요.
        </p>
      </RailCard>
    </>
  )

  return (
    <CompanionShell title={`${c.partner.name}님과 걸은 길`} backTo="/companion" backLabel="동행" rail={rail}>
      <section className="mx-4 lg:mx-6 mt-5 lg:mt-6 rounded-[26px] bg-white dark:bg-card-dark border border-border-light dark:border-border-dark px-5 pt-5 pb-6 lg:px-8 lg:py-8">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar name={myName} url={sessionStore.get('avatarUrl')} tone="me" size={34} />
            <Avatar name={c.partner.name} url={c.partner.avatar_url} tone="you" size={34} />
          </div>
          <div className="text-[12.5px] text-gray-500 dark:text-white/55 leading-snug">
            {ended ? `${ended.getMonth() + 1}월 ${ended.getDate()}일부터` : '지금은'} 잠시 쉬어가는 중이에요
          </div>
        </div>
        <p className="mt-5 text-[19px] lg:text-[22px] font-extrabold tracking-[-0.03em] leading-[1.4] text-ink-strong break-keep">
          {c.partner.name}님과 {c.together_weeks}주를 함께 걸으며
          <br />
          등불 {c.lit_weeks}개를 켰어요
        </p>
        <p className="mt-2 text-[12.5px] text-gray-500 dark:text-white/50">
          서로를 위해 {c.cheer?.total ?? 0}번 기도했어요
        </p>
        <div className="mt-5 lg:hidden">{resumeButton}</div>
      </section>

      <div className="lg:px-6">
        {c.history.length > 0 && <HistoryList history={c.history} />}
        <CompanionMilestones c={c} />
      </div>

      {resumeOpen && <InviteSheet resume={c} onClose={() => setResumeOpen(false)} onSent={() => navigate('/companion')} />}
    </CompanionShell>
  )
}

// 지나온 주 — 끊김 대신 누적. 못 채운 주는 '쉼표', 쉬어가기로 비운 주는 한 줄로 접는다
const HistoryList = ({ history, restedBefore = 0 }: { history: CompanionWeek[]; restedBefore?: number }) => (
  <section className="px-4 lg:px-0 pt-8">
    <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-3 px-0.5">지나온 주</h3>
    <ul className="rounded-2xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
      {restedBefore > 0 && <RestedRow weeks={restedBefore} />}
      {history.map((w) => (
        <Fragment key={w.week_start}>
          <HistoryRow week={w} />
          {w.rested_before > 0 && <RestedRow weeks={w.rested_before} />}
        </Fragment>
      ))}
    </ul>
  </section>
)

const RestedRow = ({ weeks }: { weeks: number }) => (
  <li className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/70 dark:bg-white/[0.02]">
    <span className="w-8 shrink-0 flex justify-center text-gray-300 dark:text-white/25" aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 3v3M12 10.5v3M12 18v3" />
      </svg>
    </span>
    <span className="text-[12.5px] text-gray-500 dark:text-white/45">쉬어간 시간 · {weeks}주</span>
  </li>
)

const HistoryRow = ({ week }: { week: CompanionWeek }) => (
  <li className="flex items-center gap-3 px-4 py-3">
    <span
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        week.achieved ? 'cp-lamp-chip' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/35'
      }`}
      aria-hidden
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v2.5M9 4.5h6" />
        <rect x="7" y="4.5" width="10" height="13" rx="3" />
        <path d="M9 20.5h6" />
        {week.achieved && <path d="M12 8.5c1.4 1.6 2 2.6 2 3.8a2 2 0 0 1-4 0c0-1.2.6-2.2 2-3.8Z" fill="currentColor" />}
      </svg>
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-[13.5px] font-bold text-ink-strong">{weekRange(week.week_start)}</div>
      <div className="text-[12px] text-gray-500 dark:text-white/50">{goalText(week.goal_type, week.goal_amount)}</div>
    </div>
    <span className={`text-[12.5px] font-semibold ${week.achieved ? 'text-ink-strong' : 'text-gray-400 dark:text-white/40'}`}>
      {week.achieved ? '등불 켜짐' : '쉼표'}
    </span>
  </li>
)

const GoalSheet = ({ id, initial, onClose }: { id: number; initial: CompanionGoal; onClose: () => void }) => {
  const update = useUpdateCompanionGoal(id)
  const [goal, setGoal] = useState<CompanionGoal>(initial)

  const save = async () => {
    try {
      await update.mutateAsync(goal)
      showToast('이번 주 목표를 바꿨어요', 'success')
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '목표를 바꾸지 못했어요', 'error')
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-[17px] font-bold text-ink-strong">이번 주 목표 바꾸기</h3>
      <p className="text-[12.5px] text-gray-500 dark:text-white/55 mt-1 mb-4 leading-[1.6]">
        둘 중 누구나 바꿀 수 있고, 다음 주에도 이 목표로 이어가요.
      </p>
      <GoalPicker value={goal} onChange={setGoal} />
      <button
        type="button"
        onClick={save}
        disabled={update.isPending}
        className="mt-6 w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40"
      >
        이 목표로 정하기
      </button>
    </Sheet>
  )
}

export default CompanionDetail
